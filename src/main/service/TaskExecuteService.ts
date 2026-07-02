import SyncTaskService from './SyncTaskService'
import SyncTaskDataService from './SyncTaskDataService'
import type { SyncTask, SyncTaskData } from '@/types'
import log from 'electron-log'
import { jHttp, kingHttp } from './http'

import pRetry from 'p-retry'
import appState from '@/AppState'
import AccountService, { type Account } from '@/service/AccountService'
import qs from 'qs'
import { KingResponse, Ledger, LedgerRow, Voucher, VoucherEntry } from '@/kingstar/types'

const executors: Map<number, { stopped: boolean }> = new Map()

// 转换期间格式，原来是xxxxxx样式，修改为 xxxx-xx格式
function parseToJPeriod (input: string): string {
  if (input.length === 6) {
    return `${input.substring(0, 4)}-${input.substring(4, 6)}`
  }
  return input
}

function parseAmount (value: string): number {
  const n = parseFloat(value)
  return Number.isNaN(n) ? 0 : n
}

/**
 * 为多借多贷凭证建立金额一一配对映射
 * 返回 Map<entryId, oppositeEntryId>；若无法完全对齐则返回 null
 */
function buildManyToManyOppositeMap (
  debitEntries: VoucherEntry[],
  creditEntries: VoucherEntry[]
): Map<string, string> | null {
  // 金额分组
  const debitByAmount = new Map<number, VoucherEntry[]>()
  debitEntries.forEach(entry => {
    const amount = parseAmount(entry.amount_for)
    const list = debitByAmount.get(amount) ?? []
    list.push(entry)
    debitByAmount.set(amount, list)
  })

  const creditByAmount = new Map<number, VoucherEntry[]>()
  creditEntries.forEach(entry => {
    const amount = parseAmount(entry.amount_for)
    const list = creditByAmount.get(amount) ?? []
    list.push(entry)
    creditByAmount.set(amount, list)
  })

  const oppositeMap = new Map<string, string>()
  const usedCreditIds = new Set<string>()

  for (const [amount, debits] of debitByAmount) {
    const credits = creditByAmount.get(amount)
    if (credits == null || credits.length !== debits.length) {
      return null
    }

    debits.forEach((debit, index) => {
      const credit = credits[index]
      oppositeMap.set(debit.id, credit.id)
      oppositeMap.set(credit.id, debit.id)
      usedCreditIds.add(credit.id)
    })
  }

  // 确保所有贷方分录都被配对
  if (usedCreditIds.size !== creditEntries.length) {
    return null
  }

  return oppositeMap
}

/**
 * 计算分录的对方科目全名
 * - 一借一贷：互为对方科目
 * - 一贷多借 / 一借多贷：单方的对方科目为对方所有分录；多方的对方科目为单个分录
 * - 多借多贷：仅当金额能完全一一配对时，返回等额匹配的那个对方科目；否则返回空
 * 多个对方科目用分号分割
 */
function calcOppositeAccount (
  entry: VoucherEntry,
  entries: VoucherEntry[],
  accounts: Record<string, Account>
): string {
  const debitEntries = entries.filter(e => e.dc === '1')
  const creditEntries = entries.filter(e => e.dc !== '1')

  // 当前分录方向
  const currentIsDebit = entry.dc === '1'
  const oppositeEntries = currentIsDebit ? creditEntries : debitEntries

  // 没有对方分录
  if (oppositeEntries.length === 0) {
    return ''
  }

  // 一借一贷 或 一多对一：直接返回对方分录的全名
  if (debitEntries.length === 1 || creditEntries.length === 1) {
    return oppositeEntries
      .map(e => accounts[e.account_id]?.full_name ?? e.account_name)
      .join(';')
  }

  // 多借多贷：按金额全局一一配对
  const oppositeMap = buildManyToManyOppositeMap(debitEntries, creditEntries)
  if (oppositeMap == null) {
    return ''
  }

  const oppositeId = oppositeMap.get(entry.id)
  if (oppositeId == null) {
    return ''
  }

  const oppositeEntry = entries.find(e => e.id === oppositeId)
  if (oppositeEntry == null) {
    return ''
  }

  return accounts[oppositeEntry.account_id]?.full_name ?? oppositeEntry.account_name
}

async function fetchData (id: number): Promise<SyncTask> {
  let task = SyncTaskService.findById(id)
  if (task == null) {
    throw new Error(`Task [${id}] not found`)
  }
  if (task.running) {
    throw new Error(`Task [${id}] is already running`)
  }
  try {
    task = SyncTaskService.update(id, { ...task, running: true })
    let currentPage = 1
    let hasMoreData = true
    const batchSize = 100

    while (hasMoreData) {
      const params = qs.stringify({
        page: currentPage,
        page_size: batchSize,
        start_period: task.startPeriod,
        end_period: task.endPeriod
      })
      const { data } = await kingHttp.get(`https://api.kingdee.com/jdy/v2/fi/voucher?${params}`)
      const currentRows = data.data.rows || []
      // 如果返回的数据少于预期，说明已经是最后一页
      hasMoreData = currentRows.length > 0
      currentPage++
      const datas = currentRows.map(item => {
        return {
          taskId: task!.id as number,
          data: JSON.stringify(item),
          succeed: null,
          exception: '',
          running: false,
          version: 0,
          createdTime: new Date(),
          lastModifiedTime: new Date()
        }
      })
      if (currentRows.length > 0) {
        SyncTaskDataService.saveAll(datas)
      }
    }
    SyncTaskService.update(id, { ...task, running: false, ready: true, exception: null })
    log.info(`Task ${id} data fetched and marked as ready`)
    return updateTaskStatus(id)
  } catch (e) {
    SyncTaskService.update(id, { ...task, running: false, ready: false, exception: (e?.message ?? '未知错误') })
    updateTaskStatus(id)
    log.error('获取数据时发生错误', e)
    throw e
  }
}

// 定义任务消费者函数
async function saveToRemote (taskData: SyncTaskData, accounts: Record<string, Account>): Promise<SyncTaskData> {
  return pRetry(async () => {
    const { id } = JSON.parse(taskData.data)
    const { data: { data: voucher } } = await kingHttp.get<KingResponse<Voucher>>(`https://api.kingdee.com/jdy/v2/fi/voucher_detail?id=${id}`)
    const accountIds = [...new Set(voucher.entry_list.map(it => it.account_id))]
    const subLedgerResults: [string, LedgerRow[]][] = await Promise.all(accountIds.map(async it => {
      const params = qs.stringify({
        account_id: it,
        end_period: voucher.period,
        start_period: voucher.period
      })
      const { data: { data } } = await kingHttp.get<KingResponse<Ledger>>(`https://api.kingdee.com/jdy/v2/fi/sub_ledger_report?${params}`)
      return [it, data.rows]
    }))
    const subLedgerMap: Map<string, LedgerRow[]> = new Map(subLedgerResults)

    const cashFlowItems = voucher.entry_list.map(item => {
      // 根据借贷方向判断收支类型：1=借方 ，-1=贷方
      // 监管平台 收支类型：1=支出，2=收入 一般情况你贷方金额就是支出，借方金额就是收入吧
      // 借方记收入，贷方记录支出
      const amtType = item.dc === '1' ? 2 : 1
      const accountFullName = accounts[item.account_id]?.full_name ?? ''
      const opposite = calcOppositeAccount(item, voucher.entry_list, accounts)
      const ledgerRows = subLedgerMap.get(item.account_id) ?? []
      const row = ledgerRows.find(it => {
        let amountEq = false
        if (item.dc === '1') {
          amountEq = (Number(item.debit_amount) === Number(it.debit))
        } else {
          amountEq = Number(item.credit_amount) === Number(it.credit)
        }
        return it.voucher_id === id && amountEq
      }) ?? { end_bal: 0 }

      return {
        period: parseToJPeriod(voucher.period),
        doc_no: `${item.id}`, // 单据编号（使用凭证ID）
        exec_date: voucher.date, // 收付日期/业务发生日期（使用凭证日期）
        apply_date: voucher.date, // 申请日期（使用凭证日期）
        amount: item.amount_for, // 交易金额（本位币金额）
        amt_type: amtType, // 收支类型：1=支出(借方)，2=收入(贷方)
        debit_acct: item.account_number, // 科目代码
        debit_name: accountFullName, // 科目名称
        debit_amt: item.debit_amount, // 借方金额
        credit_amt: item.credit_amount, // 贷方金额
        reason: item.explanation, // 备注
        voucher_no: voucher.number, // 凭证号
        direction: item.dc === '1' ? '借' : '贷', // 借贷方向
        credit_acct: opposite,
        balance: row.end_bal
      }
    })
    for (const item of cashFlowItems) {
      const { data } = await jHttp.post('/sso/finance/financeDetail', item)
      if (data.code !== 0) {
        throw Error(`推送到监管平台时发生错误：[${data.msg}]`)
      }
      log.info(`save voucher item [${JSON.stringify(item)}],reslult[${data}]`)
    }

    cashFlowItems.forEach(v => {
      log.info(`save voucher item [${JSON.stringify(v)}]`, v)
    })

    taskData.succeed = true
    taskData.running = false
    taskData.exception = ''
    const result = SyncTaskDataService.update(taskData.id!, taskData)
    appState.mainWindow?.webContents?.send('task-data-progress', result)
    updateTaskStatus(taskData.taskId)
    return result
  }, {
    retries: 3,
    minTimeout: 1000,
    factor: 2,
    onFailedAttempt: async ({ error, attemptNumber }) => {
      log.error(`saveToRemote attempt ${attemptNumber} failed for taskData ${taskData.id}: ${error.message}`)
      if (attemptNumber > 3) { // 3次重试 + 1次初始 = 4次尝试
        taskData.succeed = false
        taskData.running = false
        taskData.exception = error?.message ?? '未知错误'
        const result = SyncTaskDataService.update(taskData.id!, taskData)
        updateTaskStatus(taskData.taskId)
        appState.mainWindow?.webContents?.send('task-data-progress', result)
        log.error(`saveToRemote all ${attemptNumber} attempts failed for taskData ${taskData.id}`)
      }
    }
  })
}

async function executeItem (id: number): Promise<SyncTaskData | null> {
  const r = SyncTaskDataService.findById(id)
  const accounts = await AccountService.fetch()
  if (r != null) {
    return saveToRemote(r, accounts)
  } else {
    return Promise.reject(new Error('Task not found'))
  }
}

function execute (id: number): SyncTask | null {
  // 查询任务
  log.info(`execute task [${id}]`)
  const oldTask = SyncTaskService.findById(id)
  if (oldTask == null) {
    throw new Error(`Task ${id} not found`)
  }

  let task: SyncTask = oldTask

  if (task.running) {
    throw new Error(`Task ${id} is already running`)
  }

  // 异步执行任务准备流程:先获取数据,再处理数据
  const runTask = async (): Promise<SyncTask> => {
    try {
      const taskState = { stopped: false }
      executors.set(Number(id), taskState)
      // 启动任务队列
      // 检查任务是否已经就绪
      if (!task.ready) {
        task = await fetchData(id)
      }

      task = SyncTaskService.update(id, { ...task, running: true })
      task = updateTaskStatus(id)

      // 串行处理任务数据
      while (!taskState.stopped) {
        const accounts = await AccountService.fetch()
        const nextData = SyncTaskDataService.getNext(id)
        if (!nextData) {
          break // 没有更多数据，退出循环
        }
        try {
          const result = await saveToRemote(nextData, accounts)
          appState.mainWindow?.webContents?.send('task-data-progress', result)
        } catch {
          const result = SyncTaskDataService.findById(nextData.id!)
          appState.mainWindow?.webContents?.send('task-data-progress', result)
        }
      }
      task = SyncTaskService.update(id, { ...task, running: false })
      return updateTaskStatus(id)
      // 获取并处理所有任务数据
    } catch (error) {
      log.error(`Failed to run task ${id}:`, error)
      throw error
    }
  }

  runTask().then(() => {
    log.info(`Task ${id} completed`)
  })

  return SyncTaskService.findById(id)!
}

function updateTaskStatus (id: number): SyncTask {
  const result = SyncTaskService.updateTaskStatus(id)
  appState.mainWindow?.webContents?.send('task-progress', result)
  return result!
}

async function stop (id: number) {
  const executor = executors.get(Number(id))
  if (executor) {
    executor.stopped = true
  }
}

export default {
  executeItem,
  execute,
  stop,
  fetchData
}

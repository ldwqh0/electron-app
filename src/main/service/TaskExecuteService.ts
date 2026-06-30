import SyncTaskService from './SyncTaskService'
import SyncTaskDataService from './SyncTaskDataService'
import type { SyncTask, SyncTaskData } from '@/types'
import log from 'electron-log'
import { jHttp, kingHttp } from './http'

import pRetry from 'p-retry'
import appState from '@/AppState'

const executors: Map<number, { stopped: boolean }> = new Map()

// 转换期间格式，原来是xxxxxx样式，修改为 xxxx-xx格式
function parseToJPeriod (input: string): string {
  if (input.length === 6) {
    return `${input.substring(0, 4)}-${input.substring(4, 6)}`
  }
  return input
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
      const { data } = await kingHttp.get(`https://api.kingdee.com/jdy/v2/fi/voucher?page=${currentPage}&page_size=${batchSize}&start_period=${task.startPeriod}&end_period=${task.endPeriod}`)
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
    SyncTaskService.update(id, { ...task, running: false, ready: false, exception: (e.message ?? '未知错误') })
    updateTaskStatus(id)
    log.error('获取数据时发生错误', e)
    throw e
  }
}

// 定义任务消费者函数
async function saveToRemote (taskData: SyncTaskData): Promise<SyncTaskData> {
  return pRetry(async () => {
    const { id } = JSON.parse(taskData.data)

    const { data } = await kingHttp.get(`https://api.kingdee.com/jdy/v2/fi/voucher_detail?id=${id}`)

    const voucher = data.data

    const cashFlowItems = voucher.entry_list.map(item => {
      // 根据借贷方向判断收支类型：1=借方 ，-1=贷方
      // 监管平台 收支类型：1=支出，2=收入 一般情况你贷方金额就是支出，借方金额就是收入吧
      // 借方记收入，贷方记录支出
      const amtType = item.dc === '1' ? 2 : 1
      return {
        period: parseToJPeriod(voucher.period),
        doc_no: `${item.id}`, // 单据编号（使用凭证ID）
        exec_date: voucher.date, // 收付日期/业务发生日期（使用凭证日期）
        apply_date: voucher.date, // 申请日期（使用凭证日期）
        amount: item.amount_for, // 交易金额（本位币金额）
        amt_type: amtType, // 收支类型：1=支出(借方)，2=收入(贷方)
        debit_acct: item.account_number, // 科目代码
        debit_name: item.account_name, // 科目名称
        debit_amt: item.debit_amount, // 借方金额
        credit_amt: item.credit_amount, // 贷方金额
        reason: item.explanation, // 备注
        voucher_no: voucher.number, // 凭证号
        direction: ''// 借贷方向
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
  if (r != null) {
    return saveToRemote(r)
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
        const nextData = SyncTaskDataService.getNext(id)
        if (!nextData) {
          break // 没有更多数据，退出循环
        }
        try {
          const result = await saveToRemote(nextData)
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

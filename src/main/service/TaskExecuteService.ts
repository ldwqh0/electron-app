import SyncTaskService from './SyncTaskService'
import SyncTaskDataService from './SyncTaskDataService'
import type { SyncTask, SyncTaskData } from '@/types'
import log from 'electron-log'
import http from './http'

import pRetry from 'p-retry'
import appState from '@/AppState'

async function fetchData (task: SyncTask): Promise<SyncTaskData[]> {
  const allRows: Array<{ id: number }> = []
  let currentPage = 1
  let hasMoreData = true
  while (hasMoreData) {
    const { data } = await http.get(`https://api.kingdee.com/jdy/v2/fi/voucher?page=${currentPage}&page_size=100`)
    const currentRows = data.data.rows || []
    allRows.push(...currentRows)
    // 如果返回的数据少于预期，说明已经是最后一页
    hasMoreData = false // currentRows.length > 0
    currentPage++
  }

  const datas = allRows.map(item => {
    return {
      taskId: task.id as number,
      data: JSON.stringify(item),
      succeed: null,
      exception: '',
      running: false,
      version: 0,
      createdTime: new Date(),
      lastModifiedTime: new Date()
    }
  })
  return await SyncTaskDataService.saveAll(datas)
}

const executors: Map<number, { stopped: boolean }> = new Map()

// 定义任务消费者函数
async function saveToRemote (taskData: SyncTaskData): Promise<void> {
  return await pRetry(async () => {
    const { id } = JSON.parse(taskData.data)

    const { data } = await http.get(`https://api.kingdee.com/jdy/v2/fi/voucher_detail?id=${id}`)

    const voucher = data.data

    const cashFlowItems = voucher.entry_list.map(item => {
      // 根据借贷方向判断收支类型：1=借方 ，-1=贷方
      // 监管平台 收支类型：1=支出，2=收入 一般情况你贷方金额就是支出，借方金额就是收入吧
      // 借方记收入，贷方记录支出
      const amtType = item.dc === '1' ? 2 : 1
      return {
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

    cashFlowItems.forEach(v => {
      log.info(`save voucher item [${JSON.stringify(v)}]`, v)
    })

    taskData.succeed = true
    taskData.running = false
    taskData.exception = ''
    await SyncTaskDataService.update(taskData.id!, taskData)
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
        await SyncTaskDataService.update(taskData.id!, taskData)
        log.error(`saveToRemote all ${attemptNumber} attempts failed for taskData ${taskData.id}`)
      }
    }
  })
}

async function execute (id: number): Promise<SyncTask | null> {
  // 查询任务
  log.info(`execute task [${id}]`)

  let task = await SyncTaskService.findById(id)
  if (!task) {
    throw new Error(`Task ${id} not found`)
  }

  if (task.running) {
    throw new Error(`Task ${id} is already running`)
  }

  task = await SyncTaskService.update(id, { ...task, running: true })

  // 异步执行任务准备流程:先获取数据,再处理数据
  const prepareTask = async () => {
    try {
      const taskState = { stopped: false }
      executors.set(id, taskState)
      // 启动任务队列
      // 检查任务是否已经就绪
      if (!task.ready) {
        const allRows = await fetchData(task)
        if (allRows.length <= 0) {
          await completeTask(id)
          return
        }
        task.ready = true
        await SyncTaskService.update(id, task)
        log.info(`Task ${id} data fetched and marked as ready`)
      }
      if (taskState.stopped) {
        await completeTask(id)
        return
      }
      // 串行处理任务数据
      let processedCount = 0
      while (!taskState.stopped) {
        const nextData = await SyncTaskDataService.getNext(id)
        if (!nextData) {
          break // 没有更多数据，退出循环
        }

        await saveToRemote(nextData)
        processedCount++

        // 每处理10条更新一次状态
        if (processedCount % 10 === 0) {
          await SyncTaskService.updateTaskStatus(id)
        }
      }

      await completeTask(id)

      // 获取并处理所有任务数据
    } catch (error) {
      log.error(`Failed to prepare task ${id}:`, error)
      throw error
    }
  }

  prepareTask().then(() => {
    log.info(`Task ${id} running`)
  })

  return task
}

async function completeTask (taskId: number): Promise<void> {
  executors.delete(taskId)
  appState.mainWindow?.webContents?.send('task-completed', taskId)
  await SyncTaskService.completeTask(taskId)
}

async function stop (id: number) {
  const executor = executors.get(id)
  if (executor) {
    executor.stopped = true
  }
}

export default {
  execute,
  stop
}

import SyncTaskService from './SyncTaskService'
import SyncTaskDataService from './SyncTaskDataService'
import TaskQueue from '@/queue'
import type { SyncTask, SyncTaskData } from '@/types'
import log from 'electron-log'
import appState from '@/AppState'
import AppConfigService from '@/service/AppConfigService'
import kingRequest from '../kingstar/request'
import { KingPageData, KingResponse, Voucher } from '@/kingstar/model'

const executors: Map<number, TaskQueue<SyncTaskData>> = new Map()

async function fetchData (task: SyncTask): Promise<SyncTaskData[]> {
  const {
    kingClientId,
    kingClientSecret,
    kingOuterInstanceId,
    kingAccountId
  } = await AppConfigService.get()

  const client = {
    clientId: kingClientId,
    clientSecret: kingClientSecret,
    outerInstanceId: kingOuterInstanceId,
    accountId: kingAccountId
  }

  const allRows: Array<{ id: number }> = []
  let currentPage = 1
  let hasMoreData = true
  while (hasMoreData) {
    const response = await kingRequest<KingResponse<KingPageData<{ id: number }>>>(client, {
      method: 'GET',
      url: `https://api.kingdee.com/jdy/v2/fi/voucher?page=${currentPage}&page_size=100`
    })
    const currentRows = response.data.rows || []
    allRows.push(...currentRows)
    // 如果返回的数据少于预期，说明已经是最后一页
    hasMoreData = currentRows.length > 0
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

// 定义任务消费者函数
async function saveToRemote (taskData: SyncTaskData): Promise<void> {
  try {
    const {
      kingClientId,
      kingClientSecret,
      kingOuterInstanceId,
      kingAccountId
    } = await AppConfigService.get()

    const client = {
      clientId: kingClientId,
      clientSecret: kingClientSecret,
      outerInstanceId: kingOuterInstanceId,
      accountId: kingAccountId
    }
    const { id } = JSON.parse(taskData.data)

    const response = await kingRequest<KingResponse<Voucher>>(client, {
      method: 'GET',
      url: `https://api.kingdee.com/jdy/v2/fi/voucher_detail?id=${id}`
    })

    const voucher = response.data

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
    await SyncTaskDataService.update(taskData.id!, taskData)
  } catch (e) {
    log.error('save to remote failed', taskData)
    taskData.succeed = false
    taskData.running = false
    taskData.exception = e?.message ?? '未知错误'
    await SyncTaskDataService.update(taskData.id!, taskData)
  }
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
      // 启动任务队列
      const queue = new TaskQueue<SyncTaskData>(saveToRemote, 10, 5)
      executors.set(id, queue)
      queue.onComplete = onComplete(id)
      // 检查任务是否已经就绪
      if (!task.ready) {
        await fetchData(task)
        task.ready = true
        await SyncTaskService.update(id, task)
        log.info(`Task ${id} data fetched and marked as ready`)
      }
      if (queue.stopped) {
        await onComplete(id)()
        return
      }
      // 获取并处理所有任务数据
      await processAllTaskData(id, queue)
    } catch (error) {
      log.error(`Failed to prepare task ${id}:`, error)
    }
  }
  prepareTask().then(() => {
    log.info(`Task ${id} running`)
  })

  return task
}

async function stop (id: number) {
  executors.get(id)?.stop()
  executors.delete(id)
}

function onComplete (id: number): () => Promise<void> {
  return async () => {
    executors.delete(id)
    appState.mainWindow?.webContents?.send('task-completed', id)
    await SyncTaskService.completeTask(id)
  }
}

async function processAllTaskData (id: number, queue: TaskQueue<SyncTaskData>): Promise<void> {
  let hasMore = true
  while (hasMore && !queue.stopped) {
    const nextData = await SyncTaskDataService.getNext(id)
    if (!nextData) {
      hasMore = false
      break
    }
    // 将任务数据加入队列
    await queue.produce(nextData)
  }
}

export default {
  execute,
  stop
}

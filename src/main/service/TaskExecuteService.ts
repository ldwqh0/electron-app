import SyncTaskService from './SyncTaskService'
import SyncTaskDataService from './SyncTaskDataService'
import TaskQueue from '@/queue'
import type { SyncTask, SyncTaskData } from '@/types'
import log from 'electron-log'

const executors: Map<number, TaskQueue<SyncTaskData>> = new Map()

function fetchData (task: SyncTask): Promise<SyncTaskData[]> {
  return new Promise<SyncTaskData[]>((resolve) => {
    setTimeout(async () => {
      const data: SyncTaskData[] = []
      for (let i = 0; i < 100; i++) {
        data.push({
          taskId: task.id as number,
          data: `${i}`,
          succeed: null,
          exception: '',
          running: false,
          version: 0,
          createdTime: new Date(),
          lastModifiedTime: new Date()
        })
      }
      await SyncTaskDataService.saveAll(data)
      resolve(data)
    }, 3000)
  })
}

// 定义任务消费者函数
async function saveToRemote (taskData: SyncTaskData): Promise<void> {
  return new Promise((resolve, reject) => setTimeout(() => {
    if (Number(taskData.data) % 4 === 0) {
      log.info('save to remote success', taskData)
      taskData.succeed = false
      taskData.running = false
      taskData.exception = '数据模拟错误'
      SyncTaskDataService.update(taskData.id!, taskData)
      reject(new Error('数据模拟错误'))
    } else {
      taskData.succeed = true
      taskData.running = false
      SyncTaskDataService.update(taskData.id!, taskData)
      resolve()
    }
  }, 100))
}

async function executeItem (id: number): Promise<void> {
  const r = SyncTaskDataService.findById(id)
  if (r != null) {
    return saveToRemote(r)
  } else {
    return Promise.reject(new Error('Task not found'))
  }
}

async function execute (id: number): Promise<SyncTask | null> {
  // 查询任务
  log.info('execute task', id)

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
  stop,
  executeItem
}

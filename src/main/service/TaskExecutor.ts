import SyncTaskService from './SyncTaskService'
import SyncTaskDataService from './SyncTaskDataService'
import TaskQueue from '../queue'
import type { SyncTask, SyncTaskData } from '../../types'
import log from 'electron-log'

function fetchData (task: SyncTask): Promise<SyncTaskData[]> {
  const data: SyncTaskData[] = []
  for (let i = 0; i < 1000; i++) {
    data.push({
      taskId: task.id as number,
      data: `${i}`,
      succeed: null,
      exception: '',
      running: true,
      version: 0,
      createdAt: new Date(),
      lastModifiedAt: new Date()
    })
  }
  return SyncTaskDataService.saveAll(data)
}

// 定义任务消费者函数
async function saveToRemote (taskData: SyncTaskData): Promise<void> {
  return new Promise((resolve) => setTimeout(() => {
    log.info('save to remote success', taskData)
    taskData.succeed = true
    taskData.running = false
    SyncTaskDataService.update(taskData.id!, taskData)
    resolve()
  }, 1000))
}

async function execute ({ id }: { id: number }): Promise<SyncTask | null> {
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

  // 检查任务是否已经就绪
  if (!task.ready) {
    await fetchData(task)
    task.ready = true
    await SyncTaskService.update(id, task)
  }
  console.log(task)
  // 如果任务已经就绪，则启动一个任务队列，开始执行任务
  const queue = new TaskQueue<SyncTaskData>(saveToRemote, 10, 5)

  queue.onComplete = async () => {
    await SyncTaskService.completeTask(id)
    log.info('All tasks completed')
  }

  // 循环获取并处理任务数据
  let hasMore = true
  while (hasMore) {
    const nextData = await SyncTaskDataService.getNext(id)
    if (!nextData) {
      hasMore = false
      break
    }
    // 将任务数据加入队列
    await queue.produce(nextData)
  }

  return SyncTaskService.findById(id)
}

export default {
  execute
}

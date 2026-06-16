import SyncTaskService from './SyncTaskService'
import SyncTaskDataService from './SyncTaskDataService'
import TaskQueue from '../queue'
import { SyncTaskData } from '../../types'

function fetchData (task: SyncTaskData): Promise<SyncTaskData[]> {
  const data: SyncTaskData[] = []
  for (let i = 0; i < task.data.length; i += 100) {
    data.push({
      taskId: task.taskId,
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
    console.log('save to remote success', taskData)
    taskData.succeed = true
    SyncTaskDataService.update(taskData.id!, taskData)
    resolve()
  }, 1000))
}

async function execute ({ id }: { id: number }): Promise<void> {
  // 查询任务
  const task = await SyncTaskService.findById(id)
  if (!task) {
    throw new Error(`Task ${id} not found`)
  }

  // 检查任务是否已经就绪
  if (!task.ready) {
    await fetchData(<SyncTaskData>task)
    task.ready = true
    await SyncTaskService.update(id, task)
  }
  // 如果任务已经就绪，则启动一个任务队列，开始执行任务
  const queue = new TaskQueue<SyncTaskData>(saveToRemote, 10, 5)

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
}

export default {
  execute
}

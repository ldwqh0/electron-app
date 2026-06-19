import log from 'electron-log'

// 一个异步的任务生产消费队列
// 可以同时启动多个并发异步任务进行消费
// 具体的消费逻辑由用户实现
// 当任务队列满的时候，暂停生产任务，直到有空闲消费者消费掉队列中的任务

type ConsumerFn<T> = (task: T) => Promise<void>;

class TaskQueue<T> {
  private queue: T[] = []
  private consumer: ConsumerFn<T>
  private queueSize: number
  private concurrency: number
  private activeTasks = 0
  private isRunning = false
  private isStopped = false
  private waitingResolvers: (() => void)[] = []

  constructor (consumer: ConsumerFn<T>, queueSize: number = 100, concurrency: number = 5) {
    this.consumer = consumer
    this.queueSize = queueSize
    this.concurrency = concurrency
  }

  // 获取停止状态
  get stopped (): boolean {
    return this.isStopped
  }

  // 添加任务到队列
  async produce (task: T): Promise<void> {
    // 检查是否已停止
    if (this.isStopped) {
      throw new Error('Queue is stopped, cannot accept new tasks')
    }
    // 使用 while 循环确保被唤醒后重新检查条件
    while (this.queue.length >= this.queueSize) {
      // 如果已停止，抛出错误
      if (this.isStopped) {
        throw new Error('Queue is stopped, cannot accept new tasks')
      }
      // 等待队列有空间
      await this.waitForSpace()
    }
    // 再次检查停止状态（等待期间可能被停止）
    if (this.isStopped) {
      throw new Error('Queue is stopped, cannot accept new tasks')
    }
    this.queue.push(task)
    // 尝试启动消费
    this.tryConsume()
  }

  getQueueStatus (): { length: number; activeTasks: number; isRunning: boolean } {
    return {
      length: this.queue.length,
      activeTasks: this.activeTasks,
      isRunning: this.isRunning
    }
  }

  // 清空队列
  clear (): void {
    this.queue = []
  }

  // 停止所有消费
  stop (): void {
    this.isStopped = true
    this.isRunning = false
    // 通知所有等待的生产者
    const resolvers = [...this.waitingResolvers]
    this.waitingResolvers = []
    resolvers.forEach(resolve => resolve())
    // 清空队列
    this.queue = []
  }

  onComplete: () => Promise<void> = async () => {}

  // 消费任务
  private tryConsume (): void {
    // 循环消费，直到无法继续
    // 队列为空，退出
    if (this.queue.length === 0) return
    // 如果已经达到最大并发数，退出（等待任务完成时会再次触发）
    if (this.activeTasks >= this.concurrency) return
    // 取出任务并执行
    const task = this.queue.shift()!
    this.activeTasks++
    this.isRunning = true
    this.consumer(task).catch(error => {
      log.error('Task consumption failed:', error)
    }).then(() => {
      this.activeTasks--
      // 通知等待的生产者
      if (this.waitingResolvers.length > 0) {
        this.waitingResolvers.shift()!()
      }
      // 如果没有活跃任务且队列为空
      if (this.activeTasks === 0 && this.queue.length === 0) {
        this.isRunning = false
        this.onComplete().then(() => {
          log.info('All tasks completed')
        })
      } else {
        this.tryConsume()
      }
    })
  }

  // 等待队列有空间
  private waitForSpace (): Promise<void> {
    return new Promise(resolve => {
      this.waitingResolvers.push(resolve)
    })
  }
}

export default TaskQueue

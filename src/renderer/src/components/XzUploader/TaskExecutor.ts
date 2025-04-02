import { Status, Task } from "./Task";

export default class TaskExecutor {
  // 任务队列
  private queue: Task[] = [];
  private $threads: number = 0;
  private readonly maxThreads: number;

  // 任务调度的最大线程数默认为3
  constructor ({ maxThread = 3 } = { maxThread: 3 }) {
    this.maxThreads = maxThread;
  }

  onComplete = (): void => {
    // do nothing
  };

  // 提交一个任务
  post (task: Task): void {
    if (task.state === Status.new) {
      this.queue.push(task);
      task.state = Status.runnable;
      setTimeout(() => this.execute());
    }
  }

  // 执行任务
  execute (): void {
    while (this.$threads < this.maxThreads && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task?.state === Status.runnable) {
        // 任务完成之后,启动一个新的任务
        this.$threads++;
        task.run().finally(() => {
          this.$threads--;
          if (this.$threads <= 0) {
            this.onComplete();
          } else {
            this.execute();
          }
        });
      }
    }
  }
}

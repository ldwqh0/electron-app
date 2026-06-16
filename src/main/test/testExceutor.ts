import TaskExecutor from '../service/TaskExecutor'

TaskExecutor.execute(1).then(() => {
  console.log('处理完成')
})

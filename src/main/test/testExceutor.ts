import TaskExecuteService from '../service/TaskExecuteService'

TaskExecuteService.execute(1).then(() => {
  console.log('处理完成')
})

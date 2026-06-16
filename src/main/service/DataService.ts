import SyncTaskDataService from './SyncTaskDataService'
import SyncTaskService from './SyncTaskService'

async function init (): Promise<void> {
  SyncTaskDataService.init()
  SyncTaskService.init()
}

export default {
  init
}

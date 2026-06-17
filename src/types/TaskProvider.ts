import { SyncTaskData } from '@/types/SyncTaskData'
import { SyncTask } from '@/types/SyncTask'

export interface TaskProvider {
  fetchData: (task: SyncTask) => Promise<void>
  saveData: (taskData: SyncTaskData) => Promise<void>
}

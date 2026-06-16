export interface SyncTaskData {
  id?: number
  taskId: number
  data: string
  succeed: boolean | null
  exception: string
  running: boolean
  version: number
  createdTime: Date
  lastModifiedTime: Date
}

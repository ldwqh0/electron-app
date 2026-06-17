import { SyncTaskData } from './SyncTaskData'

export interface SyncTask {
  id: number;
  dataName: string;
  startTime: Date;
  endTime: Date;
  completedTime: Date | null;
  exception: string | null;
  succeedCount: number;
  failCount: number;
  ready: boolean;
  running: boolean,
  version: number,
  datas?: SyncTaskData[]
  createdTime: Date
  lastModifiedTime: Date
}

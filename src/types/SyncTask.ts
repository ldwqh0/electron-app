import { SyncTaskData } from './SyncTaskData'

export interface SyncTask {
  id?: number;
  dataName?: string;
  startTime?: Date;
  completedTime?: Date | null;
  exception?: string | null;
  successCount?: number;
  failCount?: number;
  ready?: boolean;
  datas?: SyncTaskData[]
}

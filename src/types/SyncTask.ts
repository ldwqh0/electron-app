import { SyncTaskData } from './SyncTaskData'

export interface SyncTask {
  id: number;
  dataName: string;
  startTime: Date;
  endTime: Date;
  completedTime: Date | null;
  startPeriod: string;
  endPeriod: string;
  exception: string | null;
  note: string | null;
  succeedCount: number;
  failCount: number;
  ready: boolean;
  running: boolean,
  version: number,
  count: number,
  datas?: SyncTaskData[]
  createdTime: Date
  lastModifiedTime: Date
}

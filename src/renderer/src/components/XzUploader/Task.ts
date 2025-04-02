import { v1 as uuid } from "uuid";
import type { AxiosInstance, AxiosProgressEvent, AxiosResponse } from "axios";
import { md5, sha256 } from "./FileCrypto";
import type { FileInfo } from "./types";

export enum Status {
  new,
  runnable,
  running,
  blocked,
  dead
}

/**
 * 任务类，在这个版本中，针对vue3的响应性特性。进行了方法重构。
 * 在vue3中。是通过Proxy对象代理实现的数据响应性。这使得基于es6的类在内部对属性进行修改时。会丢失响应性。
 * 因此在这里不再使用类的内部方法对数据进行修改。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Task<T = any, D = any> { // 请求的响应
  readonly id: string;
  readonly file: File;
  readonly url: string;
  readonly params: Record<string, string>;
  readonly http: AxiosInstance;
  readonly onProgress: (v: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onSuccess: (response: any) => void;
  readonly onError: (e: Error) => void;
  readonly onComplete: () => void;
  readonly onCancel: (reason: string) => void;
  // 错误信息
  error?: Error;
  /**
   * 当前状态,模拟线程的5态 new ,runnable,running,blocked,dead
   * new 代表一个新任务
   * runnable 表示将任务推送到任务队列中
   * running 表示任务正在上传中
   * blocked 表示任务被取消
   * dead 表示任务终止
   */
  state: Status = Status.new;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: AxiosResponse<T, D>;

  aborter?: AbortController;

  chunkProgress = 0;

  fileInfo?: FileInfo;

  constructor ({
    file,
    url,
    params = {},
    http,
    onProgress = () => {},
    onSuccess = () => {},
    onError = () => {},
    onComplete = () => {},
    onCancel = () => {}
  }: {
    file: File
    url: string
    params: Record<string, string>
    http: AxiosInstance
    chunkSize?: number
    onProgress: (v: number) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (response: AxiosResponse<any>) => void
    onError: (e: Error) => void
    onComplete: () => void
    onCancel: () => void
  }) {
    this.id = uuid();
    this.file = file;
    this.url = url;
    this.params = params;
    this.http = http;
    this.onProgress = onProgress;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.onComplete = onComplete;
    this.onCancel = onCancel;
  }

  get progress (): number {
    const p = (Number(this.fileInfo?.progress ?? 0) + this.chunkProgress) / this.file.size * 100;
    if (p >= 100 && this.state === Status.dead) {
      return 100;
    } else if (p > 80) {
      return p - 1;
    } else if (p >= 0) {
      return p;
    } else {
      throw new Error("计算进度时发生错误");
    }
  }

  get hasError (): boolean {
    return this.error !== undefined && this.error !== null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async run (): Promise<any> {
    try {
      const [sha256Value, md5Value] = await Promise.all([sha256(this.file), md5(this.file)]);
      const { data }: AxiosResponse<FileInfo> = await this.http.post<FileInfo>(`${this.url}`, {
        filename: this.file.name,
        sha256: sha256Value,
        md5: md5Value,
        size: this.file.size
      });
      this.fileInfo = data;
      this.aborter = new AbortController();
      while (!this.fileInfo.completed) {
        const { data: result } = await tryUploadChunk(this, Number(this.fileInfo?.progress ?? "0"));
        this.fileInfo = result;
      }
      return this.fileInfo;
    } finally {
      this.state = Status.dead;
    }

  }

  cancel (reason: string = ""): void {
    this.aborter!.abort(reason);
    this.onCancel(reason);
    this.state = Status.blocked;
  }

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryUploadChunk (
  task: Task,
  start: number,
  maxError: number = 10
): Promise<AxiosResponse<FileInfo>> {
  let error = 0;

  async function action (): Promise<AxiosResponse<FileInfo>> {
    if (error < maxError) {
      try {
        return await uploadChunk(task, start);
      } catch (e) {
        error++;
        return action();
      }
    } else {
      throw new Error("错误次数超限");
    }
  }

  return action();
}

async function uploadChunk (
  task: Task,
  start: number
): Promise<AxiosResponse<FileInfo>> {
  const end = Math.min(start + Number(task.fileInfo!.chunkSize!), task.file.size);
  const data = new FormData();
  data.append("fileId", task.fileInfo!.id!);
  data.append("start", `${start}`);
  data.append("file", task.file.slice(start, end));
  task.chunkProgress = 0;
  return task.http.post(`${task.url}/chunks`, data, {
    signal: task.aborter?.signal,
    onUploadProgress ({ loaded }: AxiosProgressEvent) {
      //进度改变时，刷新块进度
      task.chunkProgress = loaded;
      task.onProgress(task.progress);
    }
  });
}

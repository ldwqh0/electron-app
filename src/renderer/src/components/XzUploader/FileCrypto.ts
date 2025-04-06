import type { Progress } from "./types";

export class FileCryptor {

  progress: number = 0;

  private worker?: Worker;

  sha256 (file: File): Promise<string> {
    return this.cal(file, "sha256");
  }

  md5 (file: File): Promise<string> {
    return this.cal(file, "md5");
  }

  stop (): void {
    this.worker?.terminate();
  }

  private async cal (file: File, alog: String): Promise<string> {
    this.worker = new Worker(new URL("./FileCryptoWorker", import.meta.url), {});
    return new Promise((resolve, reject) => {
      this.worker!.onmessage = ({ data }: MessageEvent<Progress>) => {
        if (data.completed) {
          resolve(data.result!);
        } else {
        }
        this.progress = data.progress ?? 0;
      };
      this.worker!.onerror = (e) => {
        reject(e);
      };
      this.worker?.postMessage({
        file,
        alog
      });
    });
  }
}






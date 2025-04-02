async function cal (file: File, alog: String): Promise<string> {
  console.log(Worker);
  const worker = new Worker(new URL("./FileCryptoWorker", import.meta.url), {});
  return new Promise((resolve, reject) => {
    worker.onmessage = ({ data: { completed, result, progress } }: MessageEvent<{
      completed: boolean,
      result?: string,
      progress?: number
    }>) => {
      if (completed) {
        resolve(result!);
      } else {
        console.log(`progress - ${alog}`, ((progress ?? 0) / file.size * 100).toFixed(2));
      }
    };
    worker.onerror = (e) => {
      reject(e);
    };
    worker.postMessage({
      file,
      alog
    });
  });
}

export function sha256 (file: File): Promise<string> {
  return cal(file, "sha256");
}

export function md5 (file: File): Promise<string> {
  return cal(file, "md5");
}


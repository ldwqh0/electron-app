export interface FileInfo {
  id?: string;
  filename?: string;
  size?: string;
  sha256?: string;
  md5?: string;
  progress?: string;
  completed?: boolean;
  chunkSize?: number;
}

export interface Progress {
  completed: boolean,
  result?: string,
  progress?: number
}


import { ElectronAPI } from "@electron-toolkit/preload";
import { AxiosRequestConfig, AxiosResponse } from "axios";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      request<T = any, R = AxiosResponse<T>, D = any> (key: string, option: AxiosRequestConfig<D>): Promise<R>,
      onResponse (onSuccess: (key: string, v: AxiosResponse) => void, onFailure: (key: string, v) => void): void,
    };
  }
}

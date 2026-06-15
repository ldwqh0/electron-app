import { ElectronAPI } from "@electron-toolkit/preload";
import { AxiosRequestConfig, AxiosResponse } from "axios";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      request<T = any, R = AxiosResponse<T>, D = any> (key: string, option: AxiosRequestConfig<D>): Promise<R>,
      onResponse (onSuccess: (key: string, v: AxiosResponse) => void, onFailure: (key: string, v) => void): void,
      writeFile: (content: string) => Promise<{ success: boolean; message: string }>,
      syncTask: {
        save: (data: any) => Promise<{ success: boolean; data?: any; message?: string }>,
        update: (data: any) => Promise<{ success: boolean; data?: any; message?: string }>,
        findById: (id: number | string) => Promise<{ success: boolean; data?: any; message?: string }>,
        findAll: () => Promise<{ success: boolean; data?: any[]; message?: string }>,
        remove: (id: number | string) => Promise<{ success: boolean; data?: boolean; message?: string }>,
        saveBatch: (dataList: any[]) => Promise<{ success: boolean; data?: any[]; message?: string }>,
        clearAll: () => Promise<{ success: boolean; data?: boolean; message?: string }>,
      };
    };
  }
}

import { ElectronAPI } from '@electron-toolkit/preload'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      request<T = any, R = AxiosResponse<T>, D = any> (option: AxiosRequestConfig<D>): Promise<R>
    }
  }
}

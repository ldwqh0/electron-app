import { ElectronAPI } from '@electron-toolkit/preload'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      request<T = any, R = AxiosResponse<T>, D = any> (option: AxiosRequestConfig<D>): Promise<R>
    }
    appEvent: {
      on: (channel: string, func: (...args: any[]) => void) => void
      of: (channel: string, func?: (...args: any[]) => void) => void
      emit: (channel: string, ...args: any[]) => void
    }
  }
}

import { ElectronAPI } from '@electron-toolkit/preload'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      request<T = any, R = AxiosResponse<T>, D = any> (option: AxiosRequestConfig<D>): Promise<R>
      get<T = any, R = AxiosResponse<T>, D = any> (key: string, option: AxiosRequestConfig<D>): Promise<R>
      post<T = any, R = AxiosResponse<T>, D = any> (key: string, data: D): Promise<R>
      put<T = any, R = AxiosResponse<T>, D = any> (key: string, option: AxiosRequestConfig<D>): Promise<R>
      delete<T = any, R = AxiosResponse<T>, D = any> (key: string, option: AxiosRequestConfig<D>): Promise<R>
    }
  }
}

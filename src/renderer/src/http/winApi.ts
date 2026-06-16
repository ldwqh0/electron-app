import { AxiosRequestConfig, AxiosResponse } from 'axios'

export default {
  post<T = any, R = AxiosResponse<T>, D = any> (url: string, data: D): Promise<R> {
    return window.api.request({ url, method: 'post', data })
  },

  put<T = any, R = AxiosResponse<T>, D = any> (url: string, data: D): Promise<R> {
    return window.api.request({ url, method: 'put', data })
  },

  del<T = any, R = AxiosResponse<T>> (url: string): Promise<R> {
    return window.api.request({ url, method: 'delete' })
  },

  get<T = any, R = AxiosResponse<T>> (url: string, { params }: AxiosRequestConfig): Promise<R> {
    return window.api.request({ method: 'get', url, params })
  }
}

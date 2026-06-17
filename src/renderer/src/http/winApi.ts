import { AxiosResponse } from 'axios'

export default {
  post<T = any, R = AxiosResponse<T>, D = any> (url: string, data: D): Promise<R> {
    return window.api.request({ url, method: 'post', data })
  }
}

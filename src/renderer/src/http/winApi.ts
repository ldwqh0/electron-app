import { AxiosResponse } from 'axios'

export default {
  async post<T = any, R = AxiosResponse<T>, D = any> (url: string, data: D): Promise<R> {
    const r = await window.api.request({ url, method: 'post', data })
    if (r.status >= 200 && r.status < 300) {
      return r as R
    } else {
      return Promise.reject(r)
    }
  }
}

import type { InternalAxiosRequestConfig } from 'axios'
import type { JClient } from '@/j/types'

export default function (clientSupplier: () => (Promise<JClient> | JClient)) {
  // eslint-disable-next-line
  return async function (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig<any>> {
    const clientResult = clientSupplier()
    const client = clientResult instanceof Promise ? await clientResult : clientResult
    const { appid, appkey } = client

    console.log('appid:', appid, 'appkey:', appkey, 'data:', config.data)

    return {
      ...config,
      baseURL: client.url
    }
  }
}

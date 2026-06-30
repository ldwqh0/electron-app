import type { InternalAxiosRequestConfig } from 'axios'
import type { JClient } from '@/j/types'
import dayjs from 'dayjs'
import { createHash } from 'crypto'

export default function (clientSupplier: () => (Promise<JClient> | JClient)) {
  // eslint-disable-next-line
  return async function (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig<any>> {
    const clientResult = clientSupplier()
    const client = clientResult instanceof Promise ? await clientResult : clientResult
    const { appid, appkey } = client

    const time = dayjs().format('YYYY-MM-DD HH:mm:ss') // 取东八区的时间
    const sign = createHash('md5').update(`${appid}${appkey}${time}`).digest('hex')

    return {
      ...config,
      baseURL: client.url,
      data: {
        ...config.data,
        appid,
        time,
        sign
      }
    }
  }
}

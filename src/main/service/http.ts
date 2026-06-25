import axios, { AxiosInstance } from 'axios'
import type { Client } from '@/kingstar/types'
import KingAxiosInterceptor from '@/kingstar/KingAxiosInterceptor'
import AppConfigService from '@/service/AppConfigService'
import { JClient } from '@/j/types'
import JAxiosInterceptor from '@/j/JAxiosInterceptor'

export function createKingHttp (clientSupplier: () => (Promise<Client> | Client)): AxiosInstance {
  const http = axios.create()
  http.interceptors.request.use(KingAxiosInterceptor(clientSupplier))
  return http
}

export function createJHttp (clientSupplier: () => (Promise<JClient> | JClient)): AxiosInstance {
  const http = axios.create()
  http.interceptors.request.use(JAxiosInterceptor(clientSupplier))
  return http
}

const kingHttp = createKingHttp(() => {
  const {
    kingClientId,
    kingClientSecret,
    kingOuterInstanceId,
    kingAccountId
  } = AppConfigService.get()

  return {
    clientId: kingClientId as string,
    clientSecret: kingClientSecret as string,
    outerInstanceId: kingOuterInstanceId as string,
    accountId: kingAccountId as string
  }
})

const jHttp = createJHttp(() => {
  const {
    targetUrl,
    targetAppid,
    targetAppkey
  } = AppConfigService.get()

  return {
    url: targetUrl as string,
    appid: targetAppid as string,
    appkey: targetAppkey as string
  }
})

export {
  kingHttp,
  jHttp
}

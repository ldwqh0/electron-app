import axios, { AxiosInstance } from 'axios'
import type { Client } from '@/kingstar/types'
import KingAxiosInterceptor from '@/kingstar/KingAxiosInterceptor'
import AppConfigService from '@/service/AppConfigService'

type ClientSupplier = () => (Promise<Client> | Client)

export function createKingHttp (clientSupplier: ClientSupplier): AxiosInstance {
  const http = axios.create()
  http.interceptors.request.use(KingAxiosInterceptor(clientSupplier))
  return http
}

const http = createKingHttp(() => {
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
export default http

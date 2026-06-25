import type { InternalAxiosRequestConfig } from 'axios'
import type { Client } from './types'
import generateSignature from './generateSignature'
import getAppToken from './getAppToken'

export default function (clientSupplier: () => (Promise<Client> | Client)) {
  // eslint-disable-next-line
  return async function (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig<any>> {
    const clientResult = clientSupplier()
    const client = clientResult instanceof Promise ? await clientResult : clientResult
    const { clientId, clientSecret } = client
    const { signature, timestamp, nonce } = generateSignature({
      url: config.url!,
      method: config.method!
    }, clientSecret)
    const appToken = await getAppToken(client)
    const headers = {
      'X-Api-ClientID': clientId,
      'X-Api-Auth-Version': '2.0',
      'X-Api-Nonce': `${nonce}`,
      'X-Api-TimeStamp': `${timestamp}`,
      'X-Api-SignHeaders': 'X-Api-TimeStamp,X-Api-Nonce',
      'X-Api-Signature': signature,
      'app-token': `${appToken['app-token']}`,
      'X-GW-Router-Addr': `${appToken.domain}`
    }

    config.headers.set(headers)

    return config
  }
}

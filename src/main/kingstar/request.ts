import type { Client, KingRequest } from './model'
import axios from 'axios'
import generateSignature from './generateSignature'
import getAppToken from './getAppToken'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function request<T = any> (client: Client, request: KingRequest): Promise<T> {
  const { clientId, clientSecret } = client
  const { signature, timestamp, nonce } = generateSignature(request, clientSecret)
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

  const response = await axios.request<T>({
    url: request.url,
    method: request.method,
    headers,
    data: request.body
  })

  return response.data
}

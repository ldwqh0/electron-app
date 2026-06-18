import getAppAuthorize from './getAppAuthorize'
import type { AppToken, Client, KingRequest, KingResponse } from './model'
import generateSignature, { hmacSha256 } from './generateSignature'
import axios from 'axios'

const url = 'https://api.kingdee.com/jdyconnector/app_management/kingdee_auth_token'

const tokenCache = new Map<string, AppToken>()

export default async function (client: Client): Promise<AppToken> {
  const { clientId, outerInstanceId, accountId, clientSecret } = client
  const tokenCacheKey = `${accountId}@${outerInstanceId}@${clientId}`

  // 检查缓存是否有效
  if (tokenCache.has(tokenCacheKey)) {
    const token = tokenCache.get(tokenCacheKey)!
    // 如果当前时间小于过期时间，说明缓存还有效
    if (Date.now() < token.expires - 60000) {
      return token
    }
  }
  const c = await getAppAuthorize(client)
  const authorize = c.find(v => v.accountId === accountId)
  if (authorize == null) {
    throw new Error('Authorize not found')
  }
  const { appSecret, appKey } = authorize

  const appSignature = hmacSha256(appKey, appSecret)

  const request: KingRequest = {
    method: 'GET',
    url: `${url}?app_key=${appKey}&app_signature=${appSignature}`
  }
  const { nonce, signature, timestamp } = generateSignature(request, clientSecret)

  const headers = {
    'X-Api-ClientID': clientId,
    'X-Api-Auth-Version': '2.0',
    'X-Api-Nonce': `${nonce}`,
    'X-Api-TimeStamp': `${timestamp}`,
    'X-Api-SignHeaders': 'X-Api-TimeStamp,X-Api-Nonce',
    'X-Api-Signature': `${signature}`
  }

  const { data } = await axios.get<KingResponse<AppToken>>(request.url, { headers })

  if (data.errcode === 0 && data.data) {
    // 存储过期时间：当前时间 + 24小时
    const token = data.data
    token.domain = authorize.domain
    tokenCache.set(tokenCacheKey, data.data)
    return token
  }
  throw new Error('获取App Token失败：' + data.description)
}

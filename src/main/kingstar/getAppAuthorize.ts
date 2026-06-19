import type { Authorize, AuthResponse, KingRequest } from './types'
import generateSignature from './generateSignature'
import axios from 'axios'

const url = 'https://api.kingdee.com/jdyconnector/app_management/push_app_authorize'

// 授权信息缓存
const authCache = new Map<string, Authorize[]>()

async function getAppAuthorize ({ clientId, clientSecret, outerInstanceId }: {
  clientId: string,
  clientSecret: string,
  outerInstanceId: string
}): Promise<Authorize[]> {
  const cacheKey = `${outerInstanceId}@${clientId}`
  // 从缓存读取，如果没有，则从网络获取
  const cached = authCache.get(cacheKey)
  if (cached) {
    return cached
  }
  // 从网络获取
  const request: KingRequest = {
    url: `${url}?outerInstanceId=${outerInstanceId}`,
    method: 'POST'
  }
  const { signature, timestamp, nonce } = generateSignature(request, clientSecret)
  const headers = {
    'X-Api-ClientID': clientId,
    'X-Api-Auth-Version': '2.0',
    'X-Api-TimeStamp': `${timestamp}`,
    'X-Api-Nonce': `${nonce}`,
    'X-Api-SignHeaders': 'X-Api-TimeStamp,X-Api-Nonce',
    'X-Api-Signature': signature
  }
  const { data } = await axios.post<AuthResponse<Authorize[]>>(request.url, '', { headers })

  // 检查响应并写入缓存
  if (data.code === 200 && data.data && data.data.length > 0) {
    authCache.set(cacheKey, data.data)
    return data.data
  }

  throw new Error('获取授权信息失败：' + data.msg)
}

export default getAppAuthorize

import crypto from 'crypto'
import type { KingRequest, Signature } from './model'

function parseUrl (url: string): { path: string, params: Record<string, string[]> } {
  // const s = 'https://api.kingdee.com/jdyconnector/app_management/push_app_authorize?outerInstanceId=492475033566973952'
  const url_ = new URL(url)
  const path = url_.pathname // /jdyconnector/app_management/push_app_authorize
  const params: Record<string, string[]> = {}
  url_.searchParams.forEach((value, key) => {
    if (params[key]) {
      params[key].push(value)
    } else {
      params[key] = [value]
    }
  })
  return { path, params }
}

/**
 * HMAC-SHA256 加密
 */
export function hmacSha256 (data: string, key: string): string {
  const hex = crypto.createHmac('sha256', key).update(data).digest('hex')
  return Buffer.from(hex, 'utf8').toString('base64')
}

/**
 * 生成签名
 */
export function generateSignature (request: KingRequest, security: string): Signature {
  // 生成随机 nonce
  const nonce = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1)) + 1

  // 获取时间戳
  const timestamp = Date.now()

  const { params, path } = parseUrl(request.url)

  // URL 编码路径
  const encodedPath = encodeURIComponent(path)

  // 排序并编码参数（按 key 字典序排序）
  const sortedParams: string[] = []
  const sortedKeys = Object.keys(params).sort()
  sortedKeys.forEach(key => {
    const values = params[key]
    values.forEach(value => {
      sortedParams.push(`${key}=${encodeURIComponent(value)}`)
    })
  })

  // 拼接参数字符串
  const signatureString = sortedParams.join('&')

  // 拼接签名字符串
  const plain = [
    request.method.toUpperCase(),
    encodedPath,
    signatureString,
    `x-api-nonce:${nonce}`,
    `x-api-timestamp:${timestamp}`,
    ''
  ].join('\n')

  // 生成签名
  const signature = hmacSha256(plain, security)

  return {
    nonce,
    timestamp,
    signature
  }
}

export default generateSignature

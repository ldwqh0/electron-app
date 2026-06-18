import { ClientKey, KingConfig } from './model'

const clients: Map<string, KingConfig> = new Map()
clients.set('492475033566973952@333940', {
  clientId: '333940',
  clientSecret: 'c0ceb5ab5e23232c700edc3ab21d22c4',
  outerInstanceId: '492475033566973952'
})

export default function (clientKey: ClientKey): Promise<KingConfig> {
  const cacheKey = `${clientKey.outerInstanceId}@${clientKey.clientId}`
  if (!clients.has(cacheKey)) {
    return Promise.reject(new Error('Client not found'))
  } else {
    return Promise.resolve(clients.get(cacheKey)!)
  }
}

export interface AuthResponse<T> {
  code: number,
  msg: string,
  data: T
}

export interface KingResponse<T> {
  errcode: number,
  description: string,
  data: T
}

export interface Authorize {
  accountId: string
  accountName: string
  agreementCompanyName: string
  groupName: string
  status: number
  outerInstanceId: string
  serviceId: string
  tid: number
  clientId: string
  accessToken: string | null
  appToken: string | null
  appKey: string
  appSecret: string
  domain: string
  instanceExpiresTime: string
}

export interface KingRequest {
  url: string,
  method: string,
  body?: string
}

export interface Signature {
  nonce: number
  timestamp: number
  signature: string
}

export interface KingConfig {
  clientId: string
  clientSecret: string
  outerInstanceId: string
}

export interface ClientKey {
  clientId: string
  outerInstanceId: string
}

export interface AppToken {
  'uid': string,
  'app-token': string
  'access_token': string
  'expires': number,
  domain: string
}

export interface AppTokenKey {
  clientId: string
  outerInstanceId: string
  accountId: string
}

export interface Client {
  accountId: string
  clientId: string,
  clientSecret: string,
  outerInstanceId: string
}

export interface KingPageData<T> {
  'count': string,
  'current_page_size': number,
  'page': number,
  'page_size': number,
  rows: T[]
}

export interface VoucherEntry {
  account_id: string
  account_name: string
  account_number: string
  amount_for: string
  credit_amount: string
  currency_id: string
  currency_name: string
  currency_number: string
  dc: string
  debit_amount: string
  explanation: string
  id: string
  measure_unit_id: string
  measure_unit_name: string
  measure_unit_number: string
  price: string
  quantity: string
  seq: string
}

export interface Voucher {
  id: number
  date: string
  period: string
  number: string
  entry_list: VoucherEntry[]
}

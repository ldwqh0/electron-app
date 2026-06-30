import { kingHttp } from './http'

export interface Account {
  id: string
  pid: string
  number: string
  name: string
  full_name: string
  account_type_id: string
  dc: number
  enable: number
  help_code: string
  is_assist: number
  is_bank: number
  is_cash: number
  is_cash_equivalent: number
  is_currency: number
  is_leaf: number
  is_qty: number
  level: number
  readonly parent_name?: string
}

interface AccountResponse {
  data: {
    rows: Account[]
    total_count: number
  }
  description: string
  errcode: number
}

async function fetch (): Promise<Record<string, Account>> {
  const { data: { data: { rows = [] } = {} } = {} } = await kingHttp.get<AccountResponse>('https://api.kingdee.com/jdy/v2/fi/account')

  for (const row of rows) {
    Object.defineProperty(row, 'parent_name', {
      get () {
        return `${row.number}.${row.name}`
      }
    })
  }

  return Object.fromEntries(rows.map(row => [row.id, row]))
}

export default { fetch }

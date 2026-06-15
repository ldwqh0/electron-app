import { SQLInputValue } from 'node:sqlite'

export default function cleanObj<T extends Record<string, unknown>> (params: T): Record<string, SQLInputValue> {
  const result: Record<string, SQLInputValue> = {}

  for (const key in params) {
    const value = params[key]
    // 跳过 page, size 以及 null, undefined 值
    if (key === 'page' || key === 'size' || key === 'sort') {
      continue
    }
    if (value === null || value === undefined || value === '') {
      continue
    }
    result[key] = value as SQLInputValue
  }

  return result
}

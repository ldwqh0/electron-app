import { isEmpty } from '@/tools'

export function telValidator (_: unknown, value: string, callback: (error?: string | Error) => void): void {
  // const regExp = /(^1\d{10}$)|(^(((010)|(02\d)|(0[3-9]\d{2}))-?)?[1-9]\d{6,7}$)/
  const regExp = /^[0-9\-()]+$/
  if (isEmpty(value) || regExp.test(value)) {
    callback()
  } else {
    callback(new Error('请检查电话号码'))
  }
}

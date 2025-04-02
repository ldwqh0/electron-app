import { toValue } from 'vue'
import { isNil } from 'lodash-es'

export default function (v?: string | number | null): boolean {
  const value = toValue(v)
  if (isNil(value)) {
    return true
  } else {
    if (typeof value === 'string') {
      return value === '0'
    } else if (typeof value === 'number') {
      return value === 0
    } else {
      return false
    }
  }
}

import { isNil } from 'lodash-es'
import { toValue } from 'vue'

export default function (v: unknown): boolean {
  return isNil(toValue(v))
}

import { isEmpty } from 'lodash-es'
import { toValue } from 'vue'

export default function (input: unknown): boolean {
  return isEmpty(toValue(input))
}

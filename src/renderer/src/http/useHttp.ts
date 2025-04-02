import { inject } from 'vue'
import type { AxiosInstance } from 'axios'

export default function (key: string = 'http'): AxiosInstance {
  return inject<AxiosInstance>(key)!
}

import type { AxiosInstance } from 'axios'
import axios from 'axios'

const config = {
  http: axios.create()
}
export {
  config
}
export default function ({ http }: { http: AxiosInstance }): void {
  config.http = http
}

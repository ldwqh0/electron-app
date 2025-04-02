import { dayjs } from 'element-plus'

export default function changeDate (val: Date | undefined): string {
  return val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
}

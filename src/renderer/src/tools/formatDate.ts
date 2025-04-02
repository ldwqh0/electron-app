import dayjs from 'dayjs'

export default function formatDate (val: Date | undefined): string {
  return val ? dayjs(val).format('YYYY-MM-DD') : ''
}

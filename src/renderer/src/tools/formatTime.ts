import dayjs from 'dayjs'

export default function formatTime (val: Date | undefined): string {
  return val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
}

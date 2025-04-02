import { dayjs } from 'element-plus'

// 时间转换
function changeDate (val: string): string {
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
}

// 图片下载
function downloadImage (data, filename = ''): void {
  const blob = new Blob([data])
  const blodUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blodUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
  a.remove()
}

export {
  changeDate,
  downloadImage
}

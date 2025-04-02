export const formatPrice = (num: number | string | undefined):string => {
  num = Number(num)
  const yuan = num ? (num / 100) : 0
  return `¥${yuan.toFixed(2)}`
}

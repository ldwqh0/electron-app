import type { TableColumnCtx } from 'element-plus/es/components/table/src/table-column/defaults'
import { VNode } from 'vue'
import dayjs from 'dayjs'

/**
 * 返回一个适用于Element DataTables的按指定模式格式化的日期格式化器
 * @param pattern
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function (pattern = 'YYYY-MM-DD'): (row: any, column: TableColumnCtx, cellValue: any, index: number) => VNode | string {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (_row: any, _column: TableColumnCtx, cellValue: any): string => {
    if (!cellValue) {
      return ''
    }
    return dayjs(cellValue).format(pattern)
  }
}

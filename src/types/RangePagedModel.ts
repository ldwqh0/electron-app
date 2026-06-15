export interface RangePagedModel<T, M> {
  max?: M,
  page: {
    page: number,
    size: number,
    totalElements: number,
    totalPages?: number
  }
  content: T[]
}

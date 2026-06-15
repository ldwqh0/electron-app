// import _Vue, { PluginObject } from 'vue'
import { type AxiosRequestConfig } from 'axios'

/**
 * 排序信息
 */
export interface Sort {
  prop?: string
  order?: string
}

export interface ErrorResponseData {
  error?: string
  message?: string
  path?: string
  status?: number
  timestamp?: string
}

export interface PageMetadata {
  size?: string
  number?: string
  totalElements?: string
  totalPages?: string
}

export interface RangePagedModel<T, M> {
  max?: M
  content?: T[]
  page?: PageMetadata
}

/**
 * 分页查询的响应体
 */
export interface RangePage<T = unknown> {
  /**
   * 某个查询序列中的最大值
   */
  max?: number
  /**
   * 数据内容
   */
  content: T[]

  /**
   * 一次查询元素总数
   */
  totalElements: number

  /**
   * 页码，从0开始
   */
  number: number

  /**
   * 每页大小
   */
  size: number

}

export interface Pagination {
  page: number
  size: number
}

export type AjaxFunction = (pagination: Pagination, sererParams: Record<string, unknown>, sort: Sort[],) => AxiosRequestConfig

<template>
  <div v-if="showError && state.error" class="data-list">
    <slot :error="state.error" name="error">
      <div class="data-list-error">
        {{ state.error }}
      </div>
    </slot>
  </div>
  <div v-else class="data-list">
    <slot :data="data" :loading="state.loading" name="default">
      <div v-if="state.loading">
        loading...
      </div>
      <div v-else>
        <div class="data-list-list">
          <div v-for="(item, index) in data" :key="index"> {{ item }}</div>
        </div>
      </div>
    </slot>
    <slot :pagination="state.pagination" :total="total" name="pagination">
      <div class="data-list-pagination">
        <a href="javascript:void(0)" @click="state.pagination.page--">上一页</a>
        当前第: {{ state.pagination.page }}页，每页<input v-model="state.pagination.size">条，共{{ total }}条
        <a href="javascript:void(0)" @click="state.pagination.page++">下一页</a>
      </div>
    </slot>
  </div>
</template>

<script lang="ts" setup>
  import type { Pagination, RangePagedModel, Sort } from './types'
  import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
  import axios from 'axios'
  import { computed, onBeforeUnmount, reactive, toValue, watch } from 'vue'
  import { cloneDeep, debounce, isEmpty } from 'lodash-es'
  import { isNil } from '@/tools'
  import qs from 'qs'
  import { config } from './config'

  const props = withDefaults(
    defineProps<{
      sort?: string | Sort | Sort[]
      serverParams?: Record<string, unknown>
      ajax?: string | AxiosInstance | AxiosRequestConfig // ajax配置类，可以是方法，函数，或者一个对象
      showError?: boolean
      debounceTime?: number
      http?: AxiosInstance | null // 发送请求的实例
    }>(), {
      sort: '',
      serverParams: () => ({}),
      ajax: '',
      showError: true,
      debounceTime: 500,
      http: null
    }
  )

  const emit = defineEmits<{
    loading: [value: boolean]
    error: [value: Error]
    complete: []
    'data-change': [value: unknown]
  }>()

  const state = reactive<{
    loading: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: AxiosResponse<RangePagedModel<any, any>> | any
    error: AxiosError | Error | null
    pagination: Pagination
  }>({
    loading: false,
    response: {
      status: 200,
      statusText: '',
      headers: {},
      config: {},
      data: {
        max: 0,
        content: [],
        totalElements: 0,
        number: 0,
        size: 10
      }
    },
    pagination: {
      page: 1,
      size: 10
    },
    error: null
  })

  let _defaultHttp: AxiosInstance | null = null
  let cancelController: AbortController | null = null

  function defaultHttp (): AxiosInstance {
    if (_defaultHttp === null) {
      _defaultHttp = axios.create()
    }
    return _defaultHttp
  }

  const data = computed(() => {
    const result = state.response.data.content ?? []
    emit('data-change', result)
    return result
  })

  const ajax = computed<AxiosRequestConfig>(() => {
    // eslint-disable-next-line
    function parseSort (input: any): string[] {

      function parseInternal (input: string | Record<string, unknown>): Sort {
        if (typeof input === 'string') {
          const [prop, order = 'asc'] = input.split(',')
          return {
            prop,
            order
          }
        } else {
          return {
            prop: input.prop as string,
            order: input.order as string
          }
        }
      }

      function stringify ({
        prop,
        order = 'asc'
      }: Sort): string | null {
        if (isEmpty(prop)) {
          return null
        }
        if (order === 'ascending' || order === 'asc') {
          return `${prop},asc`
        }
        if (order === 'descending' || order === 'desc') {
          return `${prop},desc`
        } else {
          return null
        }
      }

      let sorts: Sort[]
      const result: Sort[] = []
      if ((typeof input) === 'string') {
        sorts = input.split(';').map(parseInternal)
      } else if (Array.isArray(input)) {
        sorts = input.map(parseInternal)
      } else {
        sorts = [input]
      }

      sorts.forEach((item) => {
        if (result.findIndex(it => {
          return item.prop === it.prop
        }) < 0) {
          result.push(item)
        }
      })

      return result.map(stringify).filter(v => v !== null) as string[]
    }

    const sort = parseSort(props.sort)

    const params = {
      ...props.serverParams,
      page: state.pagination.page - 1,
      size: state.pagination.size,
      sort
    }

    // 如果传入的ajax是一个函数，需要调用该函数构建ajax请求需要的对象
    if (!isNil(props.ajax)) {
      if (typeof props.ajax === 'object') {
        const ajax = cloneDeep(toValue(props.ajax))
        if (ajax.params === undefined || ajax.params === null) {
          ajax.params = {}
        }
        ajax.params = {
          ...ajax.params,
          ...params
        }
        return ajax
      } else {
        return {
          url: props.ajax as string,
          method: 'get',
          params,
          paramsSerializer: {
            serialize: (v: unknown) => qs.stringify(v, { arrayFormat: 'repeat' })
          }
        }
      }
    }
    throw Error('配置错误')
  })

  const total = computed<number>(() => Number.parseInt(state.response.data?.page?.totalElements ?? '0'))

  const debounceReload = computed(() => debounce(reloadAjaxData, props.debounceTime))

  function reloadData (): void {
    emit('loading', true)
    toValue(debounceReload)()
  }

  watch(() => state.pagination.size, () => {
    state.pagination.page = 1
  })
  watch(() => props.ajax, () => {
    state.pagination.page = 1
  })
  watch(() => props.serverParams, () => {
    state.pagination.page = 1
  }, { deep: true })

  watch(() => toValue(ajax), reloadData)

  onBeforeUnmount(toValue(debounceReload).cancel)

  async function reloadAjaxData (): Promise<unknown> {
    state.error = null
    state.loading = true
    // 开始一个请求前。先取消前一个请求
    cancelController?.abort()
    cancelController = null
    if (!isNil(ajax)) {
      const http = props.http ?? config.http ?? defaultHttp()
      emit('loading', true)
      try {
        cancelController = new AbortController()
        state.response = await http.request({
          ...toValue(ajax),
          signal: cancelController.signal
        })

        state.loading = false
        return state.response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e.isAxiosError) {
          if ((e as AxiosError).code === 'ERR_CANCELED') {
            // 如果是取消操作，什么也不做
          } else {
            state.error = e
            emit('error', e)
            state.loading = false
          }
        } else {
          throw e
        }
      } finally {
        emit('complete')
        emit('loading', false)
      }
    } else {
      state.loading = false
    }
  }

  reloadAjaxData()

  defineExpose({
    reloadData
  })

</script>

<style scoped></style>

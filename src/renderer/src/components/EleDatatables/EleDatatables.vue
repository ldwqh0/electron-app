<template>
  <data-list ref="list"
             v-loading="state.loading"
             :ajax="props.ajax"
             :http="http"
             :server-params="serverParams"
             :sort="sort"
             @loading="state.loading=$event"
             @data-change="emit('data-change',$event)">
    <template #default="{data}">
      <slot :data="data" name="render">
        <el-table :data="data"
                  :max-height="props.maxHeight"
                  @selection-change="emit('selection-change',$event)"
                  @sort-change="sortChange">
          <slot name="default" />
        </el-table>
      </slot>
    </template>
    <template #pagination="{pagination,total}">
      <div class="pagination">
        <el-pagination v-model:current-page="pagination.page"
                       v-model:page-size="pagination.size"
                       :total="total"
                       layout="total, sizes, prev, pager, next, jumper" />
      </div>
    </template>
  </data-list>
</template>
<script lang="ts" setup>
  import { computed, reactive, ref, toValue } from 'vue'
  import DataList from '../DataList/DataList.vue'
  import type { Sort } from '../DataList/types'
  import type { AxiosInstance, AxiosRequestConfig } from 'axios'
  import { isNil } from 'lodash-es'

  const props = withDefaults(
    defineProps<{
      maxHeight?: number | null | string
      sort?: string | Sort[]
      serverParams?: Record<string, unknown>
      ajax?: string | AxiosInstance | AxiosRequestConfig // ajax配置类，可以是方法，函数，或者一个对象
      showError?: boolean
      debounceTime?: number
      http?: AxiosInstance | null // 发送请求的实例
    }>(), {
      maxHeight: '580',
      sort: '',
      serverParams: () => ({}),
      ajax: '',
      showError: true,
      debounceTime: 500,
      http: null
    })
  const list = ref<InstanceType<typeof DataList> | null>(null)

  const emit = defineEmits<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'selection-change': [value: any]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'data-change': [value: any]
  }>()

  const state = reactive<{
    loading: boolean
    sort?: Sort
  }>({
    loading: false
  })

  const sort = computed(() => {
    if (isNil(state.sort)) {
      return props.sort
    } else {
      if (typeof props.sort === 'string') {
        return [state.sort, props.sort]
      } else {
        return [state.sort, ...(props.sort)]
      }
    }
  })

  function sortChange ({ order, prop }: Sort): void {
    if (isNil(order) || isNil(prop)) {
      delete state.sort
    } else {
      state.sort = { order, prop }
    }
  }

  function reloadData (): void {
    toValue(list)?.reloadData()
  }

  defineExpose({
    reloadData
  })
</script>
<style lang="less" scoped>
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: right;
  }
</style>

<template>
  <el-page-header class="details-container" @back="toHome">
    <template #content>
      <span>任务详情</span>
    </template>
    <div>
      {{ state.task }}
    </div>
    <ele-datatables :http="http" :server-params="serverParams" ajax="sync-task-data/findAll">
      <el-table-column label="ID" prop="id" />
      <el-table-column label="数据项" prop="data" />
      <el-table-column label="状态" prop="running">
        <template #default="{row}">
          running:{{ row.running }},succeed:{{ row.succeed }}
          <el-tag v-if="row.running" type="success">运行中</el-tag>
          <template v-else>
            <el-tag v-if="row.succeed" type="success">成功</el-tag>
            <el-tag v-else-if="row.succeed===false" type="danger">失败</el-tag>
            <el-tag v-else>未开始</el-tag>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createdTime" />
      <el-table-column label="操作">
        <template #default="{row}">
          <el-button text type="primary" @click="execute(row)">运行</el-button>
        </template>
      </el-table-column>
    </ele-datatables>
  </el-page-header>
</template>
<script lang="ts" setup>

  import winApi from '@/http/winApi'
  import { computed, reactive } from 'vue'
  import { EleDatatables } from '@/components'
  import { useRouter } from 'vue-router'
  import { SyncTaskData } from '../../../../../types'

  const router = useRouter()

  const props = withDefaults(defineProps<{
    taskId: number | string
  }>(), {
    taskId: ''
  })
  const http = window.api

  const serverParams = computed(() => {
    return { taskId: props.taskId }
  })

  const state = reactive({ task: {} })

  function toHome () {
    router.back()
  }

  async function execute (data: SyncTaskData) {
    console.log(data)
  }

  winApi.get('sync-task/findById', { params: { id: props.taskId } }).then(response => {
    state.task = response.data
  })

</script>

<style lang="less" scoped>
  .details-container {
    width: 100%;
    padding: 20px;
  }
</style>

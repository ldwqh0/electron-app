<template>
  <el-page-header class="details-container" @back="toHome">
    <template #content>
      <span>任务详情</span>
    </template>
    <el-form :model="state.task" inline style="margin-top: 10px">
      <el-form-item label="任务ID">
        {{ state.task?.id }}
      </el-form-item>
      <el-form-item label="任务名称">
        {{ state.task?.dataName }}
      </el-form-item>
      <el-form-item label="数据范围">
        {{ timeStr }}
      </el-form-item>
      <el-form-item label="执行成功数">
        {{ state.task?.succeedCount }}
      </el-form-item>
      <el-form-item label="执行失败数">
        {{ state.task?.failCount }}
      </el-form-item>
      <el-form-item label="任务状态">
        <span v-if="state.task.completedTime">已完成</span>
        <template v-else>
          <span v-if="state.task.running">运行中</span>
          <template v-else>
            <span v-if="state.task.ready">就绪</span>
            <span v-else-if="!state.task.ready">未开始</span>
          </template>
        </template>
      </el-form-item>
    </el-form>
    <ele-datatables :http="http" :server-params="serverParams" ajax="sync-task-data/findAll">
      <el-table-column label="ID" prop="id" />
      <el-table-column label="数据项" prop="data">
        <template #default="{row}">
          <el-button text type="primary" @click="showData(row)">点击查看</el-button>
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="running">
        <template #default="{row}">
          <el-tag v-if="row.running" type="warning">运行中</el-tag>
          <template v-else>
            <el-tag v-if="row.succeed" type="success">成功</el-tag>
            <el-tag v-else-if="row.succeed===false" type="danger">失败</el-tag>
            <el-tag v-else>未开始</el-tag>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="异常"

      <el-table-column :formatter="dateTimeFormatter()" label="创建时间" prop="createdTime" />
      <el-table-column label="操作" width="100">
        <template #default="{row}">
          <el-button text type="primary" @click="execute(row)">执行</el-button>
        </template>
      </el-table-column>
    </ele-datatables>

    <!-- 数据详情对话框 -->
    <el-dialog v-model="state.dataDialog.visible" title="数据详情" width="50%">
      <pre>{{ state.dataDialog.content }}</pre>
      <template #footer>
        <el-button @click="state.dataDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-page-header>
</template>
<script lang="ts" setup>
  import winApi from '@/http/winApi'
  import { computed, reactive } from 'vue'
  import { EleDatatables } from '@/components'
  import { useRouter } from 'vue-router'
  import { SyncTask, SyncTaskData } from '@/types'
  import dateTimeFormatter from '@/components/EleDatatables/dateTimeFormatter'
  import dayjs from 'dayjs'

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

  const state = reactive<{
    dataDialog: {
      visible: boolean,
      content: string
    },
    task: SyncTask
  }>({
    dataDialog: {
      visible: false,
      content: ''
    },
    task: {
      id: 0,
      dataName: '',
      startTime: new Date(),
      endTime: new Date(),
      completedTime: null,
      exception: null,
      succeedCount: 0,
      failCount: 0,
      ready: false,
      running: false,
      version: 0,
      createdTime: new Date(),
      lastModifiedTime: new Date()
    }
  })

  const timeStr = computed(() => {
    return `${dayjs(state.task.createdTime).format('YYYY-MM-DD')} 至 ${dayjs(state.task.endTime).format('YYYY-MM-DD')}`
  })

  function toHome () {
    router.back()
  }

  async function execute (data: SyncTaskData) {
    console.log(data)
  }

  function showData (data: SyncTaskData) {
    state.dataDialog.content = data.data
    state.dataDialog.visible = true
  }

  winApi.post('sync-task/findById', props.taskId).then(response => {
    state.task = response.data
  })

</script>

<style lang="less" scoped>
  .details-container {
    width: 100%;
    padding: 20px;
  }
</style>

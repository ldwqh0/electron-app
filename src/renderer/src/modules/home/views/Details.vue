<template>
  <el-page-header class="details-container"
                  style="height: 100%;"
                  @back="toHome">
    <template #content>
      <span>任务详情</span>
    </template>
    <div v-loading="state.loading">
      <el-form ref="searchForm"
               :model="state.task"
               inline
               style="margin-top: 10px">
        <div style="display: flex;justify-content: space-between;">
          <div>
            <el-form-item label="任务ID：">
              {{ state.task?.id }}
            </el-form-item>
            <el-form-item label="任务名称：">
              {{ state.task?.dataName }}
            </el-form-item>
            <el-form-item label="数据范围：">
              {{ state.task?.startPeriod }} ~ {{ state.task?.endPeriod }}
            </el-form-item>
            <el-form-item label="执行成功数：">
              {{ state.task?.succeedCount }}
            </el-form-item>
            <el-form-item label="执行失败数：">
              {{ state.task?.failCount }}
            </el-form-item>
            <el-form-item label="任务状态：">
              <span v-if="state.task.completedTime != null">已完成</span>
              <template v-else>
                <span v-if="state.task.running">运行中</span>
                <template v-else>
                  <span v-if="state.task.ready">就绪</span>
                  <span v-else-if="!state.task.ready">未开始</span>
                </template>
              </template>
            </el-form-item>
          </div>
          <div>
            <el-button v-if="!state.task.ready && !state.task.running"
                       @click="fetchTaskData()">
              获取数据
            </el-button>
            <el-button v-if="state.task.running"
                       :disabled="!state.task.running"
                       type="primary"
                       @click="stop">
              停止
            </el-button>
            <el-button v-if="!state.task.running && state.task.completedTime==null "
                       type="primary"
                       @click="start">
              启动
            </el-button>
          </div>
        </div>
      </el-form>
      <ele-datatables ref="table"
                      :debounce-time="1000"
                      :http="http"
                      :max-height="tableHeight"
                      :server-params="serverParams"
                      ajax="sync-task-data/findAll"
                      @data-change="setData">
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="数据项" prop="data">
          <template #default="{row}">
            <el-link type="primary" @click="showData(row.data)">
              {{ truncate(row.data, { length: 20 }) }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="异常" prop="exception">
          <template #default="{row}">
            <el-link type="danger" @click="showData(row.exception)">
              {{ truncate(row.exception, { length: 20 }) }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="状态" prop="running" width="120">
          <template #header>
            <el-dropdown @command="switchState">
              <span class="el-dropdown-link">
                {{ stateFilterText }}
                <el-icon>
                  <ArrowDown />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="null">全部</el-dropdown-item>
                  <el-dropdown-item command="pending">未开始</el-dropdown-item>
                  <el-dropdown-item command="running">运行中</el-dropdown-item>
                  <el-dropdown-item command="success">成功</el-dropdown-item>
                  <el-dropdown-item command="failed">失败</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template #default="{row}">
            <el-tag v-if="row.running" type="warning">运行中</el-tag>
            <template v-else>
              <el-tag v-if="row.succeed" type="success">成功</el-tag>
              <el-tag v-else-if="row.succeed===false" type="danger">失败</el-tag>
              <el-tag v-else>未开始</el-tag>
            </template>
          </template>
        </el-table-column>

        <el-table-column :formatter="dateTimeFormatter()"
                         label="创建时间"
                         prop="createdTime"
                         width="180" />
        <el-table-column label="操作" width="80">
          <template #default="{row}">
            <el-link type="primary" @click="execute(row)">执行</el-link>
          </template>
        </el-table-column>
      </ele-datatables>
    </div>
    <!-- 数据详情对话框 -->
    <el-dialog v-model="state.dataDialog.visible" title="数据详情" width="50%">
      <div>{{ state.dataDialog.content }}</div>
      <template #footer>
        <el-button @click="state.dataDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-page-header>
</template>
<script lang="ts" setup>
  import winApi from '@/http/winApi'
  import { computed, onMounted, onUnmounted, reactive, useTemplateRef } from 'vue'
  import { EleDatatables } from '@/components'
  import { useRouter } from 'vue-router'
  import { SyncTask, SyncTaskData } from '@/types'
  import dateTimeFormatter from '@/components/EleDatatables/dateTimeFormatter'
  import useAppStore from '@/store'
  import { throttle, truncate } from 'lodash-es'
  import { ElMessage } from 'element-plus'

  const searchForm = useTemplateRef('searchForm')
  const table = useTemplateRef('table')
  const appStore = useAppStore()

  const router = useRouter()

  const props = withDefaults(defineProps<{
    taskId: number | string
  }>(), {
    taskId: ''
  })
  const http = window.api

  let cancelCompleteEvent = () => {}
  let cancelTaskCompleteEvent = () => {}
  let cancelTaskProgressEvent = () => {}

  const state = reactive<{
    dataDialog: {
      visible: boolean,
      content: string
    },
    task: SyncTask,
    loading: boolean
    datas: SyncTaskData[]
    filterState: string | null
  }>({
    dataDialog: {
      visible: false,
      content: ''
    },
    datas: [],
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
      lastModifiedTime: new Date(),
      note: ''
    },
    loading: false,
    filterState: null
  })

  const serverParams = computed(() => {
    const params: { taskId: number | string; running?: boolean; succeed?: boolean } = {
      taskId: props.taskId
    }

    // 根据筛选状态设置 running 和 succeed 参数
    if (state.filterState === 'pending') {
      // 未开始: running=false, succeed=null(不传)
      params.running = false
    } else if (state.filterState === 'running') {
      // 运行中: running=true
      params.running = true
    } else if (state.filterState === 'success') {
      // 成功: running=false, succeed=true
      params.running = false
      params.succeed = true
    } else if (state.filterState === 'failed') {
      // 失败: running=false, succeed=false
      params.running = false
      params.succeed = false
    }

    return params
  })

  const stateFilterText = computed(() => {
    const textMap: Record<string, string> = {
      pending: '未开始',
      running: '运行中',
      success: '成功',
      failed: '失败'
    }
    return state.filterState ? textMap[state.filterState] || '状态' : '状态'
  })

  // 计算表格高度
  const tableHeight = computed(() => {
    // eslint-disable-next-line
    const searchFormHeight = (searchForm.value as any)?.$el?.offsetHeight ?? 0
    return appStore.height - searchFormHeight - 160
  })

  // 节流加载函数
  const reloadData = throttle(() => {
    table.value.reloadData()
  }, 1000)

  function toHome () {
    router.back()
  }

  async function execute (data: SyncTaskData) {
    try {
      state.loading = true
      await winApi.post('task-executor/executeItem', data.id)
    } finally {
      state.loading = false
    }
  }

  function showData (data: string) {
    state.dataDialog.content = data
    state.dataDialog.visible = true
  }

  async function loadData () {
    try {
      state.loading = true
      const { data } = await winApi.post('sync-task/findById', props.taskId)
      state.task = data
    } finally {
      state.loading = false
    }
  }

  async function fetchTaskData () {
    try {
      state.loading = true
      const { data } = await winApi.post('task-executor/fetchData', props.taskId)
      state.task = data
      table.value?.reloadData()
    } catch (error) {
      ElMessage.error('获取任务数据异常: ' + (error?.message ?? '未知错误'))
    } finally {
      state.loading = false
    }
  }

  function setData (datas: SyncTaskData[]) {
    state.datas = datas
  }

  async function start () {
    try {
      state.loading = true
      const { data } = await winApi.post('task-executor/execute', props.taskId) ?? state.task
      state.task = data ?? state.task
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error('执行任务异常: ' + message)
    } finally {
      state.loading = false
    }
  }

  async function stop () {
    try {
      state.loading = true
      const { data } = await winApi.post('task-executor/stop', props.taskId) ?? state.task
      state.task = data ?? state.task
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error('停止任务异常: ' + message)
    } finally {
      state.loading = false
    }
  }

  function switchState (command: string | null) {
    state.filterState = command
    // 刷新表格数据,serverParams 会自动重新计算
    table.value?.reloadData()
  }

  function onTaskDataCompleted (_: unknown, args: SyncTaskData) {
    // 如果state.data为空,刷新表格
    if (Number(args.taskId) === Number(props.taskId)) {
      if (state.datas.length === 0) {
        reloadData()
      } else {
        const exist = state.datas.find(it => it.id === args.id)
        if (exist) {
          Object.assign(exist, args)
        }
      }
    }
  }

  function onTaskProgress (_: unknown, args: SyncTask) {
    if (Number(args.id) === Number(props.taskId)) {
      Object.assign(state.task, args)
    }
  }

  onMounted(() => {
    cancelCompleteEvent = window.electron.ipcRenderer.on('task-data-progress', onTaskDataCompleted)
    cancelTaskCompleteEvent = window.electron.ipcRenderer.on('task-completed', onTaskProgress)
    cancelTaskProgressEvent = window.electron.ipcRenderer.on('task-progress', onTaskProgress)
  })

  onUnmounted(() => {
    cancelCompleteEvent()
    cancelTaskCompleteEvent()
    cancelTaskProgressEvent()
  })

  loadData().then(() => {})

</script>

<style lang="less" scoped>
  .details-container {
    width: 100%;
    padding: 20px;
  }
</style>

<template>
  <div v-loading="state.loading" class="home-container">
    <el-form ref="searchForm" style="display: flex;justify-content: space-between;">
      <div style="display: flex; gap: 8px;">
        <el-form-item label="">
          <el-input v-model="state.serverParams.keyword"
                    clearable
                    placeholder="请输入任务名称搜索" />
        </el-form-item>
      </div>
      <div>
        <el-form-item label="">
          <el-button type="primary" @click="newTask()">新任务</el-button>
        </el-form-item>
      </div>
    </el-form>
    <ele-datatables ref="dataTable"
                    :http="http"
                    :max-height="tableHeight"
                    :server-params="state.serverParams"
                    ajax="sync-task/findAll"
                    class="table-container"
                    @data-change="setData">
      <el-table-column label="任务名称" prop="dataName">
        <template #default="{row}">
          <router-link :to="`/${row.id}`">
            {{ row.dataName }}
          </router-link>
        </template>
      </el-table-column>
      <el-table-column :formatter="dateFormatter()"
                       label="开始时间"
                       prop="startTime"
                       width="140" />
      <el-table-column :formatter="dateFormatter()"
                       label="结束日期"
                       prop="endTime"
                       width="140" />
      <el-table-column :formatter="dateTimeFormatter()"
                       label="完成时间"
                       prop="completedTime"
                       width="180" />
      <el-table-column label="成功数量" prop="succeedCount" width="80" />
      <el-table-column label="失败数量" prop="failCount" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{row}">
          <span v-if="row.completedTime">已完成</span>
          <template v-else>
            <span v-if="row.running">运行中</span>
            <template v-else>
              <span v-if="row.ready">就绪</span>
              <span v-else-if="!row.ready">未开始</span>
            </template>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{row}">
          <el-link v-if="row.running"
                   :disabled="!row.running"
                   type="warning"
                   @click="stop(row)">
            停止
          </el-link>
          <el-link v-else
                   :disabled="row.running || row.completedTime != null"
                   type="primary"
                   @click="execute(row)">
            启动
          </el-link>
          &nbsp;
          <el-link :disabled="row.running"
                   type="danger"
                   @click="remove(row)">
            删除
          </el-link>
        </template>
      </el-table-column>
    </ele-datatables>
    <el-dialog v-model="state.taskDialogVisible"
               :close-on-click-modal="false"
               :close-on-press-escape="false"
               title="新任务"
               @closed="state.current=null">
      <el-form v-if="state.current"
               ref="taskForm"
               :model="state.current"
               :rules="taskRules"
               label-width="120">
        <el-form-item label="任务名称" prop="dataName">
          <el-input v-model="state.current.dataName" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="任务开始日期" prop="startTime">
          <el-date-picker v-model="state.current.startTime" />
        </el-form-item>
        <el-form-item label="任务结束日期" prop="endTime">
          <el-date-picker v-model="state.current.endTime" />
        </el-form-item>
        <el-form-item label="备注" prop="note">
          <el-input v-model="state.current.note"
                    :rows="4"
                    maxlength="400"
                    show-word-limit
                    type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="state.taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, onUnmounted, reactive, toRaw, useTemplateRef } from 'vue'
  import { EleDatatables } from '@/components'
  import type { SyncTask } from '@/types'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import winApi from '@/http/winApi'
  import { AxiosInstance } from 'axios'
  import dateFormatter from '@/components/EleDatatables/dateFormatter'
  import dateTimeFormatter from '@/components/EleDatatables/dateTimeFormatter'
  import useAppStore from '@/store'

  const state = reactive<{
    serverParams: {
      keyword?: string
    },
    current: SyncTask | null
    taskDialogVisible: boolean,
    loading: boolean,
    datas: SyncTask[]
  }>({
    serverParams: {
      keyword: ''
    },
    datas: [],
    taskDialogVisible: false,
    current: null,
    loading: false
  })
  const http = window.api as AxiosInstance
  const dataTable = useTemplateRef('dataTable')
  const taskForm = useTemplateRef('taskForm')
  const searchForm = useTemplateRef('searchForm')
  const appStore = useAppStore()

  let cancelCompleteEvent: (() => void) = () => {}
  let cancelProgressEvent: (() => void) = () => {}
  // 计算表格高度
  const tableHeight = computed(() => {
    // eslint-disable-next-line
    const searchFormHeight = (searchForm.value as any)?.$el?.offsetHeight ?? 0
    return appStore.height - searchFormHeight - 60
  })

  // 表单校验规则
  const taskRules = {
    dataName: [
      { required: true, message: '请输入任务名称', trigger: 'blur' },
      { max: 100, message: '任务名称不能超过100个字符', trigger: 'blur' }
    ],
    startTime: [
      { required: true, message: '请选择任务开始日期', trigger: 'change' }
    ],
    endTime: [
      { required: true, message: '请选择任务结束日期', trigger: 'change' }
    ],
    note: [
      { max: 400, message: '备注不能超过400个字符', trigger: 'blur' }
    ]
  }

  async function newTask () {
    state.taskDialogVisible = true
    state.current = {
      completedTime: null,
      createdTime: new Date(),
      endTime: new Date(),
      datas: undefined,
      exception: null,
      note: null,
      failCount: 0,
      id: 0,
      lastModifiedTime: new Date(),
      ready: false,
      running: false,
      startTime: new Date(),
      succeedCount: 0,
      version: 0,
      dataName: '凭证同步任务'
    }
  }

  function setData (datas: SyncTask[]) {
    state.datas = datas
  }

  async function execute (row: SyncTask) {
    try {
      state.loading = true
      await winApi.post('task-executor/execute', row.id)
      dataTable.value?.reloadData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error('执行任务异常: ' + message)
    } finally {
      state.loading = true
    }
  }

  async function stop (row: SyncTask) {
    try {
      state.loading = true
      await winApi.post('task-executor/stop', row.id)
      dataTable.value?.reloadData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error('停止任务异常: ' + message)
    } finally {
      state.loading = false
    }
  }

  async function remove (row: SyncTask) {
    try {
      await ElMessageBox.confirm('确定要删除该任务吗？此操作不可恢复。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      state.loading = true
      const result = await winApi.post('sync-task/remove', row.id)
      if (result.status === 200) {
        ElMessage.success({ message: '任务删除成功！' })
        dataTable.value?.reloadData()
      }
    } catch (error: unknown) {
      // 用户取消操作时不显示错误提示
      if (error instanceof Error && error.message === 'cancel') {
        return
      }
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error('删除任务异常: ' + message)
    } finally {
      state.loading = false
    }
  }

  async function saveTask () {
    try {
      // 表单校验
      if (!taskForm.value) return
      await taskForm.value.validate()
      state.loading = true
      const result = await winApi.post('sync-task/save', toRaw(state.current))
      if (result.status === 200) {
        ElMessage.success({ message: '任务保存成功！' })
        dataTable.value?.reloadData()
        state.taskDialogVisible = false
      }
    } catch (error: unknown) {
      // 表单校验失败会抛出错误,但不显示提示
      if (error instanceof Error && error.message) {
        return
      }
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error('保存任务异常: ' + message)
    } finally {
      state.loading = false
    }
  }

  function onTaskProgress (_: unknown, args: SyncTask) {
    const exist = state.datas.find(it => it.id === args.id)
    if (exist) {
      Object.assign(exist, args)
    }
  }

  onMounted(() => {
    cancelCompleteEvent = window.electron.ipcRenderer.on('task-completed', onTaskProgress)
    cancelProgressEvent = window.electron.ipcRenderer.on('task-progress', onTaskProgress)
  })

  onUnmounted(() => {
    if (cancelCompleteEvent) {
      cancelCompleteEvent()
    }
    if (cancelProgressEvent) {
      cancelProgressEvent()
    }
  })

</script>

<style lang="less" scoped>
  .home-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 20px;
  }
</style>

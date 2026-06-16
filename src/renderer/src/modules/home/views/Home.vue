<template>
  <div v-loading="state.loading" class="home-container">
    <el-form style="display: flex;justify-content: space-between;">
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
                    :server-params="state.serverParams"
                    ajax="sync-task/findAll"
                    class="table-container">
      <el-table-column label="任务名称" prop="dataName" />
      <el-table-column label="开始时间" prop="startTime" />
      <el-table-column label="完成时间" prop="completedTime" />
      <el-table-column label="异常信息" prop="exception" />
      <el-table-column label="成功数量" prop="succeedCount" />
      <el-table-column label="失败数量" prop="failCount" />
      <el-table-column label="状态">
        <template #default="{row}">
          <span v-if="row.running">运行中</span>
          <span v-else-if="row.ready">就绪</span>
          <span v-else-if="row.completed">已完成</span>
          <span v-else-if="!row.ready">未开始</span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{row}">
          <el-button :disabled="row.running || row.completedTime"
                     text
                     type="primary"
                     @click="execute(row)">
            执行
          </el-button>
        </template>
      </el-table-column>
    </ele-datatables>
    <el-dialog v-model="state.taskDialogVisible" title="新任务" @closed="state.current=null">
      <el-form v-if="state.current" :model="state.current" label-width="100">
        <el-form-item label="任务名称" prop="dataName">
          <el-input v-model="state.current.dataName" />
        </el-form-item>
        <el-form-item label="任务开始日期" prop="startTime">
          <el-date-picker v-model="state.current.startTime" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注" prop="note">
          <el-input type="textarea" />
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
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { reactive, ref, toRaw } from 'vue'
  import { EleDatatables } from '@/components'
  import { SyncTask } from '../../../../../types'
  import { ElMessage } from 'element-plus'
  import winApi from '@/http/winApi'

  const state = reactive<{
    serverParams: {
      keyword?: string
    },
    current: SyncTask | null
    taskDialogVisible: boolean,
    loading: boolean
  }>({
    serverParams: {
      keyword: ''
    },
    taskDialogVisible: false,
    current: null,
    loading: false
  })
  const http = window.api
  const dataTable = ref<InstanceType<typeof EleDatatables> | null>(null)

  async function newTask () {
    state.taskDialogVisible = true
    state.current = {
      dataName: '凭证同步任务'
    }
  }

  async function execute (row: SyncTask) {
    try {
      const data = winApi.post('task-executor/execute', { id: row.id })
      console.log(data)
      dataTable.value?.reloadData()
    } catch (error: any) {
      console.error(error)
      alert('执行任务异常: ' + error.message)
    }
  }

  async function saveTask () {
    try {
      const result = await winApi.post('sync-task/save', toRaw(state.current))
      if (result.status === 200) {
        ElMessage.success({ message: '任务保存成功！' })
        dataTable.value?.reloadData()
        state.taskDialogVisible = false
      }
    } catch (error: any) {
      alert('保存任务异常: ' + error.message)
    }
  }

</script>

<style lang="less" scoped>
  .home-container {
    width: 100%;
    padding: 20px;
  }
</style>

<template>
  <div class="home-container">
    <el-form style="display: flex;justify-content: space-between;">
      <div style="display: flex; gap: 8px;">
        <el-form-item label="">
          <el-input v-model="state.serverParams.keyword"
                    clearable
                    placeholder="请输入任务名称搜索"
                    @clear="handleSearch"
                    @keyup.enter="handleSearch" />
        </el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
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
      <el-table-column label="ID" prop="id" />
      <el-table-column label="NAME" prop="dataName" />
      <el-table-column label="START TIME" prop="startTime" />
      <el-table-column label="COMPLETED TIME" prop="completedTime" />
      <el-table-column label="EXCEPTION" prop="exception" />
      <el-table-column label="SUCCESS COUNT" prop="successCount" />
      <el-table-column label="FAIL COUNT" prop="failCount" />
      <el-table-column label="READY" prop="ready" />
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

  const state = reactive<{
    serverParams: {
      keyword?: string
    },
    current: SyncTask | null
    taskDialogVisible: boolean
  }>({
    serverParams: {
      keyword: ''
    },
    taskDialogVisible: false,
    current: null
  })
  const http = window.api
  const dataTable = ref<InstanceType<typeof EleDatatables> | null>(null)

  // 搜索处理
  function handleSearch () {
    dataTable.value?.reloadData()
  }

  async function newTask () {
    state.taskDialogVisible = true
    state.current = {
      dataName: '凭证同步任务'
    }
  }

  async function saveTask () {
    try {
      const result = await window.api.post('sync-task/save', toRaw(state.current))
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

// SyncTaskService 使用示例
// 在 Vue 组件或其他渲染进程代码中使用

/**
 * 示例 1: 保存单个任务
 */
export async function exampleSaveTask() {
  const result = await window.api.syncTask.save({
    dataName: '测试任务',
    startTime: new Date(),
    completedTime: null,
    exception: null,
    successCount: 0,
    failCount: 0,
    ready: true
  })

  if (result.success) {
    console.log('保存成功，生成的 ID:', result.data.id)
  } else {
    console.error('保存失败:', result.message)
  }
}

/**
 * 示例 2: 查询所有任务
 */
export async function exampleGetAllTasks() {
  const result = await window.api.syncTask.findAll()
  
  if (result.success) {
    console.log('任务列表:', result.data)
    return result.data
  } else {
    console.error('查询失败:', result.message)
    return []
  }
}

/**
 * 示例 3: 根据 ID 查询任务
 */
export async function exampleGetTaskById(id: number) {
  const result = await window.api.syncTask.findById(id)
  
  if (result.success && result.data) {
    console.log('任务详情:', result.data)
    return result.data
  } else {
    console.error('查询失败:', result.message)
    return null
  }
}

/**
 * 示例 4: 更新任务
 */
export async function exampleUpdateTask(id: number) {
  const result = await window.api.syncTask.update({
    id,
    dataName: '更新后的任务名称',
    startTime: new Date(),
    completedTime: new Date(),
    exception: null,
    successCount: 10,
    failCount: 2,
    ready: false
  })

  if (result.success) {
    console.log('更新成功')
  } else {
    console.error('更新失败:', result.message)
  }
}

/**
 * 示例 5: 删除任务
 */
export async function exampleDeleteTask(id: number) {
  const result = await window.api.syncTask.remove(id)
  
  if (result.success && result.data) {
    console.log('删除成功')
  } else {
    console.error('删除失败:', result.message)
  }
}

/**
 * 示例 6: 批量保存任务
 */
export async function exampleSaveBatchTasks() {
  const tasks = [
    {
      dataName: '批量任务 1',
      startTime: new Date(),
      completedTime: null,
      exception: null,
      successCount: 0,
      failCount: 0,
      ready: true
    },
    {
      dataName: '批量任务 2',
      startTime: new Date(),
      completedTime: null,
      exception: null,
      successCount: 0,
      failCount: 0,
      ready: false
    }
  ]

  const result = await window.api.syncTask.saveBatch(tasks)
  
  if (result.success) {
    console.log('批量保存成功，保存了', result.data.length, '个任务')
    return result.data
  } else {
    console.error('批量保存失败:', result.message)
    return []
  }
}

/**
 * 示例 7: 清空所有任务
 */
export async function exampleClearAllTasks() {
  const result = await window.api.syncTask.clearAll()
  
  if (result.success) {
    console.log('清空成功')
  } else {
    console.error('清空失败:', result.message)
  }
}

/**
 * 示例 8: 在 Vue 组件中的完整使用
 */
export const vueComponentExample = `
<template>
  <div>
    <h2>同步任务管理</h2>
    <button @click="loadTasks">加载任务列表</button>
    <button @click="createTask">创建新任务</button>
    
    <table v-if="tasks.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>任务名称</th>
          <th>成功数</th>
          <th>失败数</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in tasks" :key="task.id">
          <td>{{ task.id }}</td>
          <td>{{ task.dataName }}</td>
          <td>{{ task.successCount }}</td>
          <td>{{ task.failCount }}</td>
          <td>{{ task.ready ? '就绪' : '未就绪' }}</td>
          <td>
            <button @click="deleteTask(task.id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tasks = ref<any[]>([])

// 加载任务列表
async function loadTasks() {
  const result = await window.api.syncTask.findAll()
  if (result.success) {
    tasks.value = result.data || []
  }
}

// 创建新任务
async function createTask() {
  const result = await window.api.syncTask.save({
    dataName: '新任务 ' + Date.now(),
    startTime: new Date(),
    completedTime: null,
    exception: null,
    successCount: 0,
    failCount: 0,
    ready: true
  })
  
  if (result.success) {
    await loadTasks() // 重新加载列表
  }
}

// 删除任务
async function deleteTask(id: number) {
  const result = await window.api.syncTask.remove(id)
  if (result.success) {
    await loadTasks() // 重新加载列表
  }
}

// 组件挂载时加载数据
loadTasks()
</script>
`

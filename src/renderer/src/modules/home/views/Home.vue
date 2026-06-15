<template>
  <div>欢迎进入首页模块</div>
  <div>{{ state.current }}</div>
  <el-button @click="writeFile()">测试</el-button>
  <el-button @click="saveTask()">新增一个task</el-button>
  <el-button @click="loadTasks()">查看所有task</el-button>
</template>

<script lang="ts" setup>
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { useHttp } from '@/http'
  import { reactive } from 'vue'

  const http = useHttp()
  const state = reactive({
    current: {}
  })

  http.get('authorities/current').then((res) => {
    state.current = res.data
  }).catch(() => {
    // console.log(err)
  })

  function writeFile () {
    // 调用 Electron 主进程写入文件
    window.api.writeFile('这是一段测试文本，由 Electron 客户端写入。\n写入时间：' + new Date().toLocaleString())
      .then((result: any) => {
        console.log(result)
        if (result.success) {
          alert(result.message)
        } else {
          alert('写入失败: ' + result.message)
        }
      })
      .catch((error: any) => {
        console.error('写入文件异常:', error)
        alert('写入文件异常: ' + error.message)
      })
  }

  async function saveTask () {
    // 调用ipc saveTask
    try {
      const result = await window.api.syncTask.save({
        dataName: '测试任务 ' + new Date().toLocaleTimeString(),
        startTime: new Date(),
        completedTime: null,
        exception: null,
        successCount: 0,
        failCount: 0,
        ready: true
      })

      if (result.success) {
        console.log('任务保存成功，ID:', result.data?.id)
        alert('任务保存成功！ID: ' + result.data?.id)
      } else {
        console.error('任务保存失败:', result.message)
        alert('任务保存失败: ' + result.message)
      }
    } catch (error: any) {
      console.error('保存任务异常:', error)
      alert('保存任务异常: ' + error.message)
    }
  }

  async function loadTasks () {
    // 调用ipc查询所有任务
    try {
      const result = await window.api.syncTask.findAll()

      if (result.success) {
        console.log('所有任务:', result.data)
        alert(`查询成功！共 ${result.data?.length || 0} 个任务，详见控制台`)
      } else {
        console.error('查询失败:', result.message)
        alert('查询失败: ' + result.message)
      }
    } catch (error: any) {
      console.error('查询任务异常:', error)
      alert('查询任务异常: ' + error.message)
    }
  }

</script>

<style lang="less" scoped>
</style>

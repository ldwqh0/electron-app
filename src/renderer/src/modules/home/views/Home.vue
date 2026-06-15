<template>
  <div>欢迎进入首页模块</div>
  <div>{{ state.current }}</div>
  <el-button @click="writeFile()">测试</el-button>
  <xz-uploader auto-upload url="/files" />
</template>

<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */
  import XzUploader from '@/components/XzUploader'
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

</script>

<style lang="less" scoped>
</style>

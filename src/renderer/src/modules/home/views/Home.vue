<template>
  <div>欢迎进入首页模块</div>
  <div>{{ state.current }}</div>
  <xz-uploader auto-upload url="/files" />
</template>

<script lang="ts" setup>
  import XzUploader from '@/components/XzUploader'
  import { useHttp } from '@/http'
  import { reactive } from 'vue'

  const http = useHttp()
  const state = reactive({
    current: {}
  })

  http.get('authorities/current').then((res) => {
    state.current = res.data
  }).catch((err) => {
    console.log(err)
  })

</script>

<style lang="less" scoped>
</style>

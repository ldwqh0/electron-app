<template>
  <div>欢迎进入首页模块</div>
  <xz-uploader auto-upload url="/files" />
</template>

<script lang="ts" setup>
  import XzUploader from '@/components/XzUploader'
  import { useHttp } from '@/http'

  const http = useHttp()

  http.get('authorities/current').then((res) => {
    console.log(res)
  }).catch((err) => {
    console.log(err)
  })

</script>

<style lang="less" scoped>
</style>

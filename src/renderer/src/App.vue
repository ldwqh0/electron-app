<template>
  <el-config-provider :locale="zhCn">
    <div v-if="hasError" class="error-page">
      <el-empty :image-size="200">
        <template #description>
          <span>{{ error?.message }}</span>
        </template>
      </el-empty>
    </div>

    <router-view v-else
                 v-loading="routing"
                 element-loading-background="rgba(122, 122, 122, 0.8)"
                 element-loading-svg-view-box="-10, -10, 50, 50"
                 element-loading-text="加载中..." />
  </el-config-provider>
</template>
<script lang="ts" setup>
  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  import { computed, onMounted, onUnmounted } from 'vue'
  import useAppStore from '@/store'

  const hasError = computed(() => {
    return false
  })

  const error = computed(() => {
    return {
      message: ''
    }
  })

  const routing = computed(() => {
    return false
  })

  // 监听窗口尺寸变化
  const appStore = useAppStore()
  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    const appElement = document.getElementById('app')
    if (appElement) {
      // 初始化尺寸
      appStore.setDimensions(appElement.clientWidth, appElement.clientHeight)
      // 使用 ResizeObserver 监听尺寸变化
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          appStore.setDimensions(width, height)
        }
      })
      resizeObserver.observe(appElement)
    }
  })

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })

</script>
<style lang="less" scoped>
  .error-page {
    display: flex;
    flex-flow: column;
    justify-content: center;

    span {
      font-size: 24px;
    }
  }
</style>

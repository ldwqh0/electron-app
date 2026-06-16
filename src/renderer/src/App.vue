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
  import { computed } from 'vue'

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

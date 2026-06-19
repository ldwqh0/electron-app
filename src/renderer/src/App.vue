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

    <el-dialog v-model="state.settingVisible"
               :before-close="onBeforeClose"
               title="系统设置"
               width="400px">
      <el-form ref="settingForm"
               :model="state.settings"
               :rules="state.rules"
               label-width="100px">
        <el-tabs v-model="state.settingPanel">
          <el-tab-pane label="金蝶参数设置" name="1">
            <el-form-item label="客户端ID" prop="kingClientId">
              <el-input v-model="state.settings.kingClientId" placeholder="请输入客户端ID" />
            </el-form-item>
            <el-form-item label="客户端密钥" prop="kingClientSecret">
              <el-input v-model="state.settings.kingClientSecret"
                        placeholder="请输入客户端密钥" />
            </el-form-item>
            <el-form-item label="外部实例ID" prop="kingOuterInstanceId">
              <el-input v-model="state.settings.kingOuterInstanceId" placeholder="请输入外部实例ID" />
            </el-form-item>
            <el-form-item label="账套ID" prop="kingAccountId">
              <el-input v-model="state.settings.kingAccountId" placeholder="请输入账套ID" />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="监管平台参数设置" name="2">
            <el-form-item label="平台地址" prop="targetUrl">
              <el-input v-model="state.settings.targetUrl" placeholder="请输入监管平台地址" />
            </el-form-item>
            <el-form-item label="应用ID" prop="targetAppid">
              <el-input v-model="state.settings.targetAppid" placeholder="请输入应用ID" />
            </el-form-item>
            <el-form-item label="应用密钥" prop="targetAppkey">
              <el-input v-model="state.settings.targetAppkey" placeholder="请输入应用密钥" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="saveConfig">保存</el-button>
        <el-button @click="cancel">取消</el-button>
      </template>
    </el-dialog>
  </el-config-provider>
</template>
<script lang="ts" setup>
  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  import { computed, onMounted, onUnmounted, reactive, toRaw, useTemplateRef } from 'vue'
  import type { FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import useAppStore from '@/store'
  import winApi from '@/http/winApi'
  import type { AppConfig } from '@/types/AppConfig'
  import { isEmpty } from 'lodash-es'

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

  const state = reactive<{
    settingVisible: boolean,
    settingPanel: string
    settings: AppConfig
    rules: FormRules
  }>({
    settingPanel: '1',
    settingVisible: false,
    settings: {
      kingClientId: '',
      kingClientSecret: '',
      kingOuterInstanceId: '',
      kingAccountId: '',
      targetUrl: '',
      targetAppid: '',
      targetAppkey: ''
    },
    rules: {
      kingClientId: [
        { required: true, message: '请输入客户端ID', trigger: 'blur' },
        { max: 100, message: '客户端ID不能超过100个字符', trigger: 'blur' }
      ],
      kingClientSecret: [
        { required: true, message: '请输入客户端密钥', trigger: 'blur' },
        { max: 100, message: '客户端密钥不能超过100个字符', trigger: 'blur' }
      ],
      kingOuterInstanceId: [
        { required: true, message: '请输入外部实例ID', trigger: 'blur' },
        { max: 100, message: '外部实例ID不能超过100个字符', trigger: 'blur' }
      ],
      kingAccountId: [
        { required: true, message: '请输入账套ID', trigger: 'blur' },
        { max: 100, message: '账套ID不能超过100个字符', trigger: 'blur' }
      ],
      targetUrl: [
        { required: true, message: '请输入监管平台地址', trigger: 'blur' },
        { max: 100, message: '平台地址不能超过100个字符', trigger: 'blur' }
      ],
      targetAppid: [
        { required: true, message: '请输入应用ID', trigger: 'blur' },
        { max: 100, message: '应用ID不能超过100个字符', trigger: 'blur' }
      ],
      targetAppkey: [
        { required: true, message: '请输入应用密钥', trigger: 'blur' },
        { max: 100, message: '应用密钥不能超过100个字符', trigger: 'blur' }
      ]
    }
  })

  // 表单引用
  const settingForm = useTemplateRef('settingForm')

  // 监听窗口尺寸变化
  const appStore = useAppStore()
  let resizeObserver: ResizeObserver | null = null
  let cancelEvent: (() => void) | null = null

  // 保存设置
  async function saveConfig () {
    if (!settingForm.value) return
    try {
      await settingForm.value.validate()
      await winApi.post('app-config/save', toRaw(state.settings))
      ElMessage.success('设置保存成功')
      state.settingVisible = false
    } catch (error: unknown) {
      // 验证失败，不做任何操作
    }
  }

  async function loadConfig (): Promise<AppConfig> {
    const { data } = await winApi.post('app-config/get', {})
    state.settings = data
    return data
  }

  async function cancel () {
    try {
      await settingForm.value.validate()
      state.settingVisible = false
    } catch {
      // 什么都不做
    }
  }

  async function onBeforeClose (done: () => void) {
    try {
      await settingForm.value.validate()
      done()
    } catch {
      // 什么都不做
    }
  }

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

    // 监听托盘设置事件
    cancelEvent = window.electron.ipcRenderer.on('tray:settings-clicked', () => {
      state.settingVisible = true
    })
  })

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    if (cancelEvent) {
      cancelEvent()
    }
  })

  loadConfig().then((data) => {
    if (isEmpty(data)) {
      state.settingVisible = true
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

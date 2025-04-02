<template>
  <div class="login-wrapper">
    <div class="login-box">
      <h2 style="text-align: center;">{{ platformTitle }}订货平台管理端</h2>
      <el-form ref="form"
               v-loading="state.loading"
               :model="state.loginForm"
               :rules="rules"
               class="login-form"
               @keydown.enter="submit"
               @submit.prevent>
        <div class="login-box">
          <transition enter-active-class="animate__animated animate__slideInLeft"
                      leave-active-class="animate__animated animate__slideOutLeft">
            <div v-if="state.step===1">
              <h3>用户登录</h3>
              <el-form-item prop="username">
                <el-input v-model="state.loginForm.username"
                          :validate-event="false"
                          autofocus
                          placeholder="请输入用户名"
                          size="large"
                          @input="clearError">
                  <template #prefix>
                    <el-icon>
                      <User />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <!-- <el-form-item>
                <div style="line-height: 40px">没有账户？请联系业务员</div>
              </el-form-item> -->
              <div class="float-right">
                <el-button size="large"
                           type="primary"
                           @click="gotoStep2">
                  下一步
                </el-button>
              </div>
            </div>
          </transition>

          <transition enter-active-class="animate__animated animate__slideInRight"
                      leave-active-class="animate__animated animate__slideOutRight">
            <div v-if="state.step===2">
              <h3>密码确认</h3>
              <el-form-item>
                <el-select v-if="state.tenants.length>1"
                           v-model="state.loginForm.tenantId"
                           size="large"
                           style="width: 100%">
                  <el-option v-for="tenant in state.tenants"
                             :key="tenant.id"
                             :label="`${tenant.fullname}`"
                             :value="tenant.id">
                    {{ tenant.fullname }}
                  </el-option>
                  <template #prefix>
                    <el-icon>
                      <Lock />
                    </el-icon>
                  </template>
                </el-select>
                <div v-if="state.tenants.length===1" style="line-height: 40px">{{ state.tenants[0].fullname }}</div>
              </el-form-item>
              <el-form-item prop="password">
                <el-input ref="passwordInputBox"
                          v-model="state.loginForm.password"
                          placeholder="请输入密码"
                          size="large"
                          type="password"
                          @input="state.error=''">
                  <template #prefix>
                    <el-icon>
                      <Lock />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-row>
                <el-col :span="12">
                  <a href="javascript:void(0)" @click="state.step=1">更换账号</a>
                </el-col>
                <el-col :span="12" class="float-right">
                  <el-button size="large" type="primary" @click="submit">登&nbsp;&nbsp;录</el-button>
                </el-col>
              </el-row>
            </div>
          </transition>
        </div>
      </el-form>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import type { TenantDto } from '@/types/service'
  import { ElForm, ElInput, type FormRules } from 'element-plus'
  import { useHttp } from '@/http'
  import { isEmpty } from '@/tools'
  import { useRoute } from 'vue-router'
  import useSecurityStore from '../store'
  import { reactive, ref } from 'vue'
  import type { AxiosError } from 'axios'

  const platformTitle = env.platformTitle
  const http = useHttp()
  const $route = useRoute()

  const passwordInputBox = ref<InstanceType<typeof ElInput> | null>(null)
  const form = ref<InstanceType<typeof ElForm> | null>(null)
  const { login } = useSecurityStore()
  const state = reactive<{
    tenants: TenantDto[]
    loginForm: {
      tenantId: number | string
      username: string
      password: string
    }
    step: number
    loading: boolean
    error: string | null
  }>({
    step: 1,
    tenants: [],
    loginForm: {
      tenantId: 0,
      username: '',
      password: ''
    },
    loading: false,
    error: null
  })

  const rules: FormRules = {
    username: [{
      required: true,
      message: '请输入手机号'
    }, {
      trigger: 'change',
      validator: (_, value, callback): void => {
        loadTenants(value).then(data => {
          if (data.length < 1) {
            callback(new Error('用户不存在'))
          } else {
            callback()
          }
        }).catch(() => {

        })
      }
    }],
    password: [{
      required: true,
      message: '密码不能为空'
    }, {
      trigger: 'change',
      validator: (_, _value, callback): void => {
        if (isEmpty(state.error)) {
          callback()
        } else {
          callback(new Error('用户名或密码错误'))
        }
      }
    }]
  }

  function clearError (): boolean {
    form.value?.clearValidate()
    return true
  }

  /**
   * 加载用户的租户信息
   */
  async function loadTenants (username: string): Promise<TenantDto[]> {
    state.loading = true
    try {
      const { data } = await http.get<TenantDto[]>('tenants', {
        params: {
          username
        }
      })
      state.tenants = data
      if (state.tenants?.length > 0) {
        state.loginForm.tenantId = state.tenants[0]?.id ?? -1
      }
      return data
    } finally {
      state.loading = false
    }
  }

  async function gotoStep2 (): Promise<void> {
    if ((await form.value?.validate()) === true) {
      state.step = 2
      setTimeout(() => {
        passwordInputBox.value?.focus()
      }, 1000)
    }
  }

  async function submit (): Promise<void> {
    if (state.step === 1) {
      await gotoStep2()
    } else if (state.step === 2) {
      state.loading = true
      const queryRedirect = $route.query.redirect ?? ''
      const redirect = isEmpty(queryRedirect) ? env.CONTEXT_PATH : decodeURIComponent(queryRedirect.toString())
      try {
        await login(state.loginForm)
        window.location.href = redirect
      } catch (e: unknown) {
        if ((e as AxiosError)?.response?.status === 401) {
          state.error = '用户名或密码错误'
          form.value?.validate()
        }
      } finally {
        state.loading = false
      }
    }
  }
</script>
<style lang="less" scoped>

.login-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  background-image: url("../assets/login.svg");
  background-repeat: no-repeat no-repeat;
  background-position: center;
  background-size: cover;
  width: 100%;

  .login-form {
    background: white;
    padding: 44px;
    width: 350px;
    box-shadow: 0 2px 6px rgb(0 0 0 / 20%);

    .login-box {
      overflow: hidden;
      position: relative;
      height: 240px;

      > div {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  }

  .float-right {
    text-align: right;
  }
}
</style>

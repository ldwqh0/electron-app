import type { TenantDto } from '@/types/service'
import { defineStore } from 'pinia'
import qs from 'qs'
import { computed, reactive } from 'vue'
import http from '@/http'

const useSecurityStore = defineStore('security', () => {
  const state = reactive({
    token: ''
  })
  state.token = sessionStorage.getItem('token-m') ?? ''

  async function login (payload: unknown): Promise<void> {
    const { headers } = await http.post<TenantDto[]>('login', qs.stringify(payload))
    const token = headers['x-auth-token']
    state.token = token
    sessionStorage.setItem('token-m', token)
  }

  return {
    token: computed(() => state.token),
    login
  }
})
export default useSecurityStore

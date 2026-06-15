import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// Custom APIs for renderer
const api = {
  request<T = any, R = AxiosResponse<T>, D = any> (options: AxiosRequestConfig<D>): Promise<R> {
    if (options.method === 'post' || options.method === 'put' || options.method === 'patch') {
      return ipcRenderer.invoke(`${options.url}`, options.data)
    } else {
      return ipcRenderer.invoke(`${options.url}`, options.params)
    }
  },
  get<T = any, R = AxiosResponse<T>> (url: string): Promise<R> {
    return this.request({ url })
  },
  post<T = any, R = AxiosResponse<T>, D = any> (url: string, data: D): Promise<R> {
    return this.request({ url, method: 'post', data })
  },
  put<T = any, R = AxiosResponse<T>, D = any> (url: string, data: D): Promise<R> {
    return this.request({ url, method: 'put', data })
  },
  delete<T = any, R = AxiosResponse<T>> (url: string): Promise<R> {
    return this.request({ url, method: 'delete' })
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// Custom APIs for renderer
const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request<T = any, R = AxiosResponse<T>, D = any> (options: AxiosRequestConfig<D>): Promise<R> {
    if (options.method === 'post' || options.method === 'put' || options.method === 'patch') {
      return ipcRenderer.invoke(`${options.url}`, options.data)
    } else {
      return ipcRenderer.invoke(`${options.url}`, options.params)
    }
  }
}

const appEvent = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on (channel: string, listener: (...args: any[]) => void) {
    ipcRenderer.on(channel, listener)
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off (channel: string, listener: (...args: any[]) => void) {
    ipcRenderer.off(channel, listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('appEvent', appEvent)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
  window.appEvent = appEvent
}

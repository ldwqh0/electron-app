/**
 * IPC 自动注册工具
 * 自动将 Service 导出的函数注册为 IPC 处理器
 */

import { ipcMain, IpcMainInvokeHandler } from 'electron'

/**
 * 创建成功的 IPC 响应
 */
export function successResponse<T = any> (data: T) {
  return { success: true, data }
}

function withErrorHandler (handler: IpcMainInvokeHandler): IpcMainInvokeHandler {
  return async (...args) => {
    try {
      return await handler(...args)
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * 自动注册 Service 的所有方法为 IPC 处理器
 * @param service Service 模块对象
 * @param prefix IPC 通道前缀
 *
 * @example
 * // SyncTaskService 导出了 save, update, findAll 等方法
 * registerServiceAsIpc(SyncTaskService, 'sync-task')
 * // 自动注册: sync-task:save, sync-task:update, sync-task:findAll 等
 */
export function registerServiceAsIpc (
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  service: Record<string, Function>,
  prefix: string
): void {
  Object.entries(service).forEach(([name, fn]) => {
    // 跳过非函数和特殊方法
    if (typeof fn !== 'function') return
    if (name === 'default') return

    const channel = `${prefix}:${name}`
    // 创建 IPC 处理器
    const handler: IpcMainInvokeHandler = withErrorHandler(async (_, ...args) => {
      const result = await fn(...args)
      return successResponse(result)
    })
    // 注册
    ipcMain.handle(channel, handler)
    console.log(`  ✓ Registered: ${channel}`)
  })
}

/**
 * 移除指定前缀的所有 IPC 处理器
 * @param prefix IPC 通道前缀
 */
export function unregisterServiceIpc (prefix: string): void {
  // 注意：Electron 没有直接获取所有 channel 的方法
  // 需要在注册时记录，这里提供基础实现
  console.log(`⚠️ Unregister prefix: ${prefix} (manual implementation needed)`)
}

export default {
  registerServiceAsIpc,
  unregisterServiceIpc
}

import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { closeDatabase } from './database'
import SyncTaskService from './service/SyncTaskService'
import { registerServiceAsIpc } from './ServiceIpcRegistry'
import TaskExecuteService from './service/TaskExecuteService'
import SyncTaskDataService from './service/SyncTaskDataService'
import DataService from './service/DataService'
import log from 'electron-log'

function createWindow () {
  // Create the browser window.

  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 跨域问题仅在测试环境中出现，因为生产环境是使用loadFile加载的窗口，所以不需要设置跨域问题
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      if (details.method === 'OPTIONS') {
        callback({
          ...details,
          statusLine: 'HTTP/1.1 204',
          responseHeaders: {
            ...details.responseHeaders,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'x-auth-token',
            'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, PATCH'
          }
        })
      } else {
        callback({
          ...details,
          responseHeaders: {
            ...details.responseHeaders,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'x-auth-token'
          }
        })
      }
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  createWindow()

  // 配置数据库（WAL 模式等）
  // 自动注册 SyncTaskService 的所有方法为 IPC 处理器
  // 会注册: sync-task:save, sync-task:update, sync-task:findById,
  //        sync-task:findAll, sync-task:remove, sync-task:saveBatch,
  //        sync-task:clearAll, sync-task:closeDatabase
  DataService.init().then(() => {
    log.info('Database initialized')
  })
  registerServiceAsIpc(SyncTaskService, 'sync-task')
  registerServiceAsIpc(TaskExecuteService, 'task-executor')
  registerServiceAsIpc(SyncTaskDataService, 'sync-task-data')
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前关闭数据库连接
app.on('will-quit', () => {
  closeDatabase()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

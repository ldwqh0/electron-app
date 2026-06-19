import { app, Menu, nativeImage, Tray } from 'electron'
import { join } from 'path'
import appState from '@/AppState'

/**
 * 系统托盘管理器
 */
class TrayManager {
  private tray: Tray | null = null

  /**
   * 创建系统托盘
   */
  createTray (): void {
    // 加载托盘图标
    const iconPath = join(__dirname, '../../resources/icon.png')
    const trayIcon = nativeImage.createFromPath(iconPath)

    // 创建托盘
    this.tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))

    // 设置托盘提示文本
    this.tray.setToolTip('凭证同步工具')

    // 创建托盘菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          this.showMainWindow()
        }
      },
      {
        label: '设置',
        click: () => {
          this.sendSettingsNotification()
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit()
        }
      }
    ])

    // 设置托盘菜单
    this.tray.setContextMenu(contextMenu)

    // 点击托盘图标显示/隐藏主窗口
    this.tray.on('click', () => {
      this.toggleMainWindow()
    })

    // 双击托盘图标显示主窗口
    this.tray.on('double-click', () => {
      this.showMainWindow()
    })
  }

  /**
   * 销毁托盘
   */
  destroy (): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }

  /**
   * 获取托盘实例
   */
  getTray (): Tray | null {
    return this.tray
  }

  /**
   * 显示主窗口
   */
  private showMainWindow (): void {
    const mainWindow = appState.mainWindow
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()
    }
  }

  /**
   * 切换主窗口显示/隐藏
   */
  private toggleMainWindow (): void {
    const mainWindow = appState.mainWindow
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        this.showMainWindow()
      }
    }
  }

  /**
   * 发送设置通知到主窗口
   */
  private sendSettingsNotification (): void {
    const mainWindow = appState.mainWindow
    if (mainWindow && !mainWindow.isDestroyed()) {
      // 方式1: 通过 IPC 发送事件
      mainWindow.webContents.send('tray:settings-clicked')

      // 方式2: 显示主窗口并发送事件
      this.showMainWindow()

      // 方式3: 发送系统通知（可选）
      // 如果需要显示系统通知，可以取消下面的注释
      /*
      const notification = new Notification({
        title: '凭证同步工具',
        body: '设置菜单已点击',
        icon: join(__dirname, '../../resources/icon.png')
      })
      notification.show()
      */
    }
  }
}

// 导出单例
export const trayManager = new TrayManager()
export default TrayManager

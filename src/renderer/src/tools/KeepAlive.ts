import { throttle } from 'lodash-es'

export default class KeepAlive {
  private logoutTimeout: number = 0
  private notifyTimeout: number = 0
  private keepaliveTimeout: number = 0

  constructor ({
    timeout,
    notifyTime,
    keepAliveAction,
    onNotify,
    logout
  }: {
    timeout: number
    notifyTime: number
    keepAliveAction: () => void
    onNotify: () => Promise<unknown>
    logout: () => Promise<unknown>
  }) {
    const logoutFun = async (): Promise<unknown> => {
      try {
        this.stop()
        await logout()
      } finally {
        // window.location.reload()
      }
      return Promise.resolve()
    }

    const onNotifyFun = async (): Promise<unknown> => {
      try {
        await onNotify()
        // 如果继续。
        clearTimeout(this.logoutTimeout)
        this.notifyTimeout = window.setTimeout(onNotifyFun, notifyTime)
        this.logoutTimeout = window.setTimeout(logoutFun, timeout)
        return Promise.resolve()
      } catch (e) {
        return logoutFun()
      }
    }

    const reset = throttle(() => {
      if (this.keepaliveTimeout <= 0) {
        this.keepaliveTimeout = window.setInterval(keepAliveAction, 1000 * 60 * 10)
      }
      clearTimeout(this.logoutTimeout)
      clearTimeout(this.notifyTimeout)
      this.logoutTimeout = window.setTimeout(logoutFun, timeout)
      this.notifyTimeout = window.setTimeout(onNotifyFun, notifyTime)
    }, 3000)

    reset()

    document.addEventListener('click', reset)
    document.addEventListener('keypress', reset)
  }

  stop (): void {
    clearTimeout(this.logoutTimeout)
    clearTimeout(this.notifyTimeout)
    clearInterval(this.keepaliveTimeout)
  }
}

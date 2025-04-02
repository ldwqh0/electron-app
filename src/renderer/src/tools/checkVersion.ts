import axios from 'axios'

interface Version {
  version: number
}

let version = 0
const http = axios.create()

export default function checkVersion (callback: (version: number) => Promise<unknown>, timeout = 1000 * 3 * 60): void {
  window.setTimeout(async () => {
    const { data } = await http.get<Version>(`${env.CONTEXT_PATH}version.json`)
    if (version === 0) {
      version = data.version
      checkVersion(callback, timeout)
    } else {
      if (data.version > version) {
        try {
          await callback(data.version)
          window.location.reload()
        } catch (e) {
          checkVersion(callback, timeout)
        }
      } else {
        checkVersion(callback, timeout)
      }
    }
    // 每3分钟检测一次更新
  }, timeout)
}

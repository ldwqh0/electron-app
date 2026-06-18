import type { BrowserWindow } from 'electron'

const appState: {
  mainWindow: BrowserWindow | null,
  // eslint-disable-next-line
  [key: string]: any
} = {
  mainWindow: null
}

export default appState

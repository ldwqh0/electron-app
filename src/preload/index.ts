import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
const api = {
  request (key: string, options: any) {
    ipcRenderer.send("request", key, options);
  },
  onResponse (onSuccess: (key, v) => void, onFailure: (key, v) => void) {
    ipcRenderer.on("response-success", (_, key, args) => {
      onSuccess(key, args);
    });
    ipcRenderer.on("response-failure", (_, key, args) => {
      onFailure(key, args);
    });
  },
  // 文件写入 API
  writeFile: (content: string) => {
    return ipcRenderer.invoke('write-to-file', content);
  }
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}

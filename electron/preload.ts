import { contextBridge, ipcRenderer } from 'electron'
import type { AppState } from '../src/types/index.js'

contextBridge.exposeInMainWorld('electronAPI', {
  getState: (): Promise<AppState> => ipcRenderer.invoke('store:get'),
  setState: (state: AppState): Promise<void> => ipcRenderer.invoke('store:set', state),
  copyText: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:write', text),
  getAutoLaunch: (): Promise<boolean> => ipcRenderer.invoke('autolaunch:get'),
  setAutoLaunch: (enabled: boolean): Promise<void> => ipcRenderer.invoke('autolaunch:set', enabled),
})
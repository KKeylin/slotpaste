/// <reference types="vite/client" />

import type { AppState } from './types/index.js'

declare global {
  interface Window {
    electronAPI: {
      getState: () => Promise<AppState>
      setState: (state: AppState) => Promise<void>
      copyText: (text: string) => Promise<void>
      getAutoLaunch: () => Promise<boolean>
      setAutoLaunch: (enabled: boolean) => Promise<void>
    }
  }
}

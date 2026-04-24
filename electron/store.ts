import Store from 'electron-store'
import type { AppState } from '../src/types/index.js'

interface StoreSchema {
  appState: AppState
  windowBounds: { width: number; height: number }
}

const defaultState: AppState = {
  tabs: [
    {
      id: 'default',
      name: 'General',
      blocks: [],
      viewMode: 'canvas',
    },
  ],
  activeTabId: 'default',
  appearance: {
    bgColor: '#0e0e0e',
    bgOpacity: 0.8,
    blockColor: '#1a1a1a',
    blockOpacity: 1,
    recentColors: [],
  },
}

const DEFAULT_BOUNDS = { width: 800, height: 600 }

const store = new Store<StoreSchema>({
  defaults: {
    appState: defaultState,
    windowBounds: DEFAULT_BOUNDS,
  },
})

export function getState(): AppState {
  return store.get('appState')
}

export function setState(state: AppState): void {
  store.set('appState', state)
}

export function getWindowBounds(): { width: number; height: number } {
  return store.get('windowBounds')
}

export function saveWindowBounds(bounds: { width: number; height: number }): void {
  store.set('windowBounds', bounds)
}
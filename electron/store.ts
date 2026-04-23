import Store from 'electron-store'
import type { AppState } from '../src/types/index.js'

const defaultState: AppState = {
  tabs: [
    {
      id: 'default',
      name: 'General',
      blocks: [],
      viewMode: 'list',
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

const store = new Store<{ appState: AppState }>({
  defaults: { appState: defaultState },
})

export function getState(): AppState {
  return store.get('appState')
}

export function setState(state: AppState): void {
  store.set('appState', state)
}
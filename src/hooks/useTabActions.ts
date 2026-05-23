import type { AppState, Tab } from '../types'
import { nanoid } from '../utils/nanoid'

interface Params {
  state: AppState
  updateState: (s: AppState) => void
}

export function useTabActions({ state, updateState }: Params) {
  function patchState(patch: Partial<AppState>) {
    updateState({ ...state, ...patch })
  }

  function patchTab(tabId: string, patch: Partial<Tab>) {
    patchState({ tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)) })
  }

  function reorderTabs(tabs: Tab[]) { patchState({ tabs }) }

  function addTab() {
    const id = nanoid()
    const newTab: Tab = { id, name: 'New tab', blocks: [], viewMode: 'canvas' }
    patchState({ tabs: [...state.tabs, newTab], activeTabId: id })
  }

  function renameTab(id: string, name: string) { patchTab(id, { name }) }

  function deleteTab(id: string) {
    const remaining = state.tabs.filter((t) => t.id !== id)
    if (remaining.length === 0) return
    const newActiveId = state.activeTabId === id ? remaining[0].id : state.activeTabId
    patchState({ tabs: remaining, activeTabId: newActiveId })
  }

  return { patchState, patchTab, addTab, renameTab, deleteTab, reorderTabs }
}
import { useCallback, useEffect, useState } from 'react'
import type { AppState } from '../types'

const LS_KEY = 'slotpaste_state'

const defaultState: AppState = {
  tabs: [{ id: 'default', name: 'General', blocks: [], viewMode: 'list' }],
  activeTabId: 'default',
  appearance: {
    bgColor: '#0e0e0e',
    bgOpacity: 0.8,
    blockColor: '#1a1a1a',
    blockOpacity: 1,
    recentColors: [],
  },
}

const isBrowser = !window.electronAPI

async function loadState(): Promise<AppState> {
  if (isBrowser) {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return defaultState
    const saved = JSON.parse(raw) as AppState
    return {
      ...defaultState,
      ...saved,
      appearance: { ...defaultState.appearance, ...saved.appearance },
    }
  }
  return window.electronAPI.getState()
}

async function saveState(state: AppState): Promise<void> {
  if (isBrowser) {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
    return
  }
  return window.electronAPI.setState(state)
}

export function useStore() {
  const [state, setState] = useState<AppState>(defaultState)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadState().then((saved) => {
      setState(saved)
      setReady(true)
    })
  }, [])

  const updateState = useCallback((next: AppState) => {
    setState(next)
    saveState(next)
  }, [])

  return { state, updateState, ready }
}
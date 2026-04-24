import { useCallback, useEffect, useState } from 'react'
import type { AppState } from '../types'

const LS_KEY = 'slotpaste_state'

const defaultState: AppState = {
  tabs: [{ id: 'default', name: 'General', blocks: [], viewMode: 'canvas' }],
  activeTabId: 'default',
  appearance: {
    bgColor: '#0e0e0e',
    bgOpacity: 0.8,
    blockColor: '#1a1a1a',
    blockOpacity: 1,
    recentColors: [],
  },
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return defaultState
    const saved = JSON.parse(raw) as AppState
    return {
      ...defaultState,
      ...saved,
      appearance: { ...defaultState.appearance, ...saved.appearance },
    }
  } catch {
    return defaultState
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function useStore() {
  const [state, setState] = useState<AppState>(defaultState)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setState(loadState())
    setReady(true)
  }, [])

  const updateState = useCallback((next: AppState) => {
    setState(next)
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      localStorage.setItem(LS_KEY, JSON.stringify(next))
    }, 400)
  }, [])

  return { state, updateState, ready }
}
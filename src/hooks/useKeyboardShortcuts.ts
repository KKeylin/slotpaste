import { useEffect, useRef } from 'react'
import type { KeyShortcut } from '../types'

export const DEFAULT_FOCUS_ADD_SHORTCUT: KeyShortcut = { key: 'KeyN', alt: true, ctrl: false, meta: false, shift: false }
export const DEFAULT_SEARCH_SHORTCUT: KeyShortcut    = { key: 'KeyF', alt: true, ctrl: false, meta: false, shift: false }
export const DEFAULT_PREV_TAB_SHORTCUT: KeyShortcut  = { key: 'ArrowLeft', alt: true, ctrl: false, meta: false, shift: false }
export const DEFAULT_NEXT_TAB_SHORTCUT: KeyShortcut  = { key: 'ArrowRight', alt: true, ctrl: false, meta: false, shift: false }
export const DEFAULT_LOCK_SHORTCUT: KeyShortcut      = { key: 'KeyL', alt: true, ctrl: false, meta: false, shift: false }

function codeToLabel(code: string): string {
  if (/^Key[A-Z]$/.test(code)) return code[3]
  if (/^Digit\d$/.test(code)) return code[5]
  if (/^F\d{1,2}$/.test(code)) return code
  if (code === 'ArrowLeft') return '←'
  if (code === 'ArrowRight') return '→'
  if (code === 'ArrowUp') return '↑'
  if (code === 'ArrowDown') return '↓'
  if (code === 'Space') return 'Space'
  if (code === 'Enter') return '↵'
  if (code === 'Escape') return 'Esc'
  return code
}

export function formatShortcut({ key, alt, ctrl, meta, shift }: KeyShortcut): string {
  const parts: string[] = []
  if (ctrl) parts.push('Ctrl')
  if (meta) parts.push('⌘')
  if (alt) parts.push('Alt')
  if (shift) parts.push('Shift')
  parts.push(codeToLabel(key))
  return parts.join('+')
}

function matchesShortcut(e: KeyboardEvent, s: KeyShortcut): boolean {
  return (
    e.code === s.key &&
    e.altKey === s.alt &&
    e.ctrlKey === s.ctrl &&
    e.metaKey === s.meta &&
    e.shiftKey === s.shift
  )
}

export interface ShortcutMap {
  focusAdd: KeyShortcut
  search: KeyShortcut
  prevTab: KeyShortcut
  nextTab: KeyShortcut
  lock: KeyShortcut
}

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  focusAdd: DEFAULT_FOCUS_ADD_SHORTCUT,
  search:   DEFAULT_SEARCH_SHORTCUT,
  prevTab:  DEFAULT_PREV_TAB_SHORTCUT,
  nextTab:  DEFAULT_NEXT_TAB_SHORTCUT,
  lock:     DEFAULT_LOCK_SHORTCUT,
}

interface Callbacks {
  onFocusAdd: () => void
  onPrevTab: () => void
  onNextTab: () => void
  onSwitchTab: (index: number) => void
  onLock?: () => void
  shortcuts?: Partial<ShortcutMap>
}

export function useKeyboardShortcuts(callbacks: Callbacks) {
  const ref = useRef(callbacks)
  ref.current = callbacks

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      const s = { ...DEFAULT_SHORTCUTS, ...ref.current.shortcuts }

      if (ref.current.onLock && matchesShortcut(e, s.lock)) {
        e.preventDefault(); ref.current.onLock(); return
      }
      if (matchesShortcut(e, s.focusAdd)) {
        e.preventDefault(); ref.current.onFocusAdd(); return
      }
      if (matchesShortcut(e, s.prevTab)) {
        e.preventDefault(); ref.current.onPrevTab(); return
      }
      if (matchesShortcut(e, s.nextTab)) {
        e.preventDefault(); ref.current.onNextTab(); return
      }

      // hardcoded Alt+1-9 for tab switching by number
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const m = e.code.match(/^Digit([1-9])$/)
        if (m) { e.preventDefault(); ref.current.onSwitchTab(parseInt(m[1]) - 1) }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
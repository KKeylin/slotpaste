import { useEffect, useRef } from 'react'
import type { KeyShortcut } from '../types'

export const DEFAULT_LOCK_SHORTCUT: KeyShortcut = { key: 'l', alt: true, ctrl: false, meta: false, shift: false }

export function formatShortcut({ key, alt, ctrl, meta, shift }: KeyShortcut): string {
  const parts: string[] = []
  if (ctrl) parts.push('Ctrl')
  if (meta) parts.push('⌘')
  if (alt) parts.push('Alt')
  if (shift) parts.push('Shift')
  parts.push(key.length === 1 ? key.toUpperCase() : key)
  return parts.join('+')
}

function matchesShortcut(e: KeyboardEvent, s: KeyShortcut): boolean {
  return (
    e.key === s.key &&
    e.altKey === s.alt &&
    e.ctrlKey === s.ctrl &&
    e.metaKey === s.meta &&
    e.shiftKey === s.shift
  )
}

interface Callbacks {
  onFocusAdd: () => void
  onPrevTab: () => void
  onNextTab: () => void
  onSwitchTab: (index: number) => void
  onLock?: () => void
  lockShortcut?: KeyShortcut
}

export function useKeyboardShortcuts(callbacks: Callbacks) {
  const ref = useRef(callbacks)
  ref.current = callbacks

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      const shortcut = ref.current.lockShortcut ?? DEFAULT_LOCK_SHORTCUT
      if (ref.current.onLock && matchesShortcut(e, shortcut)) {
        e.preventDefault()
        ref.current.onLock()
        return
      }

      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        ref.current.onFocusAdd()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        ref.current.onPrevTab()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        ref.current.onNextTab()
      } else {
        const digit = parseInt(e.key)
        if (digit >= 1 && digit <= 9) {
          e.preventDefault()
          ref.current.onSwitchTab(digit - 1)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
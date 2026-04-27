import { useEffect, useRef } from 'react'

interface Callbacks {
  onFocusAdd: () => void
  onPrevTab: () => void
  onNextTab: () => void
  onSwitchTab: (index: number) => void
  onLock?: () => void
}

export function useKeyboardShortcuts(callbacks: Callbacks) {
  const ref = useRef(callbacks)
  ref.current = callbacks

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        ref.current.onLock?.()
      } else if (e.key === 'n' || e.key === 'N') {
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
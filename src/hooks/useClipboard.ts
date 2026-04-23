import { useCallback } from 'react'

const isBrowser = !window.electronAPI

export function useClipboard(onCopy: (text: string) => void) {
  return useCallback(async (text: string) => {
    if (isBrowser) {
      await navigator.clipboard.writeText(text)
    } else {
      await window.electronAPI.copyText(text)
    }
    onCopy(text)
  }, [onCopy])
}
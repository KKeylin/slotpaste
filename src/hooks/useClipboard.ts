import { useCallback } from 'react'

export function useClipboard(onCopy: (text: string) => void) {
  return useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
    onCopy(text)
  }, [onCopy])
}
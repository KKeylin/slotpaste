import { useState, useCallback } from 'react'

export interface Toast {
  id: number
  text: string
  message?: string
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = useCallback((text: string, message?: string) => {
    const id = Date.now()
    setToast({ id, text, message })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2200)
  }, [])

  return { toast, showToast }
}
import { useState, useRef, useEffect } from 'react'
import type { Block, SecureConfig } from '../types'
import { deriveKey, encryptText, decryptText, verifyKey, maskText } from '../utils/crypto'

export function useSecureMode(secure: SecureConfig | undefined) {
  const keyRef = useRef<CryptoKey | null>(null)
  const [isLocked, setIsLocked] = useState(() => secure?.enabled ?? false)
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (secure?.enabled && !keyRef.current) setIsLocked(true)
  }, [secure?.enabled])

  useEffect(() => {
    if (!secure?.enabled) return
    const onUnload = () => { keyRef.current = null }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [secure?.enabled])

  async function unlock(password: string, allBlocks: Block[]): Promise<boolean> {
    if (!secure) return false
    try {
      const key = await deriveKey(password, secure.salt)
      const ok = await verifyKey(key, secure.verifyToken)
      if (!ok) return false
      const entries: [string, string][] = await Promise.all(
        allBlocks.map(async b => {
          try {
            return [b.id, await decryptText(b.text, key)] as [string, string]
          } catch {
            return [b.id, b.text] as [string, string]
          }
        })
      )
      keyRef.current = key
      setDecryptedTexts(Object.fromEntries(entries))
      setIsLocked(false)
      return true
    } catch {
      return false
    }
  }

  function lock() {
    keyRef.current = null
    setDecryptedTexts({})
    setIsLocked(true)
  }

  function initialize(key: CryptoKey, texts: Record<string, string>) {
    keyRef.current = key
    setDecryptedTexts(texts)
    setIsLocked(false)
  }

  async function encryptForStore(blockId: string, plaintext: string): Promise<string> {
    if (!keyRef.current) throw new Error('Not unlocked')
    const ct = await encryptText(plaintext, keyRef.current)
    setDecryptedTexts(prev => ({ ...prev, [blockId]: plaintext }))
    return ct
  }

  function getDisplayText(blockId: string, storedText: string): string {
    if (!secure?.enabled) return storedText
    if (isLocked) return maskText(blockId)
    return decryptedTexts[blockId] ?? maskText(blockId)
  }

  function removeFromCache(blockId: string) {
    setDecryptedTexts(prev => { const n = { ...prev }; delete n[blockId]; return n })
  }

  return {
    isLocked: secure?.enabled ? isLocked : false,
    decryptedTexts,
    keyRef,
    unlock,
    lock,
    initialize,
    encryptForStore,
    getDisplayText,
    removeFromCache,
  }
}
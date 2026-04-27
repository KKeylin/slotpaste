import { useState } from 'react'
import type { AppState } from '../types'
import { deriveKey, encryptText, decryptText, generateSalt, createVerifyToken, verifyKey } from '../utils/crypto'
import { SECURE_INTENT } from '../enums'
import type { useSecureMode } from './useSecureMode'

export type SecureModalIntent = typeof SECURE_INTENT[keyof typeof SECURE_INTENT] | null

interface Deps {
  state: AppState
  updateState: (s: AppState) => void
  secureMode: ReturnType<typeof useSecureMode>
  showToast: (text: string) => void
}

export function useSecureOperations({ state, updateState, secureMode, showToast }: Deps) {
  const [intent, setIntent] = useState<SecureModalIntent>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingImport, setPendingImport] = useState<AppState | null>(null)

  function open(newIntent: SecureModalIntent) {
    setError('')
    setIntent(newIntent)
  }

  function handleCancel() {
    setIntent(null)
    setError('')
  }

  async function handleImportFile(file: File) {
    const raw = await file.text()
    try {
      const parsed = JSON.parse(raw) as AppState
      if (!Array.isArray(parsed.tabs) || !parsed.activeTabId) { showToast('Invalid file'); return }
      setPendingImport(parsed)
    } catch {
      showToast('Invalid file')
    }
  }

  function handleImportConfirm() {
    if (!pendingImport) return
    if (pendingImport.secure?.enabled) {
      open(SECURE_INTENT.IMPORT_VERIFY)
    } else {
      updateState(pendingImport)
      secureMode.lock()
      setPendingImport(null)
    }
  }

  async function handleSuccess(password: string) {
    setError('')
    setLoading(true)
    try {
      if (intent === SECURE_INTENT.UNLOCK) {
        const allBlocks = state.tabs.flatMap(t => t.blocks)
        const ok = await secureMode.unlock(password, allBlocks)
        if (!ok) { setError('Wrong password'); setLoading(false); return }
        setIntent(null)
      }

      else if (intent === SECURE_INTENT.ENABLE) {
        const salt = generateSalt()
        const key = await deriveKey(password, salt)
        const verifyToken = await createVerifyToken(key)
        const allBlocks = state.tabs.flatMap(t => t.blocks)
        const encryptedTabs = await Promise.all(state.tabs.map(async tab => ({
          ...tab,
          blocks: await Promise.all(tab.blocks.map(async b => ({
            ...b,
            text: await encryptText(b.text, key),
          }))),
        })))
        secureMode.initialize(key, Object.fromEntries(allBlocks.map(b => [b.id, b.text])))
        updateState({ ...state, tabs: encryptedTabs, secure: { enabled: true, salt, verifyToken } })
        setIntent(null)
      }

      else if (intent === SECURE_INTENT.DISABLE) {
        const key = await deriveKey(password, state.secure!.salt)
        const ok = await verifyKey(key, state.secure!.verifyToken)
        if (!ok) { setError('Wrong password'); setLoading(false); return }
        const decryptedTabs = await Promise.all(state.tabs.map(async tab => ({
          ...tab,
          blocks: await Promise.all(tab.blocks.map(async b => ({
            ...b,
            text: await decryptText(b.text, key),
          }))),
        })))
        secureMode.lock()
        updateState({ ...state, tabs: decryptedTabs, secure: undefined })
        setIntent(null)
      }

      else if (intent === SECURE_INTENT.CHANGE_VERIFY) {
        const key = await deriveKey(password, state.secure!.salt)
        const ok = await verifyKey(key, state.secure!.verifyToken)
        if (!ok) { setError('Wrong password'); setLoading(false); return }
        setIntent(SECURE_INTENT.CHANGE_SET)
      }

      else if (intent === SECURE_INTENT.IMPORT_VERIFY) {
        if (!pendingImport?.secure) { setIntent(null); return }
        const key = await deriveKey(password, pendingImport.secure.salt)
        const ok = await verifyKey(key, pendingImport.secure.verifyToken)
        if (!ok) { setError('Wrong password'); setLoading(false); return }
        updateState(pendingImport)
        secureMode.lock()
        setPendingImport(null)
        setIntent(null)
      }

      else if (intent === SECURE_INTENT.CHANGE_SET) {
        const salt = generateSalt()
        const key = await deriveKey(password, salt)
        const verifyToken = await createVerifyToken(key)
        const reEncryptedTabs = await Promise.all(state.tabs.map(async tab => ({
          ...tab,
          blocks: await Promise.all(tab.blocks.map(async b => {
            const plain = secureMode.decryptedTexts[b.id] ?? b.text
            return { ...b, text: await encryptText(plain, key) }
          })),
        })))
        secureMode.initialize(key, secureMode.decryptedTexts)
        updateState({ ...state, tabs: reEncryptedTabs, secure: { enabled: true, salt, verifyToken } })
        setIntent(null)
      }
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  return {
    intent,
    open,
    handleCancel,
    error,
    loading,
    pendingImport,
    setPendingImport,
    handleSuccess,
    handleImportFile,
    handleImportConfirm,
  }
}
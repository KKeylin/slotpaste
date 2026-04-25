import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './hooks/useStore'
import { useToast } from './hooks/useToast'
import { useClipboard } from './hooks/useClipboard'
import { useSecureMode } from './hooks/useSecureMode'
import TabBar from './components/TabBar'
import BlockList from './components/BlockList'
import ListView from './components/ListView'
import Toast from './components/Toast'
import SettingsPanel from './components/SettingsPanel'
import OnboardingModal from './components/OnboardingModal'
import SecureModal from './components/SecureModal'
import ImportConfirmModal from './components/ImportConfirmModal'
import type { AppState, Block, Tab } from './types'
import { nanoid } from './utils/nanoid'
import { findFreePosition } from './utils/collision'
import { isColorDark } from './utils/color'
import { deriveKey, encryptText, decryptText, generateSalt, createVerifyToken, verifyKey } from './utils/crypto'
import { BLOCK_DEFAULT_W, BLOCK_DEFAULT_H, EDIT_OVERHANG } from './constants'

type SecureModalIntent = 'unlock' | 'enable' | 'disable' | 'change-verify' | 'change-set' | 'import-verify' | null

export default function App() {
  const { state, updateState, ready } = useStore()
  const { toast, showToast } = useToast()
  const copy = useClipboard((text) => showToast(text))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(() => !localStorage.getItem('slotpaste_onboarded'))
  const [secureIntent, setSecureIntent] = useState<SecureModalIntent>(null)
  const [secureError, setSecureError] = useState('')
  const [secureLoading, setSecureLoading] = useState(false)
  const [pendingImport, setPendingImport] = useState<AppState | null>(null)

  const secureMode = useSecureMode(state.secure)

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0]
  const allBlocks = state.tabs.flatMap(t => t.blocks)
  const isSecureEnabled = !!state.secure?.enabled

  // Blocks with decrypted/masked text for display — must stay before early return
  const displayBlocks = useMemo(
    () => (activeTab?.blocks ?? []).map(b => ({ ...b, text: secureMode.getDisplayText(b.id, b.text) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab?.blocks, secureMode.isLocked, secureMode.decryptedTexts]
  )

  function closeHelp() {
    localStorage.setItem('slotpaste_onboarded', '1')
    setHelpOpen(false)
  }

  if (!ready) return null

  function patchState(patch: Partial<AppState>) {
    updateState({ ...state, ...patch })
  }

  function patchTab(tabId: string, patch: Partial<Tab>) {
    patchState({ tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)) })
  }

  function reorderTabs(tabs: Tab[]) { patchState({ tabs }) }

  function addTab() {
    const id = nanoid()
    const newTab: Tab = { id, name: 'New tab', blocks: [], viewMode: 'canvas' }
    patchState({ tabs: [...state.tabs, newTab], activeTabId: id })
  }

  function renameTab(id: string, name: string) { patchTab(id, { name }) }

  function deleteTab(id: string) {
    const remaining = state.tabs.filter((t) => t.id !== id)
    if (remaining.length === 0) return
    const newActiveId = state.activeTabId === id ? remaining[0].id : state.activeTabId
    patchState({ tabs: remaining, activeTabId: newActiveId })
  }

  async function addBlock(text: string, color?: string) {
    let storedText = text
    const id = nanoid()
    if (isSecureEnabled && !secureMode.isLocked) {
      storedText = await secureMode.encryptForStore(id, text)
    }
    let position: { x: number; y: number } | undefined
    if (activeTab.viewMode === 'canvas') {
      const last = activeTab.blocks[activeTab.blocks.length - 1]
      const i = activeTab.blocks.length
      const desired = last
        ? { x: last.position?.x ?? 5000, y: (last.position?.y ?? 5000 + (i - 1) * 90) + (last.height ?? 90) + 20 }
        : { x: 5000, y: 5000 }
      position = findFreePosition(desired, { w: BLOCK_DEFAULT_W, h: BLOCK_DEFAULT_H + EDIT_OVERHANG }, activeTab.blocks)
    }
    const block: Block = { id, text: storedText, fontSize: 'md', ...(position ? { position } : {}), ...(color ? { color } : {}) }
    patchTab(activeTab.id, { blocks: [...activeTab.blocks, block] })
  }

  function reorderBlocks(blocks: Block[]) { patchTab(activeTab.id, { blocks }) }

  async function changeBlock(updated: Block) {
    let stored = updated
    if (isSecureEnabled && !secureMode.isLocked) {
      const encryptedText = await secureMode.encryptForStore(updated.id, updated.text)
      stored = { ...updated, text: encryptedText }
    }
    patchTab(activeTab.id, { blocks: activeTab.blocks.map((b) => (b.id === stored.id ? stored : b)) })
  }

  function deleteBlock(id: string) {
    secureMode.removeFromCache(id)
    patchTab(activeTab.id, { blocks: activeTab.blocks.filter((b) => b.id !== id) })
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slotpaste-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(file: File) {
    file.text().then((raw) => {
      try {
        const parsed = JSON.parse(raw) as AppState
        if (!Array.isArray(parsed.tabs) || !parsed.activeTabId) { showToast('Invalid file'); return }
        setPendingImport(parsed)
      } catch {
        showToast('Invalid file')
      }
    })
  }

  function handleImportConfirm() {
    if (!pendingImport) return
    if (pendingImport.secure?.enabled) {
      setSecureError('')
      setSecureIntent('import-verify')
    } else {
      updateState(pendingImport)
      secureMode.lock()
      setPendingImport(null)
    }
  }

  async function changeBlockAndColors(updated: Block, recentColors: string[]) {
    let stored = updated
    if (isSecureEnabled && !secureMode.isLocked) {
      const encryptedText = await secureMode.encryptForStore(updated.id, updated.text)
      stored = { ...updated, text: encryptedText }
    }
    updateState({
      ...state,
      tabs: state.tabs.map((t) =>
        t.id === activeTab.id
          ? { ...t, blocks: t.blocks.map((b) => (b.id === stored.id ? stored : b)) }
          : t
      ),
      appearance: { ...state.appearance, recentColors },
    })
  }

  // --- Secure mode operations ---

  async function handleSecureModalSuccess(password: string) {
    setSecureError('')
    setSecureLoading(true)
    try {
      if (secureIntent === 'unlock') {
        const ok = await secureMode.unlock(password, allBlocks)
        if (!ok) { setSecureError('Wrong password'); setSecureLoading(false); return }
        setSecureIntent(null)
      }

      else if (secureIntent === 'enable') {
        const salt = generateSalt()
        const key = await deriveKey(password, salt)
        const verifyToken = await createVerifyToken(key)
        const encryptedTabs = await Promise.all(state.tabs.map(async tab => ({
          ...tab,
          blocks: await Promise.all(tab.blocks.map(async b => ({
            ...b,
            text: await encryptText(b.text, key),
          }))),
        })))
        const decryptedMap = Object.fromEntries(allBlocks.map(b => [b.id, b.text]))
        secureMode.initialize(key, decryptedMap)
        updateState({ ...state, tabs: encryptedTabs, secure: { enabled: true, salt, verifyToken } })
        setSecureIntent(null)
      }

      else if (secureIntent === 'disable') {
        const key = await deriveKey(password, state.secure!.salt)
        const ok = await verifyKey(key, state.secure!.verifyToken)
        if (!ok) { setSecureError('Wrong password'); setSecureLoading(false); return }
        const decryptedTabs = await Promise.all(state.tabs.map(async tab => ({
          ...tab,
          blocks: await Promise.all(tab.blocks.map(async b => ({
            ...b,
            text: await decryptText(b.text, key),
          }))),
        })))
        secureMode.lock()
        updateState({ ...state, tabs: decryptedTabs, secure: undefined })
        setSecureIntent(null)
      }

      else if (secureIntent === 'change-verify') {
        const key = await deriveKey(password, state.secure!.salt)
        const ok = await verifyKey(key, state.secure!.verifyToken)
        if (!ok) { setSecureError('Wrong password'); setSecureLoading(false); return }
        setSecureIntent('change-set')
      }

      else if (secureIntent === 'import-verify') {
        if (!pendingImport?.secure) { setSecureIntent(null); return }
        const key = await deriveKey(password, pendingImport.secure.salt)
        const ok = await verifyKey(key, pendingImport.secure.verifyToken)
        if (!ok) { setSecureError('Wrong password'); setSecureLoading(false); return }
        updateState(pendingImport)
        secureMode.lock()
        setPendingImport(null)
        setSecureIntent(null)
      }

      else if (secureIntent === 'change-set') {
        const salt = generateSalt()
        const key = await deriveKey(password, salt)
        const verifyToken = await createVerifyToken(key)
        // re-encrypt all blocks with new key
        const reEncryptedTabs = await Promise.all(state.tabs.map(async tab => ({
          ...tab,
          blocks: await Promise.all(tab.blocks.map(async b => {
            const plain = secureMode.decryptedTexts[b.id] ?? b.text
            return { ...b, text: await encryptText(plain, key) }
          })),
        })))
        secureMode.initialize(key, secureMode.decryptedTexts)
        updateState({ ...state, tabs: reEncryptedTabs, secure: { enabled: true, salt, verifyToken } })
        setSecureIntent(null)
      }
    } catch {
      setSecureError('Something went wrong')
    }
    setSecureLoading(false)
  }

  const btnBase = {
    backgroundColor: isColorDark(state.appearance.bgColor) ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)',
    color: isColorDark(state.appearance.bgColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
  }

  return (
    <div
      className="flex flex-col h-dvh w-screen overflow-hidden"
      style={{ backgroundColor: state.appearance.bgColor }}
    >
      <div className="relative">
        <TabBar
          tabs={state.tabs}
          activeTabId={state.activeTabId}
          accentColor={state.appearance.accentColor}
          onSelect={(id) => patchState({ activeTabId: id })}
          onAdd={addTab}
          onRename={renameTab}
          onReorder={reorderTabs}
          onDelete={deleteTab}
        />
        <div className="absolute top-0 right-0 flex">
          {isSecureEnabled && (
            <button
              onClick={() => secureMode.isLocked ? setSecureIntent('unlock') : secureMode.lock()}
              className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
              style={{ ...btnBase, opacity: 0.7 }}
            >
              {secureMode.isLocked ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1C9.24 1 7 3.24 7 6v1H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-1V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v1H9V6c0-1.66 1.34-3 3-3zm0 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => setHelpOpen(true)}
            className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
            style={{ ...btnBase, borderBottomLeftRadius: isSecureEnabled ? 0 : '12px', opacity: helpOpen ? 1 : 0.7 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
            </svg>
          </button>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
            style={{ ...btnBase, opacity: settingsOpen ? 1 : 0.7 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.67.07-1s-.03-.67-.07-1l2.16-1.68c.19-.15.24-.42.12-.64l-2.04-3.53c-.12-.22-.39-.3-.61-.22l-2.55 1.03c-.54-.42-1.11-.77-1.74-1.03l-.38-2.71C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.71c-.63.26-1.2.61-1.74 1.03L4.84 5.13c-.22-.08-.49 0-.61.22L2.19 8.88c-.13.22-.07.49.12.64l2.16 1.68c-.04.33-.07.67-.07 1s.03.67.07 1l-2.16 1.68c-.19.15-.24.42-.12.64l2.04 3.53c.12.22.39.3.61.22l2.55-1.03c.54.42 1.11.77 1.74 1.03l.38 2.71c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.71c.63-.26 1.2-.61 1.74-1.03l2.55 1.03c.22.08.49 0 .61-.22l2.04-3.53c.12-.22.07-.49-.12-.64l-2.16-1.68z"/>
            </svg>
          </button>
        </div>
      </div>

      <SettingsPanel
        isOpen={settingsOpen}
        appearance={state.appearance}
        secureEnabled={isSecureEnabled}
        secureLocked={secureMode.isLocked}
        onChange={(appearance) => patchState({ appearance })}
        onClose={() => setSettingsOpen(false)}
        onEnableSecure={() => { setSecureError(''); setSecureIntent('enable') }}
        onDisableSecure={() => { setSecureError(''); setSecureIntent('disable') }}
        onChangePassword={() => { setSecureError(''); setSecureIntent('change-verify') }}
        onExport={handleExport}
        onImportFile={handleImportFile}
      />

      <div className="relative flex-1 flex flex-col overflow-hidden">
        <div className="absolute top-2 right-2 z-10 flex flex-col rounded-xl overflow-hidden" style={{ border: `1px solid ${state.appearance.accentColor}` }}>
          {(['canvas', 'list'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => patchTab(activeTab.id, { viewMode: mode })}
              className="px-4 py-3 text-[10px] font-medium tracking-wide transition-colors"
              style={{
                backgroundColor: activeTab.viewMode === mode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                color: activeTab.viewMode === mode ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
              }}
            >
              {mode === 'canvas' ? 'Canvas' : 'List'}
            </button>
          ))}
        </div>

        {activeTab.viewMode === 'canvas' ? (
          <BlockList
            blocks={displayBlocks}
            activeTabId={activeTab.id}
            appearance={state.appearance}
            onCopy={copy}
            onAdd={addBlock}
            onChange={changeBlock}
            onDelete={deleteBlock}
            onColorChange={changeBlockAndColors}
          />
        ) : (
          <ListView
            blocks={displayBlocks}
            appearance={state.appearance}
            onCopy={copy}
            onAdd={addBlock}
            onChange={changeBlock}
            onDelete={deleteBlock}
            onColorChange={changeBlockAndColors}
            onReorder={reorderBlocks}
          />
        )}
      </div>

      <Toast toast={toast} />

      <AnimatePresence>
        {helpOpen && <OnboardingModal onClose={closeHelp} />}
      </AnimatePresence>

      <AnimatePresence>
        {pendingImport && !secureIntent && (
          <ImportConfirmModal
            hasSecure={!!pendingImport.secure?.enabled}
            onConfirm={handleImportConfirm}
            onCancel={() => setPendingImport(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {secureIntent && (
          <SecureModal
            mode={secureIntent === 'enable' || secureIntent === 'change-set' ? 'set' : secureIntent === 'unlock' ? 'unlock' : 'verify'}
            title={
              secureIntent === 'enable' ? 'Create password' :
              secureIntent === 'disable' ? 'Enter password to disable' :
              secureIntent === 'change-verify' ? 'Enter current password' :
              secureIntent === 'change-set' ? 'Create new password' :
              undefined
            }
            loading={secureLoading}
            error={secureError}
            onSuccess={handleSecureModalSuccess}
            onCancel={() => { setSecureIntent(null); setSecureError('') }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './hooks/useStore'
import { useToast } from './hooks/useToast'
import { useClipboard } from './hooks/useClipboard'
import { useSecureMode } from './hooks/useSecureMode'
import { useSecureOperations } from './hooks/useSecureOperations'
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS, type ShortcutMap } from './hooks/useKeyboardShortcuts'
import TabBar from './components/TabBar'
import BlockList from './components/BlockList'
import ListView from './components/ListView'
import Toast from './components/Toast'
import SettingsPanel from './components/SettingsPanel'
import OnboardingModal from './components/OnboardingModal'
import SecureModal from './components/SecureModal'
import ImportConfirmModal from './components/ImportConfirmModal'
import ResetModal from './components/ResetModal'
import SearchBar from './components/SearchBar'
import type { SearchBlock } from './components/SearchModal'
import { LockIcon, HelpIcon, SettingsIcon } from './components/icons'
import type { AppState, Block, Tab } from './types'
import { nanoid } from './utils/nanoid'
import { findFreePosition } from './utils/collision'
import { isColorDark } from './utils/color'
import { BLOCK_DEFAULT_W, BLOCK_DEFAULT_H, EDIT_OVERHANG } from './constants'
import { SECURE_INTENT } from './enums'

export default function App() {
  const { state, updateState, ready } = useStore()
  const { toast, showToast } = useToast()
  const copy = useClipboard((text) => showToast(text))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(() => !localStorage.getItem('slotpaste_onboarded'))

  const secureMode = useSecureMode(state.secure)
  const secureOps = useSecureOperations({ state, updateState, secureMode, showToast })

  useKeyboardShortcuts({
    onFocusAdd: () => document.querySelector<HTMLTextAreaElement>('[data-add-block]')?.focus(),
    onPrevTab: () => {
      const idx = state.tabs.findIndex((t) => t.id === state.activeTabId)
      patchState({ activeTabId: state.tabs[(idx - 1 + state.tabs.length) % state.tabs.length].id })
    },
    onNextTab: () => {
      const idx = state.tabs.findIndex((t) => t.id === state.activeTabId)
      patchState({ activeTabId: state.tabs[(idx + 1) % state.tabs.length].id })
    },
    onSwitchTab: (index) => {
      if (state.tabs[index]) patchState({ activeTabId: state.tabs[index].id })
    },
    onLock: () => {
      if (!isSecureEnabled) return
      if (secureMode.isLocked) secureOps.open(SECURE_INTENT.UNLOCK)
      else secureMode.lock()
    },
    shortcuts: {
      focusAdd: state.preferences?.focusAddShortcut ?? DEFAULT_SHORTCUTS.focusAdd,
      search:   state.preferences?.searchShortcut   ?? DEFAULT_SHORTCUTS.search,
      prevTab:  state.preferences?.prevTabShortcut  ?? DEFAULT_SHORTCUTS.prevTab,
      nextTab:  state.preferences?.nextTabShortcut  ?? DEFAULT_SHORTCUTS.nextTab,
      lock:     state.preferences?.lockShortcut     ?? DEFAULT_SHORTCUTS.lock,
    },
  })

  const shortcuts: ShortcutMap = {
    focusAdd: state.preferences?.focusAddShortcut ?? DEFAULT_SHORTCUTS.focusAdd,
    search:   state.preferences?.searchShortcut   ?? DEFAULT_SHORTCUTS.search,
    prevTab:  state.preferences?.prevTabShortcut  ?? DEFAULT_SHORTCUTS.prevTab,
    nextTab:  state.preferences?.nextTabShortcut  ?? DEFAULT_SHORTCUTS.nextTab,
    lock:     state.preferences?.lockShortcut     ?? DEFAULT_SHORTCUTS.lock,
  }

  function handleShortcutChange(key: keyof ShortcutMap, value: ShortcutMap[keyof ShortcutMap]) {
    const prefKey: Record<keyof ShortcutMap, string> = {
      focusAdd: 'focusAddShortcut',
      search:   'searchShortcut',
      prevTab:  'prevTabShortcut',
      nextTab:  'nextTabShortcut',
      lock:     'lockShortcut',
    }
    patchState({ preferences: { ...state.preferences, [prefKey[key]]: value } })
  }

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0]
  const isSecureEnabled = !!state.secure?.enabled

  const displayBlocks = useMemo(
    () => (activeTab?.blocks ?? []).map(b => ({ ...b, text: secureMode.getDisplayText(b.id, b.text) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab?.blocks, secureMode.isLocked, secureMode.decryptedTexts]
  )

  const searchBlocks = useMemo<SearchBlock[]>(
    () => state.tabs.flatMap(tab =>
      tab.blocks.map(b => ({ id: b.id, text: secureMode.getDisplayText(b.id, b.text), tabName: tab.name }))
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.tabs, secureMode.isLocked, secureMode.decryptedTexts]
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

  async function maybeEncrypt(block: Block): Promise<Block> {
    if (!isSecureEnabled || secureMode.isLocked) return block
    return { ...block, text: await secureMode.encryptForStore(block.id, block.text) }
  }

  async function addBlock(text: string, color?: string) {
    const id = nanoid()
    let position: { x: number; y: number } | undefined
    if (activeTab.viewMode === 'canvas') {
      const last = activeTab.blocks[activeTab.blocks.length - 1]
      const i = activeTab.blocks.length
      const desired = last
        ? { x: last.position?.x ?? 5000, y: (last.position?.y ?? 5000 + (i - 1) * 90) + (last.height ?? 90) + 20 }
        : { x: 5000, y: 5000 }
      position = findFreePosition(desired, { w: BLOCK_DEFAULT_W, h: BLOCK_DEFAULT_H + EDIT_OVERHANG }, activeTab.blocks)
    }
    const draft: Block = { id, text, fontSize: 'md', ...(position ? { position } : {}), ...(color ? { color } : {}) }
    const block = await maybeEncrypt(draft)
    patchTab(activeTab.id, { blocks: [...activeTab.blocks, block] })
  }

  function reorderBlocks(blocks: Block[]) { patchTab(activeTab.id, { blocks }) }

  async function changeBlock(updated: Block) {
    const stored = await maybeEncrypt(updated)
    patchTab(activeTab.id, { blocks: activeTab.blocks.map((b) => (b.id === stored.id ? stored : b)) })
  }

  function deleteBlock(id: string) {
    secureMode.removeFromCache(id)
    patchTab(activeTab.id, { blocks: activeTab.blocks.filter((b) => b.id !== id) })
  }

  function handleReset() {
    localStorage.removeItem('slotpaste_state')
    window.location.reload()
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

  async function changeBlockAndColors(updated: Block, recentColors: string[]) {
    const stored = await maybeEncrypt(updated)
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
        <div className="absolute top-0 right-0 flex items-center">
          <SearchBar blocks={searchBlocks} onCopy={copy} buttonStyle={btnBase} shortcut={shortcuts.search} />
          {isSecureEnabled && (
            <button
              onClick={() => secureMode.isLocked ? secureOps.open(SECURE_INTENT.UNLOCK) : secureMode.lock()}
              className="w-10 h-10 flex items-center justify-center mr-2 hover:opacity-80"
              style={{
                backgroundColor: secureMode.isLocked ? '#E24B4A' : '#1D9E75',
                color: 'white',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
                transition: 'background-color 0.3s ease',
              }}
            >
              <LockIcon />
            </button>
          )}
          <button
            onClick={() => setHelpOpen(true)}
            className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
            style={{ ...btnBase, borderBottomLeftRadius: '12px', opacity: helpOpen ? 1 : 0.7 }}
          >
            <HelpIcon />
          </button>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
            style={{ ...btnBase, opacity: settingsOpen ? 1 : 0.7 }}
          >
            <SettingsIcon />
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
        onEnableSecure={() => secureOps.open(SECURE_INTENT.ENABLE)}
        onDisableSecure={() => secureOps.open(SECURE_INTENT.DISABLE)}
        onChangePassword={() => secureOps.open(SECURE_INTENT.CHANGE_VERIFY)}
        onExport={handleExport}
        onImportFile={secureOps.handleImportFile}
        onReset={() => { setSettingsOpen(false); setResetOpen(true) }}
        shortcuts={shortcuts}
        onShortcutChange={handleShortcutChange}
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
            readOnly={isSecureEnabled && secureMode.isLocked}
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
            readOnly={isSecureEnabled && secureMode.isLocked}
          />
        )}
      </div>

      <Toast toast={toast} />

      <AnimatePresence>
        {helpOpen && <OnboardingModal onClose={closeHelp} />}
      </AnimatePresence>

      <AnimatePresence>
        {secureOps.pendingImport && !secureOps.intent && (
          <ImportConfirmModal
            hasSecure={!!secureOps.pendingImport.secure?.enabled}
            onConfirm={secureOps.handleImportConfirm}
            onCancel={() => secureOps.setPendingImport(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetOpen && (
          <ResetModal
            secureEnabled={isSecureEnabled}
            onBackup={handleExport}
            onReset={handleReset}
            onCancel={() => setResetOpen(false)}
          />
        )}
      </AnimatePresence>


      <AnimatePresence>
        {secureOps.intent && (
          <SecureModal
            mode={secureOps.intent === SECURE_INTENT.ENABLE || secureOps.intent === SECURE_INTENT.CHANGE_SET ? 'set' : secureOps.intent === SECURE_INTENT.UNLOCK ? 'unlock' : 'verify'}
            title={
              secureOps.intent === SECURE_INTENT.ENABLE ? 'Create password' :
              secureOps.intent === SECURE_INTENT.DISABLE ? 'Enter password to disable' :
              secureOps.intent === SECURE_INTENT.CHANGE_VERIFY ? 'Enter current password' :
              secureOps.intent === SECURE_INTENT.CHANGE_SET ? 'Create new password' :
              undefined
            }
            loading={secureOps.loading}
            error={secureOps.error}
            onSuccess={secureOps.handleSuccess}
            onCancel={secureOps.handleCancel}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
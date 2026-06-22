import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './hooks/useStore'
import { useToast } from './hooks/useToast'
import { useClipboard } from './hooks/useClipboard'
import { useSecureMode } from './hooks/useSecureMode'
import { useSecureOperations } from './hooks/useSecureOperations'
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS, type ShortcutMap } from './hooks/useKeyboardShortcuts'
import { useTabActions } from './hooks/useTabActions'
import { useBlockActions } from './hooks/useBlockActions'
import AppHeader from './components/AppHeader'
import CanvasHeader from './components/CanvasHeader'
import CanvasSettingsPanel from './components/CanvasSettingsPanel'
import ViewToggle from './components/ViewToggle'
import BlockList from './components/BlockList'
import ListView from './components/ListView'
import Toast from './components/Toast'
import SettingsPanel from './components/SettingsPanel'
import OnboardingModal from './components/OnboardingModal'
import SecureModal from './components/SecureModal'
import ImportConfirmModal from './components/ImportConfirmModal'
import ResetModal from './components/ResetModal'
import type { SearchBlock } from './components/SearchModal'
import type { TabAppearance } from './types'
import { isColorDark, hexToRgba } from './utils/color'
import { resolveAppearance } from './utils/appearance'
import { SECURE_INTENT } from './enums'

export default function App() {
  const { state, updateState, ready } = useStore()
  const { toast, showToast } = useToast()
  const copy = useClipboard((text) => showToast(text))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [canvasSettingsOpen, setCanvasSettingsOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(() => !localStorage.getItem('slotpaste_onboarded'))

  const secureMode = useSecureMode(state.secure)
  const secureOps = useSecureOperations({ state, updateState, secureMode, showToast })

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0]
  const tabAppearance = resolveAppearance(state.appearance, activeTab)
  const isSecureEnabled = !!state.secure?.enabled

  const { patchState, patchTab, addTab, renameTab, deleteTab, reorderTabs } = useTabActions({ state, updateState })
  const { addBlock, reorderBlocks, changeBlock, deleteBlock, changeBlockAndColors } = useBlockActions({
    state,
    updateState,
    activeTab,
    patchTab,
    isSecureEnabled,
    secureHandle: {
      isLocked: secureMode.isLocked,
      encryptForStore: secureMode.encryptForStore,
      removeFromCache: secureMode.removeFromCache,
    },
  })

  const shortcuts: ShortcutMap = {
    focusAdd: state.preferences?.focusAddShortcut ?? DEFAULT_SHORTCUTS.focusAdd,
    search:   state.preferences?.searchShortcut   ?? DEFAULT_SHORTCUTS.search,
    prevTab:  state.preferences?.prevTabShortcut  ?? DEFAULT_SHORTCUTS.prevTab,
    nextTab:  state.preferences?.nextTabShortcut  ?? DEFAULT_SHORTCUTS.nextTab,
    lock:     state.preferences?.lockShortcut     ?? DEFAULT_SHORTCUTS.lock,
  }

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
    shortcuts,
  })

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

  function changeTabAppearance(patch: TabAppearance) {
    patchTab(activeTab.id, { appearance: { ...activeTab.appearance, ...patch } })
  }

  function resetTabAppearance() {
    patchTab(activeTab.id, { appearance: undefined })
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

  function handleReset() {
    localStorage.removeItem('slotpaste_state')
    window.location.reload()
  }

  function closeHelp() {
    localStorage.setItem('slotpaste_onboarded', '1')
    setHelpOpen(false)
  }

  const displayBlocks = useMemo(
    () => (activeTab?.blocks ?? []).map(b => ({ ...b, text: secureMode.getDisplayText(b.id, b.text) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab?.blocks, secureMode.isLocked, secureMode.decryptedTexts]
  )

  const searchBlocks = useMemo<SearchBlock[]>(
    () => state.tabs.flatMap(tab =>
      tab.blocks.map(b => ({
        id: b.id,
        text: secureMode.getDisplayText(b.id, b.text),
        tabName: tab.name,
        tabId: tab.id,
        position: b.position,
        viewMode: tab.viewMode,
      }))
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.tabs, secureMode.isLocked, secureMode.decryptedTexts]
  )

  const [focusBlockId, setFocusBlockId] = useState<string | null>(null)

  function handleSearchSelect(block: SearchBlock) {
    copy(block.text)
    if (block.tabId !== state.activeTabId) {
      patchState({ activeTabId: block.tabId })
    }
    if (block.viewMode === 'canvas') {
      setFocusBlockId(block.id)
    }
  }

  if (!ready) return null

  const dark = isColorDark(tabAppearance.bgColor)
  const blurStyle = {
    backgroundColor: hexToRgba(tabAppearance.bgColor, 0.75),
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  }
  const btnStyle = {
    backgroundColor: dark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)',
    color: dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
  }
  const readOnly = isSecureEnabled && secureMode.isLocked

  const headerEl = (
    <AppHeader
      tabs={state.tabs}
      activeTabId={state.activeTabId}
      appearance={tabAppearance}
      btnStyle={btnStyle}
      searchBlocks={searchBlocks}
      searchShortcut={shortcuts.search}
      isSecureEnabled={isSecureEnabled}
      isSecureLocked={secureMode.isLocked}
      helpOpen={helpOpen}
      settingsOpen={settingsOpen}
      onSelectTab={(id) => patchState({ activeTabId: id })}
      onAddTab={addTab}
      onRenameTab={renameTab}
      onReorderTabs={reorderTabs}
      onDeleteTab={deleteTab}
      onSelect={handleSearchSelect}
      onOpenHelp={() => setHelpOpen(true)}
      onToggleSettings={() => setSettingsOpen((v) => !v)}
      onToggleLock={() => secureMode.isLocked ? secureOps.open(SECURE_INTENT.UNLOCK) : secureMode.lock()}
    />
  )

  const canvasHeaderEl = (
    <CanvasHeader
      tab={activeTab}
      appearance={tabAppearance}
      onRename={(name) => renameTab(activeTab.id, name)}
      onOpenSettings={() => setCanvasSettingsOpen(true)}
    />
  )

  const viewToggleEl = (
    <ViewToggle
      viewMode={activeTab.viewMode}
      accentColor={tabAppearance.accentColor}
      dark={dark}
      onChange={(mode) => patchTab(activeTab.id, { viewMode: mode })}
    />
  )

  return (
    <div
      className="relative h-dvh w-screen overflow-hidden"
      style={{ backgroundColor: tabAppearance.bgColor }}
    >
      {activeTab.viewMode === 'canvas' ? (
        <div className="absolute inset-0 flex flex-col">
          <BlockList
            blocks={displayBlocks}
            activeTabId={activeTab.id}
            appearance={tabAppearance}
            onCopy={copy}
            onAdd={addBlock}
            onChange={changeBlock}
            onDelete={deleteBlock}
            onColorChange={changeBlockAndColors}
            readOnly={readOnly}
            homePoint={activeTab.home}
            onSetHome={(point) => patchTab(activeTab.id, { home: point })}
            onHomeSet={() => showToast('', 'Home point saved')}
            focusBlockId={focusBlockId}
            onFocusDone={() => setFocusBlockId(null)}
          />
          <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
            <div className="pointer-events-auto" style={blurStyle}>
              {headerEl}
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <div className="pointer-events-auto rounded-xl" style={{ ...blurStyle, paddingLeft: 8, paddingRight: 42, maxWidth: 'min(380px, 65vw)' }}>
                {canvasHeaderEl}
              </div>
              <div className="pointer-events-auto" style={{ ...blurStyle, padding: 8, borderRadius: 10 }}>
                {viewToggleEl}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col">
          {headerEl}
          <div className="flex items-center justify-between px-3 py-2">
            {canvasHeaderEl}
            {viewToggleEl}
          </div>
          <ListView
            blocks={displayBlocks}
            appearance={tabAppearance}
            onCopy={copy}
            onAdd={addBlock}
            onChange={changeBlock}
            onDelete={deleteBlock}
            onColorChange={changeBlockAndColors}
            onReorder={reorderBlocks}
            readOnly={readOnly}
          />
        </div>
      )}

      <CanvasSettingsPanel
        isOpen={canvasSettingsOpen}
        tab={activeTab}
        tabCount={state.tabs.length}
        tabAppearance={tabAppearance}
        onTabAppearanceChange={changeTabAppearance}
        onReset={resetTabAppearance}
        onClose={() => setCanvasSettingsOpen(false)}
        onDelete={() => { deleteTab(activeTab.id); setCanvasSettingsOpen(false) }}
      />

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
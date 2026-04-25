import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './hooks/useStore'
import { useToast } from './hooks/useToast'
import { useClipboard } from './hooks/useClipboard'
import TabBar from './components/TabBar'
import BlockList from './components/BlockList'
import ListView from './components/ListView'
import Toast from './components/Toast'
import SettingsPanel from './components/SettingsPanel'
import OnboardingModal from './components/OnboardingModal'
import type { AppState, Block, Tab } from './types'
import { nanoid } from './utils/nanoid'
import { findFreePosition } from './utils/collision'
import { isColorDark } from './utils/color'
import { BLOCK_DEFAULT_W, BLOCK_DEFAULT_H, EDIT_OVERHANG } from './constants'

export default function App() {
  const { state, updateState, ready } = useStore()
  const { toast, showToast } = useToast()
  const copy = useClipboard((text) => showToast(text))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(() => !localStorage.getItem('slotpaste_onboarded'))

  function closeHelp() {
    localStorage.setItem('slotpaste_onboarded', '1')
    setHelpOpen(false)
  }

  if (!ready) return null

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0]

  function patchState(patch: Partial<AppState>) {
    updateState({ ...state, ...patch })
  }

  function patchTab(tabId: string, patch: Partial<Tab>) {
    patchState({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)),
    })
  }

  function reorderTabs(tabs: Tab[]) {
    patchState({ tabs })
  }

  function addTab() {
    const id = nanoid()
    const newTab: Tab = { id, name: 'New tab', blocks: [], viewMode: 'canvas' }
    patchState({ tabs: [...state.tabs, newTab], activeTabId: id })
  }

  function renameTab(id: string, name: string) {
    patchTab(id, { name })
  }

  function deleteTab(id: string) {
    const remaining = state.tabs.filter((t) => t.id !== id)
    if (remaining.length === 0) return
    const newActiveId = state.activeTabId === id ? remaining[0].id : state.activeTabId
    patchState({ tabs: remaining, activeTabId: newActiveId })
  }

  function addBlock(text: string, color?: string) {
    let position: { x: number; y: number } | undefined
    if (activeTab.viewMode === 'canvas') {
      const last = activeTab.blocks[activeTab.blocks.length - 1]
      const i = activeTab.blocks.length
      const desired = last
        ? { x: last.position?.x ?? 5000, y: (last.position?.y ?? 5000 + (i - 1) * 90) + (last.height ?? 90) + 20 }
        : { x: 5000, y: 5000 }
      position = findFreePosition(desired, { w: BLOCK_DEFAULT_W, h: BLOCK_DEFAULT_H + EDIT_OVERHANG }, activeTab.blocks)
    }
    const block: Block = { id: nanoid(), text, fontSize: 'md', ...(position ? { position } : {}), ...(color ? { color } : {}) }
    patchTab(activeTab.id, { blocks: [...activeTab.blocks, block] })
  }

  function reorderBlocks(blocks: Block[]) {
    patchTab(activeTab.id, { blocks })
  }

  function changeBlock(updated: Block) {
    patchTab(activeTab.id, {
      blocks: activeTab.blocks.map((b) => (b.id === updated.id ? updated : b)),
    })
  }

  function deleteBlock(id: string) {
    patchTab(activeTab.id, {
      blocks: activeTab.blocks.filter((b) => b.id !== id),
    })
  }

  function changeBlockAndColors(updated: Block, recentColors: string[]) {
    updateState({
      ...state,
      tabs: state.tabs.map((t) =>
        t.id === activeTab.id
          ? { ...t, blocks: t.blocks.map((b) => (b.id === updated.id ? updated : b)) }
          : t
      ),
      appearance: { ...state.appearance, recentColors },
    })
  }

  return (
    <div
      className="flex flex-col h-[100dvh] w-screen overflow-hidden"
      style={{
        backgroundColor: state.appearance.bgColor,
      }}
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
          <button
            onClick={() => setHelpOpen(true)}
            className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
            style={{
              borderBottomLeftRadius: '12px',
              backgroundColor: isColorDark(state.appearance.bgColor)
                ? 'rgba(255,255,255,0.88)'
                : 'rgba(0,0,0,0.82)',
              color: isColorDark(state.appearance.bgColor)
                ? 'rgba(0,0,0,0.7)'
                : 'rgba(255,255,255,0.9)',
              opacity: helpOpen ? 1 : 0.7,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
            </svg>
          </button>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
            style={{
              backgroundColor: isColorDark(state.appearance.bgColor)
                ? 'rgba(255,255,255,0.88)'
                : 'rgba(0,0,0,0.82)',
              color: isColorDark(state.appearance.bgColor)
                ? 'rgba(0,0,0,0.7)'
                : 'rgba(255,255,255,0.9)',
              opacity: settingsOpen ? 1 : 0.7,
            }}
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
        onChange={(appearance) => patchState({ appearance })}
        onClose={() => setSettingsOpen(false)}
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
            blocks={activeTab.blocks}
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
            blocks={activeTab.blocks}
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
    </div>
  )
}
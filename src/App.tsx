import { useState } from 'react'
import { useStore } from './hooks/useStore'
import { useToast } from './hooks/useToast'
import { useClipboard } from './hooks/useClipboard'
import TabBar from './components/TabBar'
import BlockList from './components/BlockList'
import Toast from './components/Toast'
import SettingsPanel from './components/SettingsPanel'
import type { AppState, Block, Tab } from './types'
import { nanoid } from './utils/nanoid'

export default function App() {
  const { state, updateState, ready } = useStore()
  const { toast, showToast } = useToast()
  const copy = useClipboard((text) => showToast(text))
  const [settingsOpen, setSettingsOpen] = useState(false)

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
    const newTab: Tab = { id, name: 'New tab', blocks: [], viewMode: 'list' }
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
    const last = activeTab.blocks[activeTab.blocks.length - 1]
    const i = activeTab.blocks.length
    const position = last
      ? { x: last.position?.x ?? 5000, y: (last.position?.y ?? 5000 + (i - 1) * 90) + (last.height ?? 90) + 20 }
      : { x: 5000, y: 5000 }
    const block: Block = { id: nanoid(), text, fontSize: 'md', position, ...(color ? { color } : {}) }
    patchTab(activeTab.id, { blocks: [...activeTab.blocks, block] })
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
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{
        backgroundColor: `color-mix(in srgb, ${state.appearance.bgColor} ${state.appearance.bgOpacity * 100}%, transparent)`,
      }}
    >
      <div className="relative">
        <TabBar
          tabs={state.tabs}
          activeTabId={state.activeTabId}
          onSelect={(id) => patchState({ activeTabId: id })}
          onAdd={addTab}
          onRename={renameTab}
          onReorder={reorderTabs}
          onDelete={deleteTab}
        />
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
          style={{
            color: settingsOpen ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="2"/>
            <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.636 2.636l1.06 1.06M10.304 10.304l1.06 1.06M11.364 2.636l-1.06 1.06M3.696 10.304l-1.06 1.06"/>
          </svg>
        </button>
      </div>

      <SettingsPanel
        isOpen={settingsOpen}
        appearance={state.appearance}
        onChange={(appearance) => patchState({ appearance })}
        onClose={() => setSettingsOpen(false)}
      />

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

      <Toast toast={toast} />
    </div>
  )
}
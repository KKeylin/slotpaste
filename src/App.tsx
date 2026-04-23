import { useStore } from './hooks/useStore'
import { useToast } from './hooks/useToast'
import { useClipboard } from './hooks/useClipboard'
import TabBar from './components/TabBar'
import BlockList from './components/BlockList'
import Toast from './components/Toast'
import type { AppState, Block, Tab } from './types'
import { nanoid } from './utils/nanoid'

export default function App() {
  const { state, updateState, ready } = useStore()
  const { toast, showToast } = useToast()
  const copy = useClipboard((text) => showToast(text))

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

  function addBlock(text: string) {
    const block: Block = { id: nanoid(), text, fontSize: 'md' }
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
      <TabBar
        tabs={state.tabs}
        activeTabId={state.activeTabId}
        onSelect={(id) => patchState({ activeTabId: id })}
        onAdd={addTab}
        onRename={renameTab}
        onReorder={reorderTabs}
      />

      <BlockList
        blocks={activeTab.blocks}
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
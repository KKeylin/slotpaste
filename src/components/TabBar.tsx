import { useState } from 'react'
import type { Tab } from '../types'

interface Props {
  tabs: Tab[]
  activeTabId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onRename: (id: string, name: string) => void
}

export default function TabBar({ tabs, activeTabId, onSelect, onAdd, onRename }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  function startRename(tab: Tab) {
    setEditingId(tab.id)
    setEditingName(tab.name)
  }

  function commitRename() {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim())
    }
    setEditingId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setEditingId(null)
  }

  return (
    <div className="flex items-center gap-1 px-3 pt-3 pb-2 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            onDoubleClick={() => startRename(tab)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs cursor-pointer transition-all"
            style={{
              backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: active ? 'rgba(255,255,255,0.87)' : 'rgba(255,255,255,0.35)',
              border: '1px solid',
              borderColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
            }}
          >
            {editingId === tab.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent outline-none w-20 text-xs"
                style={{ color: 'rgba(255,255,255,0.87)' }}
              />
            ) : (
              tab.name
            )}
          </div>
        )
      })}

      <button
        onClick={onAdd}
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 ml-1"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
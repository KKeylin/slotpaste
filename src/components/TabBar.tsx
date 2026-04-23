import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Tab } from '../types'

interface SortableTabProps {
  tab: Tab
  active: boolean
  isEditing: boolean
  editingName: string
  onSelect: () => void
  onDoubleClick: () => void
  onEditChange: (name: string) => void
  onEditBlur: () => void
  onEditKeyDown: (e: React.KeyboardEvent) => void
}

function SortableTab({
  tab, active, isEditing, editingName,
  onSelect, onDoubleClick, onEditChange, onEditBlur, onEditKeyDown,
}: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className="flex-shrink-0 px-3 py-1 rounded-full text-xs cursor-pointer transition-all select-none"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        color: active ? 'rgba(255,255,255,0.87)' : 'rgba(255,255,255,0.35)',
        border: '1px solid',
        borderColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
      }}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editingName}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditBlur}
          onKeyDown={onEditKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent outline-none w-20 text-xs"
          style={{ color: 'rgba(255,255,255,0.87)' }}
        />
      ) : (
        tab.name
      )}
    </div>
  )
}

interface Props {
  tabs: Tab[]
  activeTabId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onRename: (id: string, name: string) => void
  onReorder: (tabs: Tab[]) => void
}

export default function TabBar({ tabs, activeTabId, onSelect, onAdd, onRename, onReorder }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tabs.findIndex((t) => t.id === active.id)
    const newIndex = tabs.findIndex((t) => t.id === over.id)
    onReorder(arrayMove(tabs, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex items-center gap-1 px-3 pt-3 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              active={tab.id === activeTabId}
              isEditing={editingId === tab.id}
              editingName={editingName}
              onSelect={() => onSelect(tab.id)}
              onDoubleClick={() => startRename(tab)}
              onEditChange={setEditingName}
              onEditBlur={commitRename}
              onEditKeyDown={handleKeyDown}
            />
          ))}

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
      </SortableContext>
    </DndContext>
  )
}
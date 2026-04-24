import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import type { Tab } from '../../types'
import { LONG_PRESS_MS } from '../../constants'
import { useTabBar } from './hooks'

interface SortableTabProps {
  tab: Tab
  active: boolean
  isEditing: boolean
  editingName: string
  wiggling: boolean
  canDelete: boolean
  onSelect: () => void
  onDoubleClick: () => void
  onEditChange: (name: string) => void
  onEditBlur: () => void
  onEditKeyDown: (e: React.KeyboardEvent) => void
  onLongPress: () => void
  onDelete: () => void
}

function SortableTab({
  tab, active, isEditing, editingName, wiggling, canDelete,
  onSelect, onDoubleClick, onEditChange, onEditBlur, onEditKeyDown,
  onLongPress, onDelete,
}: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
    disabled: wiggling,
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)

  function startLongPress(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY }
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      suppressClick.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }

  function cancelLongPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    pointerStart.current = null
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointerStart.current) return
    const dx = e.clientX - pointerStart.current.x
    const dy = e.clientY - pointerStart.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 6) cancelLongPress()
  }

  function handleClick(e: React.MouseEvent) {
    if (suppressClick.current) {
      suppressClick.current = false
      e.stopPropagation()
    }
  }

  return (
    <div
      style={{ position: 'relative', flexShrink: 0 }}
      onPointerDown={startLongPress}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onClickCapture={handleClick}
    >
      <motion.div
        animate={{ rotate: wiggling ? [-5, 5, -5] : 0 }}
        transition={
          wiggling
            ? { repeat: Infinity, duration: 0.2, ease: 'easeInOut' }
            : { duration: 0.1 }
        }
        style={{ display: 'inline-flex' }}
      >
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          onClick={onSelect}
          onDoubleClick={onDoubleClick}
          className="px-3 py-1 rounded-full text-xs cursor-pointer transition-all select-none"
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
              placeholder="New tab"
              className="bg-transparent outline-none w-20 text-xs placeholder:opacity-30"
              style={{ color: 'rgba(255,255,255,0.87)' }}
            />
          ) : (
            tab.name
          )}
        </div>
      </motion.div>

      {wiggling && canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: '#E24B4A', color: 'white' }}
        >
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1l4 4M5 1L1 5" />
          </svg>
        </button>
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
  onDelete: (id: string) => void
}

export default function TabBar({ tabs, activeTabId, onSelect, onAdd, onRename, onReorder, onDelete }: Props) {
  const {
    editingId, editingName, setEditingName,
    wigglingId, setWigglingId,
    confirmTab, setConfirmTab,
    sensors,
    startRename, commitRename, handleEditKeyDown,
    handleDragEnd, handleDelete, confirmDelete,
  } = useTabBar(tabs, onRename, onReorder, onDelete)

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
          <div
            className="flex items-center gap-1 pr-3 pl-20 pt-3 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            onClick={() => setWigglingId(null)}
          >
            {tabs.map((tab) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                active={tab.id === activeTabId}
                isEditing={editingId === tab.id}
                editingName={editingName}
                wiggling={wigglingId === tab.id}
                canDelete={tabs.length > 1}
                onSelect={() => { setWigglingId(null); onSelect(tab.id) }}
                onDoubleClick={() => startRename(tab)}
                onEditChange={setEditingName}
                onEditBlur={commitRename}
                onEditKeyDown={handleEditKeyDown}
                onLongPress={() => setWigglingId(tab.id)}
                onDelete={() => handleDelete(tab)}
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

      {createPortal(
        <AnimatePresence>
          {confirmTab && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-500 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
              onClick={() => setConfirmTab(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 6 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="rounded-2xl px-6 py-5 flex flex-col gap-4 w-72"
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.87)' }}>
                    Удалить таб «{confirmTab.name}»?
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Все блоки внутри будут удалены безвозвратно.
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setConfirmTab(null)}
                    className="px-4 py-1.5 rounded-xl text-xs transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: '#E24B4A', color: 'white' }}
                  >
                    Удалить
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
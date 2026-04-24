import { useState, useRef, useEffect } from 'react'
import { PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Tab } from '../../types'

export function useTabBar(
  tabs: Tab[],
  onRename: (id: string, name: string) => void,
  onReorder: (tabs: Tab[]) => void,
  onDelete: (id: string) => void,
) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [wigglingId, setWigglingId] = useState<string | null>(null)
  const [confirmTab, setConfirmTab] = useState<Tab | null>(null)
  const prevTabCount = useRef(tabs.length)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setWigglingId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (tabs.length > prevTabCount.current) {
      const newTab = tabs[tabs.length - 1]
      setEditingId(newTab.id)
      setEditingName('')
    }
    prevTabCount.current = tabs.length
  }, [tabs.length])

  function startRename(tab: Tab) {
    setWigglingId(null)
    setEditingId(tab.id)
    setEditingName(tab.name)
  }

  function commitRename() {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim())
    }
    setEditingId(null)
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
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

  function handleDelete(tab: Tab) {
    setWigglingId(null)
    setConfirmTab(tab)
  }

  function confirmDelete() {
    if (!confirmTab) return
    onDelete(confirmTab.id)
    setConfirmTab(null)
  }

  return {
    editingId,
    editingName,
    setEditingName,
    wigglingId,
    setWigglingId,
    confirmTab,
    setConfirmTab,
    sensors,
    startRename,
    commitRename,
    handleEditKeyDown,
    handleDragEnd,
    handleDelete,
    confirmDelete,
  }
}
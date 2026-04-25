import { useRef, useState, useEffect, useCallback } from 'react'
import { DragEndEvent } from '@dnd-kit/core'
import type { Block as BlockType } from '../../types'
import { findFreePosition } from '../../utils/collision'
import { CANVAS_SIZE, BLOCK_DEFAULT_W, BLOCK_DEFAULT_H, EDIT_OVERHANG } from '../../constants'

export function useCanvas(blocks: BlockType[], activeTabId: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const panRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const isPanning = useRef(false)
  const panStart = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })
  const prevBlockCount = useRef(blocks.length)

  panRef.current = pan
  scaleRef.current = scale

  function applyTransform(p: { x: number; y: number }, s: number) {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`
    }
  }

  function panToPoint(canvasX: number, canvasY: number) {
    if (!containerRef.current || !canvasRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const newPan = {
      x: width / 2 - canvasX * scaleRef.current,
      y: height / 2 - canvasY * scaleRef.current,
    }
    panRef.current = newPan
    canvasRef.current.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    canvasRef.current.style.transform = `translate(${newPan.x}px, ${newPan.y}px) scale(${scaleRef.current})`
    setPan({ ...newPan })
    canvasRef.current.addEventListener('transitionend', () => {
      if (canvasRef.current) canvasRef.current.style.transition = ''
    }, { once: true })
  }

  useEffect(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const initial = { x: width / 2 - CANVAS_SIZE / 2, y: height / 2 - CANVAS_SIZE / 2 }
    panRef.current = initial
    setPan(initial)
    applyTransform(initial, 1)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = 1 - e.deltaY * 0.001
      const newScale = Math.min(3, Math.max(0.15, scaleRef.current * factor))
      const rect = el!.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const newPan = {
        x: cx - (cx - panRef.current.x) * (newScale / scaleRef.current),
        y: cy - (cy - panRef.current.y) * (newScale / scaleRef.current),
      }
      panRef.current = newPan
      scaleRef.current = newScale
      applyTransform(newPan, newScale)
      setPan({ ...newPan })
      setScale(newScale)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    if (blocks.length > prevBlockCount.current) {
      const newBlock = blocks[blocks.length - 1]
      const i = blocks.length - 1
      const pos = newBlock.position ?? { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 + i * 90 }
      panToPoint(pos.x, pos.y)
    }
    prevBlockCount.current = blocks.length
  }, [blocks.length])

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    panToPoint(CANVAS_SIZE / 2, CANVAS_SIZE / 2)
  }, [activeTabId])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    isPanning.current = true
    panStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isPanning.current) return
    const newPan = {
      x: panStart.current.panX + (e.clientX - panStart.current.mouseX),
      y: panStart.current.panY + (e.clientY - panStart.current.mouseY),
    }
    panRef.current = newPan
    applyTransform(newPan, scaleRef.current)
  }

  function handlePointerUp() {
    if (!isPanning.current) return
    isPanning.current = false
    setPan({ ...panRef.current })
  }

  function resetView() {
    if (!containerRef.current || !canvasRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const newPan = { x: width / 2 - CANVAS_SIZE / 2, y: height / 2 - CANVAS_SIZE / 2 }
    panRef.current = newPan
    scaleRef.current = 1
    canvasRef.current.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    canvasRef.current.style.transform = `translate(${newPan.x}px, ${newPan.y}px) scale(1)`
    setPan({ ...newPan })
    setScale(1)
    canvasRef.current.addEventListener('transitionend', () => {
      if (canvasRef.current) canvasRef.current.style.transition = ''
    }, { once: true })
  }

  function resetZoom() {
    if (!containerRef.current || !canvasRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const cx = width / 2
    const cy = height / 2
    const newPan = {
      x: cx - (cx - panRef.current.x) * (1 / scaleRef.current),
      y: cy - (cy - panRef.current.y) * (1 / scaleRef.current),
    }
    panRef.current = newPan
    scaleRef.current = 1
    canvasRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    canvasRef.current.style.transform = `translate(${newPan.x}px, ${newPan.y}px) scale(1)`
    setPan({ ...newPan })
    setScale(1)
    canvasRef.current.addEventListener('transitionend', () => {
      if (canvasRef.current) canvasRef.current.style.transition = ''
    }, { once: true })
  }

  return {
    containerRef,
    canvasRef,
    pan,
    scale,
    scaleRef,
    resetView,
    resetZoom,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  }
}

export function useBlockSnap(
  blocks: BlockType[],
  onChange: (block: BlockType) => void,
  scaleRef: React.MutableRefObject<number>,
) {
  const measuredSizes = useRef<Map<string, { w: number; h: number }>>(new Map())
  const [snappingIds, setSnappingIds] = useState<Set<string>>(new Set())

  const triggerSnap = useCallback((id: string) => {
    setSnappingIds(prev => new Set(prev).add(id))
    setTimeout(() => setSnappingIds(prev => { const next = new Set(prev); next.delete(id); return next }), 500)
  }, [])

  const handleSizeReport = useCallback((id: string, w: number, h: number) => {
    measuredSizes.current.set(id, { w, h })
  }, [])

  function effectiveSize(block: BlockType) {
    const m = measuredSizes.current.get(block.id)
    return {
      w: m?.w ?? (block.width ?? BLOCK_DEFAULT_W),
      h: m?.h ?? (block.height ?? BLOCK_DEFAULT_H) + EDIT_OVERHANG,
    }
  }

  function handleResizeEnd(updated: BlockType) {
    if (!updated.position) return
    requestAnimationFrame(() => {
      const sz = effectiveSize(updated)
      const freePos = findFreePosition(updated.position!, sz, blocks, updated.id, measuredSizes.current)
      if (freePos.x !== updated.position!.x || freePos.y !== updated.position!.y) {
        onChange({ ...updated, position: freePos })
        triggerSnap(updated.id)
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    const i = blocks.findIndex((b) => b.id === active.id)
    const block = blocks[i]
    if (!block) return
    const pos = block.position ?? { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 + i * 90 }
    const rawPos = {
      x: Math.max(0, Math.min(CANVAS_SIZE, pos.x + delta.x / scaleRef.current)),
      y: Math.max(0, Math.min(CANVAS_SIZE, pos.y + delta.y / scaleRef.current)),
    }
    const sz = effectiveSize(block)
    const freePos = findFreePosition(rawPos, sz, blocks, block.id, measuredSizes.current)
    onChange({ ...block, position: rawPos })
    if (rawPos.x !== freePos.x || rawPos.y !== freePos.y) {
      requestAnimationFrame(() => {
        onChange({ ...block, position: freePos })
        triggerSnap(block.id)
      })
    }
  }

  return {
    snappingIds,
    handleSizeReport,
    handleResizeEnd,
    handleDragEnd,
  }
}
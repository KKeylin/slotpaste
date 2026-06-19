import { useRef, useState, useEffect } from 'react'
import { DragEndEvent } from '@dnd-kit/core'
import type { Block as BlockType } from '../../types'
import { CANVAS_W, CANVAS_H } from '../../constants'

export function useCanvas(
  blocks: BlockType[],
  activeTabId: string,
  home: { x: number; y: number; scale: number } | undefined,
  onSetHome: (point: { x: number; y: number; scale: number }) => void,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [atHome, setAtHome] = useState(false)
  const panRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const isPanning = useRef(false)
  const panStart = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })
  const pinchStartDist = useRef(0)
  const pinchMidpoint = useRef({ x: 0, y: 0 })
  const prevBlockCount = useRef(blocks.length)

  panRef.current = pan
  scaleRef.current = scale

  function applyTransform(p: { x: number; y: number }, s: number) {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`
    }
  }

  function animateTo(transform: string, duration = '0.45s') {
    const el = canvasRef.current
    if (!el) return
    el.style.transition = `transform ${duration} cubic-bezier(0.25, 0.46, 0.45, 0.94)`
    el.style.transform = transform
    el.addEventListener('transitionend', () => { el.style.transition = '' }, { once: true })
  }

  function panToPoint(canvasX: number, canvasY: number, targetScale?: number) {
    if (!containerRef.current || !canvasRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const s = targetScale ?? scaleRef.current
    const newPan = {
      x: width / 2 - canvasX * s,
      y: height / 2 - canvasY * s,
    }
    panRef.current = newPan
    animateTo(`translate(${newPan.x}px, ${newPan.y}px) scale(${s})`)
    setPan({ ...newPan })
    if (targetScale !== undefined) {
      scaleRef.current = targetScale
      setScale(targetScale)
    }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    if (home) {
      const s = home.scale
      const newPan = { x: width / 2 - home.x * s, y: height / 2 - home.y * s }
      panRef.current = newPan
      scaleRef.current = s
      setPan(newPan)
      setScale(s)
      applyTransform(newPan, s)
      setAtHome(true)
    } else {
      const initial = { x: width / 2 - CANVAS_W / 2, y: height / 2 - CANVAS_H / 2 }
      panRef.current = initial
      setPan(initial)
      applyTransform(initial, 1)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      setAtHome(false)
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
      const pos = newBlock.position ?? { x: CANVAS_W / 2, y: CANVAS_H / 2 + i * 90 }
      panToPoint(pos.x, pos.y)
    }
    prevBlockCount.current = blocks.length
  }, [blocks.length])

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (home) {
      panToPoint(home.x, home.y, home.scale)
    } else {
      resetView()
    }
  }, [activeTabId])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    setAtHome(false)
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
    if (pinchStartDist.current !== 0) return
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

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      setAtHome(false)
      isPanning.current = false
      const t1 = e.touches[0], t2 = e.touches[1]
      pinchStartDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const rect = containerRef.current!.getBoundingClientRect()
      pinchMidpoint.current = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length !== 2 || pinchStartDist.current === 0) return
    const t1 = e.touches[0], t2 = e.touches[1]
    const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    const factor = newDist / pinchStartDist.current
    const newScale = Math.min(3, Math.max(0.15, scaleRef.current * factor))
    const rect = containerRef.current!.getBoundingClientRect()
    const cx = (t1.clientX + t2.clientX) / 2 - rect.left
    const cy = (t1.clientY + t2.clientY) / 2 - rect.top
    const prevCx = pinchMidpoint.current.x
    const prevCy = pinchMidpoint.current.y
    const newPan = {
      x: cx - (prevCx - panRef.current.x) * (newScale / scaleRef.current),
      y: cy - (prevCy - panRef.current.y) * (newScale / scaleRef.current),
    }
    panRef.current = newPan
    scaleRef.current = newScale
    applyTransform(newPan, newScale)
    pinchStartDist.current = newDist
    pinchMidpoint.current = { x: cx, y: cy }
  }

  function handleTouchEnd() {
    if (pinchStartDist.current !== 0) {
      setPan({ ...panRef.current })
      setScale(scaleRef.current)
    }
    pinchStartDist.current = 0
  }

  function goHome() {
    if (home) {
      panToPoint(home.x, home.y, home.scale)
    } else {
      resetView()
    }
    setAtHome(true)
  }

  function setHome() {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const canvasX = (width / 2 - panRef.current.x) / scaleRef.current
    const canvasY = (height / 2 - panRef.current.y) / scaleRef.current
    onSetHome({ x: canvasX, y: canvasY, scale: scaleRef.current })
    setAtHome(true)
  }

  function resetView() {
    if (!containerRef.current || !canvasRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const newPan = { x: width / 2 - CANVAS_W / 2, y: height / 2 - CANVAS_H / 2 }
    panRef.current = newPan
    scaleRef.current = 1
    animateTo(`translate(${newPan.x}px, ${newPan.y}px) scale(1)`)
    setPan({ ...newPan })
    setScale(1)
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
    animateTo(`translate(${newPan.x}px, ${newPan.y}px) scale(1)`, '0.3s')
    setPan({ ...newPan })
    setScale(1)
  }

  return {
    containerRef,
    canvasRef,
    pan,
    scale,
    scaleRef,
    atHome,
    goHome,
    setHome,
    resetView,
    resetZoom,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

export function useBlockSnap(
  blocks: BlockType[],
  onChange: (block: BlockType) => void,
  scaleRef: React.MutableRefObject<number>,
) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    const i = blocks.findIndex((b) => b.id === active.id)
    const block = blocks[i]
    if (!block) return
    const pos = block.position ?? { x: CANVAS_W / 2, y: CANVAS_H / 2 + i * 90 }
    const rawPos = {
      x: Math.max(0, Math.min(CANVAS_W, pos.x + delta.x / scaleRef.current)),
      y: Math.max(0, Math.min(CANVAS_H, pos.y + delta.y / scaleRef.current)),
    }
    onChange({ ...block, position: rawPos })
  }

  return { handleDragEnd }
}
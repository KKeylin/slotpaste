import { useState, useRef, useEffect } from 'react'
import type { Block as BlockType, Appearance } from '../../types'
import { getLuminance, isColorDark } from '../../utils/color'
import { LONG_PRESS_MS } from '../../constants'

interface UseBlockProps {
  block: BlockType
  appearance: Appearance
  scale: number
  onCopy: (text: string) => void
  onChange: (block: BlockType) => void
  onResizeEnd?: (block: BlockType) => void
  onWiggleChange?: (wiggling: boolean) => void
}

export function useBlock({ block, appearance, scale, onCopy, onChange, onResizeEnd, onWiggleChange }: UseBlockProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [savedBlock, setSavedBlock] = useState<BlockType | null>(null)
  const [blockRect, setBlockRect] = useState<DOMRect | null>(null)
  const [wiggling, setWiggling] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const justResized = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)

  function setWiggle(v: boolean) {
    setWiggling(v)
    onWiggleChange?.(v)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setWiggle(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function startLongPress(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('[data-no-copy]')) return
    pointerStart.current = { x: e.clientX, y: e.clientY }
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      suppressClick.current = true
      setWiggle(true)
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

  function handleSuppressClick(e: React.MouseEvent) {
    if (suppressClick.current) {
      suppressClick.current = false
      e.stopPropagation()
    }
  }

  function openEdit() {
    if (containerRef.current) setBlockRect(containerRef.current.getBoundingClientRect())
    setSavedBlock(block)
    setEditOpen(true)
  }

  function saveEdit() {
    setSavedBlock(null)
    setEditOpen(false)
  }

  function cancelEdit() {
    if (savedBlock) onChange(savedBlock)
    setSavedBlock(null)
    setEditOpen(false)
  }

  function handleResizeMouseDown(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const rect = innerRef.current!.getBoundingClientRect()
    resizeStart.current = { x: e.clientX, y: e.clientY, w: rect.width / scale, h: rect.height / scale }
    let finalW = Math.round(rect.width / scale)
    let finalH = Math.round(rect.height / scale)

    function onMove(ev: MouseEvent) {
      if (!resizeStart.current) return
      finalW = Math.max(120, Math.round(resizeStart.current.w + (ev.clientX - resizeStart.current.x) / scale))
      finalH = Math.max(40, Math.round(resizeStart.current.h + (ev.clientY - resizeStart.current.y) / scale))
      onChange({ ...block, width: finalW, height: finalH })
    }
    function onUp() {
      resizeStart.current = null
      justResized.current = true
      setTimeout(() => { justResized.current = false }, 100)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      onResizeEnd?.({ ...block, width: finalW, height: finalH })
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function handleCopy(e: React.MouseEvent) {
    if (justResized.current) return
    if ((e.target as HTMLElement).closest('[data-no-copy]')) return
    if (wiggling) { setWiggle(false); return }
    onCopy(block.text)
  }

  // derived styles
  const blockWidth = containerRef.current?.offsetWidth ?? block.width ?? 220
  const wiggleAmplitude = Math.min(7, Math.max(1.5, (8 / (blockWidth / 2)) * (180 / Math.PI)))

  const rawColor = block.color ?? appearance.blockColor
  const bgColor = `color-mix(in srgb, ${rawColor} ${Math.round(appearance.blockOpacity * 100)}%, transparent)`

  const canvasDark = isColorDark(appearance.bgColor)
  const canvasTextColor = canvasDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
  const canvasMutedColor = canvasDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'

  const effectiveLuminance =
    getLuminance(rawColor) * appearance.blockOpacity +
    getLuminance(appearance.bgColor) * (1 - appearance.blockOpacity)
  const textColor = effectiveLuminance < 0.5 ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'

  return {
    // refs
    containerRef,
    innerRef,
    // state
    editOpen,
    savedBlock,
    blockRect,
    wiggling,
    confirmOpen,
    setConfirmOpen,
    // handlers
    startLongPress,
    cancelLongPress,
    handlePointerMove,
    handleSuppressClick,
    openEdit,
    saveEdit,
    cancelEdit,
    handleResizeMouseDown,
    handleCopy,
    setWiggle,
    // styles
    wiggleAmplitude,
    bgColor,
    textColor,
    canvasTextColor,
    canvasMutedColor,
  }
}
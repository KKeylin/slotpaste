import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Block as BlockType, FontSize, Appearance } from '../types'
import { getLuminance, isColorDark } from '../utils/color'
import EditPopup from './EditPopup'
import { LONG_PRESS_MS } from '../constants'

const fontSizeClasses: Record<FontSize, string> = {
  h1: 'text-2xl font-medium',
  h2: 'text-lg font-medium',
  md: 'text-sm',
  sm: 'text-xs',
}

interface Props {
  block: BlockType
  appearance: Appearance
  scale?: number
  onCopy: (text: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
  onResizeEnd?: (block: BlockType) => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  onWiggleChange?: (wiggling: boolean) => void
}

export default function Block({ block, appearance, scale = 1, onCopy, onChange, onColorChange, onDelete, onResizeEnd, dragHandleProps, onWiggleChange }: Props) {
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

  function openEdit() {
    if (containerRef.current) {
      setBlockRect(containerRef.current.getBoundingClientRect())
    }
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

  function handleCopy(e: React.MouseEvent) {
    if (justResized.current) return
    if ((e.target as HTMLElement).closest('[data-no-copy]')) return
    if (wiggling) { setWiggle(false); return }
    onCopy(block.text)
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative"
        style={{ width: block.width ? block.width + 'px' : 'fit-content', maxWidth: '100%', transition: 'none' }}
        onPointerDown={startLongPress}
        onPointerMove={handlePointerMove}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false
            e.stopPropagation()
          }
        }}
      >
        <motion.div
          animate={{ rotate: wiggling ? [-wiggleAmplitude, wiggleAmplitude, -wiggleAmplitude] : 0 }}
          transition={wiggling ? { repeat: Infinity, duration: 0.2, ease: 'easeInOut' } : { duration: 0.1 }}
        >
          {/* block */}
          <div
            ref={innerRef}
            className="relative rounded-2xl px-5 pt-5 pb-4 cursor-pointer select-none"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              border: '1px solid rgba(255,255,255,0.08)',
              height: block.height ? block.height + 'px' : undefined,
              overflow: 'hidden',
            }}
            onClick={handleCopy}
          >
            {/* drag handle */}
            <div
              data-no-copy
              {...(dragHandleProps ?? {})}
              className="absolute top-1.5 right-1.5 flex flex-col gap-[3px] p-1 cursor-grab opacity-30 hover:opacity-70 transition-opacity"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className="block w-4 h-[2px] rounded-full" style={{ backgroundColor: textColor }} />
              ))}
            </div>

            {/* text */}
            <p
              className={`${fontSizeClasses[block.fontSize]} leading-snug pr-6`}
              style={
                block.height
                  ? { whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 99, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
                  : { whiteSpace: 'pre-wrap' }
              }
            >
              {block.text}
            </p>

            {/* resize handle */}
            <div
              data-no-copy
              onMouseDown={handleResizeMouseDown}
              className="absolute bottom-1.5 right-1.5 w-4 h-4 flex items-center justify-center opacity-20 hover:opacity-60 transition-opacity cursor-nwse-resize"
              style={{ color: textColor }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 9L9 1M9 5v4H5" />
              </svg>
            </div>
          </div>

          {/* edit button */}
          <button
            data-no-copy
            onClick={(e) => { e.stopPropagation(); openEdit() }}
            className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide transition-all opacity-30 hover:opacity-100"
            style={{ color: canvasTextColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = canvasMutedColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            EDIT
          </button>
        </motion.div>

        {/* delete badge */}
        {wiggling && (
          <button
            data-no-copy
            onClick={(e) => { e.stopPropagation(); setWiggle(false); setConfirmOpen(true) }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: '#E24B4A' }}
          >
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l5 5M6 1L1 6" />
            </svg>
          </button>
        )}
      </div>

      <EditPopup
        isOpen={editOpen}
        block={block}
        savedBlock={savedBlock}
        blockRect={blockRect}
        appearance={appearance}
        onChange={onChange}
        onColorChange={onColorChange}
        onDelete={onDelete}
        onSave={saveEdit}
        onCancel={cancelEdit}
      />

      {createPortal(
        <AnimatePresence>
          {confirmOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-500 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
              onClick={() => setConfirmOpen(false)}
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
                    Удалить блок?
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    «{block.text.length > 60 ? block.text.slice(0, 60) + '…' : block.text}»
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="px-4 py-1.5 rounded-xl text-xs transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => { setConfirmOpen(false); onDelete(block.id) }}
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
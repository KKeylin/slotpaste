import { useState, useRef } from 'react'
import type { Block as BlockType, FontSize, Appearance } from '../types'
import { isColorDark } from '../utils/color'
import EditPopup from './EditPopup'

const fontSizeClasses: Record<FontSize, string> = {
  h1: 'text-2xl font-medium',
  h2: 'text-lg font-medium',
  md: 'text-sm',
  sm: 'text-xs',
}

interface Props {
  block: BlockType
  appearance: Appearance
  onCopy: (text: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function Block({ block, appearance, onCopy, onChange, onColorChange, onDelete, dragHandleProps }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [savedBlock, setSavedBlock] = useState<BlockType | null>(null)
  const [blockRect, setBlockRect] = useState<DOMRect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const justResized = useRef(false)

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
    const rect = containerRef.current!.getBoundingClientRect()
    resizeStart.current = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height }

    function onMove(ev: MouseEvent) {
      if (!resizeStart.current) return
      const newW = Math.max(120, resizeStart.current.w + (ev.clientX - resizeStart.current.x))
      const newH = Math.max(40, resizeStart.current.h + (ev.clientY - resizeStart.current.y))
      onChange({ ...block, width: Math.round(newW), height: Math.round(newH) })
    }
    function onUp() {
      resizeStart.current = null
      justResized.current = true
      setTimeout(() => { justResized.current = false }, 100)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const bgColor = block.color ?? appearance.blockColor
  const dark = isColorDark(bgColor)
  const textColor = dark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'

  const canvasDark = isColorDark(appearance.bgColor)
  const canvasTextColor = canvasDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
  const canvasMutedColor = canvasDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'

  function handleCopy(e: React.MouseEvent) {
    if (justResized.current) return
    if ((e.target as HTMLElement).closest('[data-no-copy]')) return
    onCopy(block.text)
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: block.width ? block.width + 'px' : 'fit-content',
          maxWidth: '100%',
          transition: 'none',
        }}
      >
        {/* block */}
        <div
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
    </>
  )
}
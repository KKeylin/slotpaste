import { useState, useRef, useEffect } from 'react'
import colorWheelImg from '../assets/color-wheel-2.png'
import { motion, AnimatePresence } from 'framer-motion'
import type { Block as BlockType, FontSize, Appearance } from '../types'
import { isColorDark } from '../utils/color'

const fontSizeClasses: Record<FontSize, string> = {
  h1: 'text-2xl font-medium',
  h2: 'text-lg font-medium',
  md: 'text-sm',
  sm: 'text-xs',
}

const fontSizeLabels: Record<FontSize, string> = {
  h1: 'XL',
  h2: 'L',
  md: 'M',
  sm: 'S',
}

interface Props {
  block: BlockType
  appearance: Appearance
  onCopy: (text: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
}

export default function Block({ block, appearance, onCopy, onChange, onColorChange, onDelete }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [savedBlock, setSavedBlock] = useState<BlockType | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const onOutsideClick = useRef<() => void>(() => {})

  function openEdit() {
    setSavedBlock(block)
    setEditOpen(true)
  }

  function saveEdit() {
    setSavedBlock(null)
    setEditOpen(false)
    setConfirmOpen(false)
  }

  function cancelEdit() {
    if (savedBlock) onChange(savedBlock)
    setSavedBlock(null)
    setEditOpen(false)
    setConfirmOpen(false)
  }

  function hasChanges() {
    if (!savedBlock) return false
    return JSON.stringify(savedBlock) !== JSON.stringify(block)
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
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    if (editOpen && textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
    }
  }, [editOpen])

  onOutsideClick.current = () => {
    if (hasChanges()) {
      setConfirmOpen(true)
    } else {
      saveEdit()
    }
  }

  useEffect(() => {
    if (!editOpen) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOutsideClick.current()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [editOpen])

  const bgColor = block.color ?? appearance.blockColor
  const dark = isColorDark(bgColor)
  const textColor = dark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
  const mutedColor = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'

  function handleCopy(e: React.MouseEvent) {
    if (editOpen) return
    if ((e.target as HTMLElement).closest('[data-no-copy]')) return
    onCopy(block.text)
  }

  function setFontSize(fontSize: FontSize) {
    onChange({ ...block, fontSize })
  }

  function applyColor(color: string) {
    const recent = appearance.recentColors.filter((c) => c !== color)
    onColorChange({ ...block, color }, [color, ...recent].slice(0, 3))
  }

  const sizes: FontSize[] = ['h1', 'h2', 'md', 'sm']

  return (
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
        className={`relative rounded-2xl px-5 pt-5 pb-4 ${editOpen ? 'cursor-default' : 'cursor-pointer select-none'}`}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          border: '1px solid rgba(255,255,255,0.08)',
          height: (!editOpen && block.height) ? block.height + 'px' : undefined,
          overflow: 'hidden',
        }}
        onClick={handleCopy}
      >
        {/* drag handle */}
        <div
          data-no-copy
          className="absolute top-1.5 right-1.5 flex flex-col gap-[3px] p-1 cursor-grab opacity-30 hover:opacity-70 transition-opacity"
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="block w-4 h-[2px] rounded-full" style={{ backgroundColor: textColor }} />
          ))}
        </div>

        {/* text */}
        {editOpen ? (
          <textarea
            ref={textareaRef}
            value={block.text}
            onChange={(e) => {
              onChange({ ...block, text: e.target.value })
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            className={`${fontSizeClasses[block.fontSize]} leading-snug pr-6 w-full bg-transparent resize-none outline-none border-none overflow-hidden`}
            style={{ color: textColor }}
          />
        ) : (
          <p
            className={`${fontSizeClasses[block.fontSize]} leading-snug pr-6`}
            style={block.height
            ? { whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 99, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
            : { whiteSpace: 'pre-wrap' }}
          >
            {block.text}
          </p>
        )}

        {/* resize handle */}
        {!editOpen && (
          <div
            data-no-copy
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-1.5 right-1.5 w-4 h-4 flex items-center justify-center opacity-20 hover:opacity-60 transition-opacity cursor-nwse-resize"
            style={{ color: textColor }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 9L9 1M9 5v4H5"/>
            </svg>
          </div>
        )}
      </div>

      {/* bottom bar */}
      <AnimatePresence initial={false}>
        {editOpen ? (
          <motion.div
            key="editbar"
            data-no-copy
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="mt-[10px] flex items-center gap-2 flex-wrap"
          >
            {/* save */}
            <button
              onClick={saveEdit}
              className="px-2 py-1 rounded-xl text-[10px] font-medium tracking-wide transition-opacity hover:opacity-80"
              style={{ backgroundColor: textColor, color: bgColor }}
            >
              SAVE
            </button>

            {/* cancel */}
            <button
              onClick={cancelEdit}
              className="px-2 py-1 rounded-xl text-[10px] font-medium tracking-wide transition-opacity hover:opacity-80"
              style={{ backgroundColor: mutedColor, color: textColor }}
            >
              CANCEL
            </button>

            <div className="w-px h-4 opacity-20" style={{ backgroundColor: textColor }} />

            {/* size buttons */}
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-opacity"
                style={{
                  backgroundColor: block.fontSize === s ? textColor : mutedColor,
                  color: block.fontSize === s ? bgColor : textColor,
                }}
              >
                {fontSizeLabels[s]}
              </button>
            ))}

            <div className="w-px h-4 opacity-20" style={{ backgroundColor: textColor }} />

            {/* recent colors */}
            {appearance.recentColors.map((c) => (
              <button
                key={c}
                onClick={() => applyColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: c,
                  borderColor: block.color === c ? textColor : 'transparent',
                }}
              />
            ))}

            {/* color picker */}
            <label className="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 relative overflow-hidden">
              <img src={colorWheelImg} className="w-full h-full object-cover rounded-full" />
              <input
                type="color"
                value={block.color ?? appearance.blockColor}
                onChange={(e) => onChange({ ...block, color: e.target.value })}
                onBlur={(e) => applyColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>

            <div className="w-px h-4 opacity-20" style={{ backgroundColor: textColor }} />

            {/* delete */}
            <button
              onClick={() => onDelete(block.id)}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#E24B4A' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                <path d="M1 1l8 8M9 1L1 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

          </motion.div>
        ) : (
          <motion.button
            key="editbtn"
            data-no-copy
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={(e) => { e.stopPropagation(); openEdit() }}
            className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide transition-all opacity-30 hover:opacity-100"
            style={{ color: textColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = mutedColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            EDIT
          </motion.button>
        )}
      </AnimatePresence>

      {/* confirm dialog */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-2xl px-6 py-5 flex flex-col gap-4 min-w-[260px]"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.87)' }}>
                Сохранить изменения?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={saveEdit}
                  className="w-full py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'rgba(255,255,255,0.87)', color: '#1a1a1a' }}
                >
                  Сохранить
                </button>
                <button
                  onClick={cancelEdit}
                  className="w-full py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Не сохранять
                </button>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="w-full py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.35)' }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
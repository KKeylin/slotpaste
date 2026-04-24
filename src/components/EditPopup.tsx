import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Block, FontSize, Appearance } from '../types'
import { isColorDark } from '../utils/color'
import ColorSwatches from './ColorSwatches'

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
  isOpen: boolean
  block: Block
  savedBlock: Block | null
  blockRect: DOMRect | null
  appearance: Appearance
  onChange: (block: Block) => void
  onColorChange: (block: Block, recentColors: string[]) => void
  onDelete: (id: string) => void
  onSave: () => void
  onCancel: () => void
}

export default function EditPopup({
  isOpen,
  block,
  savedBlock,
  blockRect,
  appearance,
  onChange,
  onColorChange,
  onDelete,
  onSave,
  onCancel,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function hasChanges() {
    if (!savedBlock) return false
    return JSON.stringify(savedBlock) !== JSON.stringify(block)
  }

  function handleSave() {
    setConfirmOpen(false)
    onSave()
  }

  function handleCancel() {
    setConfirmOpen(false)
    onCancel()
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target !== e.currentTarget) return
    if (hasChanges()) {
      setConfirmOpen(true)
    } else {
      onSave()
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setConfirmOpen(false)
      return
    }
    if (textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmOpen) {
          setConfirmOpen(false)
        } else if (hasChanges()) {
          setConfirmOpen(true)
        } else {
          onSave()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, confirmOpen, block, savedBlock])

  const bgColor = block.color ?? appearance.blockColor
  const dark = isColorDark(bgColor)
  const textColor = dark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
  const mutedColor = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'

  function applyColor(color: string) {
    const recent = appearance.recentColors.filter((c) => c !== color)
    onColorChange({ ...block, color }, [color, ...recent].slice(0, 5))
  }

  const sizes: FontSize[] = ['h1', 'h2', 'md', 'sm']

  const position = blockRect
    ? (() => {
        const vh = window.innerHeight
        const cx = blockRect.left + blockRect.width / 2
        const popupH = Math.round(vh * 0.3)

        const spaceBelow = vh - blockRect.bottom - 8
        const spaceAbove = blockRect.top - 8
        const placeBelow = spaceBelow >= popupH || spaceBelow >= spaceAbove

        const top = placeBelow
          ? blockRect.bottom + 8
          : Math.max(8, blockRect.top - popupH - 8)

        const originX = Math.round((cx / window.innerWidth) * 100)
        const transformOrigin = placeBelow ? `${originX}% top` : `${originX}% bottom`

        return { top, height: popupH, transformOrigin }
      })()
    : null

  return createPortal(
    <AnimatePresence>
      {isOpen && position && (
        <>
          {/* overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-200"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            onMouseDown={handleOverlayClick}
          />

          {/* popup */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed z-201 flex flex-col"
            style={{
              top: position.top,
              left: 0,
              right: 0,
              height: position.height,
              backgroundColor: bgColor,
              transformOrigin: position.transformOrigin,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* textarea */}
            <div className="flex-1 overflow-auto px-4 pt-4 pb-2 min-h-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              <textarea
                ref={textareaRef}
                value={block.text}
                onChange={(e) => {
                  onChange({ ...block, text: e.target.value })
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                className={`${fontSizeClasses[block.fontSize]} leading-snug w-full bg-transparent resize-none outline-none border-none overflow-hidden`}
                style={{ color: textColor }}
              />
            </div>

            {/* toolbar */}
            <div
              className="flex items-center gap-2 px-4 py-3 flex-wrap shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                onClick={handleSave}
                className="px-2 py-1 rounded-xl text-[10px] font-medium tracking-wide transition-opacity hover:opacity-80"
                style={{ backgroundColor: textColor, color: bgColor }}
              >
                SAVE
              </button>

              <button
                onClick={handleCancel}
                className="px-2 py-1 rounded-xl text-[10px] font-medium tracking-wide transition-opacity hover:opacity-80"
                style={{ backgroundColor: mutedColor, color: textColor }}
              >
                CANCEL
              </button>

              <div className="w-px h-4 opacity-20" style={{ backgroundColor: textColor }} />

              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ ...block, fontSize: s })}
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

              <ColorSwatches
                colors={appearance.recentColors}
                selectedColor={block.color}
                size="md"
                accentColor={textColor}
                wheelValue={block.color ?? appearance.blockColor}
                onSelect={applyColor}
                onWheelChange={(c) => onChange({ ...block, color: c })}
                onWheelBlur={applyColor}
              />

              <div className="w-px h-4 opacity-20" style={{ backgroundColor: textColor }} />

              <button
                onClick={() => onDelete(block.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#E24B4A' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 1l8 8M9 1L1 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </motion.div>

          {/* confirm dialog */}
          <AnimatePresence>
            {confirmOpen && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="fixed inset-0 z-202 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="rounded-2xl px-6 py-5 flex flex-col gap-4 min-w-65"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.87)' }}>
                    Сохранить изменения?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSave}
                      className="w-full py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255,255,255,0.87)', color: '#1a1a1a' }}
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={handleCancel}
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
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

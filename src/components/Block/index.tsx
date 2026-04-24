import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Block as BlockType, FontSize, Appearance } from '../../types'
import EditPopup from '../EditPopup'
import { useBlock } from './hooks'

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
  const {
    containerRef, innerRef,
    editOpen, savedBlock, blockRect, wiggling, confirmOpen, setConfirmOpen,
    startLongPress, cancelLongPress, handlePointerMove, handleSuppressClick,
    openEdit, saveEdit, cancelEdit,
    handleResizeMouseDown, handleCopy, setWiggle,
    wiggleAmplitude, bgColor, textColor, canvasTextColor, canvasMutedColor,
  } = useBlock({ block, appearance, scale, onCopy, onChange, onResizeEnd, onWiggleChange })

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
        onClickCapture={handleSuppressClick}
      >
        <motion.div
          animate={{ rotate: wiggling ? [-wiggleAmplitude, wiggleAmplitude, -wiggleAmplitude] : 0 }}
          transition={wiggling ? { repeat: Infinity, duration: 0.2, ease: 'easeInOut' } : { duration: 0.1 }}
        >
          <div
            ref={innerRef}
            className="relative rounded-2xl px-5 pt-5 pb-4 cursor-pointer select-none"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              border: `1px solid ${appearance.accentColor}`,
              height: block.height ? block.height + 'px' : undefined,
              overflow: 'hidden',
            }}
            onClick={handleCopy}
          >
            <div
              data-no-copy
              {...(dragHandleProps ?? {})}
              className="absolute top-1.5 right-1.5 flex flex-col gap-[3px] p-1 cursor-grab opacity-30 hover:opacity-70 transition-opacity"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className="block w-4 h-[2px] rounded-full" style={{ backgroundColor: textColor }} />
              ))}
            </div>

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
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

export interface SearchBlock {
  id: string
  text: string
  tabName: string
}

interface Props {
  blocks: SearchBlock[]
  onCopy: (text: string) => void
  onClose: () => void
}

const MAX_RESULTS = 20
const PREVIEW_LEN = 120

function highlight(text: string, query: string) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, i) => (
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} style={{ color: '#1D9E75', fontWeight: 600 }}>{part}</span>
      : <span key={i}>{part}</span>
  ))
}

export default function SearchModal({ blocks, onCopy, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = query.trim()
    ? blocks.filter(b => b.text.toLowerCase().includes(query.toLowerCase())).slice(0, MAX_RESULTS)
    : []

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  function handleCopy(block: SearchBlock) {
    onCopy(block.text)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && results[selected]) handleCopy(results[selected])
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-500 flex items-start justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingTop: '15vh' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="w-full max-w-sm flex flex-col rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across all tabs…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'rgba(255,255,255,0.87)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'rgba(255,255,255,0.3)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11"/>
              </svg>
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div ref={listRef} className="overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ maxHeight: 340, scrollbarWidth: 'none' }}>
            {results.map((block, i) => (
              <div
                key={block.id}
                onClick={() => handleCopy(block)}
                onMouseEnter={() => setSelected(i)}
                className="flex flex-col gap-1 px-4 py-2.5 cursor-pointer"
                style={{
                  backgroundColor: i === selected ? 'rgba(255,255,255,0.06)' : 'transparent',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <span className="text-[9px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {block.tabName}
                </span>
                <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {highlight(block.text.slice(0, PREVIEW_LEN), query)}
                  {block.text.length > PREVIEW_LEN && '…'}
                </p>
              </div>
            ))}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
            No blocks found
          </p>
        )}

        <div className="flex items-center gap-3 px-4 py-2" style={{ borderTop: results.length > 0 || query.trim() ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>↑↓ navigate</span>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>↵ copy</span>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Esc close</span>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
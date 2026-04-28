import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { SearchBlock } from './SearchModal'
import type { KeyShortcut } from '../types'

interface Props {
  blocks: SearchBlock[]
  onCopy: (text: string) => void
  buttonStyle?: React.CSSProperties
  shortcut?: KeyShortcut
}

const MAX_RESULTS = 20
const PREVIEW_LEN = 100

function highlight(text: string, query: string) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} style={{ color: '#1D9E75', fontWeight: 600 }}>{part}</span>
      : <span key={i}>{part}</span>
  )
}

export default function SearchBar({ blocks, onCopy, buttonStyle, shortcut }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const results = query.trim()
    ? blocks.filter(b => b.text.toLowerCase().includes(query.toLowerCase())).slice(0, MAX_RESULTS)
    : []

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    if (!shortcut) return
    function onKey(e: KeyboardEvent) {
      if (
        e.code === shortcut!.key &&
        e.altKey === shortcut!.alt &&
        e.ctrlKey === shortcut!.ctrl &&
        e.metaKey === shortcut!.meta &&
        e.shiftKey === shortcut!.shift
      ) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut])

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  function close() {
    setOpen(false)
    setQuery('')
  }

  function handleCopy(block: SearchBlock) {
    onCopy(block.text)
    close()
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { close(); inputRef.current?.blur(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && results[selected]) handleCopy(results[selected])
  }

  const showDropdown = open && query.trim().length > 0
  const dropRect = wrapRef.current?.getBoundingClientRect()
  const iconColor = buttonStyle?.color ?? 'rgba(255,255,255,0.5)'

  return (
    <div ref={wrapRef} className="mr-2">
      <div
        className="flex items-center gap-2 px-3 transition-opacity hover:opacity-80"
        style={{
          ...buttonStyle,
          height: 40,
          width: open ? 160 : 120,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          opacity: open ? 1 : 0.7,
          transition: 'width 0.2s ease, opacity 0.15s',
          overflow: 'hidden',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: iconColor, flexShrink: 0, opacity: 0.6 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search…"
          className="flex-1 bg-transparent text-[11px] outline-none min-w-0"
          style={{ color: iconColor, caretColor: '#1D9E75' }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ color: iconColor, opacity: 0.5, flexShrink: 0 }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </button>
        )}
      </div>

      {showDropdown && dropRect && createPortal(
        <div
          className="overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{
            position: 'fixed',
            top: dropRect.bottom + 4,
            right: window.innerWidth - dropRect.right,
            width: 280,
            maxHeight: 340,
            scrollbarWidth: 'none',
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            zIndex: 9999,
          }}
        >
          {results.length > 0 ? results.map((block, i) => (
            <div
              key={block.id}
              onClick={() => handleCopy(block)}
              onMouseEnter={() => setSelected(i)}
              className="flex flex-col gap-1 px-3 py-2.5 cursor-pointer"
              style={{
                backgroundColor: i === selected ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <span className="text-[9px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {block.tabName}
              </span>
              <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {highlight(block.text.slice(0, PREVIEW_LEN), query)}
                {block.text.length > PREVIEW_LEN && '…'}
              </p>
            </div>
          )) : (
            <p className="text-[11px] text-center py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
              No blocks found
            </p>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
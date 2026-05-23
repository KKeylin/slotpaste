import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import type { Appearance, Tab } from '../types'
import { isColorDark, hexToRgba } from '../utils/color'

interface Props {
  tab: Tab
  appearance: Appearance
  onRename: (name: string) => void
  onOpenSettings: () => void
}

export default function CanvasHeader({ tab, appearance, onRename, onOpenSettings }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(tab.name)
  const [dotsHovered, setDotsHovered] = useState(false)
  const [textWidth, setTextWidth] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)

  const dark = isColorDark(appearance.bgColor)
  const textColor = dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)'
  const mutedColor = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
  const pillBg = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const pillBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const nameShadow = `2px -2px 1px ${hexToRgba(appearance.accentColor, 0.6)}`

  const displayText = editing ? value : tab.name

  useLayoutEffect(() => {
    if (spanRef.current) setTextWidth(spanRef.current.offsetWidth)
  }, [displayText])

  useEffect(() => {
    if (editing) {
      setValue(tab.name)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [editing])

  function commit() {
    const trimmed = value.trim()
    if (trimmed) onRename(trimmed)
    else setValue(tab.name)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  const nameWidth = Math.max(textWidth, 40)

  return (
    <div className="relative inline-flex items-center" style={{ height: 44 }}>
      {/* Hidden span for measuring text width */}
      <span
        ref={spanRef}
        className="font-semibold absolute invisible pointer-events-none whitespace-pre"
        style={{ fontSize: 32 }}
        aria-hidden="true"
      >
        {displayText || ' '}
      </span>

      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="font-semibold outline-none bg-transparent"
          style={{ fontSize: 32, color: textColor, textShadow: nameShadow, width: nameWidth }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="font-semibold transition-opacity hover:opacity-70 select-none"
          style={{ fontSize: 32, color: textColor, textShadow: nameShadow }}
        >
          {tab.name}
        </button>
      )}

      {/* Burger menu — absolute, follows text width with ease-out */}
      <button
        onClick={onOpenSettings}
        onMouseEnter={() => setDotsHovered(true)}
        onMouseLeave={() => setDotsHovered(false)}
        className="absolute flex items-center justify-center rounded-full"
        style={{
          left: nameWidth + 8,
          top: '50%',
          transform: 'translateY(-50%)',
          transition: 'left 0.15s ease-out',
          width: 26,
          height: 26,
          background: dotsHovered ? pillBg : 'transparent',
          border: `1px solid ${dotsHovered ? pillBorder : 'transparent'}`,
          color: mutedColor,
        }}
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="1" y1="1" x2="11" y2="1" />
          <line x1="1" y1="5" x2="11" y2="5" />
          <line x1="1" y1="9" x2="11" y2="9" />
        </svg>
      </button>
    </div>
  )
}

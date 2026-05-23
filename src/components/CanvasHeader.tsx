import { useState, useRef, useEffect } from 'react'
import type { Appearance, Tab } from '../types'
import { isColorDark } from '../utils/color'

interface Props {
  tab: Tab
  appearance: Appearance
  onRename: (name: string) => void
  onOpenSettings: () => void
  onViewModeChange: (mode: 'canvas' | 'list') => void
}

export default function CanvasHeader({ tab, appearance, onRename, onOpenSettings, onViewModeChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(tab.name)
  const [dotsHovered, setDotsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const dark = isColorDark(appearance.bgColor)
  const textColor = dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)'
  const mutedColor = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
  const pillBg = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const pillBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'


  useEffect(() => {
    if (editing) {
      setValue(tab.name)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [editing])

  function commit() {
    const trimmed = value.trim()
    if (trimmed) onRename(trimmed)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div
      className="flex items-center justify-between px-3 py-2 shrink-0"
    >
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            className="font-semibold outline-none bg-transparent"
            style={{
              fontSize: 32,
              color: textColor,
              textShadow: `2px -2px 1px ${appearance.accentColor}`,
              minWidth: 80,
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="font-semibold transition-opacity hover:opacity-70 select-none"
            style={{ fontSize: 32, color: textColor, textShadow: `2px -2px 1px ${appearance.accentColor}` }}
          >
            {tab.name}
          </button>
        )}

        <button
          onClick={onOpenSettings}
          onMouseEnter={() => setDotsHovered(true)}
          onMouseLeave={() => setDotsHovered(false)}
          className="flex items-center justify-center rounded-full ml-2 transition-all"
          style={{
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

      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: `1px solid ${appearance.accentColor}` }}
      >
        {(['canvas', 'list'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className="px-3 py-1 text-[10px] font-medium tracking-wide transition-colors"
            style={{
              backgroundColor: tab.viewMode === mode
                ? (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')
                : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
              color: tab.viewMode === mode
                ? (dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)')
                : (dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'),
            }}
          >
            {mode === 'canvas' ? 'Canvas' : 'List'}
          </button>
        ))}
      </div>
    </div>
  )
}
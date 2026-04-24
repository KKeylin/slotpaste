import { useState, useRef } from 'react'
import colorWheelImg from '../assets/color-wheel-2.png'
import type { Appearance } from '../types'
import { isColorDark } from '../utils/color'

interface Props {
  appearance: Appearance
  onAdd: (text: string, color?: string) => void
}

export default function AddBlock({ appearance, onAdd }: Props) {
  const [text, setText] = useState('')
  const [color, setColor] = useState<string | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasCustomColor = !!color
  const activeColor = color ?? appearance.blockColor
  const dark = isColorDark(activeColor)
  const inputTextColor = hasCustomColor
    ? (dark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)')
    : 'rgba(255,255,255,0.87)'

  const swatchColors = [
    appearance.blockColor,
    ...appearance.recentColors.filter((c) => c !== appearance.blockColor).slice(0, 3),
  ]

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed, color)
    setText('')
    setColor(undefined)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1">

      {/* color swatches */}
      <div className="flex items-center gap-1.5 px-1">
        {swatchColors.map((c, i) => {
          const isSelected = i === 0 ? !hasCustomColor : color === c
          return (
            <button
              key={`${c}-${i}`}
              onClick={() => { setColor(i === 0 ? undefined : c); textareaRef.current?.focus() }}
              className="w-4 h-4 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                border: isSelected
                  ? '2px solid rgba(255,255,255,0.75)'
                  : '2px solid rgba(255,255,255,0.12)',
              }}
            />
          )
        })}

        <label className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform relative overflow-hidden flex-shrink-0">
          <img src={colorWheelImg} className="w-full h-full object-cover rounded-full" />
          <input
            type="color"
            value={activeColor}
            onChange={(e) => { setColor(e.target.value); textareaRef.current?.focus() }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>

      {/* input row */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New block… (Shift+Enter for newline)"
          rows={2}
          className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-200 placeholder:opacity-30"
          style={{
            backgroundColor: hasCustomColor ? activeColor : 'rgba(255,255,255,0.06)',
            color: inputTextColor,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />

        <button
          onClick={submit}
          disabled={!text.trim()}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-20 transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#1D9E75' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
            <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
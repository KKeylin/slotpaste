import type { Appearance } from '../../types'
import { useAddBlock } from './hooks'
import ColorSwatches from '../ColorSwatches'

interface Props {
  appearance: Appearance
  onAdd: (text: string, color?: string) => void
}

export default function AddBlock({ appearance, onAdd }: Props) {
  const {
    text, setText,
    color, activeColor, hasCustomColor, inputTextColor,
    swatchColors, textareaRef,
    handleColorSelect, handleWheelChange,
    submit, handleKeyDown,
  } = useAddBlock(appearance, onAdd)

  return (
    <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1">
      <div className="px-1">
        <ColorSwatches
          colors={swatchColors}
          selectedColor={color}
          size="sm"
          wheelValue={activeColor}
          onSelect={handleColorSelect}
          onWheelChange={handleWheelChange}
        />
      </div>

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
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-20 transition-opacity hover:opacity-80"
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
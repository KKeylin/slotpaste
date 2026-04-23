import { useState, useRef } from 'react'

interface Props {
  onAdd: (text: string) => void
}

export default function AddBlock({ onAdd }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex gap-2 items-end px-3 pb-3 pt-1">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="New block… (Shift+Enter for newline)"
        rows={2}
        className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none placeholder:opacity-30"
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.87)',
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
  )
}
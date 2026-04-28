import { useState, useRef } from 'react'
import type { Appearance } from '../../types'
import { isColorDark } from '../../utils/color'

export function useAddBlock(appearance: Appearance, onAdd: (text: string, color?: string) => void) {
  const [text, setText] = useState('')
  const [color, setColor] = useState<string | undefined>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasCustomColor = !!color
  const activeColor = color ?? appearance.blockColor
  const dark = isColorDark(activeColor)
  const inputTextColor = hasCustomColor
    ? (dark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)')
    : (isColorDark(appearance.bgColor) ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)')

  const swatchColors = [
    appearance.blockColor,
    ...appearance.recentColors.filter((c) => c !== appearance.blockColor).slice(0, 3),
  ]

  function handleColorSelect(c: string) {
    setColor(c === appearance.blockColor ? undefined : c)
    textareaRef.current?.focus()
  }

  function handleWheelChange(c: string) {
    setColor(c)
    textareaRef.current?.focus()
  }

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

  return {
    text, setText,
    color, activeColor, hasCustomColor, inputTextColor,
    swatchColors,
    textareaRef,
    handleColorSelect, handleWheelChange,
    submit, handleKeyDown,
  }
}
import { useState, useRef, useEffect, useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import Block from './Block'
import type { Block as BlockType, Appearance } from '../types'

interface Props {
  block: BlockType
  position: { x: number; y: number }
  scale?: number
  snapping?: boolean
  appearance: Appearance
  onCopy: (text: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
  onResizeEnd?: (block: BlockType) => void
  onSizeReport?: (id: string, w: number, h: number) => void
}

export default function DraggableBlock({ block, position, scale = 1, snapping = false, onSizeReport, ...rest }: Props) {
  const [wiggling, setWiggling] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    disabled: wiggling,
  })

  const setRef = useCallback((el: HTMLDivElement | null) => {
    setNodeRef(el)
    wrapperRef.current = el
  }, [setNodeRef])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el || !onSizeReport) return
    const ro = new ResizeObserver(() => {
      if (wrapperRef.current) {
        onSizeReport(block.id, wrapperRef.current.offsetWidth, wrapperRef.current.offsetHeight)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [block.id, onSizeReport])

  const tx = transform ? transform.x / scale : 0
  const ty = transform ? transform.y / scale : 0

  return (
    <div
      ref={setRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: tx || ty ? `translate(${tx}px, ${ty}px)` : undefined,
        zIndex: isDragging ? 10 : 1,
        transition: isDragging ? 'none' : snapping ? 'left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
      }}
    >
      {/* glow on mount */}
      <motion.div
        initial={{ opacity: 0.7, scale: 0.9 }}
        animate={{ opacity: 0, scale: 2.2 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.1)',
          filter: 'blur(16px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* block entrance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 10 }}
        animate={{ opacity: isDragging ? 0.85 : 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Block
          {...rest}
          block={block}
          scale={scale}
          dragHandleProps={{ ...attributes, ...listeners }}
          onWiggleChange={setWiggling}
        />
      </motion.div>
    </div>
  )
}
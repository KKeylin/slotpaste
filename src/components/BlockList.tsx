import { useRef, useState, useEffect } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import type { Block as BlockType, Appearance } from '../types'
import DraggableBlock from './DraggableBlock'
import AddBlock from './AddBlock'

const CANVAS_SIZE = 10000

interface Props {
  blocks: BlockType[]
  activeTabId: string
  appearance: Appearance
  onCopy: (text: string) => void
  onAdd: (text: string, color?: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
}

export default function BlockList({ blocks, activeTabId, appearance, onCopy, onAdd, onChange, onColorChange, onDelete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const panRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const isPanning = useRef(false)
  const panStart = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })
  const prevBlockCount = useRef(blocks.length)

  panRef.current = pan
  scaleRef.current = scale

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function panToPoint(canvasX: number, canvasY: number) {
    if (!containerRef.current || !canvasRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const newPan = {
      x: width / 2 - canvasX * scaleRef.current,
      y: height / 2 - canvasY * scaleRef.current,
    }
    panRef.current = newPan
    canvasRef.current.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    canvasRef.current.style.transform = `translate(${newPan.x}px, ${newPan.y}px) scale(${scaleRef.current})`
    setPan({ ...newPan })
    const onEnd = () => {
      if (canvasRef.current) canvasRef.current.style.transition = ''
      canvasRef.current?.removeEventListener('transitionend', onEnd)
    }
    canvasRef.current.addEventListener('transitionend', onEnd, { once: true })
  }

  function applyTransform(p: { x: number; y: number }, s: number) {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`
    }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const initial = { x: width / 2 - CANVAS_SIZE / 2, y: height / 2 - CANVAS_SIZE / 2 }
    panRef.current = initial
    setPan(initial)
    applyTransform(initial, 1)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = 1 - e.deltaY * 0.001
      const newScale = Math.min(3, Math.max(0.15, scaleRef.current * factor))
      const rect = el!.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const newPan = {
        x: cx - (cx - panRef.current.x) * (newScale / scaleRef.current),
        y: cy - (cy - panRef.current.y) * (newScale / scaleRef.current),
      }
      panRef.current = newPan
      scaleRef.current = newScale
      applyTransform(newPan, newScale)
      setPan({ ...newPan })
      setScale(newScale)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    if (blocks.length > prevBlockCount.current) {
      const newBlock = blocks[blocks.length - 1]
      const i = blocks.length - 1
      const pos = newBlock.position ?? { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 + i * 90 }
      panToPoint(pos.x, pos.y)
    }
    prevBlockCount.current = blocks.length
  }, [blocks.length])

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    panToPoint(CANVAS_SIZE / 2, CANVAS_SIZE / 2)
  }, [activeTabId])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    isPanning.current = true
    panStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isPanning.current) return
    const newPan = {
      x: panStart.current.panX + (e.clientX - panStart.current.mouseX),
      y: panStart.current.panY + (e.clientY - panStart.current.mouseY),
    }
    panRef.current = newPan
    applyTransform(newPan, scaleRef.current)
  }

  function handlePointerUp() {
    if (!isPanning.current) return
    isPanning.current = false
    setPan({ ...panRef.current })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    const i = blocks.findIndex((b) => b.id === active.id)
    const block = blocks[i]
    if (!block) return
    const pos = block.position ?? { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 + i * 90 }
    onChange({
      ...block,
      position: {
        x: Math.max(0, Math.min(CANVAS_SIZE, pos.x + delta.x / scaleRef.current)),
        y: Math.max(0, Math.min(CANVAS_SIZE, pos.y + delta.y / scaleRef.current)),
      },
    })
  }

  function resetView() {
    if (!containerRef.current || !canvasRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const newPan = { x: width / 2 - CANVAS_SIZE / 2, y: height / 2 - CANVAS_SIZE / 2 }
    panRef.current = newPan
    scaleRef.current = 1
    canvasRef.current.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    canvasRef.current.style.transform = `translate(${newPan.x}px, ${newPan.y}px) scale(1)`
    setPan({ ...newPan })
    setScale(1)
    const onEnd = () => {
      if (canvasRef.current) canvasRef.current.style.transition = ''
      canvasRef.current?.removeEventListener('transitionend', onEnd)
    }
    canvasRef.current.addEventListener('transitionend', onEnd, { once: true })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            ref={canvasRef}
            style={{
              position: 'absolute',
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {blocks.map((block, i) => (
              <DraggableBlock
                key={block.id}
                block={block}
                position={block.position ?? { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 + i * 90 }}
                scale={scale}
                appearance={appearance}
                onCopy={onCopy}
                onChange={onChange}
                onColorChange={onColorChange}
                onDelete={onDelete}
              />
            ))}

            {blocks.length === 0 && (
              <p
                className="absolute text-xs select-none pointer-events-none"
                style={{
                  left: CANVAS_SIZE / 2 - 50,
                  top: CANVAS_SIZE / 2 - 8,
                  color: 'rgba(255,255,255,0.15)',
                }}
              >
                No blocks yet
              </p>
            )}
          </div>
        </DndContext>

        <button
          onClick={resetView}
          className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-xl text-[10px] font-medium tracking-wide transition-opacity opacity-40 hover:opacity-80"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
        >
          ⌖ CENTER
        </button>
      </div>
      <AddBlock appearance={appearance} onAdd={onAdd} />
    </div>
  )
}
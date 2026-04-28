import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { Block as BlockType, Appearance } from '../../types'
import DraggableBlock from '../DraggableBlock'
import AddBlock from '../AddBlock'
import { useCanvas, useBlockSnap } from './hooks'
import { CANVAS_SIZE } from '../../constants'

interface Props {
  blocks: BlockType[]
  activeTabId: string
  appearance: Appearance
  onCopy: (text: string) => void
  onAdd: (text: string, color?: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
  readOnly?: boolean
}

export default function BlockList({ blocks, activeTabId, appearance, onCopy, onAdd, onChange, onColorChange, onDelete, readOnly }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const { containerRef, canvasRef, pan, scale, scaleRef, resetView, resetZoom, pointerHandlers, touchHandlers } =
    useCanvas(blocks, activeTabId)

  const { snappingIds, handleSizeReport, handleResizeEnd, handleDragEnd } =
    useBlockSnap(blocks, onChange, scaleRef)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={containerRef} className="relative flex-1 overflow-hidden" style={{ touchAction: 'none' }} {...touchHandlers}>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            ref={canvasRef}
            style={{
              position: 'absolute',
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
            {...pointerHandlers}
          >
            {blocks.map((block, i) => (
              <DraggableBlock
                key={block.id}
                block={block}
                position={block.position ?? { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 + i * 90 }}
                scale={scale}
                snapping={snappingIds.has(block.id)}
                appearance={appearance}
                onCopy={onCopy}
                onChange={onChange}
                onColorChange={onColorChange}
                onDelete={onDelete}
                onResizeEnd={handleResizeEnd}
                onSizeReport={handleSizeReport}
                readOnly={readOnly}
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

        <div
          className="absolute right-3 flex flex-col gap-1.5"
          style={{ bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={resetZoom}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-medium tracking-wide transition-opacity opacity-40 hover:opacity-80 tabular-nums"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={resetView}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-medium tracking-wide transition-opacity opacity-40 hover:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
          >
            ⌖ CENTER
          </button>
        </div>
      </div>
      <AddBlock appearance={appearance} onAdd={onAdd} readOnly={readOnly} />
    </div>
  )
}
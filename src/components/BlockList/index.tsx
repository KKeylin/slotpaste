import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { Block as BlockType, Appearance } from '../../types'
import DraggableBlock from '../DraggableBlock'
import AddBlock from '../AddBlock'
import { useCanvas, useBlockSnap, CANVAS_SIZE } from './hooks'

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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const { containerRef, canvasRef, pan, scale, scaleRef, resetView, pointerHandlers } =
    useCanvas(blocks, activeTabId)

  const { snappingIds, handleSizeReport, handleResizeEnd, handleDragEnd } =
    useBlockSnap(blocks, onChange, scaleRef)

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
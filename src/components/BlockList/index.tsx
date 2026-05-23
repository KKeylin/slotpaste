import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { Block as BlockType, Appearance } from '../../types'
import DraggableBlock from '../DraggableBlock'
import AddBlock from '../AddBlock'
import { useCanvas, useBlockSnap } from './hooks'
import { CANVAS_W, CANVAS_H } from '../../constants'
import { isColorDark } from '../../utils/color'

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
  collisionPrevention?: boolean
}

const CANVAS_GRID_SIZE = 32

function gridBackground(appearance: Props['appearance'], isDark: boolean): string | undefined {
  const mode = appearance.gridMode ?? 'dots'
  if (mode === 'none') return undefined
  const opacity = appearance.gridOpacity ?? 0.12
  const color = isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`
  if (mode === 'dots') return `radial-gradient(circle at 0 0, ${color} 1px, transparent 1px)`
  return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`
}

export default function BlockList({ blocks, activeTabId, appearance, onCopy, onAdd, onChange, onColorChange, onDelete, readOnly, collisionPrevention }: Props) {
  const isDark = isColorDark(appearance.bgColor)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const { containerRef, canvasRef, pan, scale, scaleRef, resetView, resetZoom, pointerHandlers, touchHandlers } =
    useCanvas(blocks, activeTabId)

  const { snappingIds, handleSizeReport, handleResizeEnd, handleDragEnd } =
    useBlockSnap(blocks, onChange, scaleRef, collisionPrevention)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: 'none' }}
        {...touchHandlers}
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            ref={canvasRef}
            style={{
              position: 'absolute',
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              willChange: 'transform',
              backgroundColor: appearance.bgColor,
              backgroundImage: gridBackground(appearance, isDark),
              backgroundSize: `${CANVAS_GRID_SIZE}px ${CANVAS_GRID_SIZE}px`,
            }}
            {...pointerHandlers}
          >
            {blocks.map((block, i) => (
              <DraggableBlock
                key={block.id}
                block={block}
                position={block.position ?? { x: CANVAS_W / 2, y: CANVAS_H / 2 + i * 90 }}
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
                  left: CANVAS_W / 2 - 50,
                  top: CANVAS_H / 2 - 8,
                  color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)',
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
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', border: `1px solid ${appearance.accentColor}` }}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={resetView}
            className="px-2.5 py-1.5 rounded-xl text-[10px] font-medium tracking-wide transition-opacity opacity-40 hover:opacity-80"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', border: `1px solid ${appearance.accentColor}` }}
          >
            ⌖ CENTER
          </button>
        </div>
      </div>
      <AddBlock appearance={appearance} onAdd={onAdd} readOnly={readOnly} />
    </div>
  )
}
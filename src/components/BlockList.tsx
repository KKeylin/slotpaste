import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import type { Block as BlockType, Appearance } from '../types'
import DraggableBlock from './DraggableBlock'
import AddBlock from './AddBlock'

interface Props {
  blocks: BlockType[]
  appearance: Appearance
  onCopy: (text: string) => void
  onAdd: (text: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
}

export default function BlockList({ blocks, appearance, onCopy, onAdd, onChange, onColorChange, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    const block = blocks.find((b) => b.id === active.id)
    if (!block) return
    const pos = block.position ?? { x: 16, y: 16 }
    onChange({
      ...block,
      position: {
        x: Math.max(0, pos.x + delta.x),
        y: Math.max(0, pos.y + delta.y),
      },
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="relative flex-1 overflow-hidden">
          {blocks.map((block, i) => (
            <DraggableBlock
              key={block.id}
              block={block}
              position={block.position ?? { x: 16, y: 16 + i * 90 }}
              appearance={appearance}
              onCopy={onCopy}
              onChange={onChange}
              onColorChange={onColorChange}
              onDelete={onDelete}
            />
          ))}
          {blocks.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              No blocks yet
            </p>
          )}
        </div>
      </DndContext>
      <AddBlock onAdd={onAdd} />
    </div>
  )
}
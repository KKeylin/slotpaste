import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block as BlockType, Appearance } from '../types'
import Block from './Block'
import AddBlock from './AddBlock'

interface SortableBlockProps {
  block: BlockType
  appearance: Appearance
  onCopy: (text: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
  readOnly?: boolean
}

function SortableBlock({ block, appearance, onCopy, onChange, onColorChange, onDelete, readOnly }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <Block
        block={block}
        appearance={appearance}
        onCopy={onCopy}
        onChange={onChange}
        onColorChange={onColorChange}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        readOnly={readOnly}
      />
    </div>
  )
}

interface Props {
  blocks: BlockType[]
  appearance: Appearance
  onCopy: (text: string) => void
  onAdd: (text: string, color?: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
  onReorder: (blocks: BlockType[]) => void
  readOnly?: boolean
}

export default function ListView({ blocks, appearance, onCopy, onAdd, onChange, onColorChange, onDelete, onReorder, readOnly }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    onReorder(arrayMove(blocks, oldIndex, newIndex))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                appearance={appearance}
                onCopy={onCopy}
                onChange={onChange}
                onColorChange={onColorChange}
                onDelete={onDelete}
                readOnly={readOnly}
              />
            ))}
          </SortableContext>
        </DndContext>

        {blocks.length === 0 && (
          <p className="text-xs text-center py-8 select-none" style={{ color: 'rgba(255,255,255,0.15)' }}>
            No blocks yet
          </p>
        )}
      </div>

      <AddBlock appearance={appearance} onAdd={onAdd} readOnly={readOnly} />
    </div>
  )
}
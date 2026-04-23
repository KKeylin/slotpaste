import { useDraggable } from '@dnd-kit/core'
import Block from './Block'
import type { Block as BlockType, Appearance } from '../types'

interface Props {
  block: BlockType
  position: { x: number; y: number }
  appearance: Appearance
  onCopy: (text: string) => void
  onChange: (block: BlockType) => void
  onColorChange: (block: BlockType, recentColors: string[]) => void
  onDelete: (id: string) => void
}

export default function DraggableBlock({ block, position, ...rest }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: position.x + (transform?.x ?? 0),
        top: position.y + (transform?.y ?? 0),
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.85 : 1,
        transition: isDragging ? 'none' : 'opacity 0.15s',
      }}
    >
      <Block {...rest} block={block} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}
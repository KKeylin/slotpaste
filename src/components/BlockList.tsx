import type { Block as BlockType, Appearance } from '../types'
import Block from './Block'
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

export default function BlockList({
  blocks,
  appearance,
  onCopy,
  onAdd,
  onChange,
  onColorChange,
  onDelete,
}: Props) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-3 overflow-y-auto flex-1 items-start">
        {blocks.map((block) => (
          <Block
            key={block.id}
            block={block}
            appearance={appearance}
            onCopy={onCopy}
            onChange={onChange}
            onColorChange={onColorChange}
            onDelete={onDelete}
          />
        ))}
        {blocks.length === 0 && (
          <p className="text-xs text-center mt-8" style={{ color: 'rgba(255,255,255,0.2)' }}>
            No blocks yet
          </p>
        )}
      </div>
      <AddBlock onAdd={onAdd} />
    </div>
  )
}
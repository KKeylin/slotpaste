import RBush from 'rbush'
import type { Block } from '../types'

export const BLOCK_DEFAULT_W = 220
export const BLOCK_DEFAULT_H = 90
export const EDIT_OVERHANG = 25  // 19px button + 4px gap + 2px safety

const QUERY_RADIUS_FACTOR = 2.5
const MAX_ITER = 30

interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  id: string
}

// effectiveH: total visual height including edit button (already measured or pre-calculated)
function blockToBBox(block: Block, effectiveH?: number): BBox {
  const x = block.position!.x
  const y = block.position!.y
  const w = block.width ?? BLOCK_DEFAULT_W
  const h = effectiveH ?? (block.height ?? BLOCK_DEFAULT_H) + EDIT_OVERHANG
  return { minX: x, minY: y, maxX: x + w, maxY: y + h, id: block.id }
}

function buildTree(
  blocks: Block[],
  excludeId?: string,
  measuredSizes?: Map<string, { w: number; h: number }>,
): RBush<BBox> {
  const tree = new RBush<BBox>()
  const items = blocks
    .filter(b => b.position != null && b.id !== excludeId)
    .map(b => blockToBBox(b, measuredSizes?.get(b.id)?.h))
  if (items.length > 0) tree.load(items)
  return tree
}

function rectOverlapsBBox(x: number, y: number, w: number, h: number, b: BBox): boolean {
  return x < b.maxX && x + w > b.minX && y < b.maxY && y + h > b.minY
}

// Resolves ALL overlapping blocks at once: for each direction, finds the push
// needed to clear every block, then picks the smallest of the four directions.
// Prevents A↔B oscillation that happens when processing one block at a time.
function aggregateMTV(x: number, y: number, w: number, h: number, overlapping: BBox[]): { dx: number; dy: number } {
  let pushRight = 0
  let pushLeft  = 0
  let pushDown  = 0
  let pushUp    = 0

  for (const b of overlapping) {
    pushRight = Math.max(pushRight, b.maxX - x)
    pushLeft  = Math.max(pushLeft,  (x + w) - b.minX)
    pushDown  = Math.max(pushDown,  b.maxY - y)
    pushUp    = Math.max(pushUp,    (y + h) - b.minY)
  }

  const options = [
    { dx: pushRight, dy: 0 },
    { dx: -pushLeft, dy: 0 },
    { dx: 0, dy: pushDown },
    { dx: 0, dy: -pushUp },
  ]
  return options.reduce((best, cur) =>
    Math.abs(cur.dx) + Math.abs(cur.dy) < Math.abs(best.dx) + Math.abs(best.dy) ? cur : best
  )
}

// size.h must be effective height (block body + edit button)
export function findFreePosition(
  desired: { x: number; y: number },
  size: { w: number; h: number },
  blocks: Block[],
  excludeId?: string,
  measuredSizes?: Map<string, { w: number; h: number }>,
): { x: number; y: number } {
  const tree = buildTree(blocks, excludeId, measuredSizes)
  const { w, h } = size
  const radius = Math.max(w, h) * QUERY_RADIUS_FACTOR

  let { x, y } = desired

  for (let i = 0; i < MAX_ITER; i++) {
    const neighbors = tree.search({
      minX: x - radius,
      minY: y - radius,
      maxX: x + w + radius,
      maxY: y + h + radius,
    })
    const overlapping = neighbors.filter(b => rectOverlapsBBox(x, y, w, h, b))
    if (overlapping.length === 0) return { x, y }
    const { dx, dy } = aggregateMTV(x, y, w, h, overlapping)
    x += dx
    y += dy
  }

  return { x, y }
}
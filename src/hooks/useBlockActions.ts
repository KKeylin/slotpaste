import type { AppState, Block, Tab } from '../types'
import { nanoid } from '../utils/nanoid'
import { findFreePosition } from '../utils/collision'
import { BLOCK_DEFAULT_W, BLOCK_DEFAULT_H, EDIT_OVERHANG } from '../constants'

interface SecureHandle {
  isLocked: boolean
  encryptForStore: (id: string, text: string) => Promise<string>
  removeFromCache: (id: string) => void
}

interface Params {
  state: AppState
  updateState: (s: AppState) => void
  activeTab: Tab
  patchTab: (tabId: string, patch: Partial<Tab>) => void
  isSecureEnabled: boolean
  collisionPrevention: boolean
  secureHandle: SecureHandle
}

export function useBlockActions({ state, updateState, activeTab, patchTab, isSecureEnabled, collisionPrevention, secureHandle }: Params) {
  async function maybeEncrypt(block: Block): Promise<Block> {
    if (!isSecureEnabled || secureHandle.isLocked) return block
    return { ...block, text: await secureHandle.encryptForStore(block.id, block.text) }
  }

  async function addBlock(text: string, color?: string) {
    const id = nanoid()
    let position: { x: number; y: number } | undefined
    if (activeTab.viewMode === 'canvas') {
      const last = activeTab.blocks[activeTab.blocks.length - 1]
      const i = activeTab.blocks.length
      const desired = last
        ? { x: last.position?.x ?? 2000, y: (last.position?.y ?? 2000 + (i - 1) * 90) + (last.height ?? 90) + 20 }
        : { x: 2000, y: 2000 }
      position = collisionPrevention
        ? findFreePosition(desired, { w: BLOCK_DEFAULT_W, h: BLOCK_DEFAULT_H + EDIT_OVERHANG }, activeTab.blocks)
        : desired
    }
    const draft: Block = { id, text, fontSize: 'md', ...(position ? { position } : {}), ...(color ? { color } : {}) }
    const block = await maybeEncrypt(draft)
    patchTab(activeTab.id, { blocks: [...activeTab.blocks, block] })
  }

  function reorderBlocks(blocks: Block[]) { patchTab(activeTab.id, { blocks }) }

  async function changeBlock(updated: Block) {
    const stored = await maybeEncrypt(updated)
    patchTab(activeTab.id, { blocks: activeTab.blocks.map((b) => (b.id === stored.id ? stored : b)) })
  }

  function deleteBlock(id: string) {
    secureHandle.removeFromCache(id)
    patchTab(activeTab.id, { blocks: activeTab.blocks.filter((b) => b.id !== id) })
  }

  async function changeBlockAndColors(updated: Block, recentColors: string[]) {
    const stored = await maybeEncrypt(updated)
    updateState({
      ...state,
      tabs: state.tabs.map((t) =>
        t.id === activeTab.id
          ? { ...t, blocks: t.blocks.map((b) => (b.id === stored.id ? stored : b)) }
          : t
      ),
      appearance: { ...state.appearance, recentColors },
    })
  }

  return { addBlock, reorderBlocks, changeBlock, deleteBlock, changeBlockAndColors }
}
export type FontSize = 'h1' | 'h2' | 'md' | 'sm'

export interface Block {
  id: string
  text: string
  fontSize: FontSize
  color?: string
  width?: number
  height?: number
  position?: { x: number; y: number }
  groupId?: string
}

export interface Tab {
  id: string
  name: string
  blocks: Block[]
  viewMode: 'list' | 'canvas'
}

export interface Appearance {
  bgColor: string
  blockColor: string
  blockOpacity: number
  accentColor: string
  recentColors: string[]
}

export interface AppState {
  tabs: Tab[]
  activeTabId: string
  appearance: Appearance
}

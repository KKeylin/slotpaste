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

export type GridMode = 'none' | 'dots' | 'lines'

export interface Appearance {
  bgColor: string
  blockColor: string
  blockOpacity: number
  accentColor: string
  recentColors: string[]
  gridMode?: GridMode
  gridOpacity?: number
}

export type TabAppearance = Partial<Omit<Appearance, 'recentColors'>>

export interface Tab {
  id: string
  name: string
  blocks: Block[]
  viewMode: 'list' | 'canvas'
  appearance?: TabAppearance
  home?: { x: number; y: number; scale: number }
}

export interface KeyShortcut {
  key: string
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
}

export interface SecureConfig {
  enabled: boolean
  salt: string
  verifyToken: string
}

export interface Preferences {
  focusAddShortcut?: KeyShortcut
  searchShortcut?: KeyShortcut
  prevTabShortcut?: KeyShortcut
  nextTabShortcut?: KeyShortcut
  lockShortcut?: KeyShortcut
}

export interface AppState {
  tabs: Tab[]
  activeTabId: string
  appearance: Appearance
  secure?: SecureConfig
  preferences?: Preferences
}

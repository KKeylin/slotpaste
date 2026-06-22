import TabBar from '../TabBar'
import NavigateBar from '../NavigateBar'
import { LockIcon, HelpIcon, SettingsIcon } from '../icons'
import type { Appearance, Tab, KeyShortcut } from '../../types'
import type { NavigateBlock } from '../NavigateModal'

interface Props {
  tabs: Tab[]
  activeTabId: string
  appearance: Appearance
  btnStyle: React.CSSProperties
  navigateBlocks: NavigateBlock[]
  navigateShortcut: KeyShortcut
  isSecureEnabled: boolean
  isSecureLocked: boolean
  helpOpen: boolean
  settingsOpen: boolean
  onSelectTab: (id: string) => void
  onAddTab: () => void
  onRenameTab: (id: string, name: string) => void
  onReorderTabs: (tabs: Tab[]) => void
  onDeleteTab: (id: string) => void
  onSelect: (block: NavigateBlock) => void
  onOpenHelp: () => void
  onToggleSettings: () => void
  onToggleLock: () => void
}

export default function AppHeader({
  tabs, activeTabId, appearance, btnStyle, navigateBlocks, navigateShortcut,
  isSecureEnabled, isSecureLocked, helpOpen, settingsOpen,
  onSelectTab, onAddTab, onRenameTab, onReorderTabs, onDeleteTab,
  onSelect, onOpenHelp, onToggleSettings, onToggleLock,
}: Props) {
  return (
    <div className="relative">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        accentColor={appearance.accentColor}
        bgColor={appearance.bgColor}
        onSelect={onSelectTab}
        onAdd={onAddTab}
        onRename={onRenameTab}
        onReorder={onReorderTabs}
        onDelete={onDeleteTab}
      />
      <div className="absolute top-0 right-0 flex items-center">
        <NavigateBar blocks={navigateBlocks} onSelect={onSelect} buttonStyle={btnStyle} shortcut={navigateShortcut} />
        {isSecureEnabled && (
          <button
            onClick={onToggleLock}
            className="w-10 h-10 flex items-center justify-center mr-2 hover:opacity-80"
            style={{
              backgroundColor: isSecureLocked ? '#E24B4A' : '#1D9E75',
              color: 'white',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
              transition: 'background-color 0.3s ease',
            }}
          >
            <LockIcon />
          </button>
        )}
        <button
          onClick={onOpenHelp}
          className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
          style={{ ...btnStyle, borderBottomLeftRadius: '12px', opacity: helpOpen ? 1 : 0.7 }}
        >
          <HelpIcon />
        </button>
        <button
          onClick={onToggleSettings}
          className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-75"
          style={{ ...btnStyle, opacity: settingsOpen ? 1 : 0.7 }}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  )
}
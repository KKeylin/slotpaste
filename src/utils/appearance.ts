import type { Appearance, Tab } from '../types'

export function resolveAppearance(global: Appearance, tab: Tab): Appearance {
  return { ...global, ...tab.appearance }
}
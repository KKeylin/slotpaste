import type { Block, Appearance } from '../types'
import { getLuminance, isColorDark } from './color'

export function computeBlockStyles(block: Block, appearance: Appearance, blockWidth: number) {
  const wiggleAmplitude = Math.min(7, Math.max(1.5, (8 / (blockWidth / 2)) * (180 / Math.PI)))

  const rawColor = block.color ?? appearance.blockColor
  const bgColor = `color-mix(in srgb, ${rawColor} ${Math.round(appearance.blockOpacity * 100)}%, transparent)`

  const canvasDark = isColorDark(appearance.bgColor)
  const canvasTextColor = canvasDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'
  const canvasMutedColor = canvasDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'

  const effectiveLuminance =
    getLuminance(rawColor) * appearance.blockOpacity +
    getLuminance(appearance.bgColor) * (1 - appearance.blockOpacity)
  const textColor = effectiveLuminance < 0.5 ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'

  return { wiggleAmplitude, bgColor, textColor, canvasTextColor, canvasMutedColor }
}
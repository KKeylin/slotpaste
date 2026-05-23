import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import colorWheelImg from '../assets/color-wheel-2.png'
import type { Appearance, GridMode, Tab, TabAppearance } from '../types'
import { isColorDark } from '../utils/color'

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${r}, ${g}, ${b})`
}

interface ColorRowProps {
  label: string
  color: string
  opacity?: number
  onColorChange: (color: string) => void
  onOpacityChange?: (opacity: number) => void
}

function ColorRow({ label, color, opacity, onColorChange, onOpacityChange }: ColorRowProps) {
  const [fmt, setFmt] = useState<'hex' | 'rgb'>('hex')
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFmt(f => f === 'hex' ? 'rgb' : 'hex')}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: color, color: isColorDark(color) ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)' }}
          >
            {fmt === 'hex' ? color : hexToRgb(color)}
          </button>
          <label className="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 relative overflow-hidden flex-shrink-0">
            <img src={colorWheelImg} className="w-full h-full object-cover rounded-full" alt="colorWheel" />
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>
      {opacity !== undefined && onOpacityChange && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(opacity * 100)}
            onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-white"
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,0.7) ${Math.round(opacity * 100)}%, rgba(255,255,255,0.15) ${Math.round(opacity * 100)}%)`,
            }}
          />
          <span className="text-[11px] w-8 text-right tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {Math.round(opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

interface Props {
  isOpen: boolean
  tab: Tab
  tabAppearance: Appearance
  onTabAppearanceChange: (patch: TabAppearance) => void
  onReset: () => void
  onClose: () => void
}

export default function CanvasSettingsPanel({ isOpen, tab, tabAppearance, onTabAppearanceChange, onReset, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const hasOverrides = !!tab.appearance && Object.keys(tab.appearance).length > 0
  const gridMode = tabAppearance.gridMode ?? 'dots'

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    function handleOutside(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          key="canvas-settings"
          initial={isMobile ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.9, y: -8 }}
          animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
          exit={isMobile ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.9, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed z-300 flex flex-col gap-5 p-5 rounded-2xl overflow-y-auto"
          style={isMobile ? {
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
            left: 8,
            right: 8,
            maxHeight: '80dvh',
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
            transformOrigin: 'bottom center',
          } : {
            top: 108,
            left: 8,
            width: 288,
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            transformOrigin: 'top left',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Canvas Style
            </span>
            {hasOverrides && (
              <button
                onClick={onReset}
                className="text-[10px] transition-opacity hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Reset to defaults
              </button>
            )}
          </div>

          <ColorRow
            label="Background"
            color={tabAppearance.bgColor}
            onColorChange={(bgColor) => onTabAppearanceChange({ bgColor })}
          />

          <ColorRow
            label="Accent"
            color={tabAppearance.accentColor}
            onColorChange={(accentColor) => onTabAppearanceChange({ accentColor })}
          />

          <ColorRow
            label="Blocks"
            color={tabAppearance.blockColor}
            opacity={tabAppearance.blockOpacity}
            onColorChange={(blockColor) => onTabAppearanceChange({ blockColor })}
            onOpacityChange={(blockOpacity) => onTabAppearanceChange({ blockOpacity })}
          />

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Grid</span>
              <div className="flex items-center gap-1">
                {(['none', 'dots', 'lines'] as GridMode[]).map((mode) => {
                  const active = gridMode === mode
                  return (
                    <button
                      key={mode}
                      onClick={() => onTabAppearanceChange({ gridMode: mode })}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                        color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {mode === 'none' ? 'Off' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>
            {gridMode !== 'none' && (
              <div className="flex items-center gap-2">
                <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>Opacity</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={Math.round((tabAppearance.gridOpacity ?? 0.12) * 100)}
                  onChange={(e) => onTabAppearanceChange({ gridOpacity: Number(e.target.value) / 100 })}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-white"
                  style={{
                    background: `linear-gradient(to right, rgba(255,255,255,0.7) ${Math.round((tabAppearance.gridOpacity ?? 0.12) * 100)}%, rgba(255,255,255,0.15) ${Math.round((tabAppearance.gridOpacity ?? 0.12) * 100)}%)`,
                  }}
                />
                <span className="text-[11px] w-8 text-right tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {Math.round((tabAppearance.gridOpacity ?? 0.12) * 100)}%
                </span>
              </div>
            )}
          </div>

          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Overrides global defaults for this canvas.
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
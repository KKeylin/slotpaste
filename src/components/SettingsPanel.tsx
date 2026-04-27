import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import colorWheelImg from '../assets/color-wheel-2.png'
import type { Appearance } from '../types'
import { VERSION } from '../constants'

interface Props {
  isOpen: boolean
  appearance: Appearance
  secureEnabled: boolean
  secureLocked: boolean
  onChange: (appearance: Appearance) => void
  onClose: () => void
  onEnableSecure: () => void
  onDisableSecure: () => void
  onChangePassword: () => void
  onExport: () => void
  onImportFile: (file: File) => void
  onReset: () => void
}

interface ColorRowProps {
  label: string
  color: string
  opacity?: number
  onColorChange: (color: string) => void
  onOpacityChange?: (opacity: number) => void
}

function ColorRow({ label, color, opacity, onColorChange, onOpacityChange }: ColorRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <label className="w-7 h-7 rounded-full cursor-pointer hover:opacity-80 relative overflow-hidden flex-shrink-0">
          <img src={colorWheelImg} className="w-full h-full object-cover rounded-full" alt="colorWheel" />
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

        {opacity !== undefined && onOpacityChange && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

export default function SettingsPanel({ isOpen, appearance, secureEnabled, secureLocked, onChange, onClose, onEnableSecure, onDisableSecure, onChangePassword, onExport, onImportFile, onReset }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    function handleOutside(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          key="settings"
          initial={isMobile ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.9, y: -8 }}
          animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
          exit={isMobile ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.9, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed z-300 flex flex-col gap-5 p-5 rounded-2xl"
          style={isMobile ? {
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
            left: 8,
            right: 8,
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
            transformOrigin: 'bottom center',
          } : {
            top: 44,
            right: 8,
            width: 288,
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            transformOrigin: 'top right',
          }}
        >
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Appearance
          </span>

          <ColorRow
            label="Background"
            color={appearance.bgColor}
            onColorChange={(bgColor) => onChange({ ...appearance, bgColor })}
          />

          <ColorRow
            label="Blocks"
            color={appearance.blockColor}
            opacity={appearance.blockOpacity}
            onColorChange={(blockColor) => onChange({ ...appearance, blockColor })}
            onOpacityChange={(blockOpacity) => onChange({ ...appearance, blockOpacity })}
          />

          <ColorRow
            label="Accent"
            color={appearance.accentColor}
            onColorChange={(accentColor) => onChange({ ...appearance, accentColor })}
          />

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Security
            </span>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Secure Mode</span>
                {secureEnabled && (
                  <span className="text-[10px]" style={{ color: secureLocked ? '#E24B4A' : '#1D9E75' }}>
                    {secureLocked ? 'Locked' : 'Unlocked'}
                  </span>
                )}
              </div>
              <button
                onClick={secureEnabled ? onDisableSecure : onEnableSecure}
                className="px-3 py-1.5 rounded-xl text-[10px] font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: secureEnabled ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)',
                  color: secureEnabled ? '#E24B4A' : '#1D9E75',
                }}
              >
                {secureEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            {secureEnabled && (
              <button
                onClick={onChangePassword}
                className="py-1.5 rounded-xl text-[10px] font-medium transition-opacity hover:opacity-80 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
              >
                Change password
              </button>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Data
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImportFile(file)
                e.target.value = ''
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={onExport}
                className="flex-1 py-1.5 rounded-xl text-[10px] font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Export JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 rounded-xl text-[10px] font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Import JSON
              </button>
            </div>
            <button
              onClick={onReset}
              className="py-1.5 rounded-xl text-[10px] font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(226,75,74,0.12)', color: '#E24B4A' }}
            >
              Reset all data
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                SlotPaste v{VERSION}
              </span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                Kostiantyn Keilin · MIT License
              </span>
            </div>
            <a
              href="https://buymeacoffee.com/kkeylin"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#FFDD00', color: '#000' }}
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

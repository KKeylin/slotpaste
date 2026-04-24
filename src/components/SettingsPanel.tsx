import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import colorWheelImg from '../assets/color-wheel-2.png'
import type { Appearance } from '../types'
import { VERSION } from '../constants'

interface Props {
  isOpen: boolean
  appearance: Appearance
  onChange: (appearance: Appearance) => void
  onClose: () => void
}

interface ColorRowProps {
  label: string
  color: string
  opacity: number
  onColorChange: (color: string) => void
  onOpacityChange: (opacity: number) => void
}

function ColorRow({ label, color, opacity, onColorChange, onOpacityChange }: ColorRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <label className="w-7 h-7 rounded-full cursor-pointer hover:opacity-80 relative overflow-hidden flex-shrink-0">
          <img src={colorWheelImg} className="w-full h-full object-cover rounded-full" />
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

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
    </div>
  )
}

export default function SettingsPanel({ isOpen, appearance, onChange, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [autoLaunch, setAutoLaunch] = useState(false)

  useEffect(() => {
    if (!isOpen || !window.electronAPI?.getAutoLaunch) return
    window.electronAPI.getAutoLaunch().then(setAutoLaunch)
  }, [isOpen])

  function toggleAutoLaunch() {
    if (!window.electronAPI?.setAutoLaunch) return
    const next = !autoLaunch
    setAutoLaunch(next)
    window.electronAPI.setAutoLaunch(next)
  }

  useEffect(() => {
    if (!isOpen) return
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          key="settings"
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed z-300 flex flex-col gap-5 p-5 rounded-2xl w-72"
          style={{
            top: 44,
            right: 8,
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
            opacity={appearance.bgOpacity}
            onColorChange={(bgColor) => onChange({ ...appearance, bgColor })}
            onOpacityChange={(bgOpacity) => onChange({ ...appearance, bgOpacity })}
          />

          <ColorRow
            label="Blocks"
            color={appearance.blockColor}
            opacity={appearance.blockOpacity}
            onColorChange={(blockColor) => onChange({ ...appearance, blockColor })}
            onOpacityChange={(blockOpacity) => onChange({ ...appearance, blockOpacity })}
          />

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          <button
            onClick={toggleAutoLaunch}
            className="flex items-center justify-between w-full"
          >
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Launch at login
            </span>
            <div
              className="w-8 h-4.5 rounded-full relative transition-colors duration-200 flex-shrink-0"
              style={{
                width: '32px',
                height: '18px',
                backgroundColor: autoLaunch ? '#1D9E75' : 'rgba(255,255,255,0.12)',
              }}
            >
              <div
                className="absolute top-0.5 rounded-full transition-transform duration-200"
                style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: 'white',
                  transform: autoLaunch ? 'translateX(16px)' : 'translateX(2px)',
                }}
              />
            </div>
          </button>

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
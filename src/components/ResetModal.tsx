import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

interface Props {
  secureEnabled: boolean
  onBackup: () => void
  onReset: () => void
  onCancel: () => void
}

export default function ResetModal({ secureEnabled, onBackup, onReset, onCancel }: Props) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-500 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="flex flex-col gap-5 rounded-2xl p-6 w-full max-w-xs"
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.87)' }}>
            Reset all data
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            All tabs and blocks will be permanently deleted.
          </p>
        </div>

        {secureEnabled && (
          <div
            className="flex flex-col gap-2 rounded-xl p-3"
            style={{ backgroundColor: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.2)' }}
          >
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(226,75,74,0.85)' }}>
              Your data is encrypted. Without the password it cannot be recovered.
            </p>
            <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.22)' }}>
              A strong password will be cracked slightly after the sun burns out.
              Better go play the lottery.
            </p>
          </div>
        )}

        <button
          onClick={onBackup}
          className="py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
        >
          Download backup
        </button>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-xs transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
          >
            Cancel
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#E24B4A', color: 'white' }}
          >
            Reset
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
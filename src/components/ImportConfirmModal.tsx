import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

interface Props {
  hasSecure: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ImportConfirmModal({ hasSecure, onConfirm, onCancel }: Props) {
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
        className="flex flex-col gap-4 rounded-2xl p-6 w-full max-w-xs"
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold" style={{ color: '#E24B4A' }}>
            ⚠ This will erase everything
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            All your current tabs, blocks, and settings will be permanently replaced with the contents of the file. This cannot be undone.
          </p>
          {hasSecure && (
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
              The file is password-protected — you'll need to enter its password on the next step.
            </p>
          )}
          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.2)' }}>
            To merge two storages manually, disable Secure Mode in both before exporting.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-xs transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#E24B4A', color: 'white' }}
          >
            Replace all
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
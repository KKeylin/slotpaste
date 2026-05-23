import { motion, AnimatePresence } from 'framer-motion'
import type { Toast as ToastType } from '../hooks/useToast'
import { MAX_PREVIEW } from '../constants'

interface Props {
  toast: ToastType | null
}

export default function Toast({ toast }: Props) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl text-xs whitespace-nowrap"
          style={{
            backgroundColor: '#1D9E75',
            color: 'rgba(255,255,255,0.95)',
            zIndex: 9999,
          }}
        >
          "{toast.text.slice(0, MAX_PREVIEW)}{toast.text.length > MAX_PREVIEW ? '…' : ''}" copied
        </motion.div>
      )}
    </AnimatePresence>
  )
}
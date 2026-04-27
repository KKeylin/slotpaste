import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { estimateCrackTime } from '../utils/crypto'

const MAX_LENGTH = 32

interface CellsProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  shaking: boolean
  autoFocus?: boolean
}

function PasswordCells({ value, onChange, onSubmit, shaking, autoFocus }: CellsProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [])

  const cellCount = value.length < MAX_LENGTH
    ? Math.max(8, value.length + 1)
    : MAX_LENGTH

  return (
    <motion.div
      animate={shaking ? { x: [-6, 6, -6, 6, -3, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex flex-wrap gap-1.5 justify-center cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        autoComplete="off"
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      <AnimatePresence initial={false}>
        {Array.from({ length: cellCount }, (_, i) => (
          <motion.div
            key={i}
            initial={i >= 8 ? { scale: 0.4, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: i < value.length ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              border: '1px solid',
              borderColor: i < value.length ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)',
            }}
          >
            {i < value.length && (
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, lineHeight: 1 }}>●</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

const LEVEL_COLORS = {
  weak:    '#E24B4A',
  medium:  '#E8A838',
  strong:  '#5DB85C',
  extreme: '#1D9E75',
}

function CrackTimeDisplay({ password }: { password: string }) {
  const estimate = useMemo(() => estimateCrackTime(password), [password])
  if (!estimate) return (
    <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
      time to crack will show as you type
    </p>
  )
  return (
    <div className="flex flex-col gap-0.5 text-center">
      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
        time to crack:{' '}
        <span className="font-medium" style={{ color: LEVEL_COLORS[estimate.level] }}>
          {estimate.label}
        </span>
      </p>
      {estimate.hint && (
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {estimate.hint}
        </p>
      )}
    </div>
  )
}

export type SecureModalMode = 'set' | 'unlock' | 'verify'

interface Props {
  mode: SecureModalMode
  title?: string
  loading?: boolean
  error?: string
  onSuccess: (password: string) => void
  onCancel: () => void
}

export default function SecureModal({ mode, title, loading, error, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [shaking, setShaking] = useState(false)

  const isSet = mode === 'set'

  const stepTitle = title ?? (
    isSet
      ? (step === 1 ? 'Create password' : 'Confirm password')
      : mode === 'unlock' ? 'Unlock' : 'Confirm password'
  )

  function shake() {
    setShaking(true)
    setTimeout(() => setShaking(false), 400)
  }

  useEffect(() => {
    if (error) shake()
  }, [error])

  function handleSubmit() {
    if (loading) return
    const current = step === 1 ? password : confirm

    if (isSet) {
      if (step === 1) {
        if (!password) return
        setStep(2)
        return
      }
      if (confirm !== password) {
        setMismatch(true)
        shake()
        setConfirm('')
        return
      }
      onSuccess(password)
      return
    }

    if (!current) return
    onSuccess(current)
  }

  function handleCancel() {
    if (step === 2) {
      setStep(1)
      setConfirm('')
      setMismatch(false)
    } else {
      onCancel()
    }
  }

  const activeValue = step === 1 ? password : confirm
  const activeOnChange = step === 1 ? setPassword : (v: string) => { setConfirm(v); setMismatch(false) }

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
        <div className="flex flex-col gap-1 text-center">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.87)' }}>
            {stepTitle}
          </p>
          {isSet && (
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {step === 1 ? 'Any length. No requirements.' : 'Type it again to confirm.'}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === 2 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: step === 2 ? -20 : 20 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
          >
            <PasswordCells
              value={activeValue}
              onChange={activeOnChange}
              onSubmit={handleSubmit}
              shaking={shaking}
              autoFocus
            />

            {mismatch && (
              <p className="text-[10px] text-center" style={{ color: '#E24B4A' }}>
                Passwords don't match
              </p>
            )}

            {error && !mismatch && (
              <p className="text-[10px] text-center" style={{ color: '#E24B4A' }}>
                {error}
              </p>
            )}

            {(isSet && step === 1) && <CrackTimeDisplay password={password} />}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-2 rounded-xl text-xs transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
          >
            {step === 2 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !activeValue}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{ backgroundColor: '#1D9E75', color: 'white' }}
          >
            {loading ? '…' : isSet ? (step === 1 ? 'Next' : 'Set password') : 'Unlock'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
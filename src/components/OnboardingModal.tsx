import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface SlideData {
  icon: React.ReactNode
  title: string
  body: string
}

const SLIDES: SlideData[] = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 16H5V5h2v3h10V5h2v14z"/>
      </svg>
    ),
    title: 'Welcome to SlotPaste',
    body: 'A clipboard manager built for job search. Keep cover letter snippets, links, and skills in one place — always a tap away.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
    ),
    title: 'Copy in one tap',
    body: 'Tap any block to instantly copy its text to clipboard. Long press to enter edit mode — then tap × to delete or EDIT to update.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 10h2v2H5zm0 4h2v2H5zm4-4h10v2H9zm0 4h7v2H9z"/>
      </svg>
    ),
    title: 'Organize with tabs',
    body: 'Create tabs for different roles, companies, or content types. Long press a tab to delete it, double-tap its name to rename.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/>
      </svg>
    ),
    title: 'List & Canvas',
    body: 'List mode for quick scrolling. Canvas mode for free-form layout — drag blocks anywhere and zoom with scroll wheel.',
  },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
}

interface Props {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: Props) {
  const [[page, dir], setPage] = useState<[number, number]>([0, 0])
  const dragStartX = useRef(0)

  function go(newDir: number) {
    const next = page + newDir
    if (next < 0 || next >= SLIDES.length) return
    setPage([next, newDir])
  }

  function goTo(index: number) {
    if (index === page) return
    setPage([index, index > page ? 1 : -1])
  }

  const isLast = page === SLIDES.length - 1
  const slide = SLIDES[page]

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-500 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="flex flex-col rounded-2xl overflow-hidden w-full max-w-sm"
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => { dragStartX.current = e.clientX }}
        onPointerUp={(e) => {
          const dx = dragStartX.current - e.clientX
          if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1)
        }}
      >
        <div className="relative overflow-hidden" style={{ height: 248 }}>
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={page}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}
              >
                {slide.icon}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.87)' }}>
                  {slide.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {slide.body}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === page ? 18 : 6,
                  height: 6,
                  backgroundColor: i === page ? '#1D9E75' : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {page > 0 && (
              <button
                onClick={() => go(-1)}
                className="px-4 py-2 rounded-xl text-xs transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? onClose : () => go(1)}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#1D9E75', color: 'white' }}
            >
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
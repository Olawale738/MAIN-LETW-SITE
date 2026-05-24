'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function FlyerWidget() {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Show after a short delay so it doesn't pop immediately on load
    const t = setTimeout(() => setVisible(true), 1800)
    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-6 left-6 z-40 w-52 sm:w-60 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white"
        >
          {/* Dismiss button */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-2 right-2 z-10 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Close flyer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Flyer image */}
          <Link href="/events" aria-label="View upcoming events">
            <img
              src="/Flyer1.jpg"
              alt="LETW Event Flyer"
              className="w-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
            />
          </Link>

          {/* CTA bar */}
          <Link
            href="/events"
            className="flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white text-xs font-bold py-2.5 transition-colors"
          >
            View Events <ExternalLink className="w-3 h-3" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

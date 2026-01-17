'use client'

import { useCallback, useRef, useEffect, MouseEventHandler } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ children }: { children: React.ReactNode }) {
    const overlay = useRef<HTMLDivElement>(null)
    const wrapper = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const onDismiss = useCallback(() => {
        router.back()
    }, [router])

    const onClick: MouseEventHandler = useCallback(
        (e) => {
            if (e.target === overlay.current || e.target === wrapper.current) {
                if (onDismiss) onDismiss()
            }
        },
        [onDismiss, overlay, wrapper]
    )

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss()
        },
        [onDismiss]
    )

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onKeyDown])

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                ref={overlay}
                className="fixed inset-0 z-[9999] grid place-items-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4"
                onClick={onClick}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    ref={wrapper}
                    className="relative w-full max-w-lg mx-auto"
                >
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-[#140152] hover:bg-gray-100 rounded-full transition-all duration-300"
                    >
                        <X className="w-5 h-5" />
                        <span className="sr-only">Close</span>
                    </button>

                    {children}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

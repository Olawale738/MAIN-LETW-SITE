'use client'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Smooth fade-on-route-change. Honours prefers-reduced-motion (renders children
 * without animation in that case). Preserves scroll-restoration to the top on
 * navigation.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(mq.matches)
        const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

    if (reduced) return <>{children}</>

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

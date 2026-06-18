'use client'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
    children: React.ReactNode
    direction?: 'up' | 'down' | 'left' | 'right' | 'none'
    delay?: number  // ms
    duration?: number
    once?: boolean
    threshold?: number
    className?: string
}

/**
 * Fades + slides content in when it enters the viewport.
 * Honours prefers-reduced-motion: skips the transform/opacity entirely.
 */
export default function ScrollReveal({
    children, direction = 'up', delay = 0, duration = 700,
    once = true, threshold = 0.15, className,
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null)
    const [visible, setVisible] = useState(false)
    const [reducedMotion, setReducedMotion] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReducedMotion(mq.matches)
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

    useEffect(() => {
        const node = ref.current
        if (!node) return
        if (reducedMotion) { setVisible(true); return }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true)
                        if (once) observer.unobserve(entry.target)
                    } else if (!once) {
                        setVisible(false)
                    }
                })
            },
            { threshold, rootMargin: '0px 0px -40px 0px' }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [once, threshold, reducedMotion])

    const offset = 24
    const initial = reducedMotion ? {} : {
        opacity: 0,
        transform:
            direction === 'up' ? `translateY(${offset}px)` :
            direction === 'down' ? `translateY(-${offset}px)` :
            direction === 'left' ? `translateX(${offset}px)` :
            direction === 'right' ? `translateX(-${offset}px)` :
            'none',
    }
    const final = { opacity: 1, transform: 'none' }

    return (
        <div
            ref={ref}
            className={cn(className)}
            style={{
                ...(visible ? final : initial),
                transition: reducedMotion ? undefined : `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                willChange: reducedMotion ? undefined : 'transform, opacity',
            }}
        >
            {children}
        </div>
    )
}

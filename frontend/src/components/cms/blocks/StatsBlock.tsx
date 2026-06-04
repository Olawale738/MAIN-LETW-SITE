'use client'
import React, { useEffect, useRef, useState } from 'react'

interface StatItem {
    label: string
    value: string    // e.g. "5,000+" or "200+"
    icon?: string    // emoji or lucide icon name
    color?: string   // hex or tailwind-friendly
}

interface StatsBlockProps {
    data: {
        title?: string
        subtitle?: string
        stats: StatItem[]
        bg?: 'dark' | 'light' | 'brand'
        style?: 'cards' | 'inline'
    }
}

function useCountUp(target: number, duration = 1800, start = false) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        if (!start) return
        let startTime: number | null = null
        const step = (ts: number) => {
            if (!startTime) startTime = ts
            const progress = Math.min((ts - startTime) / duration, 1)
            setCount(Math.floor(progress * target))
            if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
    }, [target, duration, start])
    return count
}

function StatCard({ item, animate }: { item: StatItem; animate: boolean }) {
    const rawNum = parseInt(item.value.replace(/[^0-9]/g, ''), 10) || 0
    const suffix = item.value.replace(/[0-9,]/g, '')
    const count = useCountUp(rawNum, 1800, animate)
    return (
        <div className="flex flex-col items-center justify-center py-8 px-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-all group">
            {item.icon && <span className="text-4xl mb-3">{item.icon}</span>}
            <div className="text-4xl md:text-5xl font-black text-[#f5bb00] mb-2 tabular-nums">
                {animate ? count.toLocaleString() : rawNum.toLocaleString()}{suffix}
            </div>
            <p className="text-white/80 font-semibold text-sm text-center uppercase tracking-widest">{item.label}</p>
        </div>
    )
}

export default function StatsBlock({ data }: StatsBlockProps) {
    const { title, subtitle, stats = [], bg = 'brand' } = data
    const ref = useRef<HTMLDivElement>(null)
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setAnimate(true) },
            { threshold: 0.3 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    const bgClass = bg === 'dark'
        ? 'bg-gray-900'
        : bg === 'light'
        ? 'bg-gray-50'
        : 'bg-gradient-to-br from-[#140152] to-[#220274]'

    const textClass = (bg === 'light') ? 'text-[#140152]' : 'text-white'

    return (
        <section ref={ref} className={`py-20 ${bgClass}`}>
            <div className="max-w-6xl mx-auto px-4">
                {(title || subtitle) && (
                    <div className="text-center mb-14">
                        {subtitle && (
                            <p className="text-[#f5bb00] font-bold uppercase tracking-[0.25em] text-xs mb-3">{subtitle}</p>
                        )}
                        {title && (
                            <h2 className={`text-3xl md:text-4xl font-black ${textClass}`}
                                dangerouslySetInnerHTML={{ __html: title }} />
                        )}
                        <div className="w-16 h-1 bg-[#f5bb00] mx-auto rounded-full mt-4" />
                    </div>
                )}
                <div className={`grid grid-cols-2 md:grid-cols-${Math.min(stats.length, 4)} gap-4`}>
                    {stats.map((s, i) => (
                        <StatCard key={i} item={s} animate={animate} />
                    ))}
                </div>
            </div>
        </section>
    )
}

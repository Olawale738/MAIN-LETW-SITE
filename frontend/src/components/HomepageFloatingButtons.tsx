'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Download, ArrowUpRight, X } from 'lucide-react'

/**
 * Cinematic floating CTA pair that ROAMS the homepage.
 *
 * - Cycles through several positions (corners → mid-sides → bottom-center)
 *   every ~22 seconds with smooth eased transitions.
 * - Auto-disappears after 2 minutes (120s) total dwell, or sooner if user
 *   clicks Hide.
 * - Mounts only on the homepage.
 * - Blue gradient (sapphire → azure → cyan) with breathing glow, film-grain,
 *   gentle up/down drift, and a light-sweep on hover.
 */

const POSITIONS = [
    { x: 'right',  y: 'bottom', label: 'br' },
    { x: 'right',  y: 'middle', label: 'mr' },
    { x: 'center', y: 'bottom', label: 'bc' },
    { x: 'left',   y: 'middle', label: 'ml' },
    { x: 'left',   y: 'bottom', label: 'bl' },
    { x: 'right',  y: 'top',    label: 'tr' },
] as const

const POSITION_MS = 22_000
const TOTAL_MS = 120_000          // 2 minutes then disappear

function positionToStyle(p: typeof POSITIONS[number]): React.CSSProperties {
    const style: React.CSSProperties = {}
    // Horizontal
    if (p.x === 'right')       { style.right = '1.5rem' }
    else if (p.x === 'left')   { style.left  = '1.5rem' }
    else                       { style.left  = '50%'; style.transform = 'translateX(-50%)' }
    // Vertical
    if (p.y === 'bottom')      { style.bottom = '2rem' }
    else if (p.y === 'top')    { style.top    = '6rem'   }   // below the navbar
    else                       { style.top    = '50%'; style.transform = (style.transform || '') + ' translateY(-50%)' }
    return style
}

export default function HomepageFloatingButtons() {
    const [mounted, setMounted] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [idx, setIdx] = useState(0)
    const [done, setDone] = useState(false)

    useEffect(() => {
        try { if (sessionStorage.getItem('home-floats-dismissed') === '1') setDismissed(true) } catch { /* noop */ }
        const enter = setTimeout(() => setMounted(true), 500)
        return () => clearTimeout(enter)
    }, [])

    // Cycle through positions
    useEffect(() => {
        if (dismissed || done) return
        const id = setInterval(() => setIdx(i => (i + 1) % POSITIONS.length), POSITION_MS)
        return () => clearInterval(id)
    }, [dismissed, done])

    // Total dwell timer — disappear after 2 minutes
    useEffect(() => {
        if (dismissed || done) return
        const t = setTimeout(() => setDone(true), TOTAL_MS)
        return () => clearTimeout(t)
    }, [dismissed, done])

    const dismiss = () => {
        setDismissed(true)
        try { sessionStorage.setItem('home-floats-dismissed', '1') } catch { /* noop */ }
    }

    if (dismissed || done) return null

    const pos = POSITIONS[idx]
    const style = positionToStyle(pos)

    return (
        <div
            aria-label="Homepage quick links"
            style={style}
            className={`fixed z-40 flex flex-col items-stretch gap-3 transition-all duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

            <FloatPill href="/onboarding" icon={<Sparkles className="w-4 h-4" />} eyebrow="New here?" title="Start here" delay={0} />
            <FloatPill href="/download"   icon={<Download className="w-4 h-4" />} eyebrow="Free resources" title="Sermons · E-books · Music" delay={150} />

            <button onClick={dismiss} aria-label="Hide quick links"
                className="self-end text-[10px] uppercase tracking-[0.25em] font-bold text-white/60 hover:text-white bg-black/30 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 transition-colors">
                <X className="w-3 h-3" /> Hide
            </button>
        </div>
    )
}

function FloatPill({ href, icon, eyebrow, title, delay }: {
    href: string; icon: React.ReactNode; eyebrow: string; title: string; delay: number;
}) {
    return (
        <Link href={href}
            className="group relative block"
            style={{ animation: `floatDrift 6s ease-in-out infinite ${delay}ms` }}>

            {/* Outer breathing glow */}
            <span aria-hidden className="absolute inset-0 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity"
                style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.6), rgba(37,99,235,0.4) 50%, transparent 80%)' }} />

            {/* Inner pill */}
            <span className="relative inline-flex items-center gap-3 pl-4 pr-5 py-3 rounded-full text-white shadow-2xl shadow-blue-900/40 border border-white/15 backdrop-blur-md overflow-hidden"
                style={{ background: 'linear-gradient(110deg, #1e3a8a 0%, #1d4ed8 35%, #0ea5e9 100%)' }}>

                {/* Film-grain overlay */}
                <span aria-hidden className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

                {/* Light sweep on hover */}
                <span aria-hidden className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[600%] transition-transform duration-[1100ms] ease-out" />

                <span className="relative inline-flex w-9 h-9 rounded-full bg-white/15 border border-white/25 items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    {icon}
                </span>

                <span className="relative leading-tight">
                    <span className="block text-[9px] uppercase tracking-[0.35em] font-bold text-cyan-200/80">{eyebrow}</span>
                    <span className="block text-sm font-black">{title}</span>
                </span>

                <ArrowUpRight className="relative w-4 h-4 ml-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </span>

            <style jsx>{`
                @keyframes floatDrift {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50%      { transform: translateY(-8px) rotate(-0.3deg); }
                }
            `}</style>
        </Link>
    )
}

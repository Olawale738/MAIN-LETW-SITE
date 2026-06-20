'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

interface FeatureItem { title: string; description: string; icon?: string }
interface Props { title?: string; subtitle?: string; features: FeatureItem[] }

const ROTATE_MS = 9000

function Glyph({ name, className }: { name?: string; className?: string }) {
    const Lib = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
    const Icon = name && Lib[name] ? Lib[name] : LucideIcons.Sparkles
    return <Icon className={className} />
}

/**
 * Editorial Statement of Faith.
 *
 * Magazine-style asymmetric layout — oversized article number on the left,
 * elegant content on the right, refined nav between articles. Designed to
 * feel calm, dignified, and intentional rather than flashy.
 */
export default function FaithCinemaBlock({ title, subtitle, features }: Props) {
    const items = useMemo(() => features.filter(f => f.title && f.description), [features])
    const [active, setActive] = useState(0)
    const [playing, setPlaying] = useState(true)
    const [hovered, setHovered] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (!playing || hovered || items.length < 2) return
        timerRef.current = setInterval(() => setActive(a => (a + 1) % items.length), ROTATE_MS)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [playing, hovered, items.length])

    if (items.length === 0) return null
    const cur = items[active]
    const next = () => setActive(a => (a + 1) % items.length)
    const prev = () => setActive(a => (a - 1 + items.length) % items.length)

    return (
        <section className="relative bg-[#fbf5e6] py-20 md:py-28 overflow-hidden">
            {/* Subtle warm wash + hairline frames */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#140152]/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#140152]/15 to-transparent" />
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#f5bb00]/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#140152]/[0.04] blur-3xl" />
            </div>

            <div className="relative max-w-6xl mx-auto px-6">
                {/* Editorial header */}
                <div className="mb-16 md:mb-20 flex items-end justify-between flex-wrap gap-6">
                    <div>
                        <p className="text-[#f5bb00] font-bold tracking-[0.4em] text-[10px] uppercase mb-3">
                            {subtitle || 'Statement of Faith'}
                        </p>
                        <h2 className="text-[#140152] text-4xl md:text-6xl font-black leading-[0.95] tracking-tight">
                            {title || 'What We Believe'}
                        </h2>
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-[#140152]/40 text-xs font-mono uppercase tracking-[0.3em]">
                        <span>Vol. 01</span>
                        <span className="w-8 h-px bg-[#140152]/20" />
                        <span>{items.length} Articles</span>
                    </div>
                </div>

                <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                    className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">

                    {/* LEFT — oversized article number + icon */}
                    <div className="md:col-span-5 md:sticky md:top-24">
                        <div key={active} className="relative animate-[editorialIn_700ms_cubic-bezier(.16,1,.3,1)_both]">
                            <div className="relative inline-block">
                                {/* The big numeral */}
                                <div className="font-black text-[#140152] leading-none tracking-tighter"
                                    style={{ fontSize: 'clamp(8rem, 18vw, 14rem)' }}>
                                    {String(active + 1).padStart(2, '0')}
                                </div>
                                {/* Hairline gold underline */}
                                <div className="absolute -bottom-2 left-0 w-20 h-[3px] bg-[#f5bb00]" />
                            </div>
                            {/* Small inline meta */}
                            <div className="mt-6 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#140152] text-[#f5bb00] flex items-center justify-center">
                                    <Glyph name={cur.icon} className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.35em] text-[#140152]/40 font-bold">Article {active + 1}</p>
                                    <p className="text-[11px] uppercase tracking-[0.25em] text-[#140152]/60 font-bold mt-0.5">of {items.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — title + body + controls */}
                    <div className="md:col-span-7">
                        <div key={`r-${active}`} className="animate-[editorialIn_750ms_cubic-bezier(.16,1,.3,1)_75ms_both]">
                            <h3 className="text-[#140152] text-3xl md:text-5xl font-black leading-[1.05] tracking-tight mb-6">
                                {cur.title}
                            </h3>
                            <div className="relative">
                                <span className="absolute -left-2 -top-6 text-[#f5bb00]/50 text-7xl font-black leading-none select-none" aria-hidden>"</span>
                                <p className="relative text-[#140152]/75 text-lg md:text-xl leading-[1.7] font-medium max-w-[60ch]">
                                    {cur.description}
                                </p>
                            </div>
                        </div>

                        {/* Controls row */}
                        <div className="mt-12 flex items-center justify-between flex-wrap gap-4 border-t border-[#140152]/10 pt-6">
                            <div className="flex items-center gap-3">
                                <button onClick={prev} aria-label="Previous article"
                                    className="w-11 h-11 rounded-full border-2 border-[#140152]/15 text-[#140152] hover:border-[#140152] hover:bg-[#140152] hover:text-white transition-all flex items-center justify-center">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={next} aria-label="Next article"
                                    className="w-11 h-11 rounded-full bg-[#140152] text-white hover:bg-[#1d0175] transition-all flex items-center justify-center shadow-md shadow-[#140152]/20">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button onClick={() => setPlaying(p => !p)}
                                    className="ml-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-[#140152]/50 hover:text-[#140152] transition-colors">
                                    {playing ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
                                </button>
                            </div>

                            {/* Dot indicators */}
                            <div className="flex items-center gap-1.5">
                                {items.map((_, i) => (
                                    <button key={i} onClick={() => setActive(i)} aria-label={`Article ${i + 1}`}
                                        className={`h-[3px] rounded-full transition-all ${i === active ? 'w-10 bg-[#140152]' : 'w-3 bg-[#140152]/20 hover:bg-[#140152]/40'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table of contents — clean editorial list */}
                <div className="mt-20 pt-10 border-t border-[#140152]/10">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#140152]/40 font-bold mb-6">Contents</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                        {items.map((a, i) => (
                            <button key={i} onClick={() => setActive(i)}
                                className={`group text-left flex items-baseline gap-3 py-2 border-t border-[#140152]/10 transition-colors ${i === active ? 'text-[#140152]' : 'text-[#140152]/55 hover:text-[#140152]'}`}>
                                <span className={`text-[11px] font-mono tracking-widest tabular-nums ${i === active ? 'text-[#f5bb00] font-black' : ''}`}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className={`flex-1 truncate text-[15px] font-bold tracking-tight ${i === active ? '' : 'group-hover:translate-x-0.5 transition-transform'}`}>{a.title}</span>
                                <span className={`text-[#f5bb00] transition-opacity ${i === active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}>—</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes editorialIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </section>
    )
}

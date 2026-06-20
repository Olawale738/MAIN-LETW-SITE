'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles, Film } from 'lucide-react'

interface FeatureItem { title: string; description: string; icon?: string }
interface Props { title?: string; subtitle?: string; features: FeatureItem[] }

const ROTATE_MS = 9000

// Per-slide gradient palette — each article gets a distinct cinematic mood
const SCENES: Array<{ a: string; b: string; c: string }> = [
    { a: '#1a0c66', b: '#2d1a8a', c: '#0a0428' },   // royal violet dawn
    { a: '#5b1d8c', b: '#a02080', c: '#1a0228' },   // amethyst
    { a: '#0e3a6b', b: '#1b6aa5', c: '#03142a' },   // sapphire
    { a: '#7a3a0a', b: '#c47512', c: '#1a0a02' },   // amber gold
    { a: '#4b0e5e', b: '#9421a0', c: '#170026' },   // wine
    { a: '#0c4f4d', b: '#13877e', c: '#021a1d' },   // emerald deep
    { a: '#6b1239', b: '#b73067', c: '#1e0612' },   // rose nebula
    { a: '#0f2255', b: '#2b4eb6', c: '#02071e' },   // cobalt
    { a: '#3a1c00', b: '#7a3a0a', c: '#0e0500' },   // sepia
]

function Glyph({ name, className }: { name?: string; className?: string }) {
    const Lib = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
    const Icon = name && Lib[name] ? Lib[name] : LucideIcons.Sparkles
    return <Icon className={className} />
}

export default function FaithCinemaBlock({ title, subtitle, features }: Props) {
    const items = useMemo(() => features.filter(f => f.title && f.description), [features])
    const [active, setActive] = useState(0)
    const [playing, setPlaying] = useState(true)
    const [hovered, setHovered] = useState(false)
    const [mouse, setMouse] = useState({ x: 50, y: 50 })
    const stageRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (!playing || hovered || items.length < 2) return
        timerRef.current = setInterval(() => setActive(a => (a + 1) % items.length), ROTATE_MS)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [playing, hovered, items.length])

    if (items.length === 0) return null
    const cur = items[active]
    const scene = SCENES[active % SCENES.length]
    const nextItem = items[(active + 1) % items.length]
    const prevItem = items[(active - 1 + items.length) % items.length]
    const goNext = () => setActive(a => (a + 1) % items.length)
    const goPrev = () => setActive(a => (a - 1 + items.length) % items.length)

    const onMove = (e: React.MouseEvent) => {
        const r = stageRef.current?.getBoundingClientRect()
        if (!r) return
        setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
    }

    // Split title into words so each can animate in
    const titleWords = cur.title.split(' ')

    return (
        <section ref={stageRef}
            onMouseMove={onMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative overflow-hidden bg-black"
            style={{ minHeight: '92vh' }}
            aria-label={title || 'Statement of Faith'}>

            {/* SCENE — per-slide gradient backdrop with slow Ken Burns zoom */}
            <div key={`scene-${active}`} className="absolute inset-0 pointer-events-none animate-[kenBurns_18s_ease-in-out_infinite_alternate]"
                style={{ background: `radial-gradient(120% 100% at 30% 30%, ${scene.a} 0%, ${scene.b} 35%, ${scene.c} 75%, #000 100%)` }} />

            {/* Light leak streaks — animate on slide change */}
            <div key={`leak-${active}`} className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[60%] h-full opacity-50 animate-[leak1_2.5s_ease-out_both]"
                    style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(245,187,0,0.18) 50%, transparent 70%)' }} />
                <div className="absolute top-0 right-0 w-[60%] h-full opacity-40 animate-[leak2_3s_ease-out_both]"
                    style={{ background: 'linear-gradient(-115deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%)' }} />
            </div>

            {/* Mouse-tracked glow */}
            <div className="absolute inset-0 pointer-events-none transition-[background] duration-700"
                style={{ background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(255,255,255,0.10), transparent 40%)` }} />

            {/* Sacred geometry — orbital rings, very subtle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.12]">
                <div className="relative w-[140vmin] h-[140vmin]">
                    <div className="absolute inset-0 rounded-full border border-white/50 animate-[spin_90s_linear_infinite]" />
                    <div className="absolute inset-[12%] rounded-full border border-white/40 animate-[spin_60s_linear_infinite_reverse]" />
                    <div className="absolute inset-[26%] rounded-full border border-[#f5bb00]/60 animate-[spin_120s_linear_infinite]" />
                    <div className="absolute inset-[42%] rounded-full border border-white/40 animate-[spin_45s_linear_infinite_reverse]" />
                </div>
            </div>

            {/* Drifting gold specks */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
                {Array.from({ length: 14 }).map((_, i) => (
                    <span key={i}
                        className="absolute block rounded-full bg-[#f5bb00] animate-[drift_linear_infinite]"
                        style={{
                            left: `${(i * 137) % 100}%`,
                            top: `${(i * 73) % 100}%`,
                            width: `${(i % 3) + 1}px`,
                            height: `${(i % 3) + 1}px`,
                            boxShadow: '0 0 8px rgba(245,187,0,0.7)',
                            animationDuration: `${14 + (i % 6) * 3}s`,
                            animationDelay: `${(i * 0.5).toFixed(2)}s`,
                            opacity: 0.6,
                        }} />
                ))}
            </div>

            {/* Letterbox bars — cinematic aspect ratio framing */}
            <div className="absolute top-0 left-0 right-0 h-12 md:h-16 bg-black z-30 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 bg-black z-30 pointer-events-none" />

            {/* Film grain overlay */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay z-20"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none z-20"
                style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />

            {/* — TOP STRIP — "Now Presenting" + meta — */}
            <div className="absolute top-12 md:top-16 left-0 right-0 z-40 px-6 md:px-12 py-5 md:py-7 flex items-center justify-between text-white/70">
                <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.5em] font-bold">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5bb00] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f5bb00]" />
                    </span>
                    Now Presenting
                </div>
                <div className="hidden md:inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-mono">
                    <Film className="w-3.5 h-3.5" />
                    {subtitle || 'Statement of Faith'}
                </div>
                <div className="text-[10px] uppercase tracking-[0.4em] font-mono text-white/50 tabular-nums">
                    {String(active + 1).padStart(2, '0')} <span className="opacity-50">/ {String(items.length).padStart(2, '0')}</span>
                </div>
            </div>

            {/* — CENTRAL CONTENT STAGE — */}
            <div className="relative z-10 min-h-[92vh] flex flex-col items-center justify-center px-6 md:px-12 py-32 md:py-36">
                <div className="w-full max-w-5xl mx-auto text-center">
                    {/* Eyebrow series + icon */}
                    <div key={`eb-${active}`} className="inline-flex items-center gap-3 mb-8 md:mb-10 animate-[fadeUp_700ms_cubic-bezier(.16,1,.3,1)_both]">
                        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-[#f5bb00]/20 blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                            <Glyph name={cur.icon} className="relative w-6 h-6 md:w-7 md:h-7 text-[#f5bb00]" />
                        </div>
                        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-[#f5bb00] font-black">
                            Article {String(active + 1).padStart(2, '0')}
                        </p>
                    </div>

                    {/* TITLE — word-by-word reveal */}
                    <h2 className="font-black text-white leading-[0.95] tracking-tight mb-8 md:mb-10"
                        style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}>
                        {titleWords.map((w, i) => (
                            <span key={`${active}-${i}`}
                                className="inline-block mr-[0.25em] animate-[wordIn_900ms_cubic-bezier(.16,1,.3,1)_both]"
                                style={{ animationDelay: `${150 + i * 110}ms` }}>
                                <span className="bg-gradient-to-b from-white via-white to-[#f5bb00]/80 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,187,0,0.25)]">{w}</span>
                            </span>
                        ))}
                    </h2>

                    {/* Body */}
                    <p key={`body-${active}`}
                        className="text-white/80 text-lg md:text-2xl leading-[1.6] max-w-3xl mx-auto font-medium animate-[fadeUp_900ms_cubic-bezier(.16,1,.3,1)_500ms_both]">
                        {cur.description}
                    </p>

                    {/* Decorative wedge */}
                    <div className="mt-12 md:mt-14 mx-auto h-px w-28 bg-gradient-to-r from-transparent via-[#f5bb00] to-transparent animate-[fadeUp_900ms_cubic-bezier(.16,1,.3,1)_700ms_both]" />
                </div>
            </div>

            {/* — BOTTOM STRIP — prev/next preview + controls — */}
            <div className="absolute bottom-12 md:bottom-16 left-0 right-0 z-40 px-6 md:px-12 py-5 md:py-7">
                <div className="grid grid-cols-3 items-center gap-4">
                    {/* PREV preview */}
                    <button onClick={goPrev} className="group text-left hidden md:block min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-bold mb-1">Previous</p>
                        <p className="text-sm font-black text-white/70 group-hover:text-white transition-colors truncate inline-flex items-center gap-2">
                            <ChevronLeft className="w-3.5 h-3.5" /> {prevItem.title}
                        </p>
                    </button>

                    {/* Center controls */}
                    <div className="col-span-3 md:col-span-1 flex items-center justify-center gap-3">
                        <button onClick={goPrev} aria-label="Previous"
                            className="md:hidden w-10 h-10 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all flex items-center justify-center">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5">
                            {items.map((_, i) => (
                                <button key={i} onClick={() => setActive(i)} aria-label={`Article ${i + 1}`}
                                    className={`h-[3px] rounded-full transition-all ${i === active ? 'w-10 bg-[#f5bb00]' : 'w-2 bg-white/25 hover:bg-white/50'}`} />
                            ))}
                        </div>
                        <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}
                            className="ml-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.35em] font-bold text-white/50 hover:text-white transition-colors">
                            {playing ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
                        </button>
                        <button onClick={goNext} aria-label="Next"
                            className="md:hidden w-10 h-10 rounded-full bg-[#f5bb00] text-black hover:scale-105 transition-transform flex items-center justify-center">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* NEXT preview */}
                    <button onClick={goNext} className="group text-right hidden md:block min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-bold mb-1">Next</p>
                        <p className="text-sm font-black text-white/70 group-hover:text-white transition-colors truncate inline-flex items-center gap-2 justify-end">
                            {nextItem.title} <ChevronRight className="w-3.5 h-3.5" />
                        </p>
                    </button>
                </div>
            </div>

            {/* Side scrubber arrows on desktop (premium feel) */}
            <button onClick={goPrev} aria-label="Previous article"
                className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border border-white/15 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/40 backdrop-blur-md transition-all items-center justify-center">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goNext} aria-label="Next article"
                className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border border-[#f5bb00]/40 bg-[#f5bb00]/10 text-[#f5bb00] hover:bg-[#f5bb00] hover:text-black backdrop-blur-md transition-all items-center justify-center shadow-[0_0_40px_rgba(245,187,0,0.3)]">
                <ChevronRight className="w-5 h-5" />
            </button>

            <style jsx>{`
                @keyframes kenBurns {
                    0%   { transform: scale(1) translate(0,0); }
                    100% { transform: scale(1.12) translate(-2%, -1%); }
                }
                @keyframes leak1 {
                    0%   { transform: translateX(-100%); opacity: 0; }
                    35%  { opacity: 0.5; }
                    100% { transform: translateX(50%); opacity: 0; }
                }
                @keyframes leak2 {
                    0%   { transform: translateX(100%); opacity: 0; }
                    40%  { opacity: 0.4; }
                    100% { transform: translateX(-50%); opacity: 0; }
                }
                @keyframes wordIn {
                    0%   { opacity: 0; transform: translateY(28px) scale(.96); filter: blur(8px); }
                    60%  { opacity: 1; }
                    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes drift {
                    from { transform: translateY(0) translateX(0); }
                    to   { transform: translateY(-220px) translateX(40px); }
                }
            `}</style>
        </section>
    )
}

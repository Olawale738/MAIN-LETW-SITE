'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { ChevronLeft, ChevronRight, Pause, Play, Film } from 'lucide-react'

interface FeatureItem { title: string; description: string; icon?: string }
interface Props { title?: string; subtitle?: string; features: FeatureItem[] }

const ROTATE_MS = 9000

// All scenes live in the LETW milk/cream family — only the gradient focal
// point shifts per article. No color riot.
const SCENES: Array<{ a: string; b: string; c: string; pos: string }> = [
    { a: '#fffaf0', b: '#fbf5e6', c: '#f0e6cb', pos: '30% 30%' },
    { a: '#fffbf2', b: '#faf4e3', c: '#efe5c8', pos: '70% 35%' },
    { a: '#fffaef', b: '#fbf5e6', c: '#f1e7cc', pos: '50% 50%' },
    { a: '#fffbf3', b: '#faf3e1', c: '#eee3c4', pos: '40% 65%' },
    { a: '#fffaf0', b: '#fbf4e3', c: '#f0e5c8', pos: '65% 60%' },
    { a: '#fefaef', b: '#f9f3e1', c: '#eee3c4', pos: '35% 40%' },
    { a: '#fffbf2', b: '#fbf5e5', c: '#f1e7cc', pos: '60% 30%' },
    { a: '#fffaef', b: '#faf4e2', c: '#efe5c6', pos: '50% 75%' },
    { a: '#fffbf3', b: '#fbf5e6', c: '#f0e6c9', pos: '45% 25%' },
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

    const titleWords = cur.title.split(' ')

    return (
        <section ref={stageRef}
            onMouseMove={onMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative overflow-hidden bg-[#fbf5e6]"
            style={{ minHeight: '92vh' }}
            aria-label={title || 'Statement of Faith'}>

            {/* SCENE — milk/cream radial, focal point shifts per slide */}
            <div key={`scene-${active}`} className="absolute inset-0 pointer-events-none transition-[background] duration-[1400ms] ease-out animate-[kenBurns_22s_ease-in-out_infinite_alternate]"
                style={{ background: `radial-gradient(130% 110% at ${scene.pos}, ${scene.a} 0%, ${scene.b} 42%, ${scene.c} 88%, #ead8a5 100%)` }} />

            {/* Soft warm gold glow — barely there */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(60% 50% at 50% 30%, rgba(245,187,0,0.07), transparent 70%)' }} />

            {/* Light leak — single warm streak */}
            <div key={`leak-${active}`} className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[60%] h-full opacity-50 animate-[leak1_2.8s_ease-out_both]"
                    style={{ background: 'linear-gradient(115deg, transparent 35%, rgba(245,187,0,0.16) 50%, transparent 65%)' }} />
            </div>

            {/* Mouse-tracked warm halo */}
            <div className="absolute inset-0 pointer-events-none transition-[background] duration-700"
                style={{ background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(245,187,0,0.10), transparent 40%)` }} />

            {/* Sacred geometry — navy on cream, very subtle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.08]">
                <div className="relative w-[140vmin] h-[140vmin]">
                    <div className="absolute inset-0 rounded-full border border-[#140152]/40 animate-[spin_90s_linear_infinite]" />
                    <div className="absolute inset-[12%] rounded-full border border-[#140152]/30 animate-[spin_60s_linear_infinite_reverse]" />
                    <div className="absolute inset-[26%] rounded-full border border-[#f5bb00]/50 animate-[spin_120s_linear_infinite]" />
                    <div className="absolute inset-[42%] rounded-full border border-[#140152]/30 animate-[spin_45s_linear_infinite_reverse]" />
                </div>
            </div>

            {/* Drifting gold specks */}
            <div className="absolute inset-0 pointer-events-none opacity-70">
                {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i}
                        className="absolute block rounded-full bg-[#f5bb00] animate-[drift_linear_infinite]"
                        style={{
                            left: `${(i * 137) % 100}%`,
                            top: `${(i * 73) % 100}%`,
                            width: `${(i % 3) + 1}px`,
                            height: `${(i % 3) + 1}px`,
                            boxShadow: '0 0 8px rgba(245,187,0,0.5)',
                            animationDuration: `${14 + (i % 6) * 3}s`,
                            animationDelay: `${(i * 0.5).toFixed(2)}s`,
                            opacity: 0.55,
                        }} />
                ))}
            </div>

            {/* Letterbox bars — deep navy reads as "film bars" on the cream backdrop */}
            <div className="absolute top-0 left-0 right-0 h-12 md:h-16 bg-[#140152] z-30 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 bg-[#140152] z-30 pointer-events-none" />

            {/* Subtle grain on the cream */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply z-20"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

            {/* Warm vignette — burnt cream edges, not black */}
            <div className="absolute inset-0 pointer-events-none z-20"
                style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(140,100,30,0.18) 100%)' }} />

            {/* — TOP STRIP — sits inside the navy letterbox bar — */}
            <div className="absolute top-0 left-0 right-0 z-40 h-12 md:h-16 px-6 md:px-12 flex items-center justify-between text-white/80">
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
                <div className="text-[10px] uppercase tracking-[0.4em] font-mono text-white/60 tabular-nums">
                    {String(active + 1).padStart(2, '0')} <span className="opacity-50">/ {String(items.length).padStart(2, '0')}</span>
                </div>
            </div>

            {/* — CENTRAL CONTENT STAGE — */}
            <div className="relative z-10 min-h-[92vh] flex flex-col items-center justify-center px-6 md:px-12 py-32 md:py-36">
                <div className="w-full max-w-5xl mx-auto text-center">
                    {/* Eyebrow icon + article tag */}
                    <div key={`eb-${active}`} className="inline-flex items-center gap-3 mb-8 md:mb-10 animate-[fadeUp_700ms_cubic-bezier(.16,1,.3,1)_both]">
                        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/70 backdrop-blur-md border border-[#140152]/15 flex items-center justify-center shadow-lg shadow-[#140152]/5">
                            <div className="absolute inset-0 rounded-full bg-[#f5bb00]/25 blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                            <Glyph name={cur.icon} className="relative w-6 h-6 md:w-7 md:h-7 text-[#140152]" />
                        </div>
                        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-[#140152]/70 font-black">
                            <span className="text-[#f5bb00]">●</span> Article {String(active + 1).padStart(2, '0')}
                        </p>
                    </div>

                    {/* TITLE — word-by-word reveal in deep navy */}
                    <h2 className="font-black leading-[0.95] tracking-tight mb-8 md:mb-10"
                        style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}>
                        {titleWords.map((w, i) => (
                            <span key={`${active}-${i}`}
                                className="inline-block mr-[0.25em] animate-[wordIn_900ms_cubic-bezier(.16,1,.3,1)_both]"
                                style={{ animationDelay: `${150 + i * 110}ms` }}>
                                <span className="bg-gradient-to-b from-[#140152] via-[#140152] to-[#5a4310] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,187,0,0.15)]">{w}</span>
                            </span>
                        ))}
                    </h2>

                    {/* Body */}
                    <p key={`body-${active}`}
                        className="text-[#140152]/75 text-lg md:text-2xl leading-[1.6] max-w-3xl mx-auto font-medium animate-[fadeUp_900ms_cubic-bezier(.16,1,.3,1)_500ms_both]">
                        {cur.description}
                    </p>

                    {/* Decorative wedge */}
                    <div className="mt-12 md:mt-14 mx-auto h-px w-28 bg-gradient-to-r from-transparent via-[#f5bb00] to-transparent animate-[fadeUp_900ms_cubic-bezier(.16,1,.3,1)_700ms_both]" />
                </div>
            </div>

            {/* — BOTTOM STRIP — inside navy letterbox — */}
            <div className="absolute bottom-0 left-0 right-0 z-40 h-12 md:h-16 px-6 md:px-12">
                <div className="grid grid-cols-3 items-center gap-4 h-full">
                    {/* PREV preview */}
                    <button onClick={goPrev} className="group text-left hidden md:block min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-bold mb-0.5">Previous</p>
                        <p className="text-sm font-black text-white/80 group-hover:text-white transition-colors truncate inline-flex items-center gap-2">
                            <ChevronLeft className="w-3.5 h-3.5" /> {prevItem.title}
                        </p>
                    </button>

                    {/* Center controls */}
                    <div className="col-span-3 md:col-span-1 flex items-center justify-center gap-3 h-full">
                        <button onClick={goPrev} aria-label="Previous"
                            className="md:hidden w-9 h-9 rounded-full border border-white/30 text-white hover:bg-white hover:text-[#140152] transition-all flex items-center justify-center">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5">
                            {items.map((_, i) => (
                                <button key={i} onClick={() => setActive(i)} aria-label={`Article ${i + 1}`}
                                    className={`h-[3px] rounded-full transition-all ${i === active ? 'w-10 bg-[#f5bb00]' : 'w-2 bg-white/30 hover:bg-white/60'}`} />
                            ))}
                        </div>
                        <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}
                            className="ml-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.35em] font-bold text-white/60 hover:text-white transition-colors">
                            {playing ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
                        </button>
                        <button onClick={goNext} aria-label="Next"
                            className="md:hidden w-9 h-9 rounded-full bg-[#f5bb00] text-[#140152] hover:scale-105 transition-transform flex items-center justify-center">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* NEXT preview */}
                    <button onClick={goNext} className="group text-right hidden md:block min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-bold mb-0.5">Next</p>
                        <p className="text-sm font-black text-white/80 group-hover:text-white transition-colors truncate inline-flex items-center gap-2 justify-end">
                            {nextItem.title} <ChevronRight className="w-3.5 h-3.5" />
                        </p>
                    </button>
                </div>
            </div>

            {/* Side scrubber arrows on desktop */}
            <button onClick={goPrev} aria-label="Previous article"
                className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border border-[#140152]/15 bg-white/40 text-[#140152]/70 hover:text-[#140152] hover:bg-white hover:border-[#140152]/40 backdrop-blur-md transition-all items-center justify-center shadow-md shadow-[#140152]/5">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goNext} aria-label="Next article"
                className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full border border-[#f5bb00] bg-[#f5bb00] text-[#140152] hover:bg-amber-400 backdrop-blur-md transition-all items-center justify-center shadow-[0_0_40px_rgba(245,187,0,0.45)]">
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

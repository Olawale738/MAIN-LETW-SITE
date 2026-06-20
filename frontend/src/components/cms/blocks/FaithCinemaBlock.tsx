'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { Sparkles, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

interface FeatureItem { title: string; description: string; icon?: string }
interface Props { title?: string; subtitle?: string; features: FeatureItem[] }

const ROTATE_MS = 7000

function Glyph({ name, className }: { name?: string; className?: string }) {
    const Lib = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
    const Icon = name && Lib[name] ? Lib[name] : LucideIcons.Sparkles
    return <Icon className={className} />
}

export default function FaithCinemaBlock({ title, subtitle, features }: Props) {
    const items = useMemo(() => features.filter(f => f.title && f.description), [features])
    const [active, setActive] = useState(0)
    const [playing, setPlaying] = useState(true)
    const [mouse, setMouse] = useState({ x: 50, y: 50 })
    const stageRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (!playing || items.length < 2) return
        timerRef.current = setInterval(() => setActive(a => (a + 1) % items.length), ROTATE_MS)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [playing, items.length])

    if (items.length === 0) return null
    const cur = items[active]
    const next = () => setActive(a => (a + 1) % items.length)
    const prev = () => setActive(a => (a - 1 + items.length) % items.length)

    const onMove = (e: React.MouseEvent) => {
        const r = stageRef.current?.getBoundingClientRect()
        if (!r) return
        setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
    }

    return (
        <section ref={stageRef} onMouseMove={onMove}
            className="relative overflow-hidden py-24 px-4 bg-[#05001a]"
            aria-label={title || 'Statement of Faith'}>

            {/* Aurora layers — three slow drifting gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-violet-700/40 blur-[140px] animate-[drift1_18s_ease-in-out_infinite]" />
                <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-[#f5bb00]/25 blur-[140px] animate-[drift2_22s_ease-in-out_infinite]" />
                <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-rose-500/25 blur-[140px] animate-[drift3_20s_ease-in-out_infinite]" />
            </div>

            {/* Mouse-tracked spotlight halo */}
            <div className="absolute inset-0 pointer-events-none transition-[background-position] duration-[800ms]"
                style={{ background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(245,187,0,0.18), transparent 40%)` }} />

            {/* Floating dust particles */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
                {Array.from({ length: 24 }).map((_, i) => (
                    <span key={i}
                        className="absolute block w-1 h-1 rounded-full bg-white/40 animate-[floatDust_linear_infinite]"
                        style={{
                            left: `${(i * 137) % 100}%`,
                            top: `${(i * 73) % 100}%`,
                            animationDuration: `${10 + (i % 7) * 2}s`,
                            animationDelay: `${(i * 0.3).toFixed(2)}s`,
                        }} />
                ))}
            </div>

            {/* Subtle grain */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

            <div className="relative max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.45em] text-[10px] uppercase">
                        <Sparkles className="w-3 h-3" /> {subtitle || 'Statement of Faith'}
                    </p>
                    <h2 className="mt-4 text-5xl md:text-7xl font-black tracking-tight leading-none">
                        <span className="bg-gradient-to-r from-white via-[#f5bb00] to-white bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(245,187,0,0.3)]">
                            {title || 'What We Believe'}
                        </span>
                    </h2>
                    <div className="mt-5 mx-auto h-px w-32 bg-gradient-to-r from-transparent via-[#f5bb00] to-transparent" />
                </div>

                <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-stretch">
                    {/* Cinematic stage */}
                    <div className="relative">
                        <div className="relative rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden min-h-[480px] md:min-h-[520px]">
                            {/* Article position */}
                            <div className="absolute top-8 right-10 text-[#f5bb00]/40 font-mono text-xs tracking-[0.4em]">
                                {String(active + 1).padStart(2, '0')} <span className="text-white/25">/ {String(items.length).padStart(2, '0')}</span>
                            </div>

                            {/* Light shaft from icon */}
                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1px] h-[120%] bg-gradient-to-b from-[#f5bb00]/70 via-[#f5bb00]/10 to-transparent blur-[1px] pointer-events-none" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#f5bb00]/20 blur-[80px] rounded-full pointer-events-none" />

                            <div key={active} className="relative p-10 md:p-16 animate-[fadeStage_900ms_cubic-bezier(.16,1,.3,1)_both]">
                                {/* Halo ring around icon */}
                                <div className="relative w-24 h-24 mx-auto mb-8">
                                    <div className="absolute inset-0 rounded-full bg-[#f5bb00]/20 blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                                    <div className="absolute inset-2 rounded-full border border-[#f5bb00]/40 animate-[spin_25s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(245,187,0,0.4), transparent)' }} />
                                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-white/15 to-white/5 border border-white/20 backdrop-blur-md flex items-center justify-center">
                                        <Glyph name={cur.icon} className="w-10 h-10 text-[#f5bb00]" />
                                    </div>
                                </div>

                                <p className="text-center text-white/40 text-[10px] uppercase tracking-[0.45em] mb-3">Article {active + 1}</p>
                                <h3 className="text-center text-4xl md:text-6xl font-black leading-tight mb-6">
                                    <span className="bg-gradient-to-b from-white via-white to-[#f5bb00]/80 bg-clip-text text-transparent">{cur.title}</span>
                                </h3>
                                <p className="text-center text-lg md:text-xl text-white/75 leading-relaxed max-w-3xl mx-auto">{cur.description}</p>
                            </div>

                            {/* Controls */}
                            <div className="relative pb-8 flex items-center justify-center gap-4">
                                <button onClick={prev} aria-label="Previous"
                                    className="w-11 h-11 rounded-full border border-white/15 text-white/80 hover:bg-white hover:text-[#140152] hover:scale-110 transition-all flex items-center justify-center">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}
                                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-bold text-white/60 hover:text-white px-5 py-2 rounded-full border border-white/10 hover:border-white/30 transition-colors">
                                    {playing ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
                                </button>
                                <button onClick={next} aria-label="Next"
                                    className="w-11 h-11 rounded-full bg-gradient-to-br from-[#f5bb00] to-amber-500 text-[#140152] hover:scale-110 transition-transform flex items-center justify-center font-black shadow-lg shadow-[#f5bb00]/40">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Bottom progress */}
                            <div className="absolute left-0 bottom-0 right-0 h-1 bg-white/[0.04]">
                                <div className="h-full bg-gradient-to-r from-[#f5bb00] via-rose-400 to-fuchsia-400 transition-all duration-700" style={{ width: `${((active + 1) / items.length) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Vertical filmstrip (desktop) */}
                    <div className="hidden lg:flex flex-col gap-2 w-[220px] max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                        {items.map((a, i) => (
                            <button key={i} onClick={() => setActive(i)}
                                className={`group text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${i === active ? 'bg-white text-[#140152] border-white shadow-xl shadow-black/30' : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/80'}`}>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${i === active ? 'bg-[#140152] text-[#f5bb00]' : 'bg-white/10 text-[#f5bb00]'}`}>
                                    <Glyph name={a.icon} className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[9px] uppercase tracking-[0.3em] font-mono ${i === active ? 'text-[#140152]/50' : 'text-white/30'}`}>Art {String(i + 1).padStart(2, '0')}</p>
                                    <p className="text-sm font-black truncate">{a.title}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Horizontal filmstrip (mobile) */}
                <div className="lg:hidden mt-6 flex gap-2 overflow-x-auto pb-2">
                    {items.map((a, i) => (
                        <button key={i} onClick={() => setActive(i)}
                            className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all text-left min-w-[160px] ${i === active ? 'bg-white text-[#140152] border-white scale-105' : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70'}`}>
                            <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">Art. {String(i + 1).padStart(2, '0')}</p>
                            <p className="text-sm font-black truncate mt-0.5">{a.title}</p>
                        </button>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeStage {
                    0% { opacity: 0; transform: translateY(40px) scale(.96); filter: blur(14px); }
                    60% { opacity: 1; }
                    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                }
                @keyframes drift1 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50% { transform: translate(80px,40px) scale(1.15); }
                }
                @keyframes drift2 {
                    0%,100% { transform: translate(0,0) scale(1.05); }
                    50% { transform: translate(-100px,60px) scale(0.95); }
                }
                @keyframes drift3 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50% { transform: translate(50px,-80px) scale(1.2); }
                }
                @keyframes floatDust {
                    from { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    to { transform: translateY(-180px) translateX(30px); opacity: 0; }
                }
            `}</style>
        </section>
    )
}

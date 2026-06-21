'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
    ChevronLeft, ChevronRight, Play, Pause, MapPin, Sparkles,
    Music, Heart, BookOpen, Users, Coffee, Cross, Globe2, ArrowRight
} from 'lucide-react'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

/**
 * Cinematic virtual campus walkthrough — SVG-rendered "rooms" with parallax
 * lights, depth gradients, and a guided tour script. Designed for international
 * visitors and prospective members who can't visit in person yet.
 */

interface Stop {
    id: string
    name: string
    blurb: string
    icon: React.ReactNode
    gradient: string
    accents: string[]   // CSS-color halo accents
    paint: (idx: number) => React.ReactNode
}

const STOPS: Stop[] = [
    {
        id: 'entrance',
        name: 'Welcome Plaza',
        blurb: "You're greeted by hosts at the entrance arch. Coffee is on the left, the kids' check-in is to your right.",
        icon: <Sparkles className="w-4 h-4" />,
        gradient: 'from-[#06002a] via-[#140152] to-[#1d0175]',
        accents: ['#f5bb00', '#7c3aed'],
        paint: () => (
            <>
                {/* Arch */}
                <path d="M 200 400 Q 400 80 600 400" stroke="rgba(245,187,0,0.65)" strokeWidth="3" fill="none" />
                <path d="M 230 400 Q 400 130 570 400" stroke="rgba(245,187,0,0.25)" strokeWidth="2" fill="none" />
                {/* Door */}
                <rect x="350" y="240" width="100" height="160" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" />
                {/* Floor lights */}
                {[260, 320, 380, 440, 500].map((x, i) => (
                    <circle key={i} cx={x} cy="395" r="3" fill="#f5bb00" opacity="0.6">
                        <animate attributeName="r" values="2;5;2" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                    </circle>
                ))}
            </>
        ),
    },
    {
        id: 'sanctuary',
        name: 'Main Sanctuary',
        blurb: "The heart of LETW — 2,500 seats around a central stage, soaring ceiling, daylight pouring through the upper windows.",
        icon: <Cross className="w-4 h-4" />,
        gradient: 'from-[#0e0035] via-[#1a0270] to-[#2d0b8e]',
        accents: ['#f5bb00', '#ffffff'],
        paint: () => (
            <>
                {/* Floor perspective */}
                <polygon points="100,400 700,400 600,300 200,300" fill="rgba(245,187,0,0.05)" stroke="rgba(245,187,0,0.2)" strokeWidth="1" />
                {/* Stage */}
                <polygon points="280,300 520,300 500,260 300,260" fill="rgba(245,187,0,0.18)" stroke="rgba(245,187,0,0.6)" />
                {/* Cross */}
                <rect x="395" y="100" width="10" height="120" fill="#f5bb00" opacity="0.9" />
                <rect x="370" y="135" width="60" height="10" fill="#f5bb00" opacity="0.9" />
                {/* Light beams */}
                <path d="M 400 145 L 250 400" stroke="rgba(245,187,0,0.15)" strokeWidth="2" />
                <path d="M 400 145 L 550 400" stroke="rgba(245,187,0,0.15)" strokeWidth="2" />
                {/* Pews */}
                {[330, 350, 370].map(y => (
                    <line key={y} x1="180" y1={y + 20} x2="620" y2={y + 20} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                ))}
            </>
        ),
    },
    {
        id: 'cafe',
        name: 'Fellowship Café',
        blurb: "After service, this room is the loudest place on campus. Free coffee, fresh bread, the family table where conversations begin.",
        icon: <Coffee className="w-4 h-4" />,
        gradient: 'from-[#3a1c00] via-[#7a3a0a] to-[#c47512]',
        accents: ['#ffd763', '#ffffff'],
        paint: () => (
            <>
                {/* Tables */}
                {[[200, 280], [350, 320], [500, 280], [600, 350]].map(([x, y], i) => (
                    <g key={i}>
                        <ellipse cx={x} cy={y} rx="40" ry="14" fill="rgba(255,215,99,0.18)" stroke="rgba(255,215,99,0.5)" strokeWidth="1.5" />
                        {/* Mugs */}
                        <circle cx={x - 10} cy={y - 4} r="4" fill="#ffd763" />
                        <circle cx={x + 12} cy={y - 4} r="4" fill="#ffd763" />
                    </g>
                ))}
                {/* Hanging lights */}
                {[180, 300, 420, 540].map((x, i) => (
                    <g key={i}>
                        <line x1={x} y1="100" x2={x} y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                        <circle cx={x} cy="210" r="10" fill="rgba(255,215,99,0.6)" />
                        <circle cx={x} cy="210" r="20" fill="rgba(255,215,99,0.2)" />
                    </g>
                ))}
            </>
        ),
    },
    {
        id: 'kids',
        name: "Children's Wing",
        blurb: "Safe, secure, joyful. Kids check in with a code that matches a parent's wristband — only that parent can sign them out.",
        icon: <Heart className="w-4 h-4" />,
        gradient: 'from-[#6b1239] via-[#b73067] to-[#f472b6]',
        accents: ['#fde68a', '#ffffff'],
        paint: () => (
            <>
                {/* Slide */}
                <path d="M 200 200 Q 280 250 240 380" stroke="#fde68a" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.6" />
                {/* Blocks */}
                {[420, 460, 500, 540].map((x, i) => (
                    <rect key={i} x={x} y={350 - (i % 2) * 20} width="32" height="40" fill={['#fde68a', '#ffffff', '#fbcfe8', '#fde68a'][i % 4]} opacity="0.85" rx="3" />
                ))}
                {/* Balloons */}
                {[[150, 180], [380, 160], [620, 200]].map(([x, y], i) => (
                    <g key={i}>
                        <circle cx={x} cy={y} r="16" fill={['#fde68a', '#ffffff', '#fbcfe8'][i]} opacity="0.85" />
                        <line x1={x} y1={y + 16} x2={x} y2={y + 60} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                    </g>
                ))}
            </>
        ),
    },
    {
        id: 'prayer',
        name: 'Prayer Room',
        blurb: "Open 24/7. Soft lights, kneeling cushions, a wall where members pin requests. Step in any time, day or night.",
        icon: <Heart className="w-4 h-4" />,
        gradient: 'from-[#1a0a52] via-[#3b0f6e] to-[#5b1d8c]',
        accents: ['#f5bb00', '#a78bfa'],
        paint: () => (
            <>
                {/* Stained-glass cross window */}
                <rect x="330" y="80" width="140" height="180" fill="rgba(167,139,250,0.15)" stroke="rgba(245,187,0,0.4)" strokeWidth="2" rx="6" />
                <rect x="395" y="100" width="10" height="140" fill="#f5bb00" opacity="0.7" />
                <rect x="360" y="155" width="80" height="10" fill="#f5bb00" opacity="0.7" />
                {/* Candle row */}
                {[200, 250, 300, 500, 550, 600].map((x, i) => (
                    <g key={i}>
                        <rect x={x - 4} y="350" width="8" height="30" fill="rgba(255,255,255,0.7)" />
                        <ellipse cx={x} cy="345" rx="3" ry="6" fill="#f5bb00">
                            <animate attributeName="ry" values="6;8;6" dur="1.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                        </ellipse>
                        <ellipse cx={x} cy="345" rx="8" ry="12" fill="#f5bb00" opacity="0.25" />
                    </g>
                ))}
                {/* Kneelers */}
                {[200, 400, 600].map(x => (
                    <ellipse key={x} cx={x} cy="410" rx="60" ry="6" fill="rgba(245,187,0,0.15)" />
                ))}
            </>
        ),
    },
    {
        id: 'study',
        name: 'Bible Study Hall',
        blurb: "Where the Word is unpacked verse by verse, Tuesday at 6pm. Bookshelves line the walls — a real, working library.",
        icon: <BookOpen className="w-4 h-4" />,
        gradient: 'from-[#0c4f4d] via-[#13877e] to-[#22c4b6]',
        accents: ['#f5bb00', '#ffffff'],
        paint: () => (
            <>
                {/* Bookshelves */}
                {[[120, 150], [120, 250], [620, 150], [620, 250]].map(([x, y], i) => (
                    <g key={i}>
                        <rect x={x} y={y} width="60" height="80" fill="rgba(34,196,182,0.15)" stroke="rgba(245,187,0,0.4)" />
                        {[0, 15, 30, 45, 60].map(dy => (
                            <line key={dy} x1={x} y1={y + dy} x2={x + 60} y2={y + dy} stroke="rgba(245,187,0,0.3)" strokeWidth="0.5" />
                        ))}
                    </g>
                ))}
                {/* Tables in a circle */}
                <ellipse cx="400" cy="320" rx="180" ry="40" fill="rgba(245,187,0,0.1)" stroke="rgba(245,187,0,0.4)" strokeWidth="2" />
                {/* Open Bible at center */}
                <path d="M 360 320 Q 400 310 440 320 L 440 340 Q 400 330 360 340 Z" fill="rgba(255,255,255,0.6)" />
                <line x1="400" y1="315" x2="400" y2="340" stroke="rgba(245,187,0,0.6)" strokeWidth="0.8" />
            </>
        ),
    },
    {
        id: 'choir',
        name: 'Worship & Sound',
        blurb: "Alter Sound's home — a high-end stage, in-ear monitors, and a sound booth tucked at the back of the sanctuary.",
        icon: <Music className="w-4 h-4" />,
        gradient: 'from-[#190a55] via-[#3b2096] to-[#7c3aed]',
        accents: ['#f5bb00', '#a5b4fc'],
        paint: () => (
            <>
                {/* Stage lights */}
                {[200, 300, 400, 500, 600].map((x, i) => (
                    <g key={i}>
                        <line x1={x} y1="100" x2={x - 20} y2="280" stroke="rgba(245,187,0,0.25)" strokeWidth="40" strokeLinecap="round" />
                    </g>
                ))}
                {/* Drum kit hint */}
                <ellipse cx="240" cy="340" rx="40" ry="14" fill="rgba(165,180,252,0.4)" />
                <ellipse cx="240" cy="340" rx="25" ry="9" fill="rgba(245,187,0,0.5)" />
                {/* Mic stands */}
                {[400, 460, 340].map((x, i) => (
                    <g key={i}>
                        <line x1={x} y1="400" x2={x} y2="280" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                        <circle cx={x} cy="275" r="4" fill="#f5bb00" />
                    </g>
                ))}
                {/* Speaker stack */}
                <rect x="560" y="270" width="50" height="130" fill="rgba(0,0,0,0.6)" stroke="rgba(245,187,0,0.4)" />
                {[290, 325, 360].map(y => <circle key={y} cx="585" cy={y} r="9" fill="rgba(165,180,252,0.5)" />)}
            </>
        ),
    },
    {
        id: 'outreach',
        name: 'Mission Hub',
        blurb: "Where the gospel goes from here to every nation. Maps of our missions, prayer cards for missionaries, a wall of testimonies from the field.",
        icon: <Globe2 className="w-4 h-4" />,
        gradient: 'from-[#0f2255] via-[#1f3a8a] to-[#3b82f6]',
        accents: ['#f5bb00', '#fde68a'],
        paint: () => (
            <>
                {/* World map abstract */}
                <ellipse cx="400" cy="280" rx="220" ry="100" fill="none" stroke="rgba(245,187,0,0.35)" strokeWidth="1.5" strokeDasharray="3 4" />
                <ellipse cx="400" cy="280" rx="220" ry="55" fill="none" stroke="rgba(245,187,0,0.25)" strokeWidth="1" />
                {/* Mission pins */}
                {[[280, 250], [340, 285], [420, 260], [480, 280], [550, 250], [380, 310], [500, 320]].map(([x, y], i) => (
                    <g key={i}>
                        <circle cx={x} cy={y} r="3" fill="#f5bb00">
                            <animate attributeName="r" values="2;5;2" dur="3s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                        </circle>
                        <circle cx={x} cy={y} r="6" fill="#f5bb00" opacity="0.3" />
                    </g>
                ))}
                {/* Arcs connecting */}
                <path d="M 280 250 Q 320 200 380 310" stroke="rgba(245,187,0,0.4)" strokeWidth="0.8" fill="none" strokeDasharray="2 3" />
                <path d="M 280 250 Q 380 180 480 280" stroke="rgba(245,187,0,0.4)" strokeWidth="0.8" fill="none" strokeDasharray="2 3" />
                <path d="M 280 250 Q 430 190 550 250" stroke="rgba(245,187,0,0.4)" strokeWidth="0.8" fill="none" strokeDasharray="2 3" />
            </>
        ),
    },
]

const AUTOPLAY_MS = 7500

export default function VirtualTourPage() {
    const [idx, setIdx] = useState(0)
    const [playing, setPlaying] = useState(true)
    const [mouseX, setMouseX] = useState(50)
    const stageRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!playing) return
        const t = setInterval(() => setIdx(i => (i + 1) % STOPS.length), AUTOPLAY_MS)
        return () => clearInterval(t)
    }, [playing])

    const stop = STOPS[idx]
    const next = () => setIdx(i => (i + 1) % STOPS.length)
    const prev = () => setIdx(i => (i - 1 + STOPS.length) % STOPS.length)

    const onMove = (e: React.MouseEvent) => {
        const r = stageRef.current?.getBoundingClientRect()
        if (!r) return
        setMouseX(((e.clientX - r.left) / r.width) * 100)
    }
    // Parallax offset based on mouse
    const parallax = (mouseX - 50) / 50  // -1 .. 1

    return (
        <main className="min-h-screen bg-black overflow-hidden">
            <PageCmsOverlay slug="tour" position="top" />

            {/* Header strip */}
            <div className="absolute top-0 left-0 right-0 z-30 px-6 py-5 flex items-center justify-between text-white">
                <Link href="/" className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/60 hover:text-white inline-flex items-center gap-2">
                    <ChevronLeft className="w-3 h-3" /> Back to letw.org
                </Link>
                <p className="text-[10px] uppercase tracking-[0.4em] font-mono text-white/50 tabular-nums">
                    {String(idx + 1).padStart(2, '0')} / {String(STOPS.length).padStart(2, '0')}
                </p>
            </div>

            {/* Stage */}
            <section ref={stageRef} onMouseMove={onMove}
                className={`relative h-[100vh] overflow-hidden bg-gradient-to-br ${stop.gradient} transition-[background] duration-[1400ms] ease-out`}>

                {/* Ambient orbs (parallax) */}
                <div className="absolute inset-0 pointer-events-none transition-transform duration-300"
                    style={{ transform: `translateX(${parallax * 20}px) translateY(${parallax * 8}px)` }}>
                    <div className="absolute top-1/4 -left-40 w-[40rem] h-[40rem] rounded-full blur-[140px]"
                        style={{ background: `${stop.accents[0]}28` }} />
                    <div className="absolute bottom-1/4 -right-40 w-[36rem] h-[36rem] rounded-full blur-[140px]"
                        style={{ background: `${stop.accents[1]}22` }} />
                </div>

                {/* SVG scene */}
                <div key={idx} className="absolute inset-0 flex items-center justify-center animate-[sceneIn_900ms_cubic-bezier(.16,1,.3,1)_both]">
                    <svg viewBox="0 0 800 450" className="w-full max-w-5xl h-auto"
                        style={{ transform: `translateX(${parallax * -12}px)` }}>
                        {stop.paint(idx)}
                    </svg>
                </div>

                {/* Floating dust */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <span key={i}
                            className="absolute block w-1 h-1 rounded-full bg-white animate-[dustDrift_linear_infinite]"
                            style={{
                                left: `${(i * 137) % 100}%`,
                                top: `${(i * 73) % 100}%`,
                                animationDuration: `${10 + (i % 5) * 2}s`,
                                animationDelay: `${(i * 0.4).toFixed(2)}s`,
                                boxShadow: `0 0 6px ${stop.accents[0]}aa`,
                            }} />
                    ))}
                </div>

                {/* Letterbox */}
                <div className="absolute top-0 left-0 right-0 h-10 md:h-14 bg-black/40 backdrop-blur-sm z-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-10 md:h-14 bg-black/40 backdrop-blur-sm z-20 pointer-events-none" />

                {/* Caption card */}
                <div key={`cap-${idx}`} className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl animate-[capIn_900ms_cubic-bezier(.16,1,.3,1)_200ms_both]">
                    <div className="bg-black/50 backdrop-blur-xl border border-white/15 rounded-2xl p-5 md:p-6 text-white shadow-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stop.accents[0], color: '#140152' }}>
                                {stop.icon}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.35em] text-white/50 font-bold">Stop {idx + 1}</p>
                                <p className="font-serif text-xl md:text-2xl font-black">{stop.name}</p>
                            </div>
                        </div>
                        <p className="text-sm md:text-base text-white/80 leading-relaxed">{stop.blurb}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-3 left-0 right-0 z-30 px-6 flex items-center justify-between">
                    <button onClick={prev} aria-label="Previous"
                        className="w-11 h-11 rounded-full border border-white/15 text-white/80 hover:bg-white hover:text-black transition-all flex items-center justify-center">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            {STOPS.map((_, i) => (
                                <button key={i} onClick={() => setIdx(i)} aria-label={`Stop ${i + 1}`}
                                    className={`h-[3px] rounded-full transition-all ${i === idx ? 'w-10' : 'w-2'}`}
                                    style={{ background: i === idx ? stop.accents[0] : 'rgba(255,255,255,0.2)' }} />
                            ))}
                        </div>
                        <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}
                            className="ml-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white px-4 py-2 rounded-full border border-white/15 transition-colors">
                            {playing ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
                        </button>
                    </div>
                    <button onClick={next} aria-label="Next"
                        className="w-11 h-11 rounded-full text-black hover:scale-105 transition-transform flex items-center justify-center font-black shadow-lg"
                        style={{ background: stop.accents[0], boxShadow: `0 0 40px ${stop.accents[0]}88` }}>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* Below-the-fold: CTAs and stops list */}
            <section className="relative bg-white py-20 px-6">
                <div className="max-w-5xl mx-auto text-center mb-12">
                    <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-[10px] uppercase mb-3">Visit in person</p>
                    <h2 className="font-serif text-3xl md:text-5xl font-black text-[#140152]">Come see what you just toured</h2>
                    <p className="font-sans text-[#140152]/70 mt-4 max-w-2xl mx-auto">Sunday at 9:00 AM. Wednesday at 6:00 PM. We saved a seat for you.</p>
                    <div className="mt-7 flex justify-center gap-3 flex-wrap">
                        <Link href="/onboarding" className="bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-3 rounded-full text-sm uppercase tracking-widest inline-flex items-center gap-2">
                            New here? Start here <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/contact" className="bg-white border-2 border-[#140152]/15 text-[#140152] font-bold px-6 py-3 rounded-full text-sm uppercase tracking-widest inline-flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Get directions
                        </Link>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">Stops on the tour</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {STOPS.map((s, i) => (
                            <button key={s.id} onClick={() => { setIdx(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                className={`text-left p-4 rounded-2xl border transition-all ${i === idx ? 'border-[#f5bb00] bg-[#f5bb00]/10' : 'border-gray-100 bg-white hover:border-[#140152]/30'}`}>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-7 h-7 rounded-lg bg-[#140152] text-[#f5bb00] flex items-center justify-center text-[10px] font-black">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="text-[#140152]">{s.icon}</span>
                                </div>
                                <p className="font-black text-[#140152] text-sm leading-tight">{s.name}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <PageCmsOverlay slug="tour" position="bottom" />

            <style jsx>{`
                @keyframes sceneIn {
                    0%   { opacity: 0; transform: scale(.96); filter: blur(8px); }
                    100% { opacity: 1; transform: scale(1); filter: blur(0); }
                }
                @keyframes capIn {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to   { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes dustDrift {
                    from { transform: translateY(0) translateX(0); opacity: 0; }
                    10%  { opacity: 0.6; }
                    90%  { opacity: 0.6; }
                    to   { transform: translateY(-200px) translateX(40px); opacity: 0; }
                }
            `}</style>
        </main>
    )
}

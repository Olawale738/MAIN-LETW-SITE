'use client'
/**
 * /onboarding — editorial-grade "Welcome to the Family" experience.
 *
 * Design intent: a guided journey, not a list. Each step is a chapter with
 * its own colour mood, a scrolling progress rail in the gutter, scripture
 * pull-quotes between beats, and a cinematic final CTA.
 *
 * Admin CMS blocks (key 'onboarding') still override the entire page — the
 * default below only renders when no CMS template has been saved.
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import {
    Calendar, Users, BookOpen, Heart, Phone, Sparkles, ArrowRight,
    Loader2, MapPin, ChevronDown, CalendarDays,
} from 'lucide-react'
import { cmsApi, type Block } from '@/lib/api'
import PageRenderer from '@/components/cms/PageRenderer'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'
import { verseForToday, dayOfYear, DAILY_VERSES } from '@/lib/dailyVerses'

type Step = {
    n: number
    title: string
    eyebrow: string
    desc: string
    href: string
    icon: any
    /** Per-chapter colour key — drives ambient orb colour + accent. */
    hue: string
    /** Soft tint for the chapter card background. */
    tint: string
}

const STEPS: Step[] = [
    {
        n: 1,
        eyebrow: 'First Sunday',
        title: 'Plan your visit',
        desc: 'Attend a Sunday service — in the sanctuary or online. We will save you a seat and a fresh cup of coffee.',
        href: '/services/sunday-service',
        icon: Calendar,
        hue: '#7c3aed',
        tint: 'from-violet-50 via-white to-white',
    },
    {
        n: 2,
        eyebrow: 'Beyond the Pew',
        title: 'Connect with a pastor',
        desc: 'Book a 30-minute welcome conversation. We want to know your name, your story, and how to pray for you.',
        href: '/contact',
        icon: Phone,
        hue: '#ec4899',
        tint: 'from-rose-50 via-white to-white',
    },
    {
        n: 3,
        eyebrow: 'Our Foundation',
        title: 'Discover what we believe',
        desc: 'Read our Statement of Faith. Know what you are stepping into — no surprises, no fine print.',
        href: '/about',
        icon: BookOpen,
        hue: '#f5bb00',
        tint: 'from-amber-50 via-white to-white',
    },
    {
        n: 4,
        eyebrow: 'Faith in Community',
        title: 'Join a small group',
        desc: 'Christianity was never meant to be lived alone. Find a midweek group near your home or workplace.',
        href: '/bible-study',
        icon: Users,
        hue: '#10b981',
        tint: 'from-emerald-50 via-white to-white',
    },
    {
        n: 5,
        eyebrow: 'A Public Yes',
        title: 'Get baptized & serve',
        desc: 'Make your faith public, then put it to work. Join a ministry team and become part of the unfolding story.',
        href: '/life-events',
        icon: Heart,
        hue: '#06b6d4',
        tint: 'from-cyan-50 via-white to-white',
    },
]

export default function OnboardingPage() {
    const [cmsBlocks, setCmsBlocks] = useState<Block[] | null>(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        cmsApi.getPage('onboarding')
            .then(d => setCmsBlocks((d?.content?.blocks && d.content.blocks.length > 0) ? d.content.blocks : null))
            .catch(() => setCmsBlocks(null))
            .finally(() => setLoaded(true))
    }, [])

    if (!loaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#06002a]">
                <Loader2 className="w-10 h-10 animate-spin text-[#f5bb00]" />
            </div>
        )
    }

    if (cmsBlocks) {
        return (
            <>
                <PageCmsOverlay slug="onboarding" position="top" />
                <PageRenderer blocks={cmsBlocks} />
                <PageCmsOverlay slug="onboarding" position="bottom" />
            </>
        )
    }

    return <OnboardingDefault />
}

// ─── Default editorial layout ─────────────────────────────────────────────

function OnboardingDefault() {
    const containerRef = useRef<HTMLElement>(null)
    const { scrollYProgress } = useScroll({ target: containerRef })
    const progressX = useSpring(scrollYProgress, { stiffness: 120, damping: 25 })

    return (
        <main ref={containerRef} className="bg-[#fbf5e6] relative overflow-x-hidden">
            <PageCmsOverlay slug="onboarding" position="top" />

            {/* Top-of-viewport scroll progress bar — cinematic gold thread */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left"
                style={{
                    scaleX: progressX,
                    background: 'linear-gradient(90deg, #f5bb00 0%, #ffd763 50%, #f5bb00 100%)',
                    boxShadow: '0 0 12px rgba(245,187,0,0.55)',
                }}
            />

            <Hero />
            <JourneyRail />
            <StepsSection />
            <ScriptureMoment />
            <FinalCTA />

            <PageCmsOverlay slug="onboarding" position="bottom" />
        </main>
    )
}

// ─── Hero — cinematic, deep navy, parallax orbs ───────────────────────────

function Hero() {
    // Cursor-following gold spotlight — adds tactile depth to the deep-navy stage.
    const [pos, setPos] = useState({ x: 50, y: 50 })
    useEffect(() => {
        const move = (e: MouseEvent) => {
            setPos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 })
        }
        window.addEventListener('mousemove', move, { passive: true })
        return () => window.removeEventListener('mousemove', move)
    }, [])

    return (
        <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#06002a]">
            {/* Cursor-following gold spotlight */}
            <div className="absolute inset-0 pointer-events-none transition-[background] duration-300"
                style={{
                    background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, rgba(245,187,0,0.18), transparent 45%)`,
                }} />

            {/* Ambient brand orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-40 w-[40rem] h-[40rem] rounded-full blur-[150px] opacity-40"
                    style={{ background: '#f5bb00', animation: 'orbDriftA 16s ease-in-out infinite alternate' }} />
                <div className="absolute bottom-1/4 -right-40 w-[42rem] h-[42rem] rounded-full blur-[160px] opacity-30"
                    style={{ background: '#7c3aed', animation: 'orbDriftB 20s ease-in-out infinite alternate' }} />
                <div className="absolute top-1/2 left-1/2 w-[30rem] h-[30rem] rounded-full blur-[120px] opacity-20 -translate-x-1/2 -translate-y-1/2"
                    style={{ background: '#ec4899' }} />
            </div>

            {/* Faint grid texture for depth */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '72px 72px',
                }}
            />

            {/* Drifting light particles */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 30 }).map((_, i) => {
                    const dur = 9 + (i % 7) * 2
                    const size = 1 + (i % 4)
                    return (
                        <span key={i}
                            className="absolute block rounded-full bg-[#f5bb00]"
                            style={{
                                left: `${(i * 137) % 100}%`,
                                bottom: '-2%',
                                width: `${size}px`,
                                height: `${size}px`,
                                boxShadow: '0 0 10px rgba(245,187,0,0.9)',
                                opacity: 0.4,
                                animation: `divineDrift ${dur}s linear infinite`,
                                animationDelay: `${(i * 0.27).toFixed(2)}s`,
                            }} />
                    )
                })}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-2.5 font-bold tracking-[0.55em] text-[10px] md:text-[11px] uppercase mb-6"
                    style={{
                        backgroundImage: 'linear-gradient(90deg,#ffd763 0%,#f5bb00 25%,#fff5d6 50%,#f5bb00 75%,#ffd763 100%)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        animation: 'eyebrowShimmer 5s linear infinite',
                    }}>
                    <Sparkles className="w-3.5 h-3.5 text-[#f5bb00]" /> A guided welcome
                </motion.p>

                {/* Word-by-word entrance */}
                <h1 className="font-serif font-black text-white leading-[0.95] tracking-tight mb-6"
                    style={{ fontSize: 'clamp(2.75rem, 8vw, 6.5rem)', textShadow: '0 6px 40px rgba(0,0,0,0.55)' }}>
                    {'Welcome to'.split(' ').map((w, i) => (
                        <motion.span key={`a-${i}`} className="inline-block mr-[0.22em]"
                            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
                            transition={{ delay: 0.15 + i * 0.11, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                            {w}
                        </motion.span>
                    ))}
                    <br />
                    <motion.span
                        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
                        transition={{ delay: 0.55, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block bg-gradient-to-r from-[#ffd763] via-[#fff5d6] to-[#f5bb00] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(245,187,0,0.55)]"
                        style={{ backgroundSize: '200% auto', animation: 'titleShimmer 6s linear infinite' }}>
                        the Family
                    </motion.span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85, duration: 0.9 }}
                    className="text-white/75 text-base md:text-lg leading-relaxed font-light max-w-xl mx-auto"
                    style={{ textShadow: '0 2px 18px rgba(0,0,0,0.55)' }}>
                    Five short chapters to make Light Encounter Tabernacle your home — at your own pace. Start where you are. Finish closer to Jesus.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.05, duration: 0.9 }}
                    className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <a href="#step-1"
                        className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-7 py-4 rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-[#f5bb00]/30 hover:scale-105 transition-transform">
                        Begin chapter one <ArrowRight className="w-4 h-4" />
                    </a>
                    <Link href="/join"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold px-7 py-4 rounded-full text-sm uppercase tracking-widest border border-white/25 transition-colors">
                        Skip to membership
                    </Link>
                </motion.div>
            </div>

            {/* Scroll cue */}
            <motion.a href="#step-1"
                aria-label="Scroll to chapters"
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 hover:text-white/80 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 1 }}>
                <span className="text-[10px] uppercase tracking-[0.4em]">Scroll</span>
                <ChevronDown className="w-4 h-4 animate-bounce" />
            </motion.a>

            {/* Curved bottom edge → cream */}
            <svg viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden
                className="absolute left-0 right-0 bottom-0 w-full h-[80px] md:h-[120px]">
                <path d="M0,40 Q360,120 720,60 T1440,40 L1440,100 L0,100 Z" fill="#fbf5e6" />
            </svg>

            <style jsx>{`
                @keyframes orbDriftA {
                    0% { transform: translate(0,0) scale(1); }
                    100% { transform: translate(80px,40px) scale(1.1); }
                }
                @keyframes orbDriftB {
                    0% { transform: translate(0,0) scale(1.05); }
                    100% { transform: translate(-70px,-50px) scale(.95); }
                }
                @keyframes divineDrift {
                    0%   { transform: translateY(0); opacity: 0; }
                    8%   { opacity: 0.6; }
                    90%  { opacity: 0.6; }
                    100% { transform: translateY(-110vh) translateX(40px); opacity: 0; }
                }
                @keyframes titleShimmer {
                    0%   { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes eyebrowShimmer {
                    0%   { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>
        </section>
    )
}

// ─── Journey Rail — sticky vertical progress indicator (desktop only) ──

function JourneyRail() {
    const [active, setActive] = useState(1)

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const n = parseInt(e.target.id.replace('step-', ''), 10)
                    if (!isNaN(n)) setActive(n)
                }
            })
        }, { rootMargin: '-40% 0px -50% 0px' })

        STEPS.forEach(s => {
            const el = document.getElementById(`step-${s.n}`)
            if (el) observer.observe(el)
        })
        return () => observer.disconnect()
    }, [])

    return (
        <div className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-6 z-30 pointer-events-none">
            <div className="relative flex flex-col items-center gap-5 pointer-events-auto">
                {/* Connector line */}
                <div className="absolute top-3 bottom-3 left-1/2 -translate-x-1/2 w-px bg-[#140152]/15" />

                {STEPS.map(s => {
                    const isActive = s.n === active
                    const isPast = s.n < active
                    return (
                        <a key={s.n} href={`#step-${s.n}`}
                            className="relative z-10 group"
                            aria-label={`Jump to step ${s.n}: ${s.title}`}>
                            <span className={`block w-3 h-3 rounded-full transition-all duration-300 ${
                                isActive
                                    ? 'bg-[#f5bb00] ring-4 ring-[#f5bb00]/25 scale-110'
                                    : isPast
                                        ? 'bg-[#140152]'
                                        : 'bg-[#140152]/30 group-hover:bg-[#140152]/60'
                            }`}
                                style={isActive ? { boxShadow: '0 0 20px rgba(245,187,0,0.6)' } : undefined}
                            />
                            {/* Hover tooltip */}
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.25em] text-[#140152] opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-md shadow">
                                {String(s.n).padStart(2, '0')} · {s.title}
                            </span>
                        </a>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Steps Section — magazine chapters ─────────────────────────────────

function StepsSection() {
    return (
        <section className="relative pt-24 pb-32 px-4 sm:px-6 max-w-5xl mx-auto">
            {STEPS.map((s, i) => (
                <Chapter key={s.n} step={s} index={i} />
            ))}
        </section>
    )
}

function Chapter({ step, index }: { step: Step; index: number }) {
    const Icon = step.icon
    const flipped = index % 2 === 1

    return (
        <motion.article
            id={`step-${step.n}`}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={`relative scroll-mt-32 mb-24 sm:mb-32 last:mb-0 grid gap-8 items-center
                ${flipped ? 'md:grid-cols-[1fr_1.3fr]' : 'md:grid-cols-[1.3fr_1fr]'}
            `}>
            {/* Ambient mood blob per chapter */}
            <div className="absolute -z-10 inset-0 pointer-events-none">
                <div className={`absolute ${flipped ? 'right-[-10%]' : 'left-[-10%]'} top-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-[140px] opacity-25`}
                    style={{ background: step.hue }} />
            </div>

            {/* Number / icon side */}
            <div className={`relative ${flipped ? 'md:order-2' : ''}`}>
                <div className={`relative bg-gradient-to-br ${step.tint} border border-[#140152]/8 rounded-[2.25rem] p-8 sm:p-10 overflow-hidden shadow-[0_30px_80px_-30px_rgba(20,1,82,0.25)]`}>
                    {/* Oversized numeral as background art */}
                    <span aria-hidden
                        className="absolute -top-8 -right-2 font-serif font-black leading-none select-none"
                        style={{
                            fontSize: 'clamp(8rem, 18vw, 14rem)',
                            color: step.hue,
                            opacity: 0.08,
                        }}>
                        {step.n}
                    </span>

                    <div className="relative">
                        <p className="font-bold tracking-[0.4em] text-[10px] uppercase mb-4"
                            style={{ color: step.hue }}>
                            Chapter {String(step.n).padStart(2, '0')}
                        </p>
                        <p className="font-serif italic text-[#140152]/70 text-sm mb-6">{step.eyebrow}</p>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-4"
                            style={{
                                background: `linear-gradient(135deg, ${step.hue} 0%, ${step.hue}dd 100%)`,
                                boxShadow: `0 16px 40px -8px ${step.hue}66`,
                            }}>
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Copy side */}
            <div className={flipped ? 'md:order-1' : ''}>
                <h2 className="font-serif font-black text-[#140152] tracking-tight leading-[1.05]"
                    style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
                    {step.title}
                </h2>
                <p className="font-sans text-[#140152]/70 mt-5 text-base md:text-lg leading-relaxed max-w-prose">
                    {step.desc}
                </p>
                <Link href={step.href}
                    className="group inline-flex items-center gap-2 mt-7 text-sm font-black text-[#140152] hover:text-[#1d0175]">
                    <span className="border-b-2 border-[#f5bb00] pb-0.5 group-hover:pb-1 transition-all">Begin this chapter</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </motion.article>
    )
}

// ─── Scripture Moment — daily-rotating verse from the 365-day plan ─────
//
// The verse changes every day (indexed by day-of-year). On the seam between
// two days the verse fades through AnimatePresence rather than snapping.
// A small "Day X · MMM D" badge frames it as part of an intentional, paced
// walk through the year — not a static quote.

function ScriptureMoment() {
    const [verse, setVerse] = useState(() => verseForToday())
    const [day, setDay] = useState(() => dayOfYear())
    const [stampDate, setStampDate] = useState(() => new Date())

    // Re-evaluate every minute. Verse will only actually swap at midnight
    // local-time when the day-of-year ticks over; the cheap interval makes
    // sure that swap is visible without a page refresh.
    useEffect(() => {
        const id = setInterval(() => {
            const now = new Date()
            const d = dayOfYear(now)
            if (d !== day) {
                setDay(d)
                setVerse(verseForToday(now))
                setStampDate(now)
            }
        }, 60_000)
        return () => clearInterval(id)
    }, [day])

    const stamp = stampDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

    return (
        <section className="relative py-28 px-6 overflow-hidden bg-[#06002a]">
            {/* Ambient mood orbs */}
            <div className="absolute top-0 -left-40 w-[36rem] h-[36rem] rounded-full blur-[150px] opacity-30 pointer-events-none animate-[orbDriftA_18s_ease-in-out_infinite_alternate]"
                style={{ background: '#7c3aed' }} />
            <div className="absolute bottom-0 -right-40 w-[36rem] h-[36rem] rounded-full blur-[150px] opacity-30 pointer-events-none animate-[orbDriftB_22s_ease-in-out_infinite_alternate]"
                style={{ background: '#f5bb00' }} />

            {/* Faint scripture-paper texture grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '88px 88px',
                }}
            />

            <div className="relative max-w-3xl mx-auto text-center">
                {/* Day badge — gives the rotation rhythm */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="inline-flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-full px-4 py-2 mb-8">
                    <CalendarDays className="w-3.5 h-3.5 text-[#f5bb00]" />
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-[#f5bb00]">
                        Day {day} of 365 · {stamp}
                    </span>
                </motion.div>

                {/* Embossed gold quotation mark — pulses gently */}
                <motion.p
                    aria-hidden
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="font-serif font-black leading-none mx-auto mb-2 select-none"
                    style={{
                        fontSize: 'clamp(6rem, 14vw, 10rem)',
                        backgroundImage: 'linear-gradient(135deg, #ffd763 0%, #f5bb00 50%, #b88800 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        textShadow: '0 4px 30px rgba(245,187,0,0.3)',
                    }}>
                    &ldquo;
                </motion.p>

                {/* Verse text — crossfades when day rolls over */}
                <AnimatePresence mode="wait">
                    <motion.blockquote
                        key={day}
                        initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="relative">
                        <p className="font-serif italic text-white text-xl md:text-3xl leading-[1.4] -mt-4 md:-mt-8 px-4"
                            style={{ textShadow: '0 2px 30px rgba(0,0,0,0.55)' }}>
                            {verse.text}
                        </p>

                        <footer className="mt-8 inline-flex items-center gap-3">
                            <span className="block w-12 h-px bg-[#f5bb00]" />
                            <cite className="not-italic text-[#f5bb00] font-bold tracking-[0.4em] text-[10px] uppercase">
                                {verse.ref}
                            </cite>
                            <span className="block w-12 h-px bg-[#f5bb00]" />
                        </footer>
                    </motion.blockquote>
                </AnimatePresence>

                {/* Sub-line — gives the rotation a tagline */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.4 }}
                    className="text-white/40 text-xs md:text-sm mt-10 italic">
                    A fresh verse rises with the sun. Walk the 365-day path with us.
                </motion.p>
            </div>
        </section>
    )
}

// ─── Final CTA — full-bleed cinematic close ────────────────────────────

function FinalCTA() {
    return (
        <section className="relative px-6 py-32 overflow-hidden bg-gradient-to-br from-[#140152] via-[#1d0175] to-[#2d0b8e]">
            <div className="absolute top-1/4 -right-40 w-[40rem] h-[40rem] rounded-full blur-[150px] opacity-30 pointer-events-none"
                style={{ background: '#f5bb00' }} />

            <div className="relative max-w-3xl mx-auto text-center">
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="font-bold tracking-[0.5em] text-[10px] uppercase text-[#f5bb00] mb-5">
                    The next step is yours
                </motion.p>

                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="font-serif font-black text-white tracking-tight leading-[1.05] mb-6"
                    style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}>
                    Make it official.
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-white/75 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-10">
                    One name. One email. One step. Within 48 hours a real pastor &mdash; not a chatbot, not a form-letter &mdash; calls to learn your story, pray with you, and walk this road beside you. No script. No salesman energy. Just family making room.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center gap-3">
                    <Link href="/join"
                        className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-8 py-4 rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-[#f5bb00]/30 hover:scale-105 transition-transform">
                        Become a member <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link href="/contact"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest border border-white/25 transition-colors">
                        <MapPin className="w-4 h-4" /> Visit us first
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}

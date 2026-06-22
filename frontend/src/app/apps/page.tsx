'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Radio, Headphones, Play, BookOpen, Sparkles, Users, ArrowUpRight, Search, Globe2, LayoutGrid } from 'lucide-react'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'
import { ministryContentApi } from '@/lib/api'

// Map category -> default icon + colors so admin-added apps still look polished.
const CATEGORY_STYLE: Record<string, { icon: any; accent: string; glow: string }> = {
    'Worship':    { icon: Radio,      accent: 'from-[#f5bb00] via-orange-500 to-rose-600',     glow: 'shadow-[0_0_80px_rgba(245,187,0,0.35)]' },
    'Ministry':   { icon: Users,      accent: 'from-blue-500 via-indigo-600 to-violet-700',     glow: 'shadow-[0_0_80px_rgba(99,102,241,0.35)]' },
    'Learning':   { icon: BookOpen,   accent: 'from-amber-400 via-yellow-500 to-orange-500',    glow: 'shadow-[0_0_80px_rgba(251,191,36,0.35)]' },
    'Devotional': { icon: Sparkles,   accent: 'from-pink-500 via-rose-500 to-red-500',          glow: 'shadow-[0_0_80px_rgba(236,72,153,0.35)]' },
    'Family Hub': { icon: Headphones, accent: 'from-emerald-500 via-teal-500 to-cyan-600',      glow: 'shadow-[0_0_80px_rgba(20,184,166,0.35)]' },
    'Default':    { icon: LayoutGrid, accent: 'from-violet-500 via-purple-600 to-fuchsia-600',  glow: 'shadow-[0_0_80px_rgba(139,92,246,0.35)]' },
}
const styleFor = (category: string) => CATEGORY_STYLE[category] || CATEGORY_STYLE['Default']

type AppEntry = {
    name: string
    tagline: string
    description: string
    url: string
    icon: any
    accent: string         // gradient tailwind classes
    glow: string           // glow color
    category: string
    pulse?: boolean        // for "live" apps
}

/** Render a 'host/path' style label that works for both absolute and relative URLs. */
function appLabel(url: string): string {
    try {
        const u = new URL(url)
        return `${u.hostname}${u.pathname !== '/' ? u.pathname : ''}`
    } catch {
        // Relative URL (e.g. /groups) — show it as-is with the site host
        return `letw.org${url}`
    }
}

const APPS: AppEntry[] = [
    {
        name: 'LETW Radio',
        tagline: '24/7 worship + Word',
        description: 'Anointed worship, sermons, and teachings broadcasting around the clock to every corner of the world.',
        url: 'https://radio.letw.org',
        icon: Radio,
        accent: 'from-[#f5bb00] via-orange-500 to-rose-600',
        glow: 'shadow-[0_0_80px_rgba(245,187,0,0.35)]',
        category: 'Worship',
        pulse: true,
    },
    {
        name: 'Listen Now',
        tagline: 'Tune in instantly',
        description: 'One-click access to the radio player. No app, no setup — just press play and let the Spirit move.',
        url: 'https://radio.letw.org/listen',
        icon: Headphones,
        accent: 'from-violet-500 via-purple-600 to-fuchsia-600',
        glow: 'shadow-[0_0_80px_rgba(139,92,246,0.35)]',
        category: 'Worship',
    },
    {
        name: 'Live Stream',
        tagline: 'Broadcast quality audio',
        description: 'High-fidelity stream optimised for desktop, mobile, and in-car listening. Always on, always free.',
        url: 'https://radio.letw.org/stream',
        icon: Play,
        accent: 'from-emerald-400 via-teal-500 to-cyan-600',
        glow: 'shadow-[0_0_80px_rgba(20,184,166,0.35)]',
        category: 'Worship',
    },
    {
        name: 'MGM',
        tagline: 'Mission, growth, ministry',
        description: 'The hub for our mission programs, growth initiatives, and ministry leadership development.',
        url: 'https://mgmt.letw.org',
        icon: Users,
        accent: 'from-blue-500 via-indigo-600 to-violet-700',
        glow: 'shadow-[0_0_80px_rgba(99,102,241,0.35)]',
        category: 'Ministry',
    },
    {
        name: 'SharePoints',
        tagline: 'Resources for the body',
        description: 'A shared library of files, documents, and resources for leaders, members, and ministry teams.',
        url: 'https://sharepoints.letw.org',
        icon: Globe2,
        accent: 'from-sky-400 via-blue-500 to-blue-700',
        glow: 'shadow-[0_0_80px_rgba(59,130,246,0.35)]',
        category: 'Ministry',
    },
    {
        name: 'LessonHub',
        tagline: 'Discipleship that goes deep',
        description: 'Curated courses, lessons, and study materials for every season of your spiritual journey.',
        url: 'https://lessonhub.letw.org',
        icon: BookOpen,
        accent: 'from-amber-400 via-yellow-500 to-orange-500',
        glow: 'shadow-[0_0_80px_rgba(251,191,36,0.35)]',
        category: 'Learning',
    },
    {
        name: 'Devotion',
        tagline: 'Daily encounter with God',
        description: 'Morning and evening devotionals to anchor your day in the Word. Always one breath from God.',
        url: 'https://devotion.letw.org',
        icon: Sparkles,
        accent: 'from-pink-500 via-rose-500 to-red-500',
        glow: 'shadow-[0_0_80px_rgba(236,72,153,0.35)]',
        category: 'Devotional',
    },
]

const CATEGORIES = ['All', 'Worship', 'Ministry', 'Learning', 'Devotional', 'Family Hub']

export default function ChurchAppsPage() {
    const [query, setQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [mouse, setMouse] = useState({ x: 0, y: 0 })
    const [adminApps, setAdminApps] = useState<AppEntry[] | null>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', handler)
        return () => window.removeEventListener('mousemove', handler)
    }, [])

    // Pull admin-managed app cards from ministry-content. Falls through to the
    // built-in list above if nothing has been saved yet.
    useEffect(() => {
        ministryContentApi.get('apps-list')
            .then(r => {
                const c = (r.content || {}) as { apps?: Array<Partial<AppEntry> & { category?: string }> }
                if (Array.isArray(c.apps) && c.apps.length > 0) {
                    setAdminApps(c.apps.map(a => {
                        const style = styleFor(a.category || 'Ministry')
                        return {
                            name: a.name || 'Untitled',
                            tagline: a.tagline || '',
                            description: a.description || '',
                            url: a.url || '#',
                            icon: a.icon || style.icon,
                            accent: a.accent || style.accent,
                            glow: a.glow || style.glow,
                            category: a.category || 'Ministry',
                            pulse: (a as any).pulse,
                        }
                    }))
                }
            }).catch(() => { /* keep defaults */ })
    }, [])

    const allApps = adminApps ?? APPS
    const q = query.toLowerCase().trim()
    const filtered = allApps.filter(a => {
        if (activeCategory !== 'All' && a.category !== activeCategory) return false
        if (!q) return true
        return (a.name + ' ' + a.tagline + ' ' + a.description + ' ' + a.category).toLowerCase().includes(q)
    })

    return (
        <main className="min-h-screen bg-[#0a0030] text-white overflow-hidden relative">
            <PageCmsOverlay slug="apps" position="top" />
            {/* Animated background — gradient orbs that follow cursor */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#f5bb00]/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                <div
                    className="absolute w-[300px] h-[300px] bg-[#f5bb00]/8 rounded-full blur-[80px] transition-transform duration-300 ease-out"
                    style={{
                        left: `${mouse.x}px`,
                        top: `${mouse.y}px`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </div>
            {/* Grid overlay */}
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="relative z-10">
                {/* Hero */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f5bb00] animate-pulse" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#f5bb00]">Church Apps Network</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight">
                        Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5bb00] via-yellow-300 to-[#f5bb00]">tool</span>
                        <br />
                        in <span className="italic font-light">one</span> place.
                    </h1>
                    <p className="text-white/60 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
                        The complete LETW digital ecosystem. Worship, learn, give, grow — across {allApps.length} powerful apps, all part of one Kingdom.
                    </p>

                    {/* Search + filter */}
                    <div className="mt-10 max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search apps…"
                                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-white placeholder-white/40 outline-none focus:border-[#f5bb00]/50 focus:bg-white/10 transition-all"
                            />
                        </div>
                        <div className="flex gap-2 mt-4 flex-wrap justify-center">
                            {CATEGORIES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setActiveCategory(c)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                                        activeCategory === c
                                            ? 'bg-[#f5bb00] text-[#0a0030] shadow-lg shadow-[#f5bb00]/30'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Apps grid */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-white/40">
                            <Search className="w-12 h-12 mx-auto opacity-30 mb-3" />
                            <p>No apps match "{query}".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((app, i) => (
                                <AppCard key={app.url} app={app} delay={i * 80} />
                            ))}
                        </div>
                    )}

                    {/* Bottom CTA */}
                    <div className="mt-20 text-center">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#f5bb00] font-bold mb-3">Powered by Light Encounter Tabernacle Worldwide</p>
                        <Link href="/" className="text-white/40 text-sm hover:text-white transition-colors inline-flex items-center gap-1.5">
                            ← Back to letw.org
                        </Link>
                    </div>
                </section>
            </div>
            <PageCmsOverlay slug="apps" position="bottom" />
        </main>
    )
}

function AppCard({ app, delay }: { app: AppEntry; delay: number }) {
    const Icon = app.icon
    const ref = useRef<HTMLAnchorElement | null>(null)
    const [tilt, setTilt] = useState({ x: 0, y: 0 })

    const handleMouse = (e: React.MouseEvent) => {
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width  // 0..1
        const py = (e.clientY - rect.top) / rect.height
        setTilt({ x: (py - 0.5) * -8, y: (px - 0.5) * 8 })
    }
    const reset = () => setTilt({ x: 0, y: 0 })

    return (
        <a
            ref={ref}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            className="group relative block focus:outline-none focus:ring-2 focus:ring-[#f5bb00]/50 rounded-3xl motion-safe:opacity-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-forwards"
            style={{
                animationDelay: `${delay}ms`,
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.2s ease-out',
                opacity: 1,
            }}
        >
            {/* Outer glow */}
            <div className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-br ${app.accent} opacity-30 blur-xl group-hover:opacity-70 transition-opacity duration-500`} />

            {/* Main card */}
            <div className="relative bg-[#0a0030]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-7 overflow-hidden h-full group-hover:border-white/25 transition-all duration-300">
                {/* Subtle gradient inside */}
                <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${app.accent} opacity-20 rounded-full blur-3xl`} />

                {/* Live pulse */}
                {app.pulse && (
                    <div className="absolute top-5 right-5 flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span>
                    </div>
                )}

                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${app.accent} flex items-center justify-center mb-5 ${app.glow} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="relative">
                    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#f5bb00] mb-2">{app.category}</p>
                    <h3 className="text-2xl font-black text-white">{app.name}</h3>
                    <p className="text-sm text-white/50 mt-1 font-medium">{app.tagline}</p>
                    <p className="text-sm text-white/70 mt-4 leading-relaxed line-clamp-3">{app.description}</p>

                    {/* CTA */}
                    <div className="mt-6 flex items-center justify-between">
                        <span className="text-xs font-mono text-white/40 truncate max-w-[180px]">{appLabel(app.url)}</span>
                        <span className={`w-9 h-9 rounded-full bg-white/10 group-hover:bg-gradient-to-br ${app.accent} flex items-center justify-center transition-all group-hover:rotate-45`}>
                            <ArrowUpRight className="w-4 h-4 text-white" />
                        </span>
                    </div>
                </div>

                {/* Shine sweep on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
        </a>
    )
}

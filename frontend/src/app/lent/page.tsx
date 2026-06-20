'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Cross, CheckCircle2, Flame } from 'lucide-react'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

const STORAGE_KEY = 'letw-lent-progress'

function easter(y: number): Date {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100
    const d = Math.floor(b / 4), e = b % 4
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4), k = c % 4
    const L = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * L) / 451)
    const month = Math.floor((h + L - 7 * m + 114) / 31)
    const day = ((h + L - 7 * m + 114) % 31) + 1
    return new Date(y, month - 1, day)
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

const FOCI = [
    'Confession & repentance',
    'Reading the Word',
    'Prayer & solitude',
    'Fasting from a comfort',
    'Generosity to the poor',
    'Forgiving someone',
    'Letting go of a sin',
    'Worship & gratitude',
]

export default function LentTrackerPage() {
    const now = new Date()
    const y = now.getFullYear()
    const e = easter(y)
    const ashWed = addDays(e, -46)
    const inSeason = now >= ashWed && now < e
    const dayNumber = Math.floor((now.getTime() - ashWed.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const totalDays = 40

    const [completed, setCompleted] = useState<Record<number, boolean>>({})
    const [reflection, setReflection] = useState<Record<number, string>>({})

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return
            const data = JSON.parse(raw)
            setCompleted(data.completed || {})
            setReflection(data.reflection || {})
        } catch { /* noop */ }
    }, [])
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed, reflection })) } catch { /* noop */ }
    }, [completed, reflection])

    const completedCount = useMemo(() => Object.values(completed).filter(Boolean).length, [completed])

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#3d2860] via-[#2b1a47] to-[#1c0f30] text-white">
            <PageCmsOverlay slug="lent" position="top" />
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3 inline-flex items-center gap-2"><Cross className="w-3.5 h-3.5" /> Lent · 40 Days</p>
                <h1 className="text-4xl md:text-5xl font-black leading-tight">Walk the road to Easter.</h1>
                <p className="text-white/70 mt-4 max-w-xl mx-auto">A simple 40-day tracker for fasting, reflection, and turning your heart toward Christ.</p>

                <div className="mt-8 bg-white/10 backdrop-blur rounded-2xl p-5">
                    <div className="flex items-baseline justify-between mb-2">
                        <p className="text-xs uppercase tracking-wider text-white/60">Progress</p>
                        <p className="text-sm font-bold">{completedCount} / {totalDays} days</p>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#f5bb00] to-[#ffc820]" style={{ width: `${(completedCount / totalDays) * 100}%` }} />
                    </div>
                    {inSeason ? (
                        <p className="text-xs text-white/60 mt-3">Today is day <span className="text-[#f5bb00] font-bold">{dayNumber}</span> of the Lenten journey. Easter Sunday: {e.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}.</p>
                    ) : (
                        <p className="text-xs text-white/60 mt-3">Lent {y} begins {ashWed.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} (Ash Wednesday) and ends {addDays(e, -1).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}.</p>
                    )}
                </div>
            </section>

            <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                <div className="space-y-2">
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const dayNum = i + 1
                        const focus = FOCI[i % FOCI.length]
                        const isToday = inSeason && dayNum === dayNumber
                        const isDone = !!completed[dayNum]
                        const isFuture = inSeason && dayNum > dayNumber
                        return (
                            <div key={dayNum} className={`rounded-xl p-4 transition-all ${isToday ? 'bg-[#f5bb00] text-[#140152] ring-2 ring-[#f5bb00]/30' : isDone ? 'bg-white/15 text-white' : isFuture ? 'bg-white/5 text-white/40' : 'bg-white/10 text-white/80'}`}>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setCompleted({ ...completed, [dayNum]: !isDone })}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 transition-all ${isDone ? 'bg-green-500 text-white' : 'bg-white/15 hover:bg-white/25'}`}>
                                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : dayNum}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm">Day {dayNum} · {focus}</p>
                                        {isToday && <p className="text-xs font-bold mt-0.5">Today's focus</p>}
                                    </div>
                                    {isToday && <Flame className="w-5 h-5 flex-shrink-0" />}
                                </div>
                                {(isToday || isDone) && (
                                    <textarea
                                        value={reflection[dayNum] || ''}
                                        onChange={e => setReflection({ ...reflection, [dayNum]: e.target.value })}
                                        placeholder="Your reflection (private, stored only on this device)…"
                                        rows={2}
                                        className={`mt-3 w-full rounded-lg px-3 py-2 text-sm ${isToday ? 'bg-white/40 text-[#140152] placeholder-[#140152]/50' : 'bg-white/5 text-white placeholder-white/30'} outline-none border border-transparent focus:border-white/30`}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
                <p className="text-center text-white/40 text-xs mt-8">Reflections are stored on this device only. <Link href="/" className="text-[#f5bb00] hover:underline">Return home</Link></p>
            </section>
            <PageCmsOverlay slug="lent" position="bottom" />
        </main>
    )
}

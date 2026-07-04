'use client'
/**
 * Public /fasting — corporate fasting calendar.
 *
 * Active fasts show today's prayer prompt, a day-grid of your own check-ins
 * (identified by an anonymous localStorage key — no account needed), and a
 * live "N saints fasting with you" counter. Upcoming and completed fasts
 * list below.
 */
import { useEffect, useState } from 'react'
import {
    Loader2, Flame, CheckCircle, Users, CalendarDays, Sparkles, Quote, Send,
} from 'lucide-react'
import { fastingApi, type Fast } from '@/lib/api'

const KEY_STORAGE = 'letw-fast-participant-key'

function participantKey(): string {
    try {
        let k = localStorage.getItem(KEY_STORAGE)
        if (!k) {
            k = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
            localStorage.setItem(KEY_STORAGE, k)
        }
        return k
    } catch {
        return 'anon-session'
    }
}

const KIND_LABEL: Record<string, string> = {
    full: 'Full fast', daniel: 'Daniel fast', partial: 'Partial fast', media: 'Media fast',
}

export default function FastingPage() {
    const [fasts, setFasts] = useState<Fast[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fastingApi.list()
            .then(setFasts)
            .catch(() => { /* empty-state renders */ })
            .finally(() => setLoading(false))
    }, [])

    const active = fasts.filter(f => f.status === 'active')
    const upcoming = fasts.filter(f => f.status === 'upcoming')
    const completed = fasts.filter(f => f.status === 'completed')

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#06002a] via-[#140152] to-[#06002a] text-white">
            {/* Hero */}
            <section className="relative overflow-hidden pt-28 pb-14 px-4 text-center">
                <div className="absolute -top-32 left-1/4 w-[420px] h-[420px] rounded-full bg-[#f5bb00]/15 blur-[110px] pointer-events-none" />
                <div className="absolute -bottom-40 right-0 w-[480px] h-[480px] rounded-full bg-purple-500/15 blur-[130px] pointer-events-none" />
                <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.4em] text-xs uppercase mb-4">
                    <Flame className="w-3.5 h-3.5" /> Corporate fasting
                </p>
                <h1 className="font-serif text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
                    Hunger for more of God.
                </h1>
                <p className="text-white/70 mt-5 max-w-xl mx-auto leading-relaxed">
                    Join the whole church in seasons of consecration — daily prayer prompts, a shared rhythm, and the strength of fasting <em>together</em>.
                </p>
            </section>

            <section className="max-w-3xl mx-auto px-4 pb-24 space-y-10">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#f5bb00]" /></div>
                ) : fasts.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-white/60">
                        <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No fasts are on the calendar yet. Check back — the next season of consecration will appear here.</p>
                    </div>
                ) : (
                    <>
                        {active.map(f => <ActiveFastCard key={f.id} fast={f} />)}

                        {upcoming.length > 0 && (
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-[#f5bb00] mb-3">Upcoming</h2>
                                <div className="space-y-3">
                                    {upcoming.map(f => <SimpleFastRow key={f.id} fast={f} />)}
                                </div>
                            </div>
                        )}
                        {completed.length > 0 && (
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40 mb-3">Past seasons</h2>
                                <div className="space-y-3 opacity-60">
                                    {completed.map(f => <SimpleFastRow key={f.id} fast={f} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    )
}

function ActiveFastCard({ fast }: { fast: Fast }) {
    const [myDays, setMyDays] = useState<number[]>([])
    const [stats, setStats] = useState<{ participants: number; checked_in_today: number } | null>(null)
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const pk = participantKey()
    const day = fast.current_day || 1

    const refresh = async () => {
        try {
            const [mine, s] = await Promise.all([
                fastingApi.myCheckins(fast.id, pk),
                fastingApi.stats(fast.id),
            ])
            setMyDays(mine.days)
            setStats(s)
        } catch { /* non-fatal */ }
    }
    useEffect(() => { refresh() }, [fast.id])  // eslint-disable-line react-hooks/exhaustive-deps

    const checkedToday = myDays.includes(day)
    // Prayer prompt for today — cycles if admin provided fewer prompts than days.
    const prompt = fast.prayer_prompts.length > 0
        ? fast.prayer_prompts[(day - 1) % fast.prayer_prompts.length]
        : null

    const checkIn = async () => {
        setBusy(true); setMsg(null)
        try {
            const r = await fastingApi.checkin({ fast_id: fast.id, participant_key: pk, note: note || undefined })
            setMsg(r.already ? 'Note updated for today.' : `Day ${r.day_number} sealed. Stay strong.`)
            setNote('')
            await refresh()
        } catch (e) {
            setMsg((e as Error).message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <article className="bg-white/5 backdrop-blur border border-[#f5bb00]/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(245,187,0,0.15)]">
            {/* Header strip */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-[#f5bb00]/20 border border-[#f5bb00]/40 text-[#f5bb00] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        <Flame className="w-3 h-3" /> Active · Day {day} of {fast.total_days}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-white/50">{KIND_LABEL[fast.kind] || fast.kind}</span>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-black mt-3">{fast.title}</h2>
                {fast.description && <p className="text-white/70 text-sm mt-2 leading-relaxed">{fast.description}</p>}
                {fast.scripture_focus && (
                    <p className="text-xs italic text-[#f5bb00]/90 mt-3 inline-flex items-center gap-1.5"><Quote className="w-3 h-3" /> {fast.scripture_focus}</p>
                )}
                {stats && (
                    <p className="text-xs text-white/50 mt-3 inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#f5bb00]" />
                        <strong className="text-white/80">{stats.participants}</strong> fasting with you · <strong className="text-white/80">{stats.checked_in_today}</strong> checked in today
                    </p>
                )}
            </div>

            {/* Today's prompt */}
            {prompt && (
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#f5bb00]/10 to-transparent">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f5bb00] mb-2 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> Today&apos;s prayer focus
                    </p>
                    <p className="font-serif italic text-lg md:text-xl leading-relaxed text-white/90">{prompt}</p>
                </div>
            )}

            {/* Day grid */}
            <div className="p-6 border-b border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-3">Your journey</p>
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: fast.total_days }, (_, i) => i + 1).map(d => {
                        const isDone = myDays.includes(d)
                        const isToday = d === day
                        return (
                            <span key={d}
                                title={`Day ${d}`}
                                className={`w-8 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ${
                                    isDone ? 'bg-[#f5bb00] text-[#140152]'
                                    : isToday ? 'border-2 border-[#f5bb00] text-[#f5bb00] animate-pulse'
                                    : d < day ? 'bg-white/5 text-white/30'
                                    : 'bg-white/5 text-white/50'
                                }`}>
                                {isDone ? <CheckCircle className="w-4 h-4" /> : d}
                            </span>
                        )
                    })}
                </div>
            </div>

            {/* Check-in */}
            <div className="p-6">
                {msg && <p className="text-sm text-[#f5bb00] mb-3">{msg}</p>}
                <div className="flex flex-col sm:flex-row gap-2">
                    <input value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Optional note — what is God saying today?"
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40" />
                    <button onClick={checkIn} disabled={busy}
                        className={`inline-flex items-center justify-center gap-2 font-black px-6 py-3 rounded-xl text-sm disabled:opacity-50 ${
                            checkedToday ? 'bg-white/10 text-white/70 border border-white/20' : 'bg-[#f5bb00] hover:bg-amber-400 text-[#140152]'
                        }`}>
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : checkedToday ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {checkedToday ? 'Checked in today' : `Check in — Day ${day}`}
                    </button>
                </div>
            </div>
        </article>
    )
}

function SimpleFastRow({ fast }: { fast: Fast }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-[#f5bb00]" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-black text-white truncate">{fast.title}</h3>
                <p className="text-xs text-white/50">
                    {new Date(fast.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} — {new Date(fast.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    · {fast.total_days} days · {KIND_LABEL[fast.kind] || fast.kind}
                </p>
            </div>
        </div>
    )
}

'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
    BookOpen, Flame, Brain, Calendar, Plus, CheckCircle2, X, Trash2,
    Sparkles, Trophy, Star, Heart, TrendingUp, RefreshCw, ChevronRight, ChevronLeft
} from 'lucide-react'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

/**
 * Personal spiritual growth dashboard.
 *
 * Memory verses use a Leitner-style spaced repetition schedule (boxes 1-5):
 *   box 1 → review every day, 2 → every 3 days, 3 → 7 days, 4 → 14 days, 5 → 30 days.
 *
 * Habit tracker is a simple 30-day grid per habit (prayer, fasting, scripture, etc.)
 * tracked entirely in localStorage so it works offline and needs no backend.
 */

const VERSES_KEY = 'letw-grow-verses-v1'
const HABITS_KEY = 'letw-grow-habits-v1'
const HABIT_LOG_KEY = 'letw-grow-habit-log-v1'

interface Verse {
    id: string
    reference: string
    text: string
    box: 1 | 2 | 3 | 4 | 5
    nextReview: string   // YYYY-MM-DD
    createdAt: string
}
interface Habit { id: string; name: string; icon: 'pray' | 'fast' | 'read' | 'serve' | 'give'; createdAt: string }

const BOX_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 }

const DEFAULT_VERSES: Omit<Verse, 'id' | 'box' | 'nextReview' | 'createdAt'>[] = [
    { reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
    { reference: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
    { reference: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
    { reference: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
    { reference: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.' },
]

const DEFAULT_HABITS: Omit<Habit, 'id' | 'createdAt'>[] = [
    { name: 'Daily prayer',     icon: 'pray' },
    { name: 'Scripture reading', icon: 'read' },
    { name: 'Fasting',          icon: 'fast' },
    { name: 'Serve someone',    icon: 'serve' },
    { name: 'Give generously',  icon: 'give' },
]

const HABIT_ICON: Record<Habit['icon'], React.ReactNode> = {
    pray: <Heart className="w-4 h-4" />,
    read: <BookOpen className="w-4 h-4" />,
    fast: <Flame className="w-4 h-4" />,
    serve: <Sparkles className="w-4 h-4" />,
    give: <Star className="w-4 h-4" />,
}

function today(): string {
    return new Date().toISOString().slice(0, 10)
}
function addDays(date: string, days: number): string {
    const d = new Date(date + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}
function rid(): string {
    return Math.random().toString(36).slice(2, 10)
}

export default function GrowPage() {
    const [tab, setTab] = useState<'verses' | 'habits' | 'progress'>('verses')
    const [verses, setVerses] = useState<Verse[]>([])
    const [habits, setHabits] = useState<Habit[]>([])
    const [habitLog, setHabitLog] = useState<Record<string, string[]>>({})  // habitId → [dates]

    // Load on mount
    useEffect(() => {
        try {
            const vs = localStorage.getItem(VERSES_KEY)
            const hs = localStorage.getItem(HABITS_KEY)
            const hl = localStorage.getItem(HABIT_LOG_KEY)
            if (vs) setVerses(JSON.parse(vs))
            else setVerses(DEFAULT_VERSES.map(v => ({ ...v, id: rid(), box: 1, nextReview: today(), createdAt: today() })))
            if (hs) setHabits(JSON.parse(hs))
            else setHabits(DEFAULT_HABITS.map(h => ({ ...h, id: rid(), createdAt: today() })))
            if (hl) setHabitLog(JSON.parse(hl))
        } catch { /* fall through */ }
    }, [])

    // Persist
    useEffect(() => { try { localStorage.setItem(VERSES_KEY, JSON.stringify(verses)) } catch { /* noop */ } }, [verses])
    useEffect(() => { try { localStorage.setItem(HABITS_KEY, JSON.stringify(habits)) } catch { /* noop */ } }, [habits])
    useEffect(() => { try { localStorage.setItem(HABIT_LOG_KEY, JSON.stringify(habitLog)) } catch { /* noop */ } }, [habitLog])

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <PageCmsOverlay slug="grow" position="top" />

            {/* Hero */}
            <section className="max-w-4xl mx-auto px-6 pt-24 pb-8 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.35em] text-[10px] uppercase mb-3 inline-flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Spiritual Growth
                </p>
                <h1 className="font-serif text-4xl md:text-6xl font-black text-[#140152] leading-tight">
                    Grow in <span className="bg-gradient-to-r from-[#f5bb00] via-amber-500 to-[#f5bb00] bg-clip-text text-transparent">grace and truth</span>
                </h1>
                <p className="font-sans text-[#140152]/70 mt-4 max-w-xl mx-auto leading-relaxed">
                    Memorise scripture with spaced repetition. Track the spiritual habits that shape who you're becoming. Your progress is saved on this device — fully private.
                </p>
            </section>

            {/* Tabs */}
            <div className="sticky top-0 z-20 bg-[#fbf5e6]/95 backdrop-blur border-b border-[#140152]/10 mb-8">
                <div className="max-w-4xl mx-auto px-6 flex items-center gap-1">
                    {(['verses', 'habits', 'progress'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${tab === t ? 'border-[#f5bb00] text-[#140152]' : 'border-transparent text-[#140152]/50 hover:text-[#140152]'}`}>
                            {t === 'verses' ? 'Memory Verses' : t === 'habits' ? 'Habits' : 'Progress'}
                        </button>
                    ))}
                </div>
            </div>

            <section className="max-w-4xl mx-auto px-6 pb-24">
                {tab === 'verses' && <VersesView verses={verses} setVerses={setVerses} />}
                {tab === 'habits' && <HabitsView habits={habits} setHabits={setHabits} log={habitLog} setLog={setHabitLog} />}
                {tab === 'progress' && <ProgressView verses={verses} habits={habits} log={habitLog} />}
            </section>

            <PageCmsOverlay slug="grow" position="bottom" />
        </main>
    )
}

function VersesView({ verses, setVerses }: { verses: Verse[]; setVerses: (v: Verse[]) => void }) {
    const todayStr = today()
    const due = verses.filter(v => v.nextReview <= todayStr)
    const [reviewIdx, setReviewIdx] = useState(0)
    const [showing, setShowing] = useState(false)
    const [adding, setAdding] = useState(false)
    const [ref, setRef] = useState('')
    const [text, setText] = useState('')

    useEffect(() => { setReviewIdx(0); setShowing(false) }, [due.length])

    const current = due[reviewIdx]

    const recall = (success: boolean) => {
        if (!current) return
        const v: Verse = { ...current }
        v.box = (success ? Math.min(5, v.box + 1) : Math.max(1, v.box - 1)) as Verse['box']
        v.nextReview = addDays(todayStr, BOX_DAYS[v.box])
        setVerses(verses.map(x => x.id === v.id ? v : x))
        setShowing(false)
        setReviewIdx(i => i + 1)
    }

    const addVerse = () => {
        if (!ref.trim() || !text.trim()) return
        setVerses([...verses, { id: rid(), reference: ref.trim(), text: text.trim(), box: 1, nextReview: todayStr, createdAt: todayStr }])
        setRef(''); setText(''); setAdding(false)
    }
    const removeVerse = (id: string) => {
        if (!confirm('Remove this verse from your deck?')) return
        setVerses(verses.filter(v => v.id !== id))
    }

    return (
        <div>
            {/* Review card */}
            {current ? (
                <div className="bg-gradient-to-br from-[#140152] to-[#1d0175] text-white rounded-3xl p-8 md:p-10 shadow-2xl mb-8 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#f5bb00]/20 blur-3xl pointer-events-none" />
                    <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-[#f5bb00] font-black">
                                Review · {reviewIdx + 1} of {due.length}
                            </p>
                            <p className="text-[10px] text-white/40 font-bold">Box {current.box}</p>
                        </div>
                        <p className="font-serif text-2xl md:text-4xl font-black mb-6">{current.reference}</p>
                        {showing ? (
                            <>
                                <p className="text-white/85 font-serif italic text-lg md:text-xl leading-relaxed mb-8">"{current.text}"</p>
                                <p className="text-xs text-white/50 mb-4">How well did you remember it?</p>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => recall(false)} className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-3 rounded-xl text-sm">Forgot — try tomorrow</button>
                                    <button onClick={() => recall(true)} className="flex-1 min-w-[120px] bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-3 rounded-xl text-sm">Got it ✓</button>
                                </div>
                            </>
                        ) : (
                            <button onClick={() => setShowing(true)} className="bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 text-white font-bold px-6 py-3 rounded-xl text-sm">
                                Reveal verse
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-10 text-center mb-8">
                    <Trophy className="w-14 h-14 mx-auto text-green-600 mb-3" />
                    <h3 className="font-serif text-2xl font-black text-[#140152]">All caught up</h3>
                    <p className="text-gray-600 mt-2">You've reviewed every verse due today. Add more below to grow your deck.</p>
                </div>
            )}

            {/* Deck */}
            <div className="flex items-center justify-between mb-3">
                <p className="font-black text-[#140152]">Your deck ({verses.length})</p>
                <button onClick={() => setAdding(true)} className="text-sm font-bold text-[#140152] hover:bg-[#140152]/5 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add verse
                </button>
            </div>
            {adding && (
                <div className="bg-white rounded-2xl border-2 border-[#f5bb00] p-5 mb-3 shadow-md">
                    <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Reference (e.g. Romans 12:1)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-2 font-bold" />
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Verse text" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-serif italic" />
                    <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-[#140152]">Cancel</button>
                        <button onClick={addVerse} disabled={!ref.trim() || !text.trim()} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">Add to deck</button>
                    </div>
                </div>
            )}
            <div className="space-y-2">
                {verses.map(v => (
                    <div key={v.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                        <span className={`text-[10px] font-black px-2 py-1 rounded ${v.box === 5 ? 'bg-emerald-100 text-emerald-700' : v.box >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>BOX {v.box}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152] text-sm truncate">{v.reference}</p>
                            <p className="text-xs text-gray-500 truncate italic">{v.text}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 hidden sm:block">{v.nextReview <= todayStr ? 'Due' : `Next: ${v.nextReview}`}</p>
                        <button onClick={() => removeVerse(v.id)} className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function HabitsView({ habits, setHabits, log, setLog }: {
    habits: Habit[]; setHabits: (h: Habit[]) => void;
    log: Record<string, string[]>; setLog: (l: Record<string, string[]>) => void;
}) {
    const todayStr = today()
    // Last 30 days for grid
    const days: string[] = useMemo(() => {
        const out: string[] = []
        for (let i = 29; i >= 0; i--) out.push(addDays(todayStr, -i))
        return out
    }, [todayStr])

    const [adding, setAdding] = useState(false)
    const [name, setName] = useState('')
    const [icon, setIcon] = useState<Habit['icon']>('pray')

    const toggle = (habitId: string, date: string) => {
        const existing = log[habitId] || []
        const next = existing.includes(date) ? existing.filter(d => d !== date) : [...existing, date]
        setLog({ ...log, [habitId]: next })
    }
    const streak = (habitId: string): number => {
        const set = new Set(log[habitId] || [])
        let s = 0; let cursor = todayStr
        while (set.has(cursor)) { s += 1; cursor = addDays(cursor, -1) }
        return s
    }
    const addHabit = () => {
        if (!name.trim()) return
        setHabits([...habits, { id: rid(), name: name.trim(), icon, createdAt: todayStr }])
        setName(''); setAdding(false)
    }
    const removeHabit = (id: string) => {
        if (!confirm('Remove this habit and its history?')) return
        setHabits(habits.filter(h => h.id !== id))
        const next = { ...log }; delete next[id]; setLog(next)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="font-black text-[#140152]">Today's habits</p>
                <button onClick={() => setAdding(true)} className="text-sm font-bold text-[#140152] hover:bg-[#140152]/5 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add habit
                </button>
            </div>

            {adding && (
                <div className="bg-white rounded-2xl border-2 border-[#f5bb00] p-5 mb-5 shadow-md">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Habit name (e.g. Worship)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3" />
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(['pray', 'read', 'fast', 'serve', 'give'] as const).map(i => (
                            <button key={i} onClick={() => setIcon(i)} className={`p-2 rounded-lg border-2 ${icon === i ? 'border-[#f5bb00] bg-[#f5bb00]/10' : 'border-gray-200'}`}>
                                {HABIT_ICON[i]}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                        <button onClick={addHabit} disabled={!name.trim()} className="bg-[#140152] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">Add habit</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {habits.map(h => {
                    const done = (log[h.id] || []).includes(todayStr)
                    return (
                        <div key={h.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${done ? 'bg-[#f5bb00] text-[#140152]' : 'bg-[#140152]/5 text-[#140152]'}`}>
                                    {HABIT_ICON[h.icon]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-[#140152]">{h.name}</p>
                                    <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                                        <Flame className="w-3 h-3 text-orange-500" /> {streak(h.id)}-day streak
                                    </p>
                                </div>
                                <button onClick={() => toggle(h.id, todayStr)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 ${done ? 'bg-green-100 text-green-700' : 'bg-[#140152] text-white hover:bg-[#1d0175]'}`}>
                                    {done ? <><CheckCircle2 className="w-4 h-4" /> Done today</> : 'Mark done'}
                                </button>
                                <button onClick={() => removeHabit(h.id)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            {/* 30-day grid */}
                            <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
                                {days.map(d => {
                                    const did = (log[h.id] || []).includes(d)
                                    return (
                                        <button key={d} onClick={() => toggle(h.id, d)} title={d}
                                            className={`aspect-square rounded ${did ? 'bg-[#f5bb00]' : 'bg-gray-100 hover:bg-gray-200'}`} />
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                {habits.length === 0 && <p className="text-center text-gray-400 py-12">No habits yet. Tap "Add habit" to get started.</p>}
            </div>
        </div>
    )
}

function ProgressView({ verses, habits, log }: { verses: Verse[]; habits: Habit[]; log: Record<string, string[]> }) {
    const todayStr = today()
    const memorized = verses.filter(v => v.box >= 4).length
    const reviewingNow = verses.filter(v => v.box < 4).length
    const last30: string[] = useMemo(() => {
        const out: string[] = []
        for (let i = 29; i >= 0; i--) out.push(addDays(todayStr, -i))
        return out
    }, [todayStr])
    const totalChecks = Object.values(log).reduce((sum, dates) => sum + (dates || []).length, 0)
    const last30Checks = Object.values(log).reduce((sum, dates) => sum + (dates || []).filter(d => last30.includes(d)).length, 0)
    const consistency = habits.length > 0 ? Math.round((last30Checks / (habits.length * 30)) * 100) : 0

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Verses memorised" value={memorized} icon={<Brain className="w-4 h-4 text-emerald-500" />} tint="bg-emerald-50 border-emerald-100" />
                <Stat label="Verses learning" value={reviewingNow} icon={<BookOpen className="w-4 h-4 text-amber-500" />} tint="bg-amber-50 border-amber-100" />
                <Stat label="Habits tracked" value={habits.length} icon={<Star className="w-4 h-4 text-purple-500" />} tint="bg-purple-50 border-purple-100" />
                <Stat label="30-day consistency" value={`${consistency}%`} icon={<TrendingUp className="w-4 h-4 text-blue-500" />} tint="bg-blue-50 border-blue-100" />
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="font-black text-[#140152] mb-3">Lifetime stats</p>
                <ul className="text-sm text-gray-700 space-y-1.5">
                    <li>Total verses in deck: <span className="font-black text-[#140152]">{verses.length}</span></li>
                    <li>Verses at mastery (box 5): <span className="font-black text-[#140152]">{verses.filter(v => v.box === 5).length}</span></li>
                    <li>Total habit check-ins: <span className="font-black text-[#140152]">{totalChecks}</span></li>
                </ul>
            </div>

            <div className="text-center pt-4">
                <Link href="/bible-reading" className="inline-flex items-center gap-2 text-sm font-bold text-[#140152] hover:underline">
                    Continue to Bible reading plans <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    )
}

function Stat({ label, value, icon, tint }: { label: string; value: React.ReactNode; icon: React.ReactNode; tint: string }) {
    return (
        <div className={`rounded-2xl border p-4 ${tint}`}>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 inline-flex items-center gap-1.5">{icon} {label}</p>
            <p className="text-3xl font-black text-[#140152] mt-1">{value}</p>
        </div>
    )
}

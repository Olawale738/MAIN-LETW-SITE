'use client'
import { useEffect, useState } from 'react'
import { Sparkles, Heart, Cross, Flame, HeartHandshake, Users, Sun, Crown, ArrowUp } from 'lucide-react'
import { decisionsApi, type DecisionCounts, type DecisionEntry, type DecisionKind } from '@/lib/api'
import ScrollReveal from '@/components/effects/ScrollReveal'

const KINDS: { key: DecisionKind; label: string; icon: any; color: string }[] = [
    { key: 'salvation',         label: 'Salvations',          icon: Cross,         color: 'from-amber-400 to-orange-500' },
    { key: 'baptism',           label: 'Baptisms',            icon: Sun,           color: 'from-sky-400 to-blue-500' },
    { key: 'healing',           label: 'Healings',            icon: HeartHandshake, color: 'from-emerald-400 to-green-600' },
    { key: 'marriage_restored', label: 'Marriages Restored',  icon: Heart,         color: 'from-rose-400 to-pink-600' },
    { key: 'prodigal_returned', label: 'Prodigals Returned',  icon: ArrowUp,       color: 'from-violet-400 to-purple-600' },
    { key: 'deliverance',       label: 'Deliverance',         icon: Flame,         color: 'from-orange-500 to-red-600' },
    { key: 'rededication',      label: 'Rededications',       icon: Sparkles,      color: 'from-yellow-300 to-amber-500' },
    { key: 'dedication',        label: 'Child Dedications',   icon: Crown,         color: 'from-indigo-400 to-purple-500' },
    { key: 'calling',           label: 'Callings Confirmed',  icon: Users,         color: 'from-fuchsia-400 to-pink-500' },
    { key: 'other',             label: 'Other Decisions',     icon: Sparkles,      color: 'from-slate-400 to-slate-600' },
]

export default function OutcomesPage() {
    const [counts, setCounts] = useState<DecisionCounts | null>(null)
    const [recent, setRecent] = useState<DecisionEntry[]>([])
    const [year, setYear] = useState<number>(new Date().getFullYear())

    useEffect(() => {
        Promise.all([decisionsApi.counts(year), decisionsApi.recent(20)])
            .then(([c, r]) => { setCounts(c); setRecent(r) })
            .catch(() => {})
    }, [year])

    const total = counts?.total || 0

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#140152] via-[#1a0270] to-[#140152] text-white">
            <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3 inline-flex items-center gap-2"><Flame className="w-3.5 h-3.5" /> Kingdom moving</p>
                <h1 className="text-4xl md:text-6xl font-black leading-tight">What God is doing.</h1>
                <p className="text-white/70 mt-4 max-w-2xl mx-auto text-lg">Every life surrendered. Every body healed. Every marriage restored. We celebrate Him for each one.</p>

                <div className="mt-8 flex justify-center gap-2 flex-wrap">
                    {[year - 1, year, 'all'].map(y => (
                        <button key={String(y)} onClick={() => setYear(y === 'all' ? 0 : (y as number))}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold ${((y === 'all' && year === 0) || y === year) ? 'bg-[#f5bb00] text-[#140152]' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}>
                            {y === 'all' ? 'All time' : String(y)}
                        </button>
                    ))}
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
                <div className="bg-gradient-to-r from-[#f5bb00]/15 to-transparent border border-[#f5bb00]/30 rounded-3xl p-8 sm:p-10 text-center mb-10">
                    <p className="text-xs uppercase tracking-widest text-[#f5bb00] font-bold mb-2">Total decisions</p>
                    <p className="text-6xl md:text-8xl font-black text-white">{total.toLocaleString()}</p>
                    <p className="text-sm text-white/60 mt-2">{year === 0 ? 'across the life of the church' : `in ${year}`}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {KINDS.map((k, i) => {
                        const n = counts?.by_kind?.[k.key] || 0
                        const Icon = k.icon
                        return (
                            <ScrollReveal key={k.key} delay={i * 40}>
                                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 hover:border-[#f5bb00]/40 transition-all">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center mb-3`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-3xl font-black">{n.toLocaleString()}</p>
                                    <p className="text-xs text-white/60 mt-0.5">{k.label}</p>
                                </div>
                            </ScrollReveal>
                        )
                    })}
                </div>
            </section>

            {recent.length > 0 && (
                <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                    <h2 className="text-2xl font-black text-center mb-6">Recent celebrations</h2>
                    <div className="space-y-3">
                        {recent.map(d => {
                            const k = KINDS.find(x => x.key === d.kind)
                            const Icon = k?.icon || Sparkles
                            return (
                                <div key={d.id} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${k?.color || 'from-slate-400 to-slate-600'} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold">{d.person_name} · <span className="text-[#f5bb00]">{k?.label || d.kind}</span></p>
                                        {d.testimony && <p className="text-xs text-white/60 mt-1 italic">"{d.testimony}"</p>}
                                        <p className="text-[10px] text-white/40 mt-1">{new Date(d.decided_on).toLocaleDateString()}{d.location ? ` · ${d.location}` : ''}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}
        </main>
    )
}

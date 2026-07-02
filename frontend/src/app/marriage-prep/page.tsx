'use client'
/**
 * Public /marriage-prep — preview the 6-week course + enrolment form.
 *
 * Couples enrol with both names, contact email, optional intended wedding
 * date. A pastor signs off at completion via /admin/marriage-prep.
 */
import { useEffect, useState } from 'react'
import {
    Loader2, Heart, ArrowRight, CheckCircle, Sparkles, Send, AlertCircle, BookOpen, Calendar,
} from 'lucide-react'
import { marriagePrepApi, ministryContentApi, type MarriagePrepModule } from '@/lib/api'

const DEFAULT_COPY = {
    eyebrow:  'Six-week guided course',
    title:    'Marriage prep, together.',
    subtitle: 'Six weeks of guided conversations, scriptures, and homework — finishing with a pastor’s sign-off so you walk into your covenant ready, not just rushed.',
    cta_label: 'Enrol your couple',
    cta_href:  '#enrol',
    section_heading: 'The journey',
    section_sub:     'One week at a time. No skipping ahead — even the rush is part of the lesson.',
}

export default function MarriagePrepPage() {
    const [modules, setModules] = useState<MarriagePrepModule[]>([])
    const [loading, setLoading] = useState(true)
    const [enrolling, setEnrolling] = useState(false)
    const [done, setDone] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [copy, setCopy] = useState(DEFAULT_COPY)

    const [partnerA, setPartnerA] = useState('')
    const [emailA, setEmailA] = useState('')
    const [partnerB, setPartnerB] = useState('')
    const [emailB, setEmailB] = useState('')
    const [weddingDate, setWeddingDate] = useState('')

    useEffect(() => {
        marriagePrepApi.modules()
            .then(setModules)
            .catch(() => { /* page still works without modules */ })
            .finally(() => setLoading(false))
        ministryContentApi.get('marriage-prep-page')
            .then(r => setCopy({ ...DEFAULT_COPY, ...(r.content || {}) }))
            .catch(() => { /* keep defaults */ })
    }, [])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!partnerA || !emailA || !partnerB) return
        setEnrolling(true); setErr(null)
        try {
            await marriagePrepApi.enrol({
                partner_a_name: partnerA, partner_a_email: emailA,
                partner_b_name: partnerB, partner_b_email: emailB || null,
                intended_wedding_date: weddingDate || null,
            })
            setDone(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (e) {
            setErr((e as Error).message)
        } finally {
            setEnrolling(false)
        }
    }

    const published = modules.filter(m => m.is_published).sort((a, b) => a.week_number - b.week_number)

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            {/* Hero */}
            <section className="relative overflow-hidden py-24 px-4">
                <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-rose-300/20 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] rounded-full bg-[#f5bb00]/20 blur-[120px] pointer-events-none" />
                <div className="relative max-w-3xl mx-auto text-center">
                    <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.4em] text-xs uppercase mb-4">
                        <Sparkles className="w-3.5 h-3.5" /> {copy.eyebrow}
                    </p>
                    <h1 className="font-serif text-5xl md:text-7xl font-black text-[#140152] leading-[1.05] tracking-tight">
                        {copy.title}
                    </h1>
                    <p className="text-lg text-[#140152]/70 mt-6 max-w-xl mx-auto leading-relaxed">
                        {copy.subtitle}
                    </p>
                    <a href={copy.cta_href || '#enrol'} className="inline-flex items-center gap-2 mt-8 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-7 py-3.5 rounded-full shadow-lg">
                        {copy.cta_label} <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </section>

            {/* Curriculum */}
            <section className="max-w-4xl mx-auto px-4 pb-16">
                <h2 className="text-center text-3xl font-black text-[#140152] mb-2">{copy.section_heading}</h2>
                <p className="text-center text-[#140152]/60 text-sm mb-10">{copy.section_sub}</p>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
                ) : published.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-10 text-center text-gray-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Curriculum is being prepared. You can still enrol below and we&apos;ll start with you as soon as it&apos;s ready.</p>
                    </div>
                ) : (
                    <ol className="space-y-3">
                        {published.map(m => (
                            <li key={m.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5bb00] to-amber-400 text-[#140152] font-black flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[8px] uppercase tracking-widest opacity-70">Week</span>
                                    <span className="text-xl leading-none">{m.week_number}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-[#140152]">{m.title}</h3>
                                    {m.scripture && <p className="text-xs italic text-gray-500 mt-0.5">{m.scripture}</p>}
                                    {m.summary && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{m.summary}</p>}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            {/* Enrolment form */}
            <section id="enrol" className="max-w-2xl mx-auto px-4 pb-32">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
                    {done ? (
                        <div className="text-center py-6">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                            <h3 className="text-2xl font-black text-[#140152]">Enrolled.</h3>
                            <p className="text-gray-600 mt-3 max-w-md mx-auto">
                                Your pastor will reach out with the week one materials. Set aside 90 minutes together each week — phones away, hearts open.
                            </p>
                            <a href="/" className="inline-flex items-center gap-2 mt-6 bg-[#140152] text-white font-bold px-6 py-3 rounded-full text-sm">
                                Back to home
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-4">
                            <div className="text-center mb-4">
                                <Heart className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                                <h3 className="text-2xl font-black text-[#140152]">Enrol your couple</h3>
                                <p className="text-xs text-gray-500 mt-1">A pastor will respond within the week.</p>
                            </div>

                            {err && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5" />{err}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#140152] pl-2">Partner A</label>
                                <input value={partnerA} onChange={e => setPartnerA(e.target.value)} required placeholder="Full name" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm" />
                                <input type="email" value={emailA} onChange={e => setEmailA(e.target.value)} required placeholder="Email (required)" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#140152] pl-2">Partner B</label>
                                <input value={partnerB} onChange={e => setPartnerB(e.target.value)} required placeholder="Full name" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm" />
                                <input type="email" value={emailB} onChange={e => setEmailB(e.target.value)} placeholder="Email (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#140152] pl-2 inline-flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Intended wedding date (optional)
                                </label>
                                <input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm" />
                            </div>

                            <button type="submit" disabled={enrolling} className="w-full inline-flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-5 py-3.5 rounded-full text-sm disabled:opacity-60">
                                {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Enrol us
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

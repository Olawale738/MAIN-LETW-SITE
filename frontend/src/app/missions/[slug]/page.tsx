'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, MapPin, Heart, Globe, Mail, ArrowLeft, CheckCircle2, Calendar, HandHeart } from 'lucide-react'
import { missionariesApi, type Missionary, type MissionaryUpdate, type SupportStats } from '@/lib/api'

export default function MissionaryDetailPage() {
    const { slug } = useParams() as { slug: string }
    const [m, setM] = useState<Missionary | null>(null)
    const [updates, setUpdates] = useState<MissionaryUpdate[]>([])
    const [stats, setStats] = useState<SupportStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            missionariesApi.bySlug(slug),
            missionariesApi.updates(slug).catch(() => []),
            missionariesApi.supportStats(slug).catch(() => null),
        ]).then(([mm, uu, ss]) => { setM(mm); setUpdates(uu); setStats(ss) })
            .finally(() => setLoading(false))
    }, [slug])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
    if (!m) return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[#fbf5e6]">
            <div className="text-center">
                <p className="text-gray-500 mb-4">Missionary not found.</p>
                <Link href="/missions" className="text-[#140152] font-bold hover:underline">← Back to missions</Link>
            </div>
        </main>
    )

    return (
        <main className="min-h-screen bg-[#fbf5e6]">
            <div className="relative h-[55vh] bg-gradient-to-br from-[#140152] via-[#1a0270] to-[#0c0140] overflow-hidden">
                {m.photo_url && <img src={m.photo_url} alt={m.name} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#fbf5e6] via-[#140152]/30 to-transparent" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-40 relative z-10 pb-24">
                <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 mb-6">
                    <Link href="/missions" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#140152] mb-5"><ArrowLeft className="w-4 h-4" /> All missionaries</Link>

                    <div className="flex items-center gap-2 flex-wrap mb-3 text-xs">
                        <span className="bg-[#140152]/10 text-[#140152] px-2 py-1 rounded-full font-bold inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.country}{m.region ? `, ${m.region}` : ''}</span>
                        {m.organisation && <span className="bg-[#f5bb00]/15 text-[#140152] px-2 py-1 rounded-full font-bold inline-flex items-center gap-1"><Globe className="w-3 h-3" /> {m.organisation}</span>}
                        {m.sent_date && <span className="text-gray-500 inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Sent {new Date(m.sent_date).toLocaleDateString()}</span>}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-[#140152]">{m.name}</h1>
                    <p className="text-lg text-gray-600 mt-3">{m.ministry_focus}</p>

                    {m.bio && <div className="prose prose-lg max-w-none mt-6 text-gray-700 whitespace-pre-wrap">{m.bio}</div>}

                    {m.prayer_points && m.prayer_points.length > 0 && (
                        <div className="mt-8 bg-[#fbf5e6] rounded-2xl p-5">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#f5bb00] mb-3 inline-flex items-center gap-2"><Heart className="w-3.5 h-3.5" /> Pray with us</p>
                            <ul className="space-y-2">
                                {m.prayer_points.map((p, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-[#f5bb00] mt-1">•</span> {p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <SponsorBlock m={m} stats={stats} />

                {updates.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-md p-6 sm:p-8 mt-6">
                        <h2 className="text-xl font-black text-[#140152] mb-5">Field updates</h2>
                        <div className="space-y-6">
                            {updates.map(u => (
                                <article key={u.id} className="border-b border-gray-100 pb-6 last:border-0">
                                    <p className="text-xs text-gray-500 mb-1">{new Date(u.published_at).toLocaleDateString()}</p>
                                    <h3 className="font-bold text-[#140152] text-lg">{u.title}</h3>
                                    {u.hero_image_url && <img src={u.hero_image_url} alt="" className="w-full aspect-video object-cover rounded-xl mt-3 mb-3" />}
                                    <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: u.body_html }} />
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

function SponsorBlock({ m, stats }: { m: Missionary; stats: SupportStats | null }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [amount, setAmount] = useState(25)
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const submit = async () => {
        if (!name || !email || amount <= 0) return
        setSubmitting(true); setErr(null)
        try {
            await missionariesApi.sponsor(m.slug, { supporter_name: name, supporter_email: email, monthly_amount: amount, note: note || undefined })
            setDone(true)
        } catch (e) { setErr((e as Error).message) }
        finally { setSubmitting(false) }
    }

    if (done) return (
        <div className="bg-gradient-to-br from-[#140152] to-[#1a0270] text-white rounded-3xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#f5bb00] mx-auto mb-3" />
            <h3 className="text-2xl font-black">Thank you for standing with {m.name.split(' ')[0]}!</h3>
            <p className="text-white/70 mt-2 text-sm">Watch your inbox — we'll be in touch with next steps to set up your monthly support.</p>
        </div>
    )

    return (
        <div className="bg-gradient-to-br from-[#140152] to-[#1a0270] text-white rounded-3xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest text-[#f5bb00] font-bold mb-1 inline-flex items-center gap-2"><HandHeart className="w-3.5 h-3.5" /> Become a monthly supporter</p>
            <h2 className="text-2xl md:text-3xl font-black mb-4">Sponsor {m.name.split(' ')[0]}</h2>

            {stats && stats.monthly_goal > 0 && (
                <div className="bg-white/10 rounded-xl p-4 mb-5">
                    <div className="flex items-baseline justify-between text-sm mb-2">
                        <span className="text-white/70">Monthly support raised</span>
                        <span className="font-bold">{stats.currency} {stats.monthly_raised.toLocaleString()} / {stats.monthly_goal.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#f5bb00] to-[#ffc820]" style={{ width: `${Math.min(stats.percent, 100)}%` }} />
                    </div>
                    <p className="text-xs text-white/60 mt-2">{stats.supporter_count} supporter{stats.supporter_count === 1 ? '' : 's'} · {stats.percent.toFixed(0)}% funded</p>
                </div>
            )}

            {err && <p className="text-red-300 text-sm mb-3">{err}</p>}

            <div className="space-y-3">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-[#f5bb00]" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-[#f5bb00]" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Monthly amount ({m.currency})</p>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                        {[10, 25, 50, 100, 250].map(v => (
                            <button key={v} onClick={() => setAmount(v)} className={`py-2 rounded-lg text-xs font-bold ${amount === v ? 'bg-[#f5bb00] text-[#140152]' : 'bg-white/10 hover:bg-white/20 text-white'}`}>{v}</button>
                        ))}
                    </div>
                    <input type="number" min={5} value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-lg font-bold text-center" />
                </div>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Optional message…" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-[#f5bb00]" />
                <button onClick={submit} disabled={submitting || !name || !email || amount <= 0}
                    className="w-full bg-[#f5bb00] hover:bg-[#ffc820] text-[#140152] font-black px-6 py-3.5 rounded-xl text-base disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <HandHeart className="w-5 h-5" />}
                    Sponsor for {m.currency} {amount}/month
                </button>
            </div>
        </div>
    )
}

'use client'
/**
 * Couple portal — /marriage-prep/journey/[coupleId]
 *
 * Capability-link access: the couple's UUID (from their enrolment email or
 * the admin's "Copy portal link") IS the credential. Couples read each week's
 * module, write shared reflections, and mark weeks complete. Progress
 * upserts through the existing /marriage-prep/progress endpoint.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    Loader2, Heart, CheckCircle, ChevronDown, Quote, BookOpen,
    PenLine, Save, Sparkles, Award, AlertCircle, Link as LinkIcon, FileText, Video, X,
} from 'lucide-react'
import { marriagePrepApi, ministryContentApi, toVideoEmbedUrl, type MarriagePrepModule } from '@/lib/api'
import JitsiMeet, { marriagePrepRoom } from '@/components/JitsiMeet'

interface CoupleInfo {
    id: string; partner_a_name: string; partner_b_name: string
    intended_wedding_date: string | null; status: string; pastor_signed_off: boolean
}
interface ProgressRow {
    id: string; couple_id: string; module_id: string
    completed_at: string | null; reflections: string | null
}

export default function CoupleJourneyPage() {
    const params = useParams<{ coupleId: string }>()
    const coupleId = params?.coupleId || ''

    const [couple, setCouple] = useState<CoupleInfo | null>(null)
    const [modules, setModules] = useState<MarriagePrepModule[]>([])
    const [progress, setProgress] = useState<Record<string, ProgressRow>>({})
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [openWeek, setOpenWeek] = useState<string | null>(null)
    // Jitsi video call — enabled + domain are admin-editable (see
    // /admin/page-copy → marriage-prep). Defaults keep it on via meet.jit.si.
    const [jitsiEnabled, setJitsiEnabled] = useState(true)
    const [jitsiDomain, setJitsiDomain] = useState('meet.jit.si')
    const [inCall, setInCall] = useState(false)

    const refresh = async () => {
        try {
            const [c, m, p] = await Promise.all([
                marriagePrepApi.getCouple(coupleId),
                marriagePrepApi.modules(),
                marriagePrepApi.coupleProgress(coupleId),
            ])
            setCouple(c)
            setModules(m.filter(x => x.is_published).sort((a, b) => a.week_number - b.week_number))
            const map: Record<string, ProgressRow> = {}
            p.forEach(r => { map[r.module_id] = r })
            setProgress(map)
        } catch {
            setNotFound(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { if (coupleId) refresh() }, [coupleId])  // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        ministryContentApi.get('marriage-prep-page')
            .then(r => {
                const c = (r.content || {}) as { jitsi_enabled?: boolean; jitsi_domain?: string }
                if (c.jitsi_enabled === false) setJitsiEnabled(false)
                if (c.jitsi_domain) setJitsiDomain(c.jitsi_domain)
            })
            .catch(() => { /* keep defaults */ })
    }, [])

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fbf5e6]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    if (notFound || !couple) {
        return (
            <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <AlertCircle className="w-14 h-14 mx-auto text-amber-500 mb-4" />
                    <h2 className="text-2xl font-black text-[#140152]">Link not recognised</h2>
                    <p className="text-gray-600 mt-3 text-sm">This portal link doesn&apos;t match an enrolled couple. Check the link in your enrolment email, or ask your pastor to re-send it.</p>
                    <Link href="/marriage-prep" className="mt-6 inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full text-sm">Back to Marriage Prep</Link>
                </div>
            </main>
        )
    }

    const doneCount = modules.filter(m => progress[m.id]?.completed_at).length
    const pct = modules.length ? Math.round((doneCount / modules.length) * 100) : 0

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            {/* Header */}
            <section className="relative overflow-hidden pt-24 pb-10 px-4 text-center">
                <div className="absolute -top-32 right-0 w-[420px] h-[420px] rounded-full bg-rose-300/20 blur-[110px] pointer-events-none" />
                <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.4em] text-xs uppercase mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> Your journey
                </p>
                <h1 className="font-serif text-4xl md:text-5xl font-black text-[#140152]">
                    {couple.partner_a_name} <span className="text-rose-400 font-light">&amp;</span> {couple.partner_b_name}
                </h1>
                {couple.intended_wedding_date && (
                    <p className="text-sm text-[#140152]/60 mt-2">Wedding · {new Date(couple.intended_wedding_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}

                {/* Progress bar */}
                <div className="max-w-md mx-auto mt-6">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-[#140152]/60 mb-1.5">
                        <span>{doneCount} of {modules.length} weeks</span><span>{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-[#140152]/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#f5bb00] to-amber-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                </div>

                {couple.pastor_signed_off && (
                    <div className="mt-5 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full px-4 py-2 text-sm font-bold">
                        <Award className="w-4 h-4" /> Course complete — signed off by your pastor.
                        <Link href={`/marriage-prep/complete/${couple.id}`} className="underline">Certificate →</Link>
                    </div>
                )}
            </section>

            {/* Video session with the pastor */}
            {jitsiEnabled && (
                <section className="max-w-3xl mx-auto px-4 pb-6">
                    {inCall ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3">
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <p className="text-sm font-black text-[#140152] inline-flex items-center gap-2">
                                    <Video className="w-4 h-4 text-rose-500" /> Video session
                                </p>
                                <button onClick={() => setInCall(false)} className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#140152]">
                                    <X className="w-4 h-4" /> Leave
                                </button>
                            </div>
                            <div className="h-[70vh] min-h-[420px]">
                                <JitsiMeet
                                    room={marriagePrepRoom(couple.id)}
                                    domain={jitsiDomain}
                                    displayName={`${couple.partner_a_name} & ${couple.partner_b_name}`}
                                    subject="Marriage Prep — pastoral session"
                                    onClose={() => setInCall(false)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                <Video className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-[#140152]">Meet your pastor by video</h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Your private room is always here. Start it when your pastor asks — they join the same link from their side.
                                </p>
                            </div>
                            <button onClick={() => setInCall(true)}
                                className="inline-flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-3 rounded-full text-sm shrink-0">
                                <Video className="w-4 h-4" /> Start video call
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Weeks */}
            <section className="max-w-3xl mx-auto px-4 pb-24 space-y-3">
                {modules.length === 0 && (
                    <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-10 text-center text-gray-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Curriculum is being prepared — your pastor will let you know when week one is ready.</p>
                    </div>
                )}
                {modules.map(m => (
                    <WeekCard
                        key={m.id}
                        module={m}
                        row={progress[m.id]}
                        open={openWeek === m.id}
                        onToggle={() => setOpenWeek(openWeek === m.id ? null : m.id)}
                        coupleId={couple.id}
                        onSaved={refresh}
                    />
                ))}
            </section>
        </main>
    )
}

function WeekCard({ module: m, row, open, onToggle, coupleId, onSaved }: {
    module: MarriagePrepModule
    row: { completed_at: string | null; reflections: string | null } | undefined
    open: boolean
    onToggle: () => void
    coupleId: string
    onSaved: () => Promise<void> | void
}) {
    const done = !!row?.completed_at
    const [reflections, setReflections] = useState(row?.reflections || '')
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    const save = async (complete: boolean) => {
        setSaving(true); setMsg(null)
        try {
            await marriagePrepApi.logProgress(coupleId, m.id, reflections, complete)
            setMsg(complete ? 'Week marked complete. Well done!' : 'Reflections saved.')
            await onSaved()
        } catch (e) {
            setMsg((e as Error).message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <article className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-shadow ${done ? 'border-emerald-200' : 'border-gray-100'}`}>
            <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left">
                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-gradient-to-br from-[#f5bb00] to-amber-400 text-[#140152]'}`}>
                    {done ? <CheckCircle className="w-6 h-6" /> : <><span className="text-[8px] uppercase tracking-widest opacity-70">Wk</span><span className="text-lg leading-none">{m.week_number}</span></>}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-[#140152]">{m.title}</h3>
                    {m.scripture && <p className="text-xs italic text-gray-500 mt-0.5 inline-flex items-center gap-1"><Quote className="w-3 h-3" />{m.scripture}</p>}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="px-5 pb-6 border-t border-gray-50">
                    {m.summary && <p className="text-sm text-gray-700 mt-4 leading-relaxed">{m.summary}</p>}
                    {m.body_html && (
                        <div className="prose prose-sm max-w-none mt-4 text-gray-800"
                            dangerouslySetInnerHTML={{ __html: m.body_html }} />
                    )}
                    {m.homework && (
                        <div className="mt-5 bg-[#fbf5e6] border border-[#f5bb00]/30 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#b8860b] mb-1.5 inline-flex items-center gap-1.5"><PenLine className="w-3 h-3" /> This week&apos;s homework</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.homework}</p>
                        </div>
                    )}
                    {!!m.resources?.length && (
                        <div className="mt-4 space-y-3">
                            {m.resources.filter(r => r.kind === 'video').map(r => (
                                <div key={r.id}>
                                    <p className="text-xs font-bold text-gray-600 mb-1.5">{r.title}</p>
                                    <div className="aspect-video rounded-xl overflow-hidden border border-gray-100 bg-black/5">
                                        <iframe
                                            src={toVideoEmbedUrl(r.external_url || '')}
                                            className="w-full h-full" title={r.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            ))}
                            {m.resources.some(r => r.kind !== 'video') && (
                                <ul className="space-y-1.5">
                                    {m.resources.filter(r => r.kind !== 'video').map(r => (
                                        <li key={r.id}>
                                            <a
                                                href={r.kind === 'file' ? marriagePrepApi.moduleResourceFileUrl(r.id) : (r.external_url || '#')}
                                                target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm text-[#140152] font-bold underline underline-offset-2"
                                            >
                                                {r.kind === 'url' ? <LinkIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                                {r.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Shared reflections */}
                    <div className="mt-5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Your shared reflections</label>
                        <textarea value={reflections} onChange={e => setReflections(e.target.value)} rows={4}
                            placeholder="What did this week surface for the two of you? Write it together."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-y" />
                    </div>

                    {msg && <p className="text-xs text-emerald-700 mt-2">{msg}</p>}

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => save(false)} disabled={saving}
                            className="inline-flex items-center gap-2 border border-gray-200 hover:border-[#140152] text-gray-700 hover:text-[#140152] font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save reflections
                        </button>
                        {!done && (
                            <button onClick={() => save(true)} disabled={saving}
                                className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Mark week complete
                            </button>
                        )}
                        {done && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-bold px-2">
                                <CheckCircle className="w-4 h-4" /> Completed {row?.completed_at ? new Date(row.completed_at).toLocaleDateString() : ''}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </article>
    )
}

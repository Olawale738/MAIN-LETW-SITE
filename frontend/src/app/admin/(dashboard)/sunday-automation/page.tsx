'use client'
/**
 * Sunday Automation — per-sermon pipeline runner + output editor.
 *
 * Workflow:
 *   1. Pick a sermon from the list.
 *   2. Click "Run pipeline" → Whisper transcribes + Claude generates the 4
 *      outputs (notes / email / blog / social) + chapter markers.
 *   3. Edit any output freely. Save returns the same shape.
 *   4. Click "Send Monday email" → fan-out to every user.
 *
 * Nothing auto-publishes — every output stays a draft until the admin presses
 * the relevant button (Send / Publish blog manually / etc.).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Sparkles, AlertCircle, CheckCircle, Mail, FileText, Quote, Hash,
    Send, RefreshCw, ExternalLink, Activity, RotateCcw,
} from 'lucide-react'
import {
    sermonApi, sundayAutomationApi, type Sermon,
    type SundayAutomationOutputs,
} from '@/lib/api'

type Msg = { kind: 'ok' | 'err'; text: string } | null

export default function SundayAutomationAdmin() {
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [loadingList, setLoadingList] = useState(true)
    const [selectedId, setSelectedId] = useState<string>('')
    const [data, setData] = useState<SundayAutomationOutputs | null>(null)
    const [busy, setBusy] = useState<'' | 'load' | 'run' | 'save' | 'send'>('')
    const [msg, setMsg] = useState<Msg>(null)

    // Initial sermon list — only the published ones; admins re-run automation
    // through this list, so unpublished drafts stay out.
    useEffect(() => {
        sermonApi.getAllSermons(true)
            .then(d => setSermons(d.sermons || []))
            .catch(e => setMsg({ kind: 'err', text: (e as Error).message }))
            .finally(() => setLoadingList(false))
    }, [])

    useEffect(() => {
        if (!selectedId) { setData(null); return }
        setBusy('load')
        sundayAutomationApi.get(selectedId)
            .then(setData)
            .catch(e => setMsg({ kind: 'err', text: (e as Error).message }))
            .finally(() => setBusy(''))
    }, [selectedId])

    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(t) } }, [msg])

    const run = async (force = false) => {
        if (!selectedId) return
        if (!confirm(force
            ? 'Re-transcribe the audio and regenerate all outputs? Existing edits will be overwritten.'
            : 'Run the pipeline now? Transcription + 4 generations.')) return
        setBusy('run'); setMsg(null)
        try {
            const out = await sundayAutomationApi.run(selectedId, force)
            setData(out)
            setMsg({ kind: 'ok', text: 'Pipeline complete. Review each output below and edit anything before sending or publishing.' })
        } catch (e) {
            setMsg({ kind: 'err', text: (e as Error).message })
        } finally { setBusy('') }
    }

    const save = async () => {
        if (!data || !selectedId) return
        setBusy('save'); setMsg(null)
        try {
            const out = await sundayAutomationApi.update(selectedId, {
                transcript:         data.transcript,
                auto_notes:         data.auto_notes,
                auto_email_subject: data.auto_email_subject,
                auto_email_body:    data.auto_email_body,
                auto_blog_draft:    data.auto_blog_draft,
                auto_social_posts:  data.auto_social_posts,
                auto_chapters:      data.auto_chapters,
            })
            setData(out)
            setMsg({ kind: 'ok', text: 'Saved.' })
        } catch (e) {
            setMsg({ kind: 'err', text: (e as Error).message })
        } finally { setBusy('') }
    }

    const sendEmail = async () => {
        if (!selectedId || !data?.auto_email_subject || !data?.auto_email_body) {
            setMsg({ kind: 'err', text: 'Subject and body are required before sending.' }); return
        }
        if (!confirm(`Send "${data.auto_email_subject}" to every member with an email on file?`)) return
        setBusy('send'); setMsg(null)
        try {
            const r = await sundayAutomationApi.sendEmail(selectedId)
            setMsg({ kind: 'ok', text: `Sent to ${r.sent} of ${r.total}. (${r.failed} failed)` })
            // Pick up the timestamp.
            const fresh = await sundayAutomationApi.get(selectedId)
            setData(fresh)
        } catch (e) {
            setMsg({ kind: 'err', text: (e as Error).message })
        } finally { setBusy('') }
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3">
                        <Sparkles className="w-7 h-7 text-[#f5bb00]" /> Sunday Automation
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm max-w-2xl">
                        Pick a Sunday sermon → run the pipeline → review and tweak each output → send the Monday recap.
                        Whisper does the transcription, your configured AI provider generates the notes, email, blog draft,
                        social posts, and audio chapter markers in one round-trip.
                    </p>
                </div>
                <Link href="/admin/ai" target="_blank" className="text-xs underline text-gray-500 hover:text-[#140152]">
                    AI provider keys →
                </Link>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm flex-1">{msg.text}</span>
                </div>
            )}

            <div className="grid lg:grid-cols-[260px_1fr] gap-5">
                {/* ── Sermon picker ── */}
                <aside className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-fit max-h-[80vh] flex flex-col">
                    <p className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-400">Sermons</p>
                    <div className="overflow-y-auto">
                        {loadingList && <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#140152]" /></div>}
                        {!loadingList && sermons.length === 0 && (
                            <p className="p-4 text-xs text-gray-400">No sermons yet. Add one in <Link href="/admin/sermons" className="underline">/admin/sermons</Link>.</p>
                        )}
                        {sermons.map(s => (
                            <button key={s.id} onClick={() => setSelectedId(s.id!)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedId === s.id ? 'bg-[#f5bb00]/10 border-l-4 border-l-[#f5bb00]' : ''}`}>
                                <p className="text-sm font-bold text-[#140152] truncate">{s.title}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                    {s.sermon_date ? new Date(s.sermon_date).toLocaleDateString() : '—'} · {s.preacher}
                                </p>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ── Detail / outputs ── */}
                <main>
                    {!selectedId && (
                        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400">
                            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p>Pick a sermon on the left to see or generate its automation outputs.</p>
                        </div>
                    )}

                    {selectedId && busy === 'load' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[#140152]" />
                        </div>
                    )}

                    {selectedId && data && busy !== 'load' && (
                        <div className="space-y-4">
                            {/* Action bar */}
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center gap-2 flex-wrap">
                                <button onClick={() => run(false)} disabled={!!busy}
                                    className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50">
                                    {busy === 'run' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                                    Run pipeline
                                </button>
                                <button onClick={() => run(true)} disabled={!!busy}
                                    title="Re-run Whisper from scratch + regenerate"
                                    className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-[#140152] text-gray-600 hover:text-[#140152] font-bold px-3 py-2.5 rounded-xl text-xs">
                                    <RefreshCw className="w-3.5 h-3.5" /> Re-transcribe
                                </button>
                                <div className="flex-1" />
                                <button onClick={save} disabled={!!busy}
                                    className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                                    {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save edits
                                </button>
                                <button onClick={sendEmail} disabled={!!busy || !data.auto_email_subject || !data.auto_email_body}
                                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-40">
                                    {busy === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Monday email
                                </button>
                            </div>

                            {/* Timestamps */}
                            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                                {data.auto_generated_at ? <>Generated {new Date(data.auto_generated_at).toLocaleString()}</> : 'Not yet generated'}
                                {data.auto_email_sent_at ? <> · Email sent {new Date(data.auto_email_sent_at).toLocaleString()}</> : null}
                            </p>

                            {/* Transcript */}
                            <Section title="Transcript" icon={<Quote className="w-4 h-4" />}>
                                <textarea value={data.transcript || ''} onChange={e => setData({ ...data, transcript: e.target.value })}
                                    rows={6} placeholder="Whisper transcription appears here. You can paste a manual transcript instead."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                            </Section>

                            {/* Notes */}
                            <Section title="Sermon notes (HTML)" icon={<FileText className="w-4 h-4" />}
                                helper="A printable outline — main points + scriptures + application questions. Edit the HTML directly.">
                                <textarea value={data.auto_notes || ''} onChange={e => setData({ ...data, auto_notes: e.target.value })}
                                    rows={10}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                            </Section>

                            {/* Email */}
                            <Section title="Monday-morning email" icon={<Mail className="w-4 h-4" />}
                                helper="Will go to every member with an email on file. Subject ≤300 chars.">
                                <input value={data.auto_email_subject || ''} onChange={e => setData({ ...data, auto_email_subject: e.target.value })}
                                    placeholder="Subject" maxLength={300}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
                                <textarea value={data.auto_email_body || ''} onChange={e => setData({ ...data, auto_email_body: e.target.value })}
                                    rows={10} placeholder="HTML body"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                            </Section>

                            {/* Blog */}
                            <Section title="Blog post draft (HTML)" icon={<FileText className="w-4 h-4" />}
                                helper="Long-form pastoral reflection. Copy this into /admin/blog when ready.">
                                <textarea value={data.auto_blog_draft || ''} onChange={e => setData({ ...data, auto_blog_draft: e.target.value })}
                                    rows={10}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                            </Section>

                            {/* Social */}
                            <Section title="Social media posts" icon={<Sparkles className="w-4 h-4" />}
                                helper="One post per platform. Edit freely or remove a platform you don't use.">
                                {(data.auto_social_posts || []).map((p, i) => (
                                    <div key={i} className="border border-gray-100 rounded-lg p-3 mb-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <input value={p.platform} onChange={e => {
                                                const next = [...(data.auto_social_posts || [])]
                                                next[i] = { ...p, platform: e.target.value }
                                                setData({ ...data, auto_social_posts: next })
                                            }} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-transparent w-32" />
                                            <button onClick={() => setData({ ...data, auto_social_posts: (data.auto_social_posts || []).filter((_, j) => j !== i) })}
                                                className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                        </div>
                                        <textarea value={p.text} onChange={e => {
                                            const next = [...(data.auto_social_posts || [])]
                                            next[i] = { ...p, text: e.target.value }
                                            setData({ ...data, auto_social_posts: next })
                                        }} rows={3} className="w-full text-sm border-0 outline-none resize-y" />
                                    </div>
                                ))}
                                <button onClick={() => setData({ ...data, auto_social_posts: [...(data.auto_social_posts || []), { platform: 'platform', text: '' }] })}
                                    className="text-xs underline text-gray-500 hover:text-[#140152]">+ Add post</button>
                            </Section>

                            {/* Chapters */}
                            <Section title="Audio chapter markers" icon={<Hash className="w-4 h-4" />}
                                helper="Reflected in /sermons/podcast.xml so podcast apps show chapters.">
                                {(data.auto_chapters || []).map((c, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-2">
                                        <input type="number" value={c.start_seconds} onChange={e => {
                                            const next = [...(data.auto_chapters || [])]
                                            next[i] = { ...c, start_seconds: parseInt(e.target.value) || 0 }
                                            setData({ ...data, auto_chapters: next })
                                        }} className="w-20 border border-gray-200 rounded px-2 py-1 text-xs text-right" />
                                        <span className="text-[10px] text-gray-400">sec</span>
                                        <input value={c.title} onChange={e => {
                                            const next = [...(data.auto_chapters || [])]
                                            next[i] = { ...c, title: e.target.value }
                                            setData({ ...data, auto_chapters: next })
                                        }} className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm" />
                                        <button onClick={() => setData({ ...data, auto_chapters: (data.auto_chapters || []).filter((_, j) => j !== i) })}
                                            className="text-xs text-red-500 hover:text-red-700">×</button>
                                    </div>
                                ))}
                                <button onClick={() => setData({ ...data, auto_chapters: [...(data.auto_chapters || []), { start_seconds: 0, title: 'New chapter' }] })}
                                    className="text-xs underline text-gray-500 hover:text-[#140152]">+ Add chapter</button>
                            </Section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

function Section({ title, icon, helper, children }: { title: string; icon: React.ReactNode; helper?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1 text-[#140152]">{icon}<h3 className="font-black">{title}</h3></div>
            {helper && <p className="text-xs text-gray-500 mb-3">{helper}</p>}
            {children}
        </div>
    )
}

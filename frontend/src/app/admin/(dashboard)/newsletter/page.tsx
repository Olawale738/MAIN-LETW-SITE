'use client'
import React, { useEffect, useState } from 'react'
import { Loader2, Mail, Users, Send, Trash2, AlertCircle, CheckCircle, RefreshCw, History } from 'lucide-react'
import RichTextEditor from '@/components/ui/rich-text-editor'
import { blogApi, type BlogPost } from '@/lib/api'
import { useMultiSelect } from '@/hooks/useMultiSelect'
import BulkActionBar from '@/components/admin/BulkActionBar'

interface Subscriber {
    id: string
    email: string
    name?: string
    is_active: boolean
    source?: string
    subscribed_at: string
}

interface Broadcast {
    id: string
    subject: string
    recipients_count: number
    success_count: number
    failure_count: number
    created_at: string
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function token() {
    return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
}
async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
    const t = token()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> ?? {}),
    }
    if (t) headers.Authorization = `Bearer ${t}`
    const res = await fetch(`${API}${path}`, { ...init, headers })
    if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || `${res.status} ${res.statusText}`)
    }
    if (res.status === 204) return {} as T
    return res.json()
}

export default function AdminNewsletterPage() {
    const [tab, setTab] = useState<'compose' | 'subscribers' | 'history'>('compose')
    const [count, setCount] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [ok, setOk] = useState<string | null>(null)

    // compose state
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const [confirming, setConfirming] = useState(false)

    // data
    const [subs, setSubs] = useState<Subscriber[]>([])
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])

    const loadCount = async () => {
        try {
            const d = await api<{ active_subscribers: number }>('/newsletter/subscribers/count')
            setCount(d.active_subscribers)
        } catch (e) { setErr((e as Error).message) }
    }
    const loadSubs = async () => {
        try { setSubs(await api<Subscriber[]>('/newsletter/subscribers?active_only=true')) }
        catch (e) { setErr((e as Error).message) }
    }
    const loadBroadcasts = async () => {
        try { setBroadcasts(await api<Broadcast[]>('/newsletter/broadcasts')) }
        catch (e) { setErr((e as Error).message) }
    }

    useEffect(() => {
        (async () => {
            setLoading(true)
            await Promise.all([loadCount(), loadSubs(), loadBroadcasts()])
            setLoading(false)
        })()
    }, [])

    useEffect(() => {
        if (ok || err) { const t = setTimeout(() => { setOk(null); setErr(null) }, 5000); return () => clearTimeout(t) }
    }, [ok, err])

    const broadcast = async () => {
        if (!subject.trim() || !body.trim()) return
        setSending(true); setErr(null); setOk(null)
        try {
            const r = await api<Broadcast>('/newsletter/broadcast', {
                method: 'POST',
                body: JSON.stringify({ subject, body_html: body }),
            })
            setOk(`Sent to ${r.success_count} of ${r.recipients_count} subscriber${r.recipients_count === 1 ? '' : 's'}${r.failure_count ? ` (${r.failure_count} failed)` : ''}.`)
            setSubject(''); setBody('')
            setConfirming(false)
            await loadBroadcasts()
        } catch (e) {
            setErr((e as Error).message)
        } finally {
            setSending(false)
        }
    }

    const removeSub = async (id: string, email: string) => {
        if (!confirm(`Remove ${email} from the newsletter list?`)) return
        try {
            await api(`/newsletter/subscribers/${id}`, { method: 'DELETE' })
            setOk('Subscriber removed.')
            await Promise.all([loadCount(), loadSubs()])
        } catch (e) {
            setErr((e as Error).message)
        }
    }

    const deleteBroadcast = async (id: string, subject: string) => {
        if (!confirm(`Delete "${subject || '(no subject)'}" from history?\n\nThis only clears the log entry — it does NOT unsend the email.`)) return
        try {
            await api(`/newsletter/broadcasts/${id}`, { method: 'DELETE' })
            setOk('Broadcast entry removed from history.')
            await loadBroadcasts()
        } catch (e) {
            setErr((e as Error).message)
        }
    }

    const clearAllHistory = async () => {
        if (broadcasts.length === 0) return
        if (!confirm(`Clear ALL ${broadcasts.length} broadcast${broadcasts.length === 1 ? '' : 's'} from history?\n\nThis only clears the log — it does NOT unsend any emails. This cannot be undone.`)) return
        if (!confirm('Are you absolutely sure? Type-check: this will delete every past broadcast record permanently.')) return
        try {
            const r = await api<{ deleted: number }>(`/newsletter/broadcasts`, { method: 'DELETE' })
            setOk(`Cleared ${r.deleted} broadcast${r.deleted === 1 ? '' : 's'} from history.`)
            await loadBroadcasts()
        } catch (e) {
            setErr((e as Error).message)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Mail className="w-7 h-7" /> Newsletter</h1>
                    <p className="text-gray-500 mt-1 text-sm">Subscribers from the homepage signup. Send a general update to all of them in one click.</p>
                </div>
                <div className="flex items-center gap-3 bg-[#140152] text-white rounded-2xl px-5 py-3 shadow-lg">
                    <Users className="w-5 h-5 text-[#f5bb00]" />
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/60">Active Subscribers</p>
                        <p className="text-2xl font-black leading-tight">{count}</p>
                    </div>
                </div>
            </div>

            {/* Banners */}
            {err && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{err}</span>
                </div>
            )}
            {ok && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{ok}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
                {([
                    { id: 'compose',     label: 'Compose Update', icon: Send },
                    { id: 'subscribers', label: 'Subscribers',    icon: Users },
                    { id: 'history',     label: 'Sent History',   icon: History },
                ] as const).map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px transition-colors ${
                            tab === t.id ? 'text-[#140152] border-[#140152]' : 'text-gray-500 border-transparent hover:text-[#140152]'
                        }`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* COMPOSE */}
            {tab === 'compose' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-[#140152] mb-1">Send a General Update</h2>
                    <p className="text-sm text-gray-500 mb-5">Every active subscriber will receive this in their inbox.</p>

                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)}
                        placeholder="e.g. Weekly Update — Encounter Service this Sunday"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 mb-4" />

                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Message Body</label>
                        <InsertLatestBlogButton onInsert={(html) => setBody(body + html)} />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2">Use the toolbar to format your message — bold, italic, links, headings, lists. The branded header and unsubscribe footer are added automatically when we send.</p>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <RichTextEditor
                            content={body}
                            onChange={(html) => setBody(html)}
                            placeholder="Hi LETW family, here are this week's updates..."
                        />
                    </div>

                    {/* Preview */}
                    {(subject || body) && (
                        <div className="mt-5">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gradient-to-br from-[#140152] to-[#1a0270] text-white px-5 py-4">
                                    <p className="text-[10px] tracking-[0.25em] font-bold text-[#f5bb00] uppercase">Light Encounter Tabernacle</p>
                                    <p className="font-black text-lg mt-1 leading-tight">{subject || 'Your subject…'}</p>
                                </div>
                                <div className="bg-white px-5 py-4 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: body || '<p class="text-gray-400 italic">Your message preview will appear here…</p>' }} />
                                <div className="bg-gray-50 px-5 py-3 text-[11px] text-gray-500 border-t">Unsubscribe link is added automatically at the bottom of every send.</div>
                            </div>
                        </div>
                    )}

                    {/* Send / confirm */}
                    <div className="mt-6 flex items-center gap-3 flex-wrap">
                        {!confirming ? (
                            <button onClick={() => setConfirming(true)} disabled={!subject.trim() || !body.trim() || count === 0}
                                className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                                <Send className="w-4 h-4" /> Send to {count} Subscriber{count === 1 ? '' : 's'}
                            </button>
                        ) : (
                            <>
                                <span className="text-sm font-semibold text-[#140152]">Send "{subject || '(no subject)'}" to {count} subscriber{count === 1 ? '' : 's'}?</span>
                                <button onClick={broadcast} disabled={sending}
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl disabled:opacity-50">
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Confirm & Send
                                </button>
                                <button onClick={() => setConfirming(false)} disabled={sending}
                                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                            </>
                        )}
                        {count === 0 && <p className="text-xs text-amber-700">No active subscribers yet — invite people to subscribe from the homepage.</p>}
                    </div>
                </div>
            )}

            {/* SUBSCRIBERS */}
            {tab === 'subscribers' && <SubscribersTab subs={subs} loadCount={loadCount} loadSubs={loadSubs} setOk={setOk} setErr={setErr} />}

            {/* HISTORY */}
            {tab === 'history' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                        <p className="font-bold text-[#140152]">Past Broadcasts ({broadcasts.length})</p>
                        <div className="flex items-center gap-2">
                            <button onClick={loadBroadcasts}
                                className="text-sm text-gray-500 hover:text-[#140152] flex items-center gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5" /> Refresh
                            </button>
                            {broadcasts.length > 0 && (
                                <button onClick={clearAllHistory}
                                    className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg px-3 py-1.5 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Clear All History
                                </button>
                            )}
                        </div>
                    </div>
                    {broadcasts.length === 0 ? (
                        <div className="px-5 py-12 text-center text-gray-400">No broadcasts have been sent yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {broadcasts.map(b => (
                                <div key={b.id} className="px-5 py-4 flex items-start gap-3 hover:bg-gray-50 group">
                                    <div className="w-9 h-9 rounded-xl bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center flex-shrink-0"><Mail className="w-4 h-4" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#140152] truncate">{b.subject}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {new Date(b.created_at).toLocaleString()} · {b.success_count}/{b.recipients_count} delivered{b.failure_count ? ` · ${b.failure_count} failed` : ''}
                                        </p>
                                    </div>
                                    <button onClick={() => deleteBroadcast(b.id, b.subject)} title="Remove from history"
                                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    ><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500">
                        Clearing history only removes log entries — it does <strong>not</strong> unsend any email already delivered to subscribers.
                    </div>
                </div>
            )}
        </div>
    )
}

function SubscribersTab({ subs, loadCount, loadSubs, setOk, setErr }: { subs: Subscriber[]; loadCount: () => Promise<void>; loadSubs: () => Promise<void>; setOk: (s: string) => void; setErr: (s: string) => void }) {
    const allIds = subs.map(s => s.id)
    const { selected, isSelected, toggle, toggleAll, clear, count, allSelected, someSelected } = useMultiSelect(allIds)

    const bulkRemove = async () => {
        try {
            await Promise.all([...selected].map(id => api(`/newsletter/subscribers/${id}`, { method: 'DELETE' })))
            setOk(`Removed ${count} subscriber${count === 1 ? '' : 's'}.`)
            clear()
            await Promise.all([loadCount(), loadSubs()])
        } catch (e) { setErr((e as Error).message) }
    }

    const removeOne = async (id: string, email: string) => {
        if (!confirm(`Remove ${email}?`)) return
        try { await api(`/newsletter/subscribers/${id}`, { method: 'DELETE' }); setOk('Subscriber removed.'); await Promise.all([loadCount(), loadSubs()]) }
        catch (e) { setErr((e as Error).message) }
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <label className="flex items-center gap-2 font-bold text-[#140152] cursor-pointer">
                    <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected }} onChange={toggleAll} />
                    All Active Subscribers ({subs.length})
                </label>
                <button onClick={() => Promise.all([loadCount(), loadSubs()])} className="text-sm text-gray-500 hover:text-[#140152] flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
            </div>
            {subs.length === 0 ? (
                <div className="px-5 py-12 text-center text-gray-400">No subscribers yet.</div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {subs.map(s => (
                        <div key={s.id} className={`px-5 py-3 flex items-center gap-3 ${isSelected(s.id) ? 'bg-[#f5bb00]/10' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={isSelected(s.id)} onChange={() => toggle(s.id)} />
                            <div className="w-9 h-9 rounded-full bg-[#140152]/10 flex items-center justify-center font-bold text-[#140152] text-sm flex-shrink-0">
                                {(s.name || s.email).slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#140152] truncate">{s.email}</p>
                                <p className="text-[11px] text-gray-400 truncate">
                                    {s.name ? `${s.name} · ` : ''}{new Date(s.subscribed_at).toLocaleDateString()} · via {s.source || 'unknown'}
                                </p>
                            </div>
                            <button onClick={() => removeOne(s.id, s.email)} title="Remove from list"
                                className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            )}

            <BulkActionBar count={count} onClear={clear} label="subscriber" actions={[
                { label: 'Remove', destructive: true, icon: Trash2, confirm: 'Remove {count} subscribers from the list?', onClick: bulkRemove },
            ]} />
        </div>
    )
}

function InsertLatestBlogButton({ onInsert }: { onInsert: (html: string) => void }) {
    const [latest, setLatest] = useState<BlogPost | null>(null)
    useEffect(() => {
        blogApi.publicList({ limit: 1 }).then(rows => setLatest(rows[0] || null)).catch(() => setLatest(null))
    }, [])

    const insert = () => {
        if (!latest) return
        const url = `https://letw.org/blog/${latest.slug}`
        const html = `
<div style="border-top:1px solid #e5e7eb;margin:24px 0 16px 0;padding-top:16px">
  <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;color:#f5bb00;margin:0 0 8px 0">From the Pastor's Blog</p>
  <p style="font-size:18px;font-weight:bold;color:#140152;margin:0 0 6px 0">${latest.title}</p>
  ${latest.excerpt ? `<p style="font-size:14px;color:#475569;margin:0 0 12px 0">${latest.excerpt}</p>` : ''}
  <p style="margin:0"><a href="${url}" style="display:inline-block;background:#140152;color:#fff;padding:10px 18px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px">Read on the blog →</a></p>
</div>`
        onInsert(html)
    }

    if (!latest) return <span className="text-[10px] text-gray-400">(no blog posts yet)</span>
    return (
        <button onClick={insert} type="button" className="text-[11px] font-bold text-[#140152] bg-[#f5bb00]/15 hover:bg-[#f5bb00]/30 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
            + Insert latest blog post
        </button>
    )
}

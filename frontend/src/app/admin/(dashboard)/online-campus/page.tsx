'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Radio, Plus, Eye, Users, Hand, Cross, Heart, ExternalLink, Play, Pause, CheckCircle, RefreshCw, Trash2, Youtube, Facebook, Instagram, Twitter, Image as ImageIcon, Save, Link2 } from 'lucide-react'
import { onlineCampusApi, type CurrentService } from '@/lib/api'

export default function AdminOnlineCampusPage() {
    const [services, setServices] = useState<CurrentService[]>([])
    const [current, setCurrent] = useState<CurrentService | null>(null)
    const [altarResponses, setAltarResponses] = useState<any[]>([])
    const [raiseHand, setRaiseHand] = useState<any[]>([])
    const [communion, setCommunion] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)

    const load = async () => {
        try {
            const [s, c, a, r, co] = await Promise.all([
                onlineCampusApi.listServices(),
                onlineCampusApi.current(),
                onlineCampusApi.altarResponses(),
                onlineCampusApi.raiseHandQueue().catch(() => []),
                onlineCampusApi.listCommunion().catch(() => []),
            ])
            setServices(s); setCurrent(c); setAltarResponses(a); setRaiseHand(r as any); setCommunion(co as any)
        } catch { /* noop */ }
        finally { setLoading(false) }
    }
    useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id) }, [])

    const toggleLive = async (sid: string, is_live: boolean) => {
        await onlineCampusApi.setState(sid, { is_live: !is_live }); await load()
    }
    const toggleAltar = async (sid: string, val: boolean) => {
        await onlineCampusApi.setState(sid, { altar_call_open: !val }); await load()
    }
    const markFollowed = async (rid: string) => { await onlineCampusApi.markFollowedUp(rid); await load() }
    const closeHand = async (rid: string) => { await onlineCampusApi.updateRaiseHand(rid, 'closed'); await load() }
    const removeService = async (sid: string, isLive: boolean) => {
        if (isLive) { alert('End the live service first.'); return }
        if (!confirm('Delete this service permanently? The matching event will also be removed.')) return
        try { await onlineCampusApi.deleteService(sid); await load() }
        catch (e) { alert((e as Error).message) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Radio className="w-7 h-7 text-red-500" /> Global Online Campus</h1>
                    <p className="text-gray-500 mt-1 text-sm">Run live services online with altar calls, raised hands, and online communion. Public page at <Link href="/live" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">/live <ExternalLink className="w-3 h-3" /></Link></p>
                </div>
                <div className="flex gap-2">
                    <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
                    <button onClick={() => setShowNew(true)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Schedule service</button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Card label="Live now" value={current?.status === 'live' ? '🔴 LIVE' : '—'} />
                <Card label="Altar responses" value={altarResponses.filter(a => !a.followed_up).length} sub="pending follow-up" />
                <Card label="Hands raised" value={raiseHand.filter(r => r.status !== 'closed').length} sub="awaiting pastor" />
                <Card label="Communion requests" value={communion.filter(c => c.status === 'requested').length} sub="to confirm" />
            </div>

            {showNew && <NewServiceForm onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); load() }} />}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-gray-100"><p className="font-bold text-[#140152]">Services</p></div>
                <div className="divide-y divide-gray-100">
                    {services.length === 0 && <p className="px-5 py-12 text-center text-gray-400">No services scheduled.</p>}
                    {services.map(s => (
                        <ServiceRow key={s.id} s={s}
                            onToggleLive={() => toggleLive(s.id!, s.is_live || false)}
                            onToggleAltar={() => toggleAltar(s.id!, s.altar_call_open || false)}
                            onRemove={() => removeService(s.id!, s.is_live || false)}
                            onSaved={load}
                        />
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mb-6">
                <Panel title="Altar call responses" icon={<Cross className="w-4 h-4 text-amber-500" />}>
                    {altarResponses.length === 0 && <p className="text-xs text-gray-400">No responses yet.</p>}
                    {altarResponses.slice(0, 20).map(r => (
                        <div key={r.id} className="border-b border-gray-100 last:border-0 py-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#140152] truncate">{r.name}</p>
                                    <p className="text-[10px] text-gray-500">{r.kind.replace('_', ' ')} · {new Date(r.created_at).toLocaleString()}</p>
                                    {r.email && <p className="text-[10px] text-gray-500">{r.email}</p>}
                                    {r.note && <p className="text-xs text-gray-700 mt-1 italic line-clamp-2">"{r.note}"</p>}
                                </div>
                                {!r.followed_up && <button onClick={() => markFollowed(r.id)} className="text-[10px] font-bold text-green-600 hover:bg-green-50 px-2 py-1 rounded inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /></button>}
                                {r.followed_up && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                        </div>
                    ))}
                </Panel>

                <Panel title="Hands raised" icon={<Hand className="w-4 h-4 text-[#f5bb00]" />}>
                    {raiseHand.length === 0 && <p className="text-xs text-gray-400">Queue is clear.</p>}
                    {raiseHand.map(r => (
                        <div key={r.id} className="border-b border-gray-100 last:border-0 py-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#140152] truncate">{r.display_name}</p>
                                    {r.message && <p className="text-xs text-gray-600 mt-1">{r.message}</p>}
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleTimeString()}</p>
                                </div>
                                <button onClick={() => closeHand(r.id)} className="text-[10px] font-bold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">Close</button>
                            </div>
                        </div>
                    ))}
                </Panel>

                <Panel title="Communion requests" icon={<Heart className="w-4 h-4 text-purple-500" />}>
                    {communion.length === 0 && <p className="text-xs text-gray-400">No requests.</p>}
                    {communion.map(c => (
                        <div key={c.id} className="border-b border-gray-100 last:border-0 py-2">
                            <p className="text-sm font-bold text-[#140152]">{c.name}</p>
                            <p className="text-[10px] text-gray-500">{c.email}</p>
                            <p className="text-xs text-gray-600 mt-1">Requested for {new Date(c.requested_date).toLocaleDateString()} ({c.timezone})</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1 ${c.status === 'requested' ? 'bg-amber-100 text-amber-700' : c.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                        </div>
                    ))}
                </Panel>
            </div>
        </div>
    )
}

function Card({ label, value, sub }: { label: string; value: any; sub?: string }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
            <p className="text-3xl font-black text-[#140152] mt-1">{value}</p>
            {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
    )
}
function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <p className="font-bold text-[#140152] text-sm mb-3 flex items-center gap-2">{icon} {title}</p>
            <div className="max-h-[300px] overflow-y-auto pr-1">{children}</div>
        </div>
    )
}
function NewServiceForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
    const [title, setTitle] = useState('Sunday Service'); const [description, setDescription] = useState(''); const [scheduledAt, setScheduledAt] = useState('')
    const [livestreamUrl, setLivestreamUrl] = useState('')
    const [coverImageUrl, setCoverImageUrl] = useState('')
    const [youtubeUrl, setYoutubeUrl] = useState(''); const [facebookUrl, setFacebookUrl] = useState('')
    const [instagramUrl, setInstagramUrl] = useState(''); const [twitterUrl, setTwitterUrl] = useState('')
    const [tiktokUrl, setTiktokUrl] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const submit = async () => {
        if (!title || !scheduledAt) return
        setSubmitting(true)
        try {
            await onlineCampusApi.createService({
                title, description, scheduled_at: scheduledAt,
                livestream_url: livestreamUrl || undefined,
                cover_image_url: coverImageUrl || undefined,
                youtube_url: youtubeUrl || undefined,
                facebook_url: facebookUrl || undefined,
                instagram_url: instagramUrl || undefined,
                twitter_url: twitterUrl || undefined,
                tiktok_url: tiktokUrl || undefined,
                chat_enabled: true, altar_call_open: false, raise_hand_enabled: true,
            })
            onDone()
        } catch (e) { alert((e as Error).message); setSubmitting(false) }
    }
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md mb-5">
            <h3 className="font-bold text-[#140152] mb-3">Schedule online service</h3>
            <p className="text-[11px] text-gray-500 mb-3">Scheduled services automatically appear on the public Events page. Linked social URLs show on /live for cross-platform sharing.</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <input value={livestreamUrl} onChange={e => setLivestreamUrl(e.target.value)} placeholder="Livestream embed URL (YouTube embed, Vimeo, etc.)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <div className="relative mb-2">
                <ImageIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="Cover image URL (shown on /live & event card)" className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm" />
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />

            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 mt-2">Linked social media (optional)</p>
            <div className="grid sm:grid-cols-2 gap-2 mb-3">
                <SocialField icon={<Youtube className="w-4 h-4 text-red-500" />} value={youtubeUrl} onChange={setYoutubeUrl} placeholder="YouTube channel/stream URL" />
                <SocialField icon={<Facebook className="w-4 h-4 text-blue-600" />} value={facebookUrl} onChange={setFacebookUrl} placeholder="Facebook page URL" />
                <SocialField icon={<Instagram className="w-4 h-4 text-pink-500" />} value={instagramUrl} onChange={setInstagramUrl} placeholder="Instagram URL" />
                <SocialField icon={<Twitter className="w-4 h-4 text-sky-500" />} value={twitterUrl} onChange={setTwitterUrl} placeholder="X / Twitter URL" />
                <SocialField icon={<span className="text-xs font-black">TT</span>} value={tiktokUrl} onChange={setTiktokUrl} placeholder="TikTok URL" />
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                <button onClick={submit} disabled={!title || !scheduledAt || submitting} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Schedule'}
                </button>
            </div>
        </div>
    )
}

function SocialField({ icon, value, onChange, placeholder }: { icon: React.ReactNode; value: string; onChange: (s: string) => void; placeholder: string }) {
    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 flex justify-center">{icon}</span>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm" />
        </div>
    )
}

function ServiceRow({ s, onToggleLive, onToggleAltar, onRemove, onSaved }: {
    s: CurrentService
    onToggleLive: () => void
    onToggleAltar: () => void
    onRemove: () => void
    onSaved: () => void | Promise<void>
}) {
    const [url, setUrl] = useState(s.livestream_url || '')
    const [saving, setSaving] = useState(false)
    const dirty = (url.trim() || '') !== (s.livestream_url || '')
    const saveUrl = async () => {
        if (!s.id) return
        setSaving(true)
        try {
            await onlineCampusApi.setState(s.id, { livestream_url: url.trim() })
            await onSaved()
        } catch (e) {
            alert((e as Error).message)
        } finally {
            setSaving(false)
        }
    }
    return (
        <div className="px-5 py-3">
            <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${s.is_live ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#140152] truncate">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}</p>
                </div>
                <button onClick={onToggleLive} className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 ${s.is_live ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {s.is_live ? <><Pause className="w-3 h-3" /> End live</> : <><Play className="w-3 h-3" /> Go live</>}
                </button>
                <button onClick={onToggleAltar} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${s.altar_call_open ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    Altar: {s.altar_call_open ? 'OPEN' : 'closed'}
                </button>
                <button onClick={onRemove}
                    title={s.is_live ? 'End live first' : 'Delete service'}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                    disabled={s.is_live}>
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Inline livestream URL editor — the most-requested fix. Lets the
                  operator paste a YouTube live URL right on the service row and
                  hit save; /live picks it up within ~15s. */}
            <div className="mt-2 ml-5 flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && dirty) saveUrl() }}
                    placeholder="Paste YouTube live URL — e.g. https://www.youtube.com/watch?v=…"
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 font-mono"
                />
                <button
                    onClick={saveUrl}
                    disabled={!dirty || saving}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 ${dirty ? 'bg-[#140152] text-white hover:bg-[#1d0175]' : 'bg-gray-100 text-gray-400'} disabled:opacity-50`}>
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {s.livestream_url ? 'Update' : 'Set URL'}
                </button>
                {s.livestream_url && (
                    <a href={s.livestream_url} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-[#140152]" title="Open in new tab">
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </div>
    )
}

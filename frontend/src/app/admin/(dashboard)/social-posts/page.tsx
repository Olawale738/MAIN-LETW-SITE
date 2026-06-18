'use client'
import { useEffect, useState } from 'react'
import { Loader2, Share2, Save, Trash2, AlertCircle, CheckCircle, Send, RefreshCw, ExternalLink } from 'lucide-react'
import { socialApi, type SocialTarget, type SocialPost } from '@/lib/api'

const PLATFORMS = [
    { key: 'twitter', label: 'Twitter / X', helper: 'Paste a Bearer access token with `tweet.write` scope.' },
    { key: 'facebook', label: 'Facebook Page', helper: 'Set Page ID and a Page access token (not user token).' },
    { key: 'instagram', label: 'Instagram', helper: 'Coming soon — requires Facebook Business linked IG account.' },
]

export default function AdminSocialPostsPage() {
    const [targets, setTargets] = useState<Record<string, SocialTarget | null>>({ twitter: null, facebook: null, instagram: null })
    const [posts, setPosts] = useState<SocialPost[]>([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [manualMsg, setManualMsg] = useState('')
    const [manualPlatforms, setManualPlatforms] = useState<Set<string>>(new Set(['twitter']))
    const [sending, setSending] = useState(false)

    const load = async () => {
        try {
            const list = await socialApi.listTargets()
            const next: Record<string, SocialTarget | null> = { twitter: null, facebook: null, instagram: null }
            list.forEach(t => { next[t.platform] = t })
            setTargets(next)
            setPosts(await socialApi.listPosts())
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const saveTarget = async (platform: string, patch: Partial<SocialTarget>) => {
        try {
            await socialApi.upsertTarget(platform, {
                display_name: patch.display_name,
                access_token: patch.access_token_masked || undefined,
                page_id: patch.page_id || undefined,
                account_id: patch.account_id || undefined,
                is_active: patch.is_active,
                auto_post_sermons: patch.auto_post_sermons,
                config: patch.config,
            })
            setMsg({ kind: 'ok', text: `${platform} saved.` })
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const send = async () => {
        if (!manualMsg.trim() || manualPlatforms.size === 0) return
        setSending(true)
        try {
            const r = await socialApi.postManual({ message: manualMsg, platforms: [...manualPlatforms] })
            const ok = r.results.filter(x => x.status === 'posted').length
            const fail = r.results.length - ok
            setMsg({ kind: ok > 0 ? 'ok' : 'err', text: `Posted to ${ok} platform${ok === 1 ? '' : 's'}${fail ? `; ${fail} failed` : ''}.` })
            setManualMsg('')
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSending(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Share2 className="w-7 h-7 text-[#f5bb00]" /> Social Auto-Poster</h1>
                    <p className="text-gray-500 mt-1 text-sm">Auto-post every new sermon to Twitter and Facebook. Also lets you compose one-off posts.</p>
                </div>
                <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="space-y-4 mb-8">
                {PLATFORMS.map(p => (
                    <TargetForm key={p.key} platform={p.key} label={p.label} helper={p.helper} initial={targets[p.key]} onSave={(patch) => saveTarget(p.key, patch)} onDelete={async () => { await socialApi.deleteTarget(p.key); await load() }} />
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-[#140152] mb-3 flex items-center gap-2"><Send className="w-5 h-5" /> Compose a one-off post</h2>
                <textarea value={manualMsg} onChange={e => setManualMsg(e.target.value)} rows={3} placeholder="Type a message…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {PLATFORMS.map(p => {
                            const active = targets[p.key]?.is_active
                            const selected = manualPlatforms.has(p.key)
                            return (
                                <button key={p.key} onClick={() => {
                                    const next = new Set(manualPlatforms); selected ? next.delete(p.key) : next.add(p.key); setManualPlatforms(next)
                                }} disabled={!active} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${!active ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed' : selected ? 'border-[#140152] bg-[#140152] text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                                    {p.label}{!active && ' (not configured)'}
                                </button>
                            )
                        })}
                    </div>
                    <button onClick={send} disabled={sending || !manualMsg.trim() || manualPlatforms.size === 0}
                        className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post Now
                    </button>
                </div>
            </div>

            <h2 className="text-lg font-bold text-[#140152] mb-3">Recent Posts</h2>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                        <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Platform</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {posts.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No posts yet.</td></tr>}
                        {posts.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.created_at).toLocaleString()}</td>
                                <td className="px-4 py-3 text-xs"><span className="font-bold text-[#140152]">{p.platform}</span></td>
                                <td className="px-4 py-3 text-xs text-gray-500">{p.source_kind || 'manual'}{p.source_id ? `:${p.source_id.slice(0, 8)}` : ''}</td>
                                <td className="px-4 py-3"><p className="text-xs line-clamp-2 max-w-xs">{p.message}</p></td>
                                <td className="px-4 py-3 text-xs">
                                    <span className={`font-bold px-2 py-1 rounded ${p.status === 'posted' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{p.status}</span>
                                    {p.external_url && <a href={p.external_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#140152] hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /></a>}
                                    {p.error && <p className="text-[10px] text-red-500 mt-1 line-clamp-2 max-w-xs">{p.error}</p>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function TargetForm({ platform, label, helper, initial, onSave, onDelete }: { platform: string; label: string; helper: string; initial: SocialTarget | null; onSave: (t: Partial<SocialTarget>) => void; onDelete: () => void }) {
    const [state, setState] = useState<Partial<SocialTarget>>({
        display_name: initial?.display_name || '',
        access_token_masked: '',
        page_id: initial?.page_id || '',
        account_id: initial?.account_id || '',
        is_active: initial?.is_active ?? false,
        auto_post_sermons: initial?.auto_post_sermons ?? false,
    })
    useEffect(() => {
        setState({
            display_name: initial?.display_name || '',
            access_token_masked: '',
            page_id: initial?.page_id || '',
            account_id: initial?.account_id || '',
            is_active: initial?.is_active ?? false,
            auto_post_sermons: initial?.auto_post_sermons ?? false,
        })
    }, [initial?.id, initial?.updated_at])

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="font-bold text-[#140152]">{label}</h3>
                <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1">
                        <input type="checkbox" checked={!!state.is_active} onChange={e => setState({ ...state, is_active: e.target.checked })} /> Active
                    </label>
                    <label className="flex items-center gap-1">
                        <input type="checkbox" checked={!!state.auto_post_sermons} onChange={e => setState({ ...state, auto_post_sermons: e.target.checked })} /> Auto-post sermons
                    </label>
                </div>
            </div>
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2 mb-3">{helper}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Display Name</label>
                    <input value={state.display_name || ''} onChange={e => setState({ ...state, display_name: e.target.value })} placeholder="@letwchurch" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                {platform === 'facebook' && <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Page ID</label>
                    <input value={state.page_id || ''} onChange={e => setState({ ...state, page_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
                </div>}
                {platform === 'instagram' && <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">IG Account ID</label>
                    <input value={state.account_id || ''} onChange={e => setState({ ...state, account_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
                </div>}
                <div className={platform === 'twitter' ? 'md:col-span-2' : ''}>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Access Token</label>
                    <input type="password" value={state.access_token_masked || ''} onChange={e => setState({ ...state, access_token_masked: e.target.value })} placeholder={initial?.access_token_masked || 'paste token'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
                    <p className="text-[10px] text-gray-400 mt-1">Currently saved: {initial?.access_token_masked || '(none)'}</p>
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                {initial && <button onClick={onDelete} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>}
                <button onClick={() => onSave(state)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Save className="w-4 h-4" /> Save</button>
            </div>
        </div>
    )
}

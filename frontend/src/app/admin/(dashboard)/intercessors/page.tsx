'use client'
import { useEffect, useState } from 'react'
import { Loader2, Heart, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw, Search, Info, Mail, X } from 'lucide-react'
import { intercessionApi } from '@/lib/api'

interface Intercessor { id: string; user_id: string; display_name: string; bio: string | null; languages: string | null; is_active: boolean; is_available_now: boolean; total_prayed_for: number }

export default function AdminIntercessorsPage() {
    const [items, setItems] = useState<Intercessor[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try {
            const [ii, rr] = await Promise.all([intercessionApi.adminListIntercessors(), intercessionApi.adminAllRequests()])
            setItems(ii); setRequests(rr)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const add = async (data: { user_id: string; display_name: string; bio?: string; languages?: string }) => {
        try { await intercessionApi.adminAddIntercessor({ ...data, is_active: true }); setShowNew(false); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const remove = async (id: string) => {
        if (!confirm('Remove this intercessor from the rota?')) return
        try { await intercessionApi.adminRemoveIntercessor(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    const waiting = requests.filter(r => r.status === 'waiting').length
    const active = requests.filter(r => r.status === 'assigned' || r.status === 'praying').length
    const online = items.filter(i => i.is_active && i.is_available_now).length

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Heart className="w-7 h-7 text-rose-500" /> Live Prayer Command Center</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage the intercessor rota + see live prayer queue.</p>
                </div>
                <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>

            {/* How intercessors get connected — onboarding explainer */}
            <div className="mb-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-rose-50 p-5">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-900 leading-relaxed">
                        <p className="font-black mb-1">How intercessors get connected</p>
                        <ol className="list-decimal pl-5 space-y-1">
                            <li>The person registers/logs in at <a href="/auth/login" className="underline font-bold">letw.org/auth</a>.</li>
                            <li>You search for them below by name or email and add them to the rota.</li>
                            <li>They sign in and visit <a href="/intercessor" className="underline font-bold">/intercessor</a> to toggle ONLINE.</li>
                            <li>When someone submits a prayer request, the system auto-routes it to the next available intercessor.</li>
                            <li>They mark "Praying" then "Done" — totals tracked on this page.</li>
                        </ol>
                    </div>
                </div>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500">Online</p>
                    <p className="text-3xl font-black text-[#140152] mt-1">{online}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500">Waiting</p>
                    <p className="text-3xl font-black text-amber-600 mt-1">{waiting}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500">In progress</p>
                    <p className="text-3xl font-black text-emerald-600 mt-1">{active}</p>
                </div>
            </div>

            <div className="flex justify-end mb-3">
                <button onClick={() => setShowNew(true)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add intercessor</button>
            </div>

            {showNew && <AddForm onCancel={() => setShowNew(false)} onAdd={add} />}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-gray-100"><p className="font-bold text-[#140152]">Intercessors ({items.length})</p></div>
                <div className="divide-y divide-gray-100">
                    {items.length === 0 && <p className="px-5 py-12 text-center text-gray-400">No intercessors on the rota yet.</p>}
                    {items.map(i => (
                        <div key={i.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                            <span className={`w-2 h-2 rounded-full ${i.is_available_now ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-[#140152] truncate">{i.display_name}</p>
                                <p className="text-xs text-gray-500 truncate">{i.languages || 'No languages set'} · {i.total_prayed_for} prayers prayed</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${i.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{i.is_active ? 'Active' : 'Paused'}</span>
                            <button onClick={() => remove(i.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100"><p className="font-bold text-[#140152]">Recent requests ({requests.length})</p></div>
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {requests.length === 0 && <p className="px-5 py-12 text-center text-gray-400">No prayer requests yet.</p>}
                    {requests.slice(0, 100).map(r => (
                        <div key={r.id} className="px-5 py-3 flex items-start gap-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${r.status === 'waiting' ? 'bg-amber-100 text-amber-700' : r.status === 'answered' ? 'bg-green-100 text-green-700' : r.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#140152]">{r.display_name}{r.category && <span className="text-xs text-gray-500 ml-2">· {r.category}</span>}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.text}</p>
                                {r.answered_testimony && <p className="text-xs text-green-700 mt-1 italic">Testimony: {r.answered_testimony}</p>}
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function AddForm({ onCancel, onAdd }: { onCancel: () => void; onAdd: (d: { user_id: string; display_name: string; bio?: string; languages?: string }) => void }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Array<{ id: string; name: string; email: string }>>([])
    const [searching, setSearching] = useState(false)
    const [picked, setPicked] = useState<{ id: string; name: string; email: string } | null>(null)
    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [languages, setLanguages] = useState('')

    useEffect(() => {
        if (picked) return
        const t = setTimeout(async () => {
            setSearching(true)
            try { setResults(await intercessionApi.adminSearchCandidates(query)) }
            catch { setResults([]) }
            finally { setSearching(false) }
        }, 250)
        return () => clearTimeout(t)
    }, [query, picked])

    const choose = (u: { id: string; name: string; email: string }) => {
        setPicked(u)
        setDisplayName(u.name || u.email)
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md mb-5">
            <h3 className="font-bold text-[#140152] mb-3">Add intercessor to rota</h3>
            {!picked ? (
                <>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Search members by name or email</label>
                    <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Type to search…"
                            className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm" />
                    </div>
                    <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                        {searching && <p className="px-4 py-6 text-center text-gray-400 text-sm">Searching…</p>}
                        {!searching && results.length === 0 && <p className="px-4 py-6 text-center text-gray-400 text-sm">{query ? 'No matching members.' : 'Members available to add appear here.'}</p>}
                        {!searching && results.map(r => (
                            <button key={r.id} type="button" onClick={() => choose(r)}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                                    {(r.name || r.email || '?').slice(0, 1).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-[#140152] truncate">{r.name || '(no name)'}</p>
                                    <p className="text-xs text-gray-500 truncate inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {r.email}</p>
                                </div>
                                <Plus className="w-4 h-4 text-purple-500" />
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="mb-4 flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center">{(picked.name || picked.email).slice(0, 1).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152] truncate">{picked.name || '(no name)'}</p>
                            <p className="text-xs text-gray-500 truncate">{picked.email}</p>
                        </div>
                        <button onClick={() => setPicked(null)} className="text-gray-400 hover:text-gray-700 p-1"><X className="w-4 h-4" /></button>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Display name (shown to people requesting prayer)</label>
                        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Mama Adaeze" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="mt-3">
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Languages (comma-separated)</label>
                        <input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Yoruba, French" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="Brief bio (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-3" />
                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                        <button onClick={() => onAdd({ user_id: picked.id, display_name: displayName, bio: bio || undefined, languages: languages || undefined })}
                            disabled={!displayName} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                            Add to rota
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

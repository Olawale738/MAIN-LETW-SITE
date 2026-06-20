'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Power, PowerOff, Clock, CheckCircle2, Loader2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react'
import { intercessionApi, tokenManager } from '@/lib/api'

interface Me {
    is_intercessor: boolean
    is_available: boolean
    display_name: string
    languages: string[]
    bio: string | null
    online_count: number
    queued_count: number
}

interface Req {
    id: string
    text: string
    name: string | null
    language: string | null
    status: string
    created_at: string
    claimed_at: string | null
}

export default function IntercessorPortal() {
    const [me, setMe] = useState<Me | null>(null)
    const [queue, setQueue] = useState<Req[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState<string | null>(null)

    const load = async () => {
        try {
            if (!tokenManager.isLoggedIn()) {
                setError('signin')
                return
            }
            const [meData, q] = await Promise.all([
                intercessionApi.me().catch(() => null),
                intercessionApi.myQueue().catch(() => []),
            ])
            if (!meData || !meData.is_intercessor) {
                setError('not-intercessor')
                return
            }
            setMe(meData as Me)
            setQueue(q as Req[])
            setError(null)
        } catch (e) { setError((e as Error).message) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        load()
        const id = setInterval(load, 15000)   // refresh queue every 15s
        return () => clearInterval(id)
    }, [])

    const toggleAvailable = async () => {
        if (!me) return
        setBusy('toggle')
        try { await intercessionApi.toggleAvailable(); await load() }
        catch (e) { setError((e as Error).message) }
        finally { setBusy(null) }
    }

    const updateStatus = async (rid: string, status: 'in_progress' | 'completed') => {
        setBusy(rid)
        try { await intercessionApi.updateRequestStatus(rid, status); await load() }
        catch (e) { setError((e as Error).message) }
        finally { setBusy(null) }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fbf5e6]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    if (error === 'signin') {
        return (
            <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                    <h2 className="text-2xl font-black text-[#140152]">Sign in required</h2>
                    <p className="text-gray-600 mt-3">Only registered intercessors can access this portal.</p>
                    <Link href="/auth/login?redirect=/intercessor" className="inline-block mt-5 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-xl">Sign in</Link>
                </div>
            </main>
        )
    }

    if (error === 'not-intercessor') {
        return (
            <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <Heart className="w-12 h-12 mx-auto text-[#f5bb00] mb-3" />
                    <h2 className="text-2xl font-black text-[#140152]">Not yet an intercessor</h2>
                    <p className="text-gray-600 mt-3">Your heart for prayer is precious. To join the intercessor rota, please contact our prayer coordinator.</p>
                    <a href="mailto:prayer@letw.org" className="inline-block mt-5 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-xl">Email prayer@letw.org</a>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#fbf5e6]">
            <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-8">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                    <div>
                        <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-2 inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Intercessor Portal</p>
                        <h1 className="text-3xl md:text-4xl font-black text-[#140152]">Welcome, {me?.display_name}</h1>
                        <p className="text-gray-600 mt-1">{me?.bio || 'Standing in the gap for the body of Christ.'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
                    </div>
                </div>

                {/* AVAILABILITY TOGGLE — the most important control */}
                <div className={`rounded-3xl p-6 mb-6 border-2 transition-colors ${me?.is_available ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${me?.is_available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}>
                            {me?.is_available ? <Power className="w-7 h-7" /> : <PowerOff className="w-7 h-7" />}
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <p className={`font-black text-lg ${me?.is_available ? 'text-green-900' : 'text-gray-700'}`}>
                                {me?.is_available ? "You are ONLINE — visible in the prayer queue" : "You are OFFLINE — not receiving requests"}
                            </p>
                            <p className={`text-sm mt-0.5 ${me?.is_available ? 'text-green-700' : 'text-gray-500'}`}>
                                {me?.is_available ? `${me?.online_count - 1} other intercessor${me.online_count - 1 === 1 ? '' : 's'} also online · ${me?.queued_count} waiting in queue` : 'Toggle on when you have time to pray with someone'}
                            </p>
                        </div>
                        <button onClick={toggleAvailable} disabled={busy === 'toggle'}
                            className={`px-6 py-3 rounded-xl font-black text-sm transition-colors ${me?.is_available ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#140152] hover:bg-[#1d0175] text-white'}`}>
                            {busy === 'toggle' ? <Loader2 className="w-4 h-4 animate-spin inline" /> : me?.is_available ? 'Go offline' : '✨ Go online'}
                        </button>
                    </div>
                </div>

                <h2 className="font-black text-[#140152] text-xl mb-4">Prayer Queue ({queue.length})</h2>

                {queue.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                        <Heart className="w-12 h-12 mx-auto text-[#f5bb00]/40 mb-3" />
                        <p className="text-gray-500">No prayer requests waiting right now.</p>
                        <p className="text-xs text-gray-400 mt-2">{me?.is_available ? 'Keep refreshing — when someone needs prayer, they\'ll appear here.' : 'Toggle ON to receive incoming requests.'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {queue.map(r => (
                            <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center font-bold flex-shrink-0">
                                        {(r.name || 'A').slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[#140152]">{r.name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-gray-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(r.created_at).toLocaleString()}{r.language ? ` · ${r.language}` : ''}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${r.status === 'queued' ? 'bg-amber-100 text-amber-700' : r.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {r.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-3 italic whitespace-pre-wrap">"{r.text}"</p>
                                <div className="mt-3 flex gap-2 justify-end">
                                    {r.status === 'queued' && (
                                        <button onClick={() => updateStatus(r.id, 'in_progress')} disabled={busy === r.id}
                                            className="text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50">
                                            {busy === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className="w-3 h-3" />} I'll pray
                                        </button>
                                    )}
                                    {r.status !== 'completed' && (
                                        <button onClick={() => updateStatus(r.id, 'completed')} disabled={busy === r.id}
                                            className="text-xs font-bold px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50">
                                            <CheckCircle2 className="w-3 h-3" /> Done
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-10">"And whatsoever ye shall ask in my name, that will I do, that the Father may be glorified in the Son." — John 14:13</p>
            </section>
        </main>
    )
}

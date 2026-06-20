'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Power, PowerOff, Clock, CheckCircle2, Loader2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react'
import { intercessionApi, tokenManager, authApi, type IntercessorMe } from '@/lib/api'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

interface Req {
    id: string
    text: string
    display_name: string | null
    category: string | null
    status: string
    created_at: string
    assigned_at: string | null
}

export default function IntercessorPortal() {
    const [me, setMe] = useState<IntercessorMe | null>(null)
    const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
    const [queue, setQueue] = useState<Req[]>([])
    const [online, setOnline] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState<string | null>(null)

    const load = async () => {
        try {
            if (!tokenManager.isLoggedIn()) {
                setError('signin')
                return
            }
            const [meData, q, oc] = await Promise.all([
                intercessionApi.me().catch(() => null),
                intercessionApi.myQueue().catch(() => []),
                intercessionApi.onlineCount().catch(() => ({ online: 0 })),
            ])
            if (!meData) {
                try {
                    const u = await authApi.getCurrentUser()
                    setSignedInEmail(u?.email || null)
                } catch { /* noop */ }
                setError('not-intercessor')
                return
            }
            setMe(meData)
            setQueue(q as Req[])
            setOnline(oc.online || 0)
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

    const updateStatus = async (rid: string, status: 'praying' | 'answered' | 'closed') => {
        setBusy(rid)
        try { await intercessionApi.updateStatus(rid, { status }); await load() }
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
                    {signedInEmail && (
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700">You are signed in as</p>
                            <p className="font-bold text-[#140152] text-sm break-all">{signedInEmail}</p>
                            <p className="text-[11px] text-amber-700 mt-1">If your admin added a different email to the rota, please sign out and back in with that one.</p>
                        </div>
                    )}
                    <p className="text-gray-600 mt-4 text-sm">If you should be on the rota, contact our prayer coordinator.</p>
                    <div className="mt-5 flex gap-2 justify-center flex-wrap">
                        <a href="mailto:prayer@letw.org" className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl text-sm">Email prayer@letw.org</a>
                        <Link href="/auth/login?redirect=/intercessor" className="bg-white border border-gray-200 hover:border-[#140152] text-[#140152] font-bold px-5 py-3 rounded-xl text-sm">Sign in with another account</Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#fbf5e6]">
            <PageCmsOverlay slug="intercessor" position="top" />
            <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-8">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                    <div>
                        <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-2 inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Intercessor Portal</p>
                        <h1 className="text-3xl md:text-4xl font-black text-[#140152]">Welcome, {me?.display_name}</h1>
                        <p className="text-gray-600 mt-1">Standing in the gap for the body of Christ.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
                    </div>
                </div>

                {/* AVAILABILITY TOGGLE — the most important control */}
                <div className={`rounded-3xl p-6 mb-6 border-2 transition-colors ${me?.is_available_now ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${me?.is_available_now ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}>
                            {me?.is_available_now ? <Power className="w-7 h-7" /> : <PowerOff className="w-7 h-7" />}
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <p className={`font-black text-lg ${me?.is_available_now ? 'text-green-900' : 'text-gray-700'}`}>
                                {me?.is_available_now ? "You are ONLINE — visible in the prayer queue" : "You are OFFLINE — not receiving requests"}
                            </p>
                            <p className={`text-sm mt-0.5 ${me?.is_available_now ? 'text-green-700' : 'text-gray-500'}`}>
                                {me?.is_available_now ? `${Math.max(0, online - 1)} other intercessor${online - 1 === 1 ? '' : 's'} also online · ${queue.length} in your queue · ${me.total_prayed_for} prayed for total` : 'Toggle on when you have time to pray with someone'}
                            </p>
                        </div>
                        <button onClick={toggleAvailable} disabled={busy === 'toggle'}
                            className={`px-6 py-3 rounded-xl font-black text-sm transition-colors ${me?.is_available_now ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#140152] hover:bg-[#1d0175] text-white'}`}>
                            {busy === 'toggle' ? <Loader2 className="w-4 h-4 animate-spin inline" /> : me?.is_available_now ? 'Go offline' : 'Go online'}
                        </button>
                    </div>
                </div>

                <h2 className="font-black text-[#140152] text-xl mb-4">Prayer Queue ({queue.length})</h2>

                {queue.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                        <Heart className="w-12 h-12 mx-auto text-[#f5bb00]/40 mb-3" />
                        <p className="text-gray-500">No prayer requests waiting right now.</p>
                        <p className="text-xs text-gray-400 mt-2">{me?.is_available_now ? 'Keep refreshing — when someone needs prayer, they\'ll appear here.' : 'Toggle ON to receive incoming requests.'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {queue.map(r => (
                            <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center font-bold flex-shrink-0">
                                        {(r.display_name || 'A').slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[#140152]">{r.display_name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-gray-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(r.created_at).toLocaleString()}{r.category ? ` · ${r.category}` : ''}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${r.status === 'assigned' ? 'bg-amber-100 text-amber-700' : r.status === 'praying' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {r.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-3 italic whitespace-pre-wrap">"{r.text}"</p>
                                <div className="mt-3 flex gap-2 justify-end">
                                    {r.status === 'assigned' && (
                                        <button onClick={() => updateStatus(r.id, 'praying')} disabled={busy === r.id}
                                            className="text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50">
                                            {busy === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className="w-3 h-3" />} I'll pray
                                        </button>
                                    )}
                                    {r.status !== 'answered' && r.status !== 'closed' && (
                                        <button onClick={() => updateStatus(r.id, 'answered')} disabled={busy === r.id}
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
            <PageCmsOverlay slug="intercessor" position="bottom" />
        </main>
    )
}

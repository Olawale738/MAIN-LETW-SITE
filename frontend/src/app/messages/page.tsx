'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Inbox, Loader2, Flag, CheckCheck, ChevronLeft, ShieldCheck } from 'lucide-react'
import { directoryApi, tokenManager, type DirectoryMessage } from '@/lib/api'

export default function MessagesPage() {
    const [items, setItems] = useState<DirectoryMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [signedOut, setSignedOut] = useState(false)

    const load = async () => {
        setLoading(true)
        try { setItems(await directoryApi.inbox()) }
        catch { /* noop */ }
        finally { setLoading(false) }
    }
    useEffect(() => {
        if (!tokenManager.isLoggedIn()) { setSignedOut(true); setLoading(false); return }
        load()
    }, [])

    const markRead = async (m: DirectoryMessage) => {
        if (m.is_read) return
        try { await directoryApi.markRead(m.id); setItems(items.map(x => x.id === m.id ? { ...x, is_read: true } : x)) } catch { /* noop */ }
    }
    const report = async (m: DirectoryMessage) => {
        if (!confirm('Report this message to the admin team?')) return
        try { await directoryApi.report(m.id); setItems(items.map(x => x.id === m.id ? { ...x, is_reported: true } : x)) } catch { /* noop */ }
    }

    if (signedOut) {
        return (
            <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <Inbox className="w-12 h-12 mx-auto text-[#f5bb00] mb-3" />
                    <h2 className="text-2xl font-black text-[#140152]">Sign in to read your messages</h2>
                    <Link href="/auth/login?redirect=/messages" className="inline-block mt-5 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-xl">Sign in</Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <section className="max-w-3xl mx-auto px-6 pt-24 pb-20">
                <Link href="/family" className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#140152]/60 hover:text-[#140152] inline-flex items-center gap-1.5 mb-3"><ChevronLeft className="w-3 h-3" /> Back to family</Link>
                <h1 className="font-serif text-4xl md:text-5xl font-black text-[#140152]">My messages</h1>
                <p className="text-xs text-gray-500 mt-2 inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Messages stay inside LETW. Report anything inappropriate.</p>

                <div className="mt-8 space-y-3">
                    {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div> :
                        items.length === 0 ? <p className="text-center text-gray-400 py-12 text-sm">No messages yet.</p> :
                            items.map(m => (
                                <div key={m.id} onClick={() => markRead(m)}
                                    className={`bg-white border ${m.is_read ? 'border-gray-100' : 'border-[#f5bb00] shadow-md'} rounded-2xl p-5 cursor-pointer`}>
                                    <p className="text-xs text-gray-400 mb-2">{new Date(m.created_at).toLocaleString()}{!m.is_read && <span className="text-[#f5bb00] font-black ml-2">· NEW</span>}</p>
                                    <p className="text-[#140152] whitespace-pre-wrap leading-relaxed">{m.body}</p>
                                    <div className="mt-3 flex items-center justify-between text-[11px]">
                                        {m.is_read ? <span className="text-green-600 inline-flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" /> Read</span> : <span className="text-amber-600 inline-flex items-center gap-1">New</span>}
                                        {m.is_reported ? <span className="text-red-600 font-bold">Reported</span> : (
                                            <button onClick={e => { e.stopPropagation(); report(m) }} className="text-gray-400 hover:text-red-600 inline-flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> Report</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                </div>
            </section>
        </main>
    )
}

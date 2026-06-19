'use client'
import { useEffect, useState } from 'react'
import { Heart, Send, Loader2, CheckCircle2, ShieldCheck, Users } from 'lucide-react'
import { intercessionApi } from '@/lib/api'

const CATEGORIES = ['Health', 'Family', 'Finance', 'Salvation', 'Work', 'Relationship', 'Spiritual', 'Other']

export default function LivePrayerPage() {
    const [text, setText] = useState('')
    const [category, setCategory] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [anonymous, setAnonymous] = useState(false)
    const [online, setOnline] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<{ assigned: string | null; message: string } | null>(null)

    useEffect(() => {
        const tick = () => intercessionApi.onlineCount().then(r => setOnline(r.online)).catch(() => {})
        tick()
        const id = setInterval(tick, 15000)
        return () => clearInterval(id)
    }, [])

    const submit = async () => {
        if (!text.trim()) return
        setSubmitting(true)
        try {
            const r = await intercessionApi.submitRequest({
                text,
                display_name: anonymous ? 'A child of God' : (displayName || 'A child of God'),
                category: category || undefined,
                is_anonymous: anonymous,
            })
            setResult({ assigned: r.assigned_intercessor, message: r.message })
            setText(''); setCategory(''); setDisplayName('')
        } catch (e) {
            setResult({ assigned: null, message: (e as Error).message })
        } finally {
            setSubmitting(false)
        }
    }

    if (result) return (
        <main className="min-h-screen bg-gradient-to-b from-[#140152] via-[#1a0270] to-[#140152] text-white flex items-center justify-center p-6">
            <div className="bg-white text-gray-800 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-lg w-full text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-[#140152]">Your prayer is heard.</h2>
                <p className="text-gray-600 mt-3 leading-relaxed">{result.message}</p>
                {result.assigned && (
                    <p className="mt-4 text-sm text-[#140152] bg-[#f5bb00]/15 rounded-lg p-3"><strong>{result.assigned}</strong> is praying for you right now.</p>
                )}
                <button onClick={() => setResult(null)} className="mt-6 text-sm font-bold text-[#140152] hover:underline">Submit another request</button>
            </div>
        </main>
    )

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#140152] via-[#1a0270] to-[#140152] text-white">
            <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-8 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3 inline-flex items-center gap-2"><Heart className="w-3.5 h-3.5" /> Live prayer line</p>
                <h1 className="text-4xl md:text-5xl font-black leading-tight">Tell us. We're praying.</h1>
                <p className="text-white/70 mt-4 text-lg">A real intercessor from our team will pray for your need within minutes.</p>

                <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <Users className="w-3.5 h-3.5" />
                    <span><strong>{online}</strong> intercessor{online === 1 ? '' : 's'} online right now</span>
                </div>
            </section>

            <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
                <div className="bg-white text-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">What can we pray about?</label>
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="Be as honest as you need to be. Nothing leaves the prayer team."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4" />

                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Category (optional)</label>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {CATEGORIES.map(c => (
                            <button key={c} onClick={() => setCategory(category === c ? '' : c)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full border ${category === c ? 'bg-[#140152] text-white border-[#140152]' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                                {c}
                            </button>
                        ))}
                    </div>

                    <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} />
                        <ShieldCheck className="w-4 h-4 text-gray-400" />
                        <span>Stay anonymous (intercessor sees "A child of God")</span>
                    </label>

                    {!anonymous && (
                        <>
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">First name (or how we should call you)</label>
                            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Sarah" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4" />
                        </>
                    )}

                    <button onClick={submit} disabled={submitting || !text.trim()}
                        className="w-full bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-4 rounded-xl text-lg inline-flex items-center justify-center gap-2 disabled:opacity-50">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Send to a prayer warrior
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-4">"The effectual fervent prayer of a righteous man availeth much." — James 5:16</p>
                </div>
            </section>
        </main>
    )
}

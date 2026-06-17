'use client'
import { useEffect, useState } from 'react'
import { Loader2, Calendar, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { counsellingApi, type CounsellingSlot } from '@/lib/api'

export default function BookCounsellingPage() {
    const [slots, setSlots] = useState<CounsellingSlot[]>([])
    const [picked, setPicked] = useState<CounsellingSlot | null>(null)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [topic, setTopic] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        counsellingApi.slots(21).then(setSlots).catch(e => setErr((e as Error).message)).finally(() => setLoading(false))
    }, [])

    const submit = async () => {
        if (!picked || !name || !email) return
        setSubmitting(true); setErr(null)
        try {
            await counsellingApi.book({
                pastor_id: picked.pastor_id, scheduled_at: picked.starts_at, duration_minutes: picked.duration_minutes,
                user_name: name, user_email: email, user_phone: phone || undefined,
                topic, notes: notes || undefined,
            })
            setSubmitted(true)
        } catch (e) { setErr((e as Error).message) }
        finally { setSubmitting(false) }
    }

    // Group slots by date
    const byDate: Record<string, CounsellingSlot[]> = {}
    slots.forEach(s => {
        const d = new Date(s.starts_at).toDateString()
        ;(byDate[d] = byDate[d] || []).push(s)
    })

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    if (submitted) return (
        <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-black text-[#140152]">Booking Submitted</h2>
                <p className="text-gray-600 mt-3">A pastor will confirm your appointment soon. Watch your email at <strong>{email}</strong>.</p>
            </div>
        </main>
    )

    return (
        <main className="min-h-screen bg-[#fbf5e6]">
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3">Pastoral Care</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">Book a private session.</h1>
                <p className="text-gray-600 mt-4 max-w-xl mx-auto">Confidential. Compassionate. With a pastor who'll meet you where you are.</p>
            </section>

            <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                    <h3 className="font-black text-[#140152] mb-3 flex items-center gap-2"><Calendar className="w-5 h-5" /> Pick a slot</h3>
                    {Object.keys(byDate).length === 0 ? (
                        <p className="text-sm text-gray-400">No slots available right now. Please check back soon or contact the office.</p>
                    ) : (
                        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                            {Object.entries(byDate).map(([d, ss]) => (
                                <div key={d}>
                                    <p className="text-xs font-bold uppercase text-gray-500 mb-1.5">{d}</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {ss.map(s => (
                                            <button key={s.starts_at + s.pastor_id} onClick={() => setPicked(s)}
                                                className={`px-2 py-2 rounded-lg text-xs font-bold border ${picked === s ? 'bg-[#140152] text-white border-[#140152]' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                {new Date(s.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                    <h3 className="font-black text-[#140152] mb-3">Your details</h3>
                    {err && <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5" /><span className="text-sm">{err}</span></div>}
                    {picked && (
                        <p className="text-sm bg-[#140152]/5 rounded-lg p-3 mb-3 flex items-center gap-2 text-[#140152]"><Clock className="w-4 h-4" />{new Date(picked.starts_at).toLocaleString()} · {picked.duration_minutes} min</p>
                    )}
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name *" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *" type="email" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Brief topic" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Anything else (confidential)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4" />
                    <button onClick={submit} disabled={submitting || !picked || !name || !email}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-3 rounded-xl shadow-lg disabled:opacity-50">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Request Appointment
                    </button>
                </div>
            </section>
        </main>
    )
}

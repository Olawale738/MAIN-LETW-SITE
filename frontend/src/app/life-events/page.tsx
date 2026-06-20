'use client'
import { useState } from 'react'
import { Heart, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { lifeEventApi } from '@/lib/api'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

const KINDS = [
    { value: 'wedding', label: 'Wedding', desc: 'Marriage ceremony or vow renewal.' },
    { value: 'baptism', label: 'Baptism', desc: 'Believer\'s water baptism.' },
    { value: 'dedication', label: 'Child Dedication', desc: 'Dedicate a child / infant to the Lord.' },
]

export default function LifeEventsPage() {
    const [kind, setKind] = useState('wedding')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [preferred, setPreferred] = useState('')
    const [alternate, setAlternate] = useState('')
    const [details, setDetails] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const submit = async () => {
        if (!name || !email || !preferred) return
        setSubmitting(true); setErr(null)
        try {
            await lifeEventApi.submit({
                kind, requester_name: name, requester_email: email, requester_phone: phone || undefined,
                preferred_date: preferred, alternate_date: alternate || undefined,
                details: details ? { notes: details } : undefined,
            })
            setSubmitted(true)
        } catch (e) { setErr((e as Error).message) }
        finally { setSubmitting(false) }
    }

    if (submitted) {
        return (
            <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h2 className="text-2xl font-black text-[#140152]">Request Received</h2>
                    <p className="text-gray-600 mt-3">We've received your request and a pastor will contact you within 3 working days.</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <PageCmsOverlay slug="life-events" position="top" />
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3">Sacred Milestones</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">Mark the moments that matter.</h1>
                <p className="text-gray-600 mt-4 max-w-xl mx-auto">Wedding, baptism, child dedication, or memorial — request a date and our pastoral team will reach out.</p>
            </section>

            <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
                    {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{err}</span></div>}

                    <label className="text-xs font-bold uppercase text-gray-500 block mb-2">What are you requesting?</label>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        {KINDS.map(k => (
                            <button key={k.value} onClick={() => setKind(k.value)} className={`px-4 py-3 rounded-xl border text-left ${kind === k.value ? 'border-[#140152] bg-[#140152]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <p className="font-bold text-[#140152] text-sm">{k.label}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{k.desc}</p>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name *" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *" type="email" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                    </div>

                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-5" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Preferred date *</label>
                            <input type="date" value={preferred} onChange={e => setPreferred(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Alternate date</label>
                            <input type="date" value={alternate} onChange={e => setAlternate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                        </div>
                    </div>

                    <textarea value={details} onChange={e => setDetails(e.target.value)} rows={4} placeholder="Tell us anything else we should know — number of guests expected, special requests, location, etc." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-5" />

                    <button onClick={submit} disabled={submitting || !name || !email || !preferred}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-4 rounded-xl text-lg shadow-lg disabled:opacity-50">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Submit Request
                    </button>
                </div>
            </section>
            <PageCmsOverlay slug="life-events" position="bottom" />
        </main>
    )
}

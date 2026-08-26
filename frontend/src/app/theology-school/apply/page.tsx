'use client'
/**
 * /theology-school/apply — public application for the LETW Theology School.
 * Pick a programme → submit details → pay the exact fee → the admission letter
 * is issued automatically and the offer link is emailed.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { theologyApi, type TheologyProgram } from '@/lib/api'

export default function ApplyPage() {
    const [programs, setPrograms] = useState<TheologyProgram[]>([])
    const [loading, setLoading] = useState(true)
    const [sel, setSel] = useState<TheologyProgram | null>(null)
    const [form, setForm] = useState({
        full_name: '', email: '', phone: '', date_of_birth: '', address: '',
        education_level: '', statement: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [created, setCreated] = useState<{ application_id: string; amount_due: number; currency: string; program_name: string } | null>(null)
    const [reference, setReference] = useState('')
    const [confirming, setConfirming] = useState(false)
    const [providers, setProviders] = useState<Array<{ id: string; name: string; currency: string }>>([])
    const [paying, setPaying] = useState('')
    const [done, setDone] = useState<{ admission_number: string } | null>(null)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        theologyApi.programs().then(p => { setPrograms(p); if (p.length === 1) setSel(p[0]) })
            .catch(() => setPrograms([])).finally(() => setLoading(false))
        theologyApi.providers().then(setProviders).catch(() => setProviders([]))
        // Coming back from the payment provider: pick the application back up
        // and confirm it automatically.
        try {
            const saved = localStorage.getItem('letw-theology-application')
            if (saved) {
                const v = JSON.parse(saved)
                if (v?.application_id) {
                    setCreated(v)
                    if (v.reference) {
                        setReference(v.reference)
                        theologyApi.confirmPayment(v.application_id, v.reference)
                            .then(r => { setDone({ admission_number: r.admission_number }); localStorage.removeItem('letw-theology-application') })
                            .catch(() => { /* not settled yet — they can retry below */ })
                    }
                }
            }
        } catch { /* ignore */ }
    }, [])

    const submit = async () => {
        if (!sel) { setMsg({ kind: 'err', text: 'Please choose a programme.' }); return }
        if (!form.full_name.trim() || !form.email.trim()) { setMsg({ kind: 'err', text: 'Name and email are required.' }); return }
        setSubmitting(true); setMsg(null)
        try {
            const r = await theologyApi.apply({ program_id: sel.id, ...form })
            setCreated(r)
            try { localStorage.setItem('letw-theology-application', JSON.stringify(r)) } catch { /* ignore */ }
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSubmitting(false) }
    }

    const confirm = async () => {
        if (!created || !reference.trim()) return
        setConfirming(true); setMsg(null)
        try {
            const r = await theologyApi.confirmPayment(created.application_id, reference.trim())
            setDone({ admission_number: r.admission_number })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setConfirming(false) }
    }

    const pay = async (providerId: string) => {
        if (!created) return
        setPaying(providerId); setMsg(null)
        try {
            const r = await theologyApi.checkout(created.application_id, providerId)
            if (r.already_paid) { setMsg({ kind: 'ok', text: 'This application is already paid.' }); return }
            try { localStorage.setItem('letw-theology-application', JSON.stringify({ ...created, reference: r.reference })) } catch { /* ignore */ }
            if (r.checkout_url) window.location.href = r.checkout_url
            else { setReference(r.reference); setMsg({ kind: 'ok', text: 'Payment started. Confirm below once it completes.' }) }
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setPaying('') }
    }

    const list = programs

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-black text-[#140152] flex items-center gap-3">
                    <GraduationCap className="w-8 h-8 text-[#f5bb00]" /> Apply — Theology School
                </h1>
                <p className="text-gray-600 mt-2 mb-6">Train for ministry with Light Encounter Tabernacle Worldwide. Complete the form, pay the exact fee, and your admission letter is issued automatically.</p>

                {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span>{msg.text}</span></div>}

                {/* Step 3 — admitted */}
                {done ? (
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <h2 className="text-2xl font-black text-[#140152]">Congratulations — you have been admitted</h2>
                        <p className="text-gray-600 mt-2">Your admission number is <strong className="text-[#140152]">{done.admission_number}</strong>.</p>
                        <p className="text-gray-600 mt-2">We have emailed your <strong>offer of admission</strong> with a link to accept your place. Accepting creates your student portal and classroom access.</p>
                        <p className="text-xs text-gray-400 mt-4">Check your inbox (and spam folder) for the offer email.</p>
                    </div>
                ) : created ? (
                    /* Step 2 — pay */
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-black text-[#140152] mb-1">Application received</h2>
                        <p className="text-sm text-gray-600 mb-4">To progress your application for <strong>{created.program_name}</strong>, pay exactly:</p>
                        <div className="rounded-xl bg-[#140152] text-white p-5 text-center mb-4">
                            <p className="text-3xl font-black text-[#f5bb00]">{created.currency} {created.amount_due.toLocaleString()}</p>
                            <p className="text-xs text-white/70 mt-1">The amount must match exactly for automatic admission.</p>
                        </div>
                        {providers.length > 0 ? (
                            <div className="mb-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Pay the exact fee</p>
                                <div className="flex flex-wrap gap-2">
                                    {providers.map(pv => (
                                        <button key={pv.id} onClick={() => pay(pv.id)} disabled={!!paying}
                                            className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-3 rounded-full text-sm disabled:opacity-50">
                                            {paying === pv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Pay with {pv.name}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">You&apos;ll be returned here automatically and your admission letter issued.</p>
                            </div>
                        ) : (
                            <Link href="/give" target="_blank" className="inline-flex items-center gap-2 bg-[#f5bb00] text-[#140152] font-black px-5 py-3 rounded-full text-sm mb-5">
                                Make payment <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                        <div className="border-t border-gray-100 pt-4">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Payment reference</label>
                            <p className="text-xs text-gray-500 mb-2">Already paid, or paid another way? Paste the reference from your receipt to confirm and receive your admission letter instantly.</p>
                            <div className="flex flex-wrap gap-2">
                                <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. LETW-XXXXXXXX" className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono" />
                                <button onClick={confirm} disabled={confirming || !reference.trim()} className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg text-sm disabled:opacity-50">
                                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Confirm payment
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">Application ID: <span className="font-mono">{created.application_id}</span> — keep this safe.</p>
                        </div>
                    </div>
                ) : (
                    /* Step 1 — choose + apply */
                    <>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Choose a programme</h2>
                        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-[#140152]" /></div>
                            : list.length === 0 ? (
                                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                                    <p className="text-gray-600 text-sm font-semibold">Applications are not open yet.</p>
                                    <p className="text-gray-500 text-xs mt-1">Admissions for the next cohort open shortly. Leave your details with the school office and we&apos;ll tell you the moment they do.</p>
                                    <Link href="/contact" className="inline-block mt-3 bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg text-sm">Contact the school office</Link>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                                    {list.map(p => (
                                        <button key={p.id} onClick={() => setSel(p)} className={`text-left rounded-2xl border p-4 transition-all ${sel?.id === p.id ? 'border-[#140152] bg-[#140152]/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                            <p className="font-black text-[#140152]">{p.name}</p>
                                            <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-0.5">{p.level} · {p.duration_months} months</p>
                                            {p.summary && <p className="text-xs text-gray-600 mt-2 line-clamp-3">{p.summary}</p>}
                                            <p className="mt-2 font-bold text-[#b8860b] text-sm">{p.currency} {Number(p.tuition_amount).toLocaleString()}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                        {list.length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Your details</h2>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <F label="Full name *" value={form.full_name} onChange={v => setForm({ ...form, full_name: v })} />
                                    <F label="Email *" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
                                    <F label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                                    <F label="Date of birth" type="date" value={form.date_of_birth} onChange={v => setForm({ ...form, date_of_birth: v })} />
                                    <F label="Highest education" value={form.education_level} onChange={v => setForm({ ...form, education_level: v })} placeholder="e.g. BSc, WAEC" />
                                    <F label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
                                </div>
                                <label className="block mt-3">
                                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Why do you want to study with us?</span>
                                    <textarea value={form.statement} onChange={e => setForm({ ...form, statement: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                </label>
                                <button onClick={submit} disabled={submitting} className="mt-4 inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-3 rounded-full text-sm disabled:opacity-50">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />} Submit application
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}

function F({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </label>
    )
}

'use client'
/**
 * /theology-school/offer/[token] — the applicant's offer of admission.
 * Accepting here creates their student account, classroom access and student ID.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { theologyApi, type TheologyOffer } from '@/lib/api'

export default function OfferPage() {
    const { token } = useParams<{ token: string }>()
    const [offer, setOffer] = useState<TheologyOffer | null>(null)
    const [err, setErr] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [accepted, setAccepted] = useState<{ login_email: string; portal_url: string; setup_url?: string | null } | null>(null)

    const load = useCallback(async () => {
        try { setOffer(await theologyApi.offer(token)) }
        catch (e) { setErr((e as Error).message) }
    }, [token])
    useEffect(() => { if (token) load() }, [token, load])

    const accept = async () => {
        setBusy(true)
        try {
            const r = await theologyApi.accept(token)
            setAccepted({ login_email: r.login_email, portal_url: r.portal_url, setup_url: r.setup_url })
        } catch (e) { setErr((e as Error).message) }
        finally { setBusy(false) }
    }
    const decline = async () => {
        if (!confirm('Decline this offer of admission? This cannot be undone.')) return
        setBusy(true)
        try { await theologyApi.decline(token); await load() }
        catch (e) { setErr((e as Error).message) }
        finally { setBusy(false) }
    }

    if (err) return <main className="min-h-screen flex items-center justify-center p-6 text-center text-gray-500">{err}</main>
    if (!offer) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></main>

    if (accepted || offer.status === 'accepted' || offer.status === 'enrolled') {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
                <div className="max-w-lg w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
                    <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                    <h1 className="text-2xl font-black text-[#140152]">Your place is confirmed</h1>
                    <p className="text-gray-600 mt-2">Welcome to the LETW Theology School, {offer.full_name.split(' ')[0]}.</p>
                    <div className="mt-5 text-left bg-gray-50 rounded-xl p-4 text-sm">
                        <p className="text-gray-600"><strong>Admission number:</strong> {offer.admission_number}</p>
                        <p className="text-gray-600 mt-1"><strong>Programme:</strong> {offer.program_name}</p>
                        <p className="text-gray-600 mt-1"><strong>Sign-in email:</strong> {accepted?.login_email || offer.email}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Choose your password using the button below — you do not need to wait for an email. Use the same email and password for your student portal and your classroom on live.letw.org.</p>
                    <div className="mt-5 flex flex-wrap gap-2 justify-center">
                        <Link href={`/theology-school/offer/${token}/letter`} className="border border-gray-300 text-[#140152] font-bold px-5 py-2.5 rounded-full text-sm inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Admission letter</Link>
                        {accepted?.setup_url
                            ? <a href={accepted.setup_url} className="bg-[#140152] text-white font-bold px-5 py-2.5 rounded-full text-sm">Set your password &amp; open your portal</a>
                            : <Link href="/theology-school/student" className="bg-[#140152] text-white font-bold px-5 py-2.5 rounded-full text-sm">Open student dashboard</Link>}
                        <a href="https://live.letw.org/login" target="_blank" rel="noreferrer" className="bg-[#f5bb00] text-[#140152] font-bold px-5 py-2.5 rounded-full text-sm">Go to classroom</a>
                    </div>
                </div>
            </main>
        )
    }

    if (offer.status === 'declined') {
        return <main className="min-h-screen flex items-center justify-center p-6 text-center text-gray-500">This offer was declined. Please contact the school office if this was a mistake.</main>
    }

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Admission letter */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-[#140152] text-white px-8 py-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f5bb00]">Light Encounter Tabernacle Worldwide</p>
                        <h1 className="text-2xl font-black mt-1 flex items-center justify-center gap-2"><GraduationCap className="w-6 h-6 text-[#f5bb00]" /> Offer of Admission</h1>
                    </div>
                    <div className="p-8">
                        <p className="text-gray-700">Dear <strong className="text-[#140152]">{offer.full_name}</strong>,</p>
                        <p className="text-gray-700 mt-3 leading-relaxed">
                            We are delighted to offer you admission into <strong className="text-[#140152]">{offer.program_name}</strong>
                            {offer.duration_months ? <> ({offer.duration_months} months)</> : null} at the LETW Theology School.
                        </p>
                        <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                            <Row label="Admission number" value={offer.admission_number} />
                            <Row label="Programme" value={offer.program_name || '—'} />
                            <Row label="Level" value={offer.level || '—'} />
                            <Row label="Issued" value={offer.issued_at ? new Date(offer.issued_at).toLocaleDateString() : '—'} />
                        </div>
                        <p className="text-gray-700 mt-5 leading-relaxed">
                            Please confirm your place below. Accepting creates your student dashboard, your classroom access on
                            live.letw.org, and begins processing of your student ID.
                        </p>
                        <p className="mt-4">
                            <Link href={`/theology-school/offer/${token}/letter`} className="inline-flex items-center gap-2 text-sm font-bold text-[#140152] underline">
                                <FileText className="w-4 h-4" /> View &amp; print your admission letter
                            </Link>
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <button onClick={accept} disabled={busy} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-3 rounded-full text-sm disabled:opacity-50">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Accept my offer
                            </button>
                            <button onClick={decline} disabled={busy} className="text-gray-400 hover:text-red-500 font-semibold px-4 py-3 text-sm">Decline</button>
                        </div>
                    </div>
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-4 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> This link is personal to you — please don&apos;t share it.</p>
            </div>
        </main>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className="font-semibold text-[#140152]">{value}</p>
        </div>
    )
}

'use client'
/**
 * /verify/booking/[id]?sig=… — public verification page the permission-letter
 * QR code lands on. Confirms (server-side) whether the letter is authentic.
 */
import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShieldCheck, ShieldX, Calendar } from 'lucide-react'
import { sanctuaryApi, type SanctuaryLetterVerify } from '@/lib/api'

function fmt(iso?: string) {
    return iso ? new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''
}

function VerifyInner() {
    const { id } = useParams() as { id: string }
    const sp = useSearchParams()
    const sig = sp.get('sig') || ''
    const [res, setRes] = useState<SanctuaryLetterVerify | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        sanctuaryApi.verifyLetter(id, sig).then(setRes).catch(() => setRes({ valid: false, reason: 'Could not reach the verification service.' })).finally(() => setLoading(false))
    }, [id, sig])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    const ok = res?.valid
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className={`p-8 text-center text-white ${ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {ok ? <ShieldCheck className="w-14 h-14 mx-auto mb-2" /> : <ShieldX className="w-14 h-14 mx-auto mb-2" />}
                    <h1 className="text-2xl font-black">{ok ? 'Valid permission letter' : 'Not verified'}</h1>
                    <p className="text-white/80 text-sm mt-1">{ok ? 'Issued by Light Encounter Tabernacle Worldwide' : (res?.reason || 'This letter could not be verified.')}</p>
                </div>
                {ok && (
                    <div className="p-6 space-y-2 text-sm">
                        <Row k="Reference" v={res?.reference} mono />
                        <Row k="Facility" v={res?.room_name} />
                        <Row k="Purpose" v={res?.purpose} />
                        <Row k="Authorised contact" v={res?.contact_name} />
                        <Row k="From" v={fmt(res?.starts_at)} />
                        <Row k="To" v={fmt(res?.ends_at)} />
                        <Row k="Fingerprint" v={res?.fingerprint} mono />
                    </div>
                )}
                <div className="p-6 border-t border-gray-100 text-center">
                    <Link href="/sanctuary" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#140152] hover:underline"><Calendar className="w-4 h-4" /> Hall bookings</Link>
                </div>
            </div>
        </main>
    )
}

function Row({ k, v, mono }: { k: string; v?: string; mono?: boolean }) {
    if (!v) return null
    return (
        <div className="flex justify-between gap-3 border-b border-gray-50 pb-1.5">
            <span className="text-gray-500">{k}</span>
            <span className={`font-bold text-[#140152] text-right ${mono ? 'font-mono text-xs' : ''}`}>{v}</span>
        </div>
    )
}

export default function VerifyBookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>}>
            <VerifyInner />
        </Suspense>
    )
}

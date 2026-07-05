'use client'
/**
 * /verify/cert/[coupleId]?sig=<hmac>
 *
 * The page a phone camera lands on after scanning a certificate's QR chip.
 * The backend recomputes the HMAC-SHA256 signature over the certificate's
 * immutable facts and compares in constant time — so a certificate that has
 * been altered, forged, or revoked shows INVALID even if the page URL looks
 * plausible.
 */
import { Suspense, use, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Loader2, ShieldCheck, ShieldX, BadgeCheck, CalendarHeart, Fingerprint, Globe,
} from 'lucide-react'
import { marriagePrepApi } from '@/lib/api'

export default function VerifyCertPage({ params }: { params: Promise<{ coupleId: string }> }) {
    const { coupleId } = use(params)
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#06002a] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#f5bb00]" />
            </main>
        }>
            <VerifyBody coupleId={coupleId} />
        </Suspense>
    )
}

function VerifyBody({ coupleId }: { coupleId: string }) {
    const searchParams = useSearchParams()
    const sig = searchParams?.get('sig') || ''

    const [result, setResult] = useState<Awaited<ReturnType<typeof marriagePrepApi.verifyCert>> | null>(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        marriagePrepApi.verifyCert(coupleId, sig)
            .then(setResult)
            .catch(() => setResult({ valid: false, reason: 'Verification service unreachable — try again shortly.' }))
            .finally(() => setChecking(false))
    }, [coupleId, sig])

    if (checking) {
        return (
            <main className="min-h-screen bg-[#06002a] flex flex-col items-center justify-center gap-4 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-[#f5bb00]" />
                <p className="text-sm text-white/60 tracking-widest uppercase">Verifying signature…</p>
            </main>
        )
    }

    const ok = !!result?.valid
    const signedAt = result?.pastor_signed_at
        ? new Date(result.pastor_signed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : null

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#06002a] via-[#140152] to-[#06002a] text-white flex items-center justify-center px-4 py-16">
            <div className="max-w-lg w-full">
                {/* Verdict card */}
                <div className={`rounded-3xl border-2 overflow-hidden shadow-2xl ${ok ? 'border-emerald-400/60 shadow-emerald-500/20' : 'border-red-400/60 shadow-red-500/20'}`}>
                    <div className={`p-8 text-center ${ok ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                        {ok
                            ? <ShieldCheck className="w-20 h-20 mx-auto text-emerald-400" />
                            : <ShieldX className="w-20 h-20 mx-auto text-red-400" />}
                        <h1 className="font-serif text-3xl md:text-4xl font-black mt-4">
                            {ok ? 'Certificate verified' : 'Not verified'}
                        </h1>
                        <p className={`text-sm mt-2 ${ok ? 'text-emerald-200/90' : 'text-red-200/90'}`}>
                            {ok
                                ? 'The cryptographic signature matches the record on file at Light Encounter Tabernacle Worldwide.'
                                : (result?.reason || 'This code does not match any issued certificate.')}
                        </p>
                    </div>

                    {ok && (
                        <div className="p-8 bg-white/5 backdrop-blur space-y-5">
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/50">Certificate of Completion · Marriage Prep</p>
                                <p className="font-serif text-2xl font-black mt-2">
                                    {result?.partner_a_name} <span className="text-rose-300 font-light">&amp;</span> {result?.partner_b_name}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white/5 rounded-2xl p-4">
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-white/40 inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Signed by</p>
                                    <p className="font-serif italic mt-1">{result?.pastor_signature || '—'}</p>
                                    {signedAt && <p className="text-[11px] text-white/50 mt-0.5">{signedAt}</p>}
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4">
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-white/40 inline-flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Fingerprint</p>
                                    <p className="font-mono text-[#f5bb00] mt-1">{result?.fingerprint}</p>
                                    <p className="text-[11px] text-white/50 mt-0.5">Match this against the printed chip</p>
                                </div>
                            </div>
                            {result?.wedding_date && (
                                <p className="text-center text-sm text-white/70 inline-flex items-center gap-2 w-full justify-center">
                                    <CalendarHeart className="w-4 h-4 text-rose-300" />
                                    Wedding on file: {new Date(result.wedding_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            )}
                            <p className="text-center text-[11px] text-white/40 inline-flex items-center gap-1.5 w-full justify-center border-t border-white/10 pt-4">
                                <Globe className="w-3 h-3" /> Issued & cryptographically signed by <strong className="text-white/70">letw.org</strong>
                            </p>
                        </div>
                    )}
                </div>

                <p className="text-center mt-6">
                    <Link href="/" className="text-xs text-white/40 hover:text-white/80 underline">Light Encounter Tabernacle Worldwide — letw.org</Link>
                </p>
            </div>
        </main>
    )
}

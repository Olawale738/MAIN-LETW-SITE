'use client'
/**
 * /verify/admission/[id]?sig=… — where the admission letter's QR code lands.
 *
 * The signature travels in the URL; the server recomputes the HMAC over the
 * letter's immutable facts and compares. A letter whose name, admission number
 * or issue date has been altered fails, and so does one that was never issued
 * here. Public by design — anyone holding the letter can check it.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { theologyApi, type AdmissionVerification } from '@/lib/api'

export default function VerifyAdmissionPage() {
    const { id } = useParams<{ id: string }>()
    const sig = useSearchParams().get('sig') || ''
    const [result, setResult] = useState<AdmissionVerification | null>(null)
    const [err, setErr] = useState<string | null>(null)

    const load = useCallback(async () => {
        try { setResult(await theologyApi.verifyAdmission(id, sig)) }
        catch (e) { setErr((e as Error).message) }
    }, [id, sig])
    useEffect(() => { if (id) load() }, [id, load])

    if (err) return <Shell><p className="text-center text-gray-500 text-sm">{err}</p></Shell>
    if (!result) return <Shell><div className="flex justify-center py-6"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div></Shell>

    if (!result.valid) {
        return (
            <Shell>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-black text-[#140152] mt-4">Not verified</h1>
                    <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">{result.reason}</p>
                    <p className="text-xs text-gray-400 mt-4">
                        If you believe this letter is genuine, contact the Office of the Registrar before acting on it.
                    </p>
                </div>
            </Shell>
        )
    }

    return (
        <Shell>
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-xl font-black text-[#140152] mt-4">Genuine admission letter</h1>
                <p className="text-gray-600 text-sm mt-1">Issued by the LETW School of Theology.</p>
            </div>

            <div className="mt-6 flex items-start gap-4">
                {result.photo_url && (
                    // Applicant photos come from arbitrary hosts.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.photo_url} alt={result.full_name}
                        className="w-20 h-24 object-cover border border-gray-200 rounded shrink-0" />
                )}
                <dl className="flex-1 min-w-0 text-sm">
                    {[
                        ['Holder', result.full_name],
                        ['Admission number', result.admission_number],
                        ['Programme', result.program_name || '—'],
                        ['Level', result.level || '—'],
                        ['Issued', result.issued_at ? new Date(result.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                        ['Signed by', result.signed_by || '—'],
                    ].map(([k, v]) => (
                        <div key={k as string} className="flex gap-3 py-1.5 border-b border-gray-100 last:border-0">
                            <dt className="w-32 shrink-0 text-[10px] uppercase tracking-widest font-bold text-gray-400 pt-1">{k}</dt>
                            <dd className="font-semibold text-[#140152] min-w-0 break-words">{v}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-gray-400">
                    Current status: <span className="font-bold text-gray-600 capitalize">{result.status}</span>
                </p>
                {result.fingerprint && (
                    <p className="text-[11px] text-gray-400">
                        Check code <span className="font-mono font-bold text-gray-600">{result.fingerprint}</span>
                    </p>
                )}
            </div>
        </Shell>
    )
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                <div className="flex items-center justify-center gap-2 mb-5">
                    <div className="relative w-9 h-9">
                        <Image src="/logo.png" alt="LETW" fill sizes="36px" className="object-contain" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-[#140152] leading-tight">LIGHT ENCOUNTER TABERNACLE WORLDWIDE</p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9a6f00]">School of Theology</p>
                    </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-7">{children}</div>
                <p className="text-center text-[11px] text-gray-400 mt-4">
                    Verification is performed on letw.org&apos;s servers against a cryptographic signature.
                </p>
            </div>
        </main>
    )
}

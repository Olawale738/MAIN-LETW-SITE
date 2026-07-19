'use client'
/**
 * /sanctuary/letter/[id] — printable hall-booking permission letter for an
 * approved booking. Church letterhead, a faint ministry watermark, the
 * booking details, a QR code that verifies the letter at letw.org, and the
 * church secretary's signature. Print / Save-as-PDF hides everything but the
 * letter (same trick as the marriage-prep certificate).
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Printer, AlertCircle, ShieldCheck } from 'lucide-react'
import { sanctuaryApi, type SanctuaryPermissionLetter } from '@/lib/api'

function fmt(iso: string) {
    return new Date(iso).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function PermissionLetterPage() {
    const { id } = useParams() as { id: string }
    const [data, setData] = useState<SanctuaryPermissionLetter | null>(null)
    const [err, setErr] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        sanctuaryApi.permissionLetter(id).then(setData).catch((e: Error) => setErr(e.message)).finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
    if (err || !data) return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <AlertCircle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
                <p className="text-gray-600">{err || 'This permission letter is not available. Bookings must be approved before a letter is issued.'}</p>
                <Link href="/sanctuary" className="text-[#140152] font-bold hover:underline mt-4 inline-block">← Back to bookings</Link>
            </div>
        </main>
    )

    return (
        <main className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-3xl mx-auto mb-4 flex justify-center print:hidden">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-full text-sm">
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
            </div>

            <div id="letter-print" className="relative max-w-3xl mx-auto bg-white shadow-xl print:shadow-none overflow-hidden">
                {/* Ministry watermark */}
                {data.watermark_image && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <img src={data.watermark_image} alt="" className="w-2/3 max-w-md opacity-[0.06]" />
                    </div>
                )}

                <div className="relative p-8 sm:p-12">
                    {/* Letterhead */}
                    <div className="text-center border-b-2 border-[#140152] pb-5 mb-6">
                        {data.watermark_image && <img src={data.watermark_image} alt="LETW" className="h-16 mx-auto mb-2 object-contain" />}
                        <h1 className="text-xl sm:text-2xl font-black text-[#140152] tracking-tight">LIGHT ENCOUNTER TABERNACLE WORLDWIDE</h1>
                        <p className="text-[11px] tracking-[0.3em] uppercase text-[#b8860b] font-bold mt-1">Facility Use Permission Letter</p>
                    </div>

                    <div className="flex items-start justify-between text-xs text-gray-500 mb-6">
                        <p>Ref: <span className="font-mono font-bold text-[#140152]">{data.reference}</span></p>
                        <p>Issued: {new Date(data.issued_at).toLocaleDateString()}</p>
                    </div>

                    <p className="text-sm text-gray-800 leading-relaxed mb-4">To whom it may concern,</p>
                    <p className="text-sm text-gray-800 leading-relaxed mb-4">
                        {data.letter_intro || (
                            <>This letter confirms that permission has been <strong>granted</strong> for the use of the church facility named below.
                            The named contact is authorised to hold the stated event during the approved window.</>
                        )}
                    </p>

                    {/* Details */}
                    <table className="w-full text-sm my-6">
                        <tbody className="divide-y divide-gray-100">
                            {[
                                ['Facility', data.room_name + (data.room_location ? ` — ${data.room_location}` : '')],
                                ['Purpose / Event', data.purpose],
                                ['Authorised contact', data.contact_name],
                                ['Expected attendees', String(data.attendees || '—')],
                                ['From', fmt(data.starts_at)],
                                ['To', fmt(data.ends_at)],
                            ].map(([k, v]) => (
                                <tr key={k}>
                                    <td className="py-2 pr-4 text-gray-500 align-top w-40">{k}</td>
                                    <td className="py-2 font-bold text-[#140152]">{v}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {data.admin_note && (
                        <div className="bg-[#fbf5e6] border border-[#f5bb00]/40 rounded-xl px-4 py-3 text-sm text-gray-800 mb-6">
                            <span className="font-bold text-[#140152]">Conditions / notes: </span>{data.admin_note}
                        </div>
                    )}

                    {/* Signature + QR */}
                    <div className="flex items-end justify-between gap-6 mt-10 pt-6 border-t border-gray-100">
                        <div>
                            {data.secretary_signature_image
                                ? <img src={data.secretary_signature_image} alt="Signature" className="h-16 object-contain mb-1" />
                                : <div className="h-16 flex items-end"><span className="font-[cursive] text-2xl text-[#140152]">{data.secretary_name}</span></div>}
                            <div className="border-t border-gray-400 pt-1 w-56">
                                <p className="font-black text-[#140152] text-sm">{data.secretary_name}</p>
                                <p className="text-xs text-gray-500">{data.secretary_title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">For and on behalf of LETW</p>
                            </div>
                        </div>

                        <div className="text-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={sanctuaryApi.letterQrUrl(data.id)} alt="Verification QR" className="w-24 h-24 mx-auto" />
                            <p className="text-[9px] text-gray-500 mt-1">Scan to verify</p>
                            <p className="text-[9px] font-mono text-gray-400">{data.fingerprint}</p>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-400 mt-8 leading-relaxed border-t border-gray-100 pt-3 inline-flex items-start gap-1.5">
                        <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
                        This letter is digitally verifiable. Scan the QR code or visit the verification link to confirm authenticity — a forged or altered letter will fail verification.
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    body * { visibility: hidden !important; }
                    #letter-print, #letter-print * { visibility: visible !important; }
                    #letter-print { position: absolute !important; left: 0; top: 0; width: 100% !important; box-shadow: none !important; }
                    @page { size: A4 portrait; margin: 12mm; }
                }
            `}</style>
        </main>
    )
}

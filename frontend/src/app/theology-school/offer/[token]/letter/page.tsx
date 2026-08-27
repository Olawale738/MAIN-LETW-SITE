'use client'
/**
 * /theology-school/offer/[token]/letter — the printable admission letter.
 *
 * SharePoints is the system of record and issues the official letter; this is
 * letw.org's own copy, rendered from the same offer record so the applicant and
 * the admissions office can always print one. Both carry the same admission
 * number, and both verify against the same signature.
 *
 * The QR chip encodes an HMAC-signed verification URL — the server recomputes
 * the signature, so a letter that has been altered fails the check.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Printer, ExternalLink } from 'lucide-react'
import { theologyApi, type TheologyOffer } from '@/lib/api'

const fmtDate = (iso?: string | null) =>
    new Date(iso || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default function AdmissionLetterPage() {
    const { token } = useParams<{ token: string }>()
    const [offer, setOffer] = useState<TheologyOffer | null>(null)
    const [err, setErr] = useState<string | null>(null)

    const load = useCallback(async () => {
        try { setOffer(await theologyApi.offer(token)) }
        catch (e) { setErr((e as Error).message) }
    }, [token])
    useEffect(() => { if (token) load() }, [token, load])

    if (err) return <main className="min-h-screen flex items-center justify-center p-6 text-center text-gray-500">{err}</main>
    if (!offer) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></main>

    const first = offer.full_name.split(' ')[0]
    const admissionNo = offer.offer_number || offer.admission_number
    const signatory = offer.signatory

    return (
        <main className="min-h-screen bg-neutral-200 py-8 px-4 print:bg-white print:p-0 print:min-h-0">
            {/* Toolbar — never printed */}
            <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap gap-2 justify-end print:hidden">
                {offer.admission_letter_url && (
                    <a href={offer.admission_letter_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 border border-gray-300 bg-white text-[#140152] font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                        <ExternalLink className="w-4 h-4" /> Official copy (SharePoints)
                    </a>
                )}
                <button onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-4 py-2 rounded-lg text-sm">
                    <Printer className="w-4 h-4" /> Print / save as PDF
                </button>
            </div>

            {/* ── A4 sheet ───────────────────────────────────────────────── */}
            <div className="letter relative max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none">

                {/* Gold rule down the binding edge */}
                <div aria-hidden className="absolute inset-y-0 left-0 w-[6mm] bg-gradient-to-b from-[#f5bb00] via-[#d9a400] to-[#140152]" />

                {/* Seal watermark */}
                <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-[135mm] h-[135mm] opacity-[0.05]">
                        <Image src="/logo.png" alt="" fill sizes="500px" className="object-contain" priority />
                    </div>
                </div>

                <div className="relative pl-[22mm] pr-[16mm] py-[14mm]">

                    {/* ── Letterhead ─────────────────────────────────────── */}
                    <header className="flex items-start gap-4 pb-4 border-b-[3px] border-double border-[#140152]">
                        <div className="relative w-[19mm] h-[19mm] shrink-0">
                            <Image src="/logo.png" alt="LETW" fill sizes="80px" className="object-contain" />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-[13.5px] font-black text-[#140152] leading-[1.15] tracking-[-0.01em]">
                                LIGHT ENCOUNTER TABERNACLE WORLDWIDE
                            </p>
                            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-[#9a6f00] mt-1">
                                School of Theology
                            </p>
                            <p className="text-[8.5px] text-gray-500 mt-1.5 leading-snug">
                                Office of the Registrar · letw.org · Admissions &amp; Student Records
                            </p>
                        </div>
                        {/* Passport photograph of the holder */}
                        <div className="shrink-0 text-center">
                            <div className="relative w-[25mm] h-[31mm] border border-gray-300 bg-gray-50 overflow-hidden">
                                {offer.photo_url ? (
                                    // Applicant photos come from arbitrary hosts, so a plain img
                                    // avoids next/image's remote-host allow-list entirely.
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={offer.photo_url} alt={offer.full_name}
                                        className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[7px] text-gray-400 px-1 text-center leading-tight">
                                        Photograph<br />to be affixed
                                    </div>
                                )}
                            </div>
                            <p className="text-[6.5px] uppercase tracking-[0.14em] text-gray-400 mt-1">Holder</p>
                        </div>
                    </header>

                    {/* ── Reference line ─────────────────────────────────── */}
                    <div className="flex justify-between items-baseline mt-4 text-[9.5px]">
                        <p>
                            <span className="text-gray-400 uppercase tracking-[0.14em] font-bold">Our ref</span>{' '}
                            <span className="font-mono font-bold text-[#140152] text-[11px] tracking-tight">{admissionNo}</span>
                        </p>
                        <p>
                            <span className="text-gray-400 uppercase tracking-[0.14em] font-bold">Date</span>{' '}
                            <span className="font-bold text-[#140152] text-[10.5px]">{fmtDate(offer.issued_at)}</span>
                        </p>
                    </div>

                    {/* ── Title ──────────────────────────────────────────── */}
                    <div className="mt-7 text-center">
                        <h1 className="text-[17px] font-black uppercase tracking-[0.2em] text-[#140152]">
                            Offer of Provisional Admission
                        </h1>
                        <div className="mx-auto mt-2 flex items-center justify-center gap-2">
                            <span className="block w-14 h-px bg-[#c9a227]" />
                            <span className="block w-1.5 h-1.5 rotate-45 bg-[#f5bb00]" />
                            <span className="block w-14 h-px bg-[#c9a227]" />
                        </div>
                    </div>

                    {/* ── Body ───────────────────────────────────────────── */}
                    <div className="mt-6 text-[11.5px] leading-[1.78] text-neutral-800 text-justify">
                        <p className="font-bold text-[#140152] text-[12px]">{offer.full_name}</p>
                        <p className="text-[10px] text-gray-500 -mt-0.5">{offer.email}</p>

                        <p className="mt-4">Dear {first},</p>

                        <p className="mt-3">
                            On the recommendation of the Academic Board, I am pleased to inform you that you
                            have been offered provisional admission into the{' '}
                            <strong className="text-[#140152]">{offer.program_name}</strong>
                            {offer.level ? <> programme at {offer.level} level</> : ' programme'}
                            {offer.duration_months ? <>, a course of study extending over {offer.duration_months} months</> : null}
                            {' '}in the School of Theology of Light Encounter Tabernacle Worldwide.
                        </p>

                        <p className="mt-3">
                            Your application has been assessed and the prescribed tuition of{' '}
                            <strong>{offer.currency} {Number(offer.tuition_amount || 0).toLocaleString()}</strong>{' '}
                            has been received and verified in full. This admission is granted on that basis and
                            takes effect upon your written acceptance of this offer.
                        </p>

                        {/* Particulars */}
                        <table className="w-full mt-5 text-[10px] border border-neutral-300 border-collapse">
                            <caption className="caption-top text-left text-[7.5px] font-bold uppercase tracking-[0.18em] text-gray-400 pb-1">
                                Particulars of admission
                            </caption>
                            <tbody>
                                {[
                                    ['Name of candidate', offer.full_name],
                                    ['Admission number', admissionNo],
                                    ['Programme', offer.program_name || '—'],
                                    ['Level of award', offer.level || '—'],
                                    ['Duration of study', offer.duration_months ? `${offer.duration_months} months` : '—'],
                                    ['Tuition (settled)', `${offer.currency} ${Number(offer.tuition_amount || 0).toLocaleString()}`],
                                    ['Student login', offer.email],
                                ].map(([label, value], i) => (
                                    <tr key={label as string} className={i % 2 ? 'bg-neutral-50/70' : ''}>
                                        <th className="text-left font-bold text-gray-500 uppercase tracking-[0.1em] text-[7.5px] px-2.5 py-[5px] w-[36%] border border-neutral-200 align-middle">
                                            {label}
                                        </th>
                                        <td className="px-2.5 py-[5px] font-semibold text-[#140152] border border-neutral-200">{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <p className="mt-4">
                            To take up this offer you must record your acceptance. Upon acceptance your student
                            record is opened, your identity card is issued, and access to your classes is
                            arranged. Should you not accept within the period stated in your offer
                            correspondence, this admission may be withdrawn without further notice.
                        </p>

                        <p className="mt-3">
                            It is a privilege to welcome you into the school. It is our prayer that this
                            training will deepen your walk with God and equip you thoroughly for the work of
                            the ministry to which you have been called.
                        </p>
                    </div>

                    {/* ── Signature + authentication ─────────────────────── */}
                    <div className="mt-7 flex items-end justify-between gap-6">
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-neutral-800">Yours faithfully,</p>
                            <div className="h-[15mm] flex items-end">
                                {signatory?.signature_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={signatory.signature_url} alt=""
                                        className="max-h-[14mm] max-w-[52mm] object-contain object-left" />
                                ) : null}
                            </div>
                            <div className="w-[58mm] border-t border-neutral-500 pt-1">
                                <p className="font-black text-[#140152] text-[11px] leading-tight">
                                    {signatory?.name || '—'}
                                </p>
                                <p className="text-[8px] uppercase tracking-[0.16em] text-gray-500 mt-0.5">
                                    {signatory?.title || 'Registrar'}
                                </p>
                                <p className="text-[7.5px] text-gray-400 mt-0.5">
                                    For and on behalf of the Academic Board
                                </p>
                            </div>
                        </div>

                        {/* QR authentication chip */}
                        <div className="shrink-0 text-center">
                            {offer.qr_svg_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={offer.qr_svg_url} alt="Verification QR code"
                                    className="w-[23mm] h-[23mm] block" />
                            )}
                            <p className="text-[6.5px] uppercase tracking-[0.12em] text-gray-500 mt-1 leading-tight">
                                Scan to verify
                            </p>
                            {offer.fingerprint && (
                                <p className="font-mono text-[7px] text-gray-600 tracking-tight mt-0.5">
                                    {offer.fingerprint}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ─────────────────────────────────────────── */}
                    <footer className="mt-6 pt-2.5 border-t border-neutral-300 flex justify-between items-center gap-3 text-[7px] text-gray-400 leading-tight">
                        <span>
                            This document is issued electronically and is valid without a wet signature.
                            Its authenticity may be confirmed at <span className="font-mono">letw.org/verify/admission</span>.
                        </span>
                        <span className="font-mono shrink-0">{admissionNo}</span>
                    </footer>
                </div>
            </div>

            <style jsx global>{`
                .letter { width: 210mm; min-height: 297mm; }
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    html, body { background: #fff !important; }
                    .letter {
                        width: 210mm;
                        min-height: 297mm;
                        margin: 0;
                        page-break-after: avoid;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </main>
    )
}

'use client'
/**
 * /theology-school/offer/[token]/letter — the printable admission letter.
 *
 * SharePoints is the system of record and issues the official letter; this page
 * renders letw.org's own copy from the same offer record so the applicant and
 * the admissions office can always open and print it, even before (or without)
 * the SharePoints copy. When SharePoints has issued its letter, we link to it.
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

    return (
        <main className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
            {/* Toolbar — never printed */}
            <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap gap-2 justify-end print:hidden">
                {offer.admission_letter_url && (
                    <a href={offer.admission_letter_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 border border-gray-300 bg-white text-[#140152] font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                        <ExternalLink className="w-4 h-4" /> Official letter (SharePoints)
                    </a>
                )}
                <button onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-4 py-2 rounded-lg text-sm">
                    <Printer className="w-4 h-4" /> Print / save as PDF
                </button>
            </div>

            {/* A4 sheet */}
            <div className="relative max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none overflow-hidden"
                style={{ minHeight: '297mm' }}>

                {/* Watermark */}
                <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-[420px] h-[420px] opacity-[0.055]">
                        <Image src="/logo.png" alt="" fill sizes="420px" className="object-contain" />
                    </div>
                </div>

                <div className="relative px-[18mm] py-[16mm]">
                    {/* Letterhead */}
                    <header className="flex items-center gap-4 pb-5 border-b-2 border-[#140152]">
                        <div className="relative w-16 h-16 shrink-0">
                            <Image src="/logo.png" alt="LETW" fill sizes="64px" className="object-contain" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[15px] font-black text-[#140152] leading-tight tracking-tight">
                                LIGHT ENCOUNTER TABERNACLE WORLDWIDE
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8860b] mt-0.5">
                                School of Theology
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">letw.org · Office of Admissions</p>
                        </div>
                    </header>

                    {/* Reference block */}
                    <div className="flex justify-between items-start mt-6 text-[11px]">
                        <div>
                            <p className="text-gray-400 uppercase tracking-widest text-[9px] font-bold">Admission number</p>
                            <p className="font-mono font-bold text-[#140152] text-sm">
                                {offer.offer_number || offer.admission_number}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 uppercase tracking-widest text-[9px] font-bold">Date of issue</p>
                            <p className="font-bold text-[#140152] text-sm">{fmtDate(offer.issued_at)}</p>
                        </div>
                    </div>

                    <h1 className="mt-8 text-center text-[19px] font-black uppercase tracking-[0.14em] text-[#140152]">
                        Offer of Admission
                    </h1>
                    <div className="mx-auto mt-2 w-24 h-[3px] bg-[#f5bb00]" />

                    {/* Body */}
                    <div className="mt-8 text-[13px] leading-[1.85] text-gray-800">
                        <p className="font-bold text-[#140152]">Dear {offer.full_name},</p>

                        <p className="mt-4">
                            On behalf of the Academic Board of the LETW School of Theology, it is my privilege to
                            offer you admission into the{' '}
                            <strong className="text-[#140152]">{offer.program_name}</strong>
                            {offer.duration_months ? <> programme, a {offer.duration_months}-month course of study</> : ' programme'}
                            {offer.level ? <> at {offer.level} level</> : null}.
                        </p>

                        <p className="mt-4">
                            Your application and the full tuition payment of{' '}
                            <strong>{offer.currency} {Number(offer.tuition_amount || 0).toLocaleString()}</strong>{' '}
                            have been received and verified. This letter confirms your place on the programme.
                        </p>

                        {/* Particulars */}
                        <table className="w-full mt-6 text-[12px] border border-gray-200">
                            <tbody>
                                {[
                                    ['Full name', offer.full_name],
                                    ['Programme', offer.program_name || '—'],
                                    ['Level', offer.level || '—'],
                                    ['Duration', offer.duration_months ? `${offer.duration_months} months` : '—'],
                                    ['Admission number', offer.offer_number || offer.admission_number],
                                    ['Login email', offer.email],
                                ].map(([label, value]) => (
                                    <tr key={label as string} className="border-b border-gray-100 last:border-0">
                                        <th className="text-left font-bold text-gray-500 uppercase tracking-widest text-[9px] px-3 py-2 w-[38%] bg-gray-50/70">{label}</th>
                                        <td className="px-3 py-2 font-medium text-[#140152]">{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <p className="mt-6">
                            To take up this offer, {first}, please accept it on your offer page. Your student
                            account and classroom access are created the moment you accept, and your student
                            identity card is issued shortly afterwards.
                        </p>

                        <p className="mt-4">
                            We look forward to welcoming you into the school, and we pray that this training
                            will deepen your walk and sharpen you for the work of the ministry.
                        </p>

                        <p className="mt-8">Yours faithfully,</p>
                        <div className="mt-10">
                            <div className="w-56 border-t border-gray-400 pt-1.5">
                                <p className="font-black text-[#140152] text-[13px]">Registrar</p>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500">LETW School of Theology</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="absolute left-[18mm] right-[18mm] bottom-[12mm] pt-3 border-t border-gray-200 flex justify-between items-center text-[9px] text-gray-400">
                        <span>Light Encounter Tabernacle Worldwide · School of Theology</span>
                        <span className="font-mono">{offer.offer_number || offer.admission_number}</span>
                    </footer>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: #fff; }
                }
            `}</style>
        </main>
    )
}

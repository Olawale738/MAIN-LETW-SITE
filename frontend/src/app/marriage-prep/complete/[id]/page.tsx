'use client'
/**
 * /marriage-prep/complete/[id]
 *
 * Landing page emailed to the couple after their pastor signs off. Shows a
 * printable Certificate of Completion + a checklist of next steps
 * (book wedding hall, meet the pastor, keep the habits). The couple id
 * (UUID) is the only auth — it's unguessable enough for this use.
 *
 * Backend endpoint refuses to serve a certificate for a couple that has
 * NOT been signed off yet; we render a gentle "not yet" state instead.
 */
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Heart, Printer, MapPin, Phone, Sparkles, ArrowRight, ShieldCheck, CalendarHeart, AlertCircle,
} from 'lucide-react'
import { marriagePrepApi } from '@/lib/api'

interface CertificateData {
    id: string
    partner_a_name: string
    partner_b_name: string
    wedding_date: string | null
    pastor_signature: string | null
    pastor_signed_at: string | null
    status: string
    signature: string
    fingerprint: string
    verify_url: string
}

export default function MarriagePrepCompletePage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15 params-as-promise; React.use() unwraps it in a client component.
    const { id } = use(params)

    const [cert, setCert] = useState<CertificateData | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        marriagePrepApi.certificate(id)
            .then(setCert)
            .catch((e: Error) => setErr(e.message || 'Not found.'))
            .finally(() => setLoading(false))
    }, [id])

    // Loading + not-yet-signed-off states are treated as distinct experiences
    // so a couple mid-course doesn't see "error"; they see encouragement.
    if (loading) {
        return (
            <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </main>
        )
    }

    if (err || !cert) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6] px-4 py-24">
                <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-lg p-10 text-center border border-gray-100">
                    <Heart className="w-14 h-14 mx-auto text-rose-500 mb-4" />
                    <h1 className="text-2xl font-black text-[#140152]">Not quite yet.</h1>
                    <p className="text-gray-600 mt-3 leading-relaxed">
                        We couldn&apos;t find a completed Marriage Prep certificate for this link.
                        If you&apos;re still working through the six weeks, keep going —
                        this page unlocks the moment your pastor signs off.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <Link href="/marriage-prep" className="inline-flex items-center gap-1.5 bg-[#140152] text-white font-bold px-5 py-2.5 rounded-full text-sm">
                            Back to Marriage Prep
                        </Link>
                        <Link href="/contact" className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-full text-sm">
                            Ask a pastor
                        </Link>
                    </div>
                    {err && (
                        <p className="mt-6 text-[10px] text-gray-400 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {err}
                        </p>
                    )}
                </div>
            </main>
        )
    }

    const coupleLabel = `${cert.partner_a_name} & ${cert.partner_b_name}`
    const signedAt = cert.pastor_signed_at
        ? new Date(cert.pastor_signed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : ''
    const weddingLabel = cert.wedding_date
        ? new Date(cert.wedding_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : ''

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            {/* Hero */}
            <section className="relative overflow-hidden py-16 px-4 text-center">
                <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-rose-300/20 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] rounded-full bg-[#f5bb00]/20 blur-[120px] pointer-events-none" />
                <div className="relative max-w-2xl mx-auto">
                    <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.4em] text-xs uppercase mb-4">
                        <Sparkles className="w-3.5 h-3.5" /> You did it
                    </p>
                    <h1 className="font-serif text-4xl md:text-6xl font-black text-[#140152] leading-tight">
                        Marriage Prep, complete.
                    </h1>
                    <p className="text-lg text-[#140152]/70 mt-4">
                        Congratulations, <strong>{coupleLabel}</strong>. Six weeks of listening, learning, and choosing each other on purpose — signed off by your pastor.
                    </p>
                </div>
            </section>

            {/* Certificate — printable card. id=cert-print-area is targeted by
                  the print stylesheet below so ONLY this card prints. */}
            <section className="max-w-3xl mx-auto px-4 pb-12">
                <div id="cert-print-area" className="relative bg-white border-4 border-[#140152] rounded-3xl p-8 sm:p-12 shadow-xl overflow-hidden print:shadow-none print:border-2">
                    {/* Corner ornaments */}
                    <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-[#f5bb00] rounded-tl-3xl" />
                    <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-[#f5bb00] rounded-tr-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-[#f5bb00] rounded-bl-3xl" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-[#f5bb00] rounded-br-3xl" />

                    <div className="text-center relative">
                        <ShieldCheck className="w-14 h-14 mx-auto text-[#140152] mb-4" />
                        <p className="text-[10px] uppercase tracking-[0.5em] font-black text-gray-500">Certificate of Completion</p>
                        <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#f5bb00] mt-1">Six-Week Marriage Prep</p>

                        <p className="text-sm text-[#140152]/70 mt-8 italic">This is to certify that</p>
                        <h2 className="font-serif text-3xl sm:text-5xl font-black text-[#140152] mt-3 leading-tight break-words">
                            {coupleLabel}
                        </h2>
                        <p className="text-sm text-[#140152]/70 mt-4 italic max-w-md mx-auto leading-relaxed">
                            have faithfully completed the six-week Marriage Prep course at Light Encounter Tabernacle Worldwide.
                        </p>

                        {weddingLabel && (
                            <p className="text-sm text-[#140152] mt-6 inline-flex items-center gap-2">
                                <CalendarHeart className="w-4 h-4 text-rose-500" />
                                Wedding on file: <strong>{weddingLabel}</strong>
                            </p>
                        )}

                        <div className="mt-10 pt-6 border-t border-gray-200 grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:gap-8 max-w-xl mx-auto text-left">
                            <div>
                                <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Signed by</p>
                                <p className="font-serif italic text-lg text-[#140152] mt-1">{cert.pastor_signature || '—'}</p>
                                <p className="text-[10px] text-gray-500 mt-1">Pastor</p>
                            </div>

                            {/* QR chip — scan lands on letw.org/verify/cert/… where the
                                  server recomputes the HMAC. Fingerprint below lets a
                                  human cross-check the scan result against the print. */}
                            <div className="text-center">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-2xl border-2 border-[#f5bb00] bg-white p-1.5 shadow-[0_4px_20px_rgba(245,187,0,0.25)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={marriagePrepApi.certificateQrUrl(cert.id)}
                                        alt="Scan to verify this certificate"
                                        className="w-full h-full"
                                    />
                                </div>
                                <p className="text-[8px] uppercase tracking-[0.25em] font-black text-gray-500 mt-2">Scan to verify</p>
                                <p className="font-mono text-[10px] font-bold text-[#140152] mt-0.5">{cert.fingerprint}</p>
                            </div>

                            <div className="text-right sm:text-left">
                                <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Date signed</p>
                                <p className="text-lg text-[#140152] mt-1">{signedAt || '—'}</p>
                                <p className="text-[10px] text-gray-500 mt-1">Light Encounter Tabernacle Worldwide</p>
                            </div>
                        </div>

                        <p className="mt-6 text-[9px] text-gray-400 tracking-wide inline-flex items-center gap-1.5 justify-center w-full">
                            <ShieldCheck className="w-3 h-3 text-[#f5bb00]" />
                            Cryptographically signed &amp; verifiable at <strong className="text-gray-600">letw.org</strong>
                            <span className="text-gray-300">·</span>
                            <span className="font-mono">{cert.fingerprint}</span>
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
                    <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-[#1d0175]">
                        <Printer className="w-4 h-4" /> Print / Save as PDF
                    </button>
                    <p className="text-xs text-gray-500">Ctrl / ⌘ + P works too.</p>
                </div>
            </section>

            {/* Next steps */}
            <section className="max-w-4xl mx-auto px-4 pb-24 print:hidden">
                <div className="text-center mb-8">
                    <p className="text-[#f5bb00] font-bold tracking-[0.4em] text-xs uppercase">Next steps</p>
                    <h2 className="text-3xl font-black text-[#140152] mt-2">Now for the wedding, and the marriage.</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <NextStep
                        n={1}
                        icon={<MapPin className="w-5 h-5" />}
                        title="Book your wedding hall"
                        desc="Reserve the sanctuary or a smaller chapel for the ceremony and rehearsal. First-come, first-served — pick a date now."
                        cta="Browse rooms"
                        href="/sanctuary"
                    />
                    <NextStep
                        n={2}
                        icon={<Phone className="w-5 h-5" />}
                        title="Meet your pastor once more"
                        desc="A final planning conversation to walk through the vows, the order of service, and any last questions."
                        cta="Book a call"
                        href="/contact"
                    />
                    <NextStep
                        n={3}
                        icon={<Heart className="w-5 h-5" />}
                        title="Keep the muscles you built"
                        desc="Set a weekly rhythm: one long conversation, one shared prayer, one small kindness. The six weeks aren't a finish line — they're a starter kit."
                        cta="See Grow"
                        href="/grow"
                    />
                </div>

                <div className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                    <p className="text-sm text-gray-600">
                        Know another couple who could use these six weeks? Share the link.
                    </p>
                    <Link href="/marriage-prep" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[#140152] underline">
                        letw.org/marriage-prep <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </section>

            {/* Print styles — hide EVERYTHING except the certificate card, then
                  pin the card to the top of the sheet. The visibility trick (vs
                  display:none) keeps the card's layout box intact so its own
                  absolute-positioned corner ornaments still render. */}
            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    body * { visibility: hidden !important; }
                    #cert-print-area, #cert-print-area * { visibility: visible !important; }
                    #cert-print-area {
                        position: absolute !important;
                        left: 50% !important;
                        top: 0 !important;
                        transform: translateX(-50%) !important;
                        width: 180mm !important;
                        margin: 10mm 0 !important;
                        box-shadow: none !important;
                        border-width: 2px !important;
                        page-break-inside: avoid !important;
                    }
                    @page { size: A4 portrait; margin: 10mm; }
                }
            `}</style>
        </main>
    )
}

function NextStep({ n, icon, title, desc, cta, href }: { n: number; icon: React.ReactNode; title: string; desc: string; cta: string; href: string }) {
    return (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#f5bb00]/20 text-[#140152] font-black flex items-center justify-center">{n}</div>
                <div className="text-[#140152]">{icon}</div>
            </div>
            <h3 className="font-black text-[#140152] text-lg">{title}</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed flex-1">{desc}</p>
            <Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-[#140152] hover:gap-2 transition-all">
                {cta} <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    )
}

'use client'
/**
 * /marriage-certificate/[coupleId] — letw.org's own marriage-certificate print
 * page. Pulls the signed-off couple's verified details (same data sharepoints
 * receives via the handshake), lets the officiant complete the marriage-specific
 * fields, and prints the ornate certificate. sharepoints keeps its own copy.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer, Loader2, Save } from 'lucide-react'
import { marriagePrepApi } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://letw-backend.onrender.com/api'
const DEFAULT_LOGO = '/NewLETWlogo.png'

type Cert = {
    id: string
    certificate_number: string
    partner_a_name: string
    partner_b_name: string
    wedding_date: string | null
    pastor_signature: string | null
    photo_url: string | null
    marriage_date: string | null
    marriage_venue: string | null
    officiant_name: string | null
    witness_1: string | null
    witness_2: string | null
    fingerprint: string
    verify_url: string
    seal_url: string | null
    logo_url: string | null
}

function fmtDate(iso?: string | null) {
    if (!iso) return ''
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function LetwMarriageCertificatePage() {
    const { coupleId } = useParams<{ coupleId: string }>()
    const [cert, setCert] = useState<Cert | null>(null)
    const [err, setErr] = useState<string | null>(null)
    const [marriageDate, setMarriageDate] = useState('')
    const [venue, setVenue] = useState('')
    const [officiant, setOfficiant] = useState('')
    const [witness1, setWitness1] = useState('')
    const [witness2, setWitness2] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState('')

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/marriage-prep/certificate/${coupleId}`, { cache: 'no-store' })
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Certificate not available.')
            const c = (await res.json()) as Cert
            setCert(c)
            setMarriageDate((c.marriage_date || c.wedding_date || '').slice(0, 10))
            setVenue(c.marriage_venue || '')
            setOfficiant(c.officiant_name || c.pastor_signature || '')
            setWitness1(c.witness_1 || '')
            setWitness2(c.witness_2 || '')
        } catch (e) { setErr((e as Error).message) }
    }, [coupleId])
    useEffect(() => { if (coupleId) load() }, [coupleId, load])

    const saveDetails = async () => {
        setSaving(true); setSaved('')
        try {
            await marriagePrepApi.updateCouple(coupleId, {
                marriage_date: marriageDate ? new Date(marriageDate).toISOString() : null,
                marriage_venue: venue || null, officiant_name: officiant || null,
                witness_1: witness1 || null, witness_2: witness2 || null,
            })
            setSaved('Saved — these details (incl. witnesses) now travel to sharepoints.')
        } catch (e) { setSaved((e as Error).message) }
        finally { setSaving(false) }
    }

    if (err) return <main className="min-h-screen flex items-center justify-center p-6 text-center text-gray-500">{err}</main>
    if (!cert) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></main>

    const marriageCertNo = cert.certificate_number.replace('LETW-MP-', 'LETW-MC-')
    const qrSrc = `${API_BASE}/marriage-prep/certificate/${cert.id}/qr.svg`

    return (
        <main className="min-h-screen bg-gray-100 py-8 px-4">
            {/* Controls */}
            <div className="mx-auto max-w-3xl print:hidden">
                <h1 className="text-2xl font-black text-[#140152]">Marriage Certificate</h1>
                <p className="mt-1 text-sm text-gray-600">Complete the marriage details, then print. sharepoints.letw.org can issue its own copy from the same record.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-2xl border border-gray-200 bg-white p-5">
                    <F label="Marriage date" type="date" value={marriageDate} onChange={setMarriageDate} />
                    <F label="Venue / place" value={venue} onChange={setVenue} placeholder="LETW Cathedral, Lagos" />
                    <F label="Officiating minister" value={officiant} onChange={setOfficiant} placeholder="Rev. …" />
                    <F label="Witness 1" value={witness1} onChange={setWitness1} />
                    <F label="Witness 2" value={witness2} onChange={setWitness2} />
                    <div className="flex items-end gap-2">
                        <button onClick={saveDetails} disabled={saving} className="rounded-full bg-[#140152] px-5 py-3 text-sm font-bold text-white inline-flex items-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save details</button>
                        <button onClick={() => window.print()} className="rounded-full bg-[#f5bb00] px-6 py-3 text-sm font-black text-[#140152] inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print / PDF</button>
                    </div>
                </div>
                {saved && <p className="mt-2 text-xs text-[#140152] font-semibold">{saved}</p>}
            </div>

            {/* Certificate */}
            <div id="marriage-cert" className="relative mx-auto mt-6 overflow-hidden bg-[#fffdf6] shadow-2xl print:mt-0 print:shadow-none" style={{ maxWidth: 960, aspectRatio: '1.414 / 1' }}>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap" />
                <div className="absolute inset-[10px] border-[3px] border-[#b8860b] pointer-events-none" />
                <div className="absolute inset-[16px] border border-[#140152]/40 pointer-events-none" />
                {['top-2 left-2', 'top-2 right-2 rotate-90', 'bottom-2 right-2 rotate-180', 'bottom-2 left-2 -rotate-90'].map((pos, i) => (
                    <svg key={i} className={`absolute ${pos} pointer-events-none`} width="54" height="54" viewBox="0 0 54 54" fill="none" aria-hidden="true">
                        <path d="M4 50 Q4 12 42 8 M4 50 Q14 20 34 18 M4 50 L4 40 M4 50 L14 50" stroke="#b8860b" strokeWidth="1.4" fill="none" />
                        <circle cx="42" cy="8" r="2" fill="#b8860b" />
                    </svg>
                ))}
                {/* LETW logo watermark */}
                <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cert.logo_url || DEFAULT_LOGO} alt="" style={{ width: '60%', maxWidth: 460, opacity: 0.07 }} />
                </div>

                <div className="relative h-full flex flex-col px-10 sm:px-16 py-8">
                    <div className="text-center">
                        <p style={{ fontFamily: "'Cinzel', serif" }} className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.34em] text-[#b8860b]">Light Encounter Tabernacle Worldwide</p>
                        <div className="mt-2 flex items-center justify-center gap-3">
                            <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#b8860b]" /><span className="text-[#b8860b] text-lg">✚</span><span className="h-px w-16 bg-gradient-to-l from-transparent to-[#b8860b]" />
                        </div>
                        <h2 style={{ fontFamily: "'Cinzel', serif" }} className="mt-3 text-[28px] sm:text-[38px] font-bold tracking-wide text-[#140152] leading-none">Certificate of Marriage</h2>
                        <p style={{ fontFamily: "'Great Vibes', cursive" }} className="text-[#b8860b] text-2xl sm:text-3xl leading-tight -mt-0.5">Holy Matrimony</p>
                    </div>

                    <div className="mt-4 text-center flex-1 flex flex-col justify-center">
                        <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-gray-600 text-sm sm:text-base italic">This is to certify that</p>
                        <div className="mt-2 flex items-center justify-center gap-5">
                            {cert.photo_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cert.photo_url} alt="" className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-[3px] border-[#b8860b] object-cover shadow-md" />
                            )}
                            <p style={{ fontFamily: "'Great Vibes', cursive" }} className="text-[#140152] text-4xl sm:text-6xl leading-tight">
                                {cert.partner_a_name} <span className="text-[#b8860b]">&amp;</span> {cert.partner_b_name}
                            </p>
                        </div>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="mx-auto mt-4 max-w-2xl text-[15px] sm:text-[17px] leading-relaxed text-gray-700">
                            were joined together in Holy Matrimony
                            {marriageDate ? <> on <span className="font-semibold text-[#140152]">{fmtDate(marriageDate)}</span></> : ''}
                            {venue ? <> at <span className="font-semibold text-[#140152]">{venue}</span></> : ''},
                            according to the ordinance of God and solemnized before witnesses.
                        </p>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-6 items-end">
                        <Sign name={officiant} role="Officiating Minister" script />
                        <Sign name={witness1} role="Witness" />
                        <Sign name={witness2} role="Witness" />
                        <div className="flex flex-col items-center">
                            {cert.seal_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cert.seal_url} alt="" className="h-16 w-16 object-contain" />
                            ) : (
                                <div className="relative h-16 w-16 rounded-full border-[3px] border-[#b8860b] flex items-center justify-center text-center" style={{ background: 'radial-gradient(circle,#fff8e6,#f7e9c0)' }}>
                                    <span style={{ fontFamily: "'Cinzel', serif" }} className="text-[9px] font-bold text-[#b8860b] leading-tight">LETW<br />SEAL</span>
                                </div>
                            )}
                            <p className="mt-1 text-[9px] uppercase tracking-widest text-gray-500">Church Seal</p>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#b8860b]/30 pt-2">
                        <div className="text-[9px] text-gray-500 leading-relaxed">
                            <div>Certificate No: <span className="font-mono font-bold text-[#140152]">{marriageCertNo}</span></div>
                            <div>Verified by letw.org · <span className="font-mono">{cert.fingerprint}</span></div>
                        </div>
                        <a href={cert.verify_url || '#'} target="_blank" rel="noreferrer" className="flex flex-col items-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrSrc} alt="Scan to verify" className="h-14 w-14" />
                            <span className="mt-0.5 text-[8px] uppercase tracking-wider text-gray-500">Scan to verify</span>
                        </a>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    body * { visibility: hidden !important; }
                    #marriage-cert, #marriage-cert * { visibility: visible !important; }
                    #marriage-cert { position: absolute !important; left: 0; top: 0; width: 100% !important; }
                    @page { size: A4 landscape; margin: 10mm; }
                }
            `}</style>
        </main>
    )
}

function F({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
    )
}
function Sign({ name, role, script }: { name: string; role: string; script?: boolean }) {
    return (
        <div className="text-center">
            <div className="flex h-9 items-end justify-center overflow-hidden">
                <span className="whitespace-nowrap leading-none text-[#140152]" style={script ? { fontFamily: "'Great Vibes', cursive", fontSize: 22 } : { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 15 }}>{name || ''}</span>
            </div>
            <div className="border-t border-gray-500 pt-1"><p className="text-[9px] font-semibold uppercase tracking-wider text-[#140152]">{role}</p></div>
        </div>
    )
}

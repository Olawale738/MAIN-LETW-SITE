'use client'
/**
 * /leaflet/[id] — public, shareable & printable view of a published evangelism
 * leaflet. Renders the same ministry-branded design as the admin preview.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer, Loader2 } from 'lucide-react'
import { leafletsApi, type Leaflet } from '@/lib/api'

const DEFAULT_LOGO = '/NewLETWlogo.png'

function toHtml(s: string): string {
    const t = (s || '').trim()
    if (!t) return ''
    if (t.includes('<')) return t
    return t.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
}

export default function PublicLeafletPage() {
    const { id } = useParams<{ id: string }>()
    const [lf, setLf] = useState<Leaflet | null>(null)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        leafletsApi.publicGet(id).then(setLf).catch(e => setErr((e as Error).message))
    }, [id])

    if (err) return <main className="min-h-screen flex items-center justify-center p-6 text-center text-gray-500">This leaflet is not available.</main>
    if (!lf) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></main>

    const accent = lf.accent_color || '#f5bb00'
    const logo = lf.logo_url || DEFAULT_LOGO
    const accentText = accent === '#f5bb00' ? '#b8860b' : accent

    return (
        <main className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="print:hidden max-w-[480px] mx-auto mb-4 flex justify-end">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-full text-sm shadow">
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
            </div>

            <div id="leaflet" className="mx-auto bg-white shadow-xl overflow-hidden print:shadow-none" style={{ maxWidth: 480 }}>
                <div style={{ background: accent }} className="px-6 py-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="" className="h-10 w-auto object-contain" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#140152]">{lf.church_name}</span>
                </div>
                <div className="px-6 pt-7 pb-6 text-center" style={{ background: `linear-gradient(180deg, ${accent}22, #ffffff)` }}>
                    <h1 className="text-3xl font-black leading-tight text-[#140152]">{lf.headline}</h1>
                    {lf.subheadline && <p className="mt-1 text-sm font-semibold" style={{ color: accentText }}>{lf.subheadline}</p>}
                </div>
                {lf.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lf.image_url} alt="" className="w-full max-h-56 object-cover" />
                )}
                {toHtml(lf.body_html) && (
                    <div className="px-6 py-5 text-[13px] leading-relaxed text-gray-700 leaflet-body" dangerouslySetInnerHTML={{ __html: toHtml(lf.body_html) }} />
                )}
                {(lf.scripture_text || lf.scripture_ref) && (
                    <div className="mx-6 mb-5 rounded-xl p-4 text-center" style={{ background: `${accent}18`, borderLeft: `4px solid ${accent}` }}>
                        {lf.scripture_text && <p className="text-[13px] italic text-[#140152] leading-relaxed">“{lf.scripture_text}”</p>}
                        {lf.scripture_ref && <p className="mt-1 text-[11px] font-black uppercase tracking-wider" style={{ color: accentText }}>{lf.scripture_ref}</p>}
                    </div>
                )}
                {(lf.cta_text || lf.cta_detail) && (
                    <div style={{ background: '#140152' }} className="px-6 py-5 text-center text-white">
                        {lf.cta_text && <p className="text-base font-black" style={{ color: accent }}>{lf.cta_text}</p>}
                        {lf.cta_detail && <p className="mt-2 text-[12px] leading-relaxed text-white/90">{lf.cta_detail}</p>}
                    </div>
                )}
                <div className="px-6 py-4 text-center text-[11px] text-gray-500 border-t border-gray-100">
                    {lf.footer_note && <p className="mb-1 text-gray-600">{lf.footer_note}</p>}
                    {lf.service_times && <p className="font-semibold text-[#140152]">{lf.service_times}</p>}
                    <p className="mt-1">{[lf.contact_phone, lf.contact_website].filter(Boolean).join('  ·  ')}</p>
                    {lf.contact_address && <p>{lf.contact_address}</p>}
                </div>
                <div style={{ background: accent }} className="h-2" />
            </div>

            <style jsx global>{`
                .leaflet-body p { margin: 0 0 0.7em; }
                @media print {
                    body { background: white !important; }
                    body * { visibility: hidden !important; }
                    #leaflet, #leaflet * { visibility: visible !important; }
                    #leaflet { position: absolute !important; left: 0; top: 0; width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
                    @page { size: A5 portrait; margin: 0; }
                }
            `}</style>
        </main>
    )
}

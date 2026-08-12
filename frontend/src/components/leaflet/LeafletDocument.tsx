'use client'
/**
 * LeafletDocument — the shared, print-ready visual for an evangelism leaflet.
 *
 * Renders a single FIXED physical page (A5 portrait for the flyer, A4 landscape
 * for the tri-fold) and AUTO-FITS the content so it always stays on exactly one
 * page: if the content is taller than the page it is scaled down to fit; if
 * shorter, the footer is pinned to the bottom so the page reads as a composed,
 * full leaflet. Display scaling for preview/print is handled by LeafletCanvas.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Leaflet } from '@/lib/api'

const DEFAULT_LOGO = '/NewLETWlogo.png'
const NAVY = '#140152'
const CREAM = '#fbf9f2'

export function toHtml(s: string): string {
    const t = (s || '').trim()
    if (!t) return ''
    if (t.includes('<')) return t
    return t.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
}

function Flourish({ color }: { color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '8px auto' }}>
            <span style={{ height: 1, width: 46, background: `linear-gradient(90deg, transparent, ${color})` }} />
            <svg width="13" height="17" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                <path d="M7 0v18M2 6h10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="7" cy="6" r="2.2" fill={color} />
            </svg>
            <span style={{ height: 1, width: 46, background: `linear-gradient(90deg, ${color}, transparent)` }} />
        </div>
    )
}

export default function LeafletDocument({ data }: { data: Partial<Leaflet> }) {
    const accent = data.accent_color || '#f5bb00'
    const logo = data.logo_url || DEFAULT_LOGO
    const accentDeep = accent.toLowerCase() === '#f5bb00' ? '#b8860b' : accent
    const bodyHtml = toHtml(data.body_html || '')
    const contactLines = [data.contact_phone, data.contact_website, data.contact_address].filter(Boolean)
    const isTrifold = data.layout === 'tri-fold'

    // ── Auto-fit: scale content down so it never overflows the fixed page ───────
    const boxRef = useRef<HTMLDivElement>(null)
    const colRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    const fit = useCallback(() => {
        const box = boxRef.current, col = colRef.current
        if (!box || !col) return
        const avail = box.clientHeight
        const natural = col.scrollHeight
        const next = natural > avail + 1 ? Math.max(0.4, avail / natural) : 1
        setScale(prev => (Math.abs(prev - next) > 0.004 ? next : prev))
    }, [])
    useEffect(() => {
        fit()
        const t = setTimeout(fit, 250)
        const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts
        fonts?.ready?.then(fit)
        const ro = new ResizeObserver(fit)
        if (colRef.current) ro.observe(colRef.current)
        return () => { clearTimeout(t); ro.disconnect() }
    }, [fit, data])

    // ── Reusable blocks ────────────────────────────────────────────────────────
    const Header = (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accentDeep, maxWidth: 180, lineHeight: 1.3 }}>
                {data.church_name || 'Light Encounter Tabernacle Worldwide'}
            </span>
        </div>
    )
    const Hero = (
        <div style={{ textAlign: 'center', margin: '10px 0 2px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: accentDeep, marginBottom: 5 }}>
                A message of hope for you
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: isTrifold ? 32 : 44, lineHeight: 1.03, letterSpacing: '-0.01em', margin: 0, color: NAVY }}>
                {data.headline || 'God Loves You'}
            </h1>
            {data.subheadline && (
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, fontSize: isTrifold ? 15 : 18, margin: '6px 0 0', color: accentDeep }}>
                    {data.subheadline}
                </p>
            )}
            <Flourish color={accent} />
        </div>
    )
    const Message = bodyHtml ? (
        <div className="leaflet-body" style={{ fontSize: 12.5, lineHeight: 1.6, color: '#33322f', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    ) : null
    const Scripture = (data.scripture_text || data.scripture_ref) ? (
        <div style={{ position: 'relative', margin: '12px 0', padding: '15px 14px 11px', textAlign: 'center', background: `${accent}12`, borderTop: `2px solid ${accent}`, borderBottom: `2px solid ${accent}` }}>
            <span aria-hidden="true" style={{ position: 'absolute', top: -10, left: 10, fontFamily: "'Playfair Display', serif", fontSize: 44, lineHeight: 1, color: accent, opacity: 0.5 }}>&ldquo;</span>
            {data.scripture_text && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, fontSize: 16, lineHeight: 1.42, color: NAVY, margin: 0 }}>{data.scripture_text}</p>}
            {data.scripture_ref && <div style={{ marginTop: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accentDeep }}>{data.scripture_ref}</div>}
        </div>
    ) : null
    const Prayer = (data.cta_text || data.cta_detail) ? (
        <div style={{ background: NAVY, color: '#fff', padding: '13px 15px', borderRadius: 8, textAlign: 'center' }}>
            {data.cta_text && <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, lineHeight: 1.2, margin: 0, color: accent }}>{data.cta_text}</h2>}
            {data.cta_detail && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.5, margin: '8px 0 0', color: 'rgba(255,255,255,.92)' }}>{data.cta_detail}</p>}
        </div>
    ) : null
    const JoinPanel = (data.service_times || contactLines.length) ? (
        <div style={{ background: NAVY, color: '#fff', padding: '12px 12px 14px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: accent, letterSpacing: '0.02em' }}>Join us</div>
            <div aria-hidden="true" style={{ height: 2, width: 24, background: accent, margin: '6px auto 8px' }} />
            {data.service_times && <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.45, marginBottom: contactLines.length ? 8 : 0 }}>{data.service_times}</div>}
            {contactLines.map((line, i) => (
                <div key={i} style={{ fontSize: 10, lineHeight: 1.45, color: 'rgba(255,255,255,.9)', wordBreak: 'break-word' }}>{line}</div>
            ))}
        </div>
    ) : null
    const FooterNote = (
        <div style={{ textAlign: 'center' }}>
            <Flourish color={accent} />
            {data.footer_note && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: '#5a5852', margin: '8px 0 4px' }}>{data.footer_note}</p>}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accentDeep, marginTop: 4 }}>
                {data.church_name || 'Light Encounter Tabernacle Worldwide'}
            </div>
        </div>
    )
    const Fonts = (
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" />
    )
    const Watermark = (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0, pointerEvents: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" style={{ width: isTrifold ? '30%' : '86%', maxWidth: 420, opacity: 0.06 }} />
        </div>
    )
    const dropCap = (
        <style jsx global>{`
            .leaflet-body p { margin: 0 0 0.6em; }
            .leaflet-body p:last-child { margin-bottom: 0; }
            .leaflet-body p:first-of-type::first-letter {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 2.9em; font-weight: 800; float: left; line-height: 0.8;
                margin: 3px 7px 0 0; color: ${accent};
            }
        `}</style>
    )

    // Inner content, composed per layout, fills the page height.
    const inner = isTrifold ? (
        <div style={{ display: 'flex', minHeight: '100%', width: '100%' }}>
            <div style={{ flex: 1, minWidth: 0, padding: '0 16px', borderRight: `1px dashed ${accent}88`, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                {Header}{Hero}
                {data.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.image_url} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', border: `1px solid ${accent}66`, marginTop: 8 }} />
                )}
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '0 16px', borderRight: `1px dashed ${accent}88`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {Message}{Scripture}
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '0 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>{Prayer}{JoinPanel}</div>
                <div style={{ marginTop: 'auto' }}>{FooterNote}</div>
            </div>
        </div>
    ) : (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', width: '100%' }}>
            {Header}
            {Hero}
            {data.image_url && (
                <div style={{ margin: '8px 0 2px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.image_url} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', display: 'block', border: `1px solid ${accent}66` }} />
                </div>
            )}
            <div style={{ display: 'flex', gap: 14, marginTop: 12, alignItems: 'flex-start' }}>
                {JoinPanel && <div style={{ width: 132, flexShrink: 0 }}>{JoinPanel}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>{Message}{Scripture}{Prayer}</div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 12 }}>{FooterNote}</div>
        </div>
    )

    return (
        <div className="leaflet-doc" style={{ position: 'relative', width: isTrifold ? '297mm' : '148mm', height: '210mm', background: CREAM, overflow: 'hidden', fontFamily: "'Lora', Georgia, serif", color: '#2c2b28' }}>
            {Fonts}
            {Watermark}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 9, border: `2px solid ${accent}`, zIndex: 2, pointerEvents: 'none' }} />
            {!isTrifold && <div aria-hidden="true" style={{ position: 'absolute', inset: 14, border: `1px solid ${NAVY}33`, zIndex: 2, pointerEvents: 'none' }} />}
            <div ref={boxRef} style={{ position: 'absolute', inset: isTrifold ? 20 : 24, zIndex: 1, overflow: 'hidden' }}>
                <div ref={colRef} style={{ height: '100%', width: '100%', transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                    {inner}
                </div>
            </div>
            {dropCap}
        </div>
    )
}

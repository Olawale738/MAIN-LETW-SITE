'use client'
/**
 * LeafletDocument — the shared, print-ready visual for an evangelism leaflet.
 * Used by both the admin live-preview and the public /leaflet/[id] page.
 *
 * Two layouts, driven by data.layout:
 *   'flyer'    — single A5 poster: logo watermark, gold frame, big headline,
 *                and a two-column body (Join-us panel left, message right).
 *   'tri-fold' — three landscape panels (cover · message · prayer) with fold
 *                lines, to fold into a classic pocket tract.
 */
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '10px auto 0' }}>
            <span style={{ height: 1, width: 48, background: `linear-gradient(90deg, transparent, ${color})` }} />
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                <path d="M7 0v18M2 6h10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="7" cy="6" r="2.2" fill={color} />
            </svg>
            <span style={{ height: 1, width: 48, background: `linear-gradient(90deg, ${color}, transparent)` }} />
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

    // ── Reusable blocks ────────────────────────────────────────────────────────
    const Header = (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accentDeep, maxWidth: 170, lineHeight: 1.3 }}>
                {data.church_name || 'Light Encounter Tabernacle Worldwide'}
            </span>
        </div>
    )

    const Hero = (
        <div style={{ textAlign: 'center', margin: '16px 0 6px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: accentDeep, marginBottom: 6 }}>
                A message of hope for you
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: isTrifold ? 34 : 46, lineHeight: 1.03, letterSpacing: '-0.01em', margin: 0, color: NAVY }}>
                {data.headline || 'God Loves You'}
            </h1>
            {data.subheadline && (
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, fontSize: isTrifold ? 16 : 19, margin: '8px 0 0', color: accentDeep }}>
                    {data.subheadline}
                </p>
            )}
            <Flourish color={accent} />
        </div>
    )

    const Message = bodyHtml ? (
        <div className="leaflet-body" style={{ fontSize: 13, lineHeight: 1.65, color: '#33322f', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    ) : null

    const Scripture = (data.scripture_text || data.scripture_ref) ? (
        <div style={{ position: 'relative', margin: '14px 0', padding: '16px 14px 12px', textAlign: 'center', background: `${accent}12`, borderTop: `2px solid ${accent}`, borderBottom: `2px solid ${accent}` }}>
            <span aria-hidden="true" style={{ position: 'absolute', top: -10, left: 10, fontFamily: "'Playfair Display', serif", fontSize: 46, lineHeight: 1, color: accent, opacity: 0.55 }}>&ldquo;</span>
            {data.scripture_text && (
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, fontSize: 16.5, lineHeight: 1.45, color: NAVY, margin: 0 }}>{data.scripture_text}</p>
            )}
            {data.scripture_ref && (
                <div style={{ marginTop: 9, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accentDeep }}>{data.scripture_ref}</div>
            )}
        </div>
    ) : null

    const Prayer = (data.cta_text || data.cta_detail) ? (
        <div style={{ background: NAVY, color: '#fff', padding: '14px 15px', borderRadius: 8, textAlign: 'center' }}>
            {data.cta_text && <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, lineHeight: 1.2, margin: 0, color: accent }}>{data.cta_text}</h2>}
            {data.cta_detail && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, lineHeight: 1.55, margin: '9px 0 0', color: 'rgba(255,255,255,.92)' }}>{data.cta_detail}</p>}
        </div>
    ) : null

    const JoinPanel = (data.service_times || contactLines.length) ? (
        <div style={{ background: NAVY, color: '#fff', padding: '13px 13px 15px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: accent, letterSpacing: '0.02em' }}>Join us</div>
            <div aria-hidden="true" style={{ height: 2, width: 26, background: accent, margin: '7px auto 9px' }} />
            {data.service_times && <div style={{ fontSize: 11.5, fontWeight: 500, lineHeight: 1.5, marginBottom: contactLines.length ? 9 : 0 }}>{data.service_times}</div>}
            {contactLines.map((line, i) => (
                <div key={i} style={{ fontSize: 10.5, lineHeight: 1.5, color: 'rgba(255,255,255,.9)', wordBreak: 'break-word' }}>{line}</div>
            ))}
        </div>
    ) : null

    const FooterNote = (
        <div style={{ textAlign: 'center' }}>
            <Flourish color={accent} />
            {data.footer_note && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13.5, color: '#5a5852', margin: '10px 0 4px' }}>{data.footer_note}</p>}
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accentDeep, marginTop: 4 }}>
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
            <img src={logo} alt="" style={{ width: isTrifold ? '40%' : '92%', maxWidth: 420, opacity: 0.06 }} />
        </div>
    )
    const dropCap = (
        <style jsx global>{`
            .leaflet-body p { margin: 0 0 0.7em; }
            .leaflet-body p:last-child { margin-bottom: 0; }
            .leaflet-body p:first-of-type::first-letter {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 3em; font-weight: 800; float: left; line-height: 0.8;
                margin: 4px 7px 0 0; color: ${accent};
            }
        `}</style>
    )

    // ── Tri-fold: three landscape panels ───────────────────────────────────────
    if (isTrifold) {
        const foldBorder = `1px dashed ${accent}88`
        const panel: React.CSSProperties = { flex: 1, minWidth: 0, padding: '22px 18px', display: 'flex', flexDirection: 'column' }
        return (
            <div className="leaflet-doc" style={{ position: 'relative', background: CREAM, fontFamily: "'Lora', Georgia, serif", color: '#2c2b28', overflow: 'hidden' }}>
                {Fonts}
                {Watermark}
                <div aria-hidden="true" style={{ position: 'absolute', inset: 9, border: `2px solid ${accent}`, zIndex: 2, pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: 460 }}>
                    {/* Panel 1 — cover */}
                    <div style={{ ...panel, borderRight: foldBorder, justifyContent: 'center', textAlign: 'center' }}>
                        {Header}
                        {Hero}
                        {data.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={data.image_url} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', border: `1px solid ${accent}66`, marginTop: 10 }} />
                        )}
                    </div>
                    {/* Panel 2 — message + scripture */}
                    <div style={{ ...panel, borderRight: foldBorder }}>
                        {Message}
                        {Scripture}
                    </div>
                    {/* Panel 3 — prayer + join + footer */}
                    <div style={{ ...panel, gap: 12, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Prayer}
                            {JoinPanel}
                        </div>
                        {FooterNote}
                    </div>
                </div>
                {dropCap}
            </div>
        )
    }

    // ── Flyer: single A5 poster ────────────────────────────────────────────────
    return (
        <div className="leaflet-doc" style={{ position: 'relative', background: CREAM, fontFamily: "'Lora', Georgia, serif", color: '#2c2b28', overflow: 'hidden' }}>
            {Fonts}
            {Watermark}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 9, border: `2px solid ${accent}`, zIndex: 2, pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', inset: 14, border: `1px solid ${NAVY}33`, zIndex: 2, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1, padding: '26px 24px 22px' }}>
                {Header}
                {Hero}
                {data.image_url && (
                    <div style={{ margin: '12px 0 4px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={data.image_url} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', display: 'block', border: `1px solid ${accent}66` }} />
                    </div>
                )}
                <div style={{ display: 'flex', gap: 15, marginTop: 14, alignItems: 'flex-start' }}>
                    {JoinPanel && <div style={{ width: 138, flexShrink: 0 }}>{JoinPanel}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {Message}
                        {Scripture}
                        {Prayer}
                    </div>
                </div>
                <div style={{ marginTop: 16 }}>{FooterNote}</div>
            </div>
            {dropCap}
        </div>
    )
}

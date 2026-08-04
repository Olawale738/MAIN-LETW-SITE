'use client'
/**
 * LeafletDocument — the shared, print-ready visual for an evangelism leaflet.
 * Used by both the admin live-preview and the public /leaflet/[id] page so the
 * two never drift. Elegant "gospel pamphlet" styling: display serif headings,
 * a navy hero with rays of light, an ornately framed scripture, a drop-cap
 * message, and a refined prayer band. All content is admin-authored; the accent
 * colour is admin-chosen.
 */
import type { Leaflet } from '@/lib/api'

const DEFAULT_LOGO = '/NewLETWlogo.png'
const NAVY = '#140152'

/** Plain text (blank-line paragraphs) → HTML; leave real HTML untouched. */
export function toHtml(s: string): string {
    const t = (s || '').trim()
    if (!t) return ''
    if (t.includes('<')) return t
    return t.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
}

function Ornament({ color }: { color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 auto' }}>
            <span style={{ height: 1, width: 44, background: `linear-gradient(90deg, transparent, ${color})` }} />
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true">
                <path d="M6 0v16M1 5h10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span style={{ height: 1, width: 44, background: `linear-gradient(90deg, ${color}, transparent)` }} />
        </div>
    )
}

export default function LeafletDocument({ data }: { data: Partial<Leaflet> }) {
    const accent = data.accent_color || '#f5bb00'
    const logo = data.logo_url || DEFAULT_LOGO
    const accentDeep = accent.toLowerCase() === '#f5bb00' ? '#c98a00' : accent
    const bodyHtml = toHtml(data.body_html || '')

    return (
        <div className="leaflet-doc" style={{ width: '100%', background: '#fdfbf5', fontFamily: "'Lora', Georgia, serif", color: '#2a2a28' }}>
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,600;1,500;1,600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
            />

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <div
                style={{
                    position: 'relative',
                    background: `radial-gradient(120% 90% at 50% -10%, ${accent}44 0%, ${NAVY} 55%, #0d0138 100%)`,
                    color: '#fff',
                    padding: '22px 26px 30px',
                    textAlign: 'center',
                    overflow: 'hidden',
                }}
            >
                {/* rays of light */}
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `conic-gradient(from 180deg at 50% 0%, transparent 0deg, ${accent}22 12deg, transparent 24deg, ${accent}18 40deg, transparent 60deg, ${accent}22 80deg, transparent 100deg)`, opacity: 0.5, pointerEvents: 'none' }} />

                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo} alt="" style={{ height: 34, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }} />
                        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'Lora', serif" }}>
                            {data.church_name || 'Light Encounter Tabernacle Worldwide'}
                        </span>
                    </div>

                    <Ornament color={accent} />

                    <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 800, fontSize: 38, lineHeight: 1.06, margin: '14px 0 0', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.35)' }}>
                        {data.headline || 'God Loves You'}
                    </h1>
                    {data.subheadline && (
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, margin: '8px 0 14px', color: accent }}>
                            {data.subheadline}
                        </p>
                    )}
                    <Ornament color={accent} />
                </div>
            </div>

            {data.image_url && (
                <div style={{ position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.image_url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 1px ${accent}55` }} />
                </div>
            )}

            {/* ── Message ──────────────────────────────────────────────────── */}
            {bodyHtml && (
                <div
                    className="leaflet-body"
                    style={{ padding: '26px 28px 8px', fontSize: 14.5, lineHeight: 1.72, color: '#33322f' }}
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
            )}

            {/* ── Scripture ────────────────────────────────────────────────── */}
            {(data.scripture_text || data.scripture_ref) && (
                <div style={{ margin: '14px 26px 24px', position: 'relative', padding: '22px 20px 18px', textAlign: 'center', background: `${accent}12`, border: `1px solid ${accent}55` }}>
                    <span aria-hidden="true" style={{ position: 'absolute', top: -14, left: 14, fontFamily: "'Playfair Display', serif", fontSize: 56, lineHeight: 1, color: accent, opacity: 0.5 }}>&ldquo;</span>
                    {/* corner ticks */}
                    <span aria-hidden="true" style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderTop: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />
                    <span aria-hidden="true" style={{ position: 'absolute', bottom: 6, left: 6, width: 14, height: 14, borderBottom: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
                    {data.scripture_text && (
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: 18, lineHeight: 1.5, color: NAVY, margin: 0 }}>
                            {data.scripture_text}
                        </p>
                    )}
                    {data.scripture_ref && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                            <span style={{ height: 1, width: 22, background: accentDeep }} />
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accentDeep }}>{data.scripture_ref}</span>
                            <span style={{ height: 1, width: 22, background: accentDeep }} />
                        </div>
                    )}
                </div>
            )}

            {/* ── Call to action / prayer ──────────────────────────────────── */}
            {(data.cta_text || data.cta_detail) && (
                <div style={{ background: NAVY, color: '#fff', padding: '24px 26px 26px', textAlign: 'center', position: 'relative' }}>
                    <div aria-hidden="true" style={{ height: 3, width: 46, background: accent, margin: '0 auto 14px' }} />
                    {data.cta_text && (
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 21, lineHeight: 1.2, margin: 0, color: accent }}>
                            {data.cta_text}
                        </h2>
                    )}
                    {data.cta_detail && (
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.6, margin: '14px auto 0', maxWidth: 320, color: 'rgba(255,255,255,.92)', padding: '14px 16px', border: '1px solid rgba(255,255,255,.22)' }}>
                            {data.cta_detail}
                        </p>
                    )}
                </div>
            )}

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <div style={{ padding: '18px 26px 20px', textAlign: 'center', background: '#fdfbf5' }}>
                <Ornament color={accent} />
                {data.footer_note && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: '#5a5852', margin: '12px 0 8px' }}>{data.footer_note}</p>}
                {data.service_times && (
                    <div style={{ display: 'inline-block', background: `${accent}1c`, border: `1px solid ${accent}66`, borderRadius: 999, padding: '5px 14px', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.03em', color: NAVY, margin: '4px 0 10px' }}>
                        {data.service_times}
                    </div>
                )}
                <div style={{ fontSize: 11.5, color: '#4a4844', lineHeight: 1.7 }}>
                    {[data.contact_phone, data.contact_website].filter(Boolean).join('  ·  ')}
                    {data.contact_address && <div>{data.contact_address}</div>}
                </div>
                <div style={{ marginTop: 8, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accentDeep }}>
                    {data.church_name || 'Light Encounter Tabernacle Worldwide'}
                </div>
            </div>
            <div style={{ height: 8, background: accent }} />

            <style jsx global>{`
                .leaflet-body p { margin: 0 0 0.8em; }
                .leaflet-body p:first-of-type::first-letter {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 3.2em;
                    font-weight: 800;
                    float: left;
                    line-height: 0.82;
                    margin: 4px 8px 0 0;
                    color: ${NAVY};
                }
            `}</style>
        </div>
    )
}

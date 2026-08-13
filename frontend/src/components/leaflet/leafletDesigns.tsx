'use client'
/**
 * Leaflet designs — genuinely distinct, print-ready one-page layouts (not just
 * recolours). Each design supplies a full-bleed `background` (drawn on the fixed
 * page, never scaled) and a `content` block (auto-fit-scaled to stay on one
 * page). LeafletDocument composes the two.
 */
import type { ReactNode, CSSProperties } from 'react'
import type { Leaflet } from '@/lib/api'

export const NAVY = '#140152'
export const CREAM = '#fbf9f2'
const DEFAULT_LOGO = '/NewLETWlogo.png'

export function toHtml(s: string): string {
    const t = (s || '').trim()
    if (!t) return ''
    if (t.includes('<')) return t
    return t.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
}

export interface DesignCtx {
    data: Partial<Leaflet>
    accent: string
    accentDeep: string
    logo: string
    bodyHtml: string
    contactLines: string[]
}

export interface LeafletDesign {
    id: string
    name: string
    inset: number
    baseBg: string
    dark?: boolean // background is dark — watermark uses a light silhouette
    background: (c: DesignCtx) => ReactNode
    content: (c: DesignCtx) => ReactNode
}

// ── Shared decorative + content blocks (parameterised by colour) ──────────────
function Cross({ color, size = 16 }: { color: string; size?: number }) {
    return (
        <svg width={size} height={size * 1.28} viewBox="0 0 14 18" fill="none" aria-hidden="true">
            <path d="M7 0v18M2 6h10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="7" cy="6" r="2.1" fill={color} />
        </svg>
    )
}
function Flourish({ color }: { color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '8px auto' }}>
            <span style={{ height: 1, width: 44, background: `linear-gradient(90deg, transparent, ${color})` }} />
            <Cross color={color} size={13} />
            <span style={{ height: 1, width: 44, background: `linear-gradient(90deg, ${color}, transparent)` }} />
        </div>
    )
}
function Message({ c, color, dropCap }: { c: DesignCtx; color: string; dropCap: string }) {
    if (!c.bodyHtml) return null
    return <div className="leaflet-body" style={{ fontSize: 12.5, lineHeight: 1.6, color, textAlign: 'justify', ['--dropcap' as string]: dropCap } as CSSProperties} dangerouslySetInnerHTML={{ __html: c.bodyHtml }} />
}
function Scripture({ c, variant }: { c: DesignCtx; variant: 'boxed' | 'bare' | 'ribbon' }) {
    const { data, accent, accentDeep } = c
    if (!data.scripture_text && !data.scripture_ref) return null
    const verse = data.scripture_text && (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, fontSize: variant === 'bare' ? 22 : 16, lineHeight: 1.4, color: variant === 'ribbon' ? '#fff' : NAVY, margin: 0 }}>{data.scripture_text}</p>
    )
    const ref = data.scripture_ref && (
        <div style={{ marginTop: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: variant === 'ribbon' ? accent : accentDeep }}>{data.scripture_ref}</div>
    )
    if (variant === 'bare') return <div style={{ textAlign: 'center', margin: '14px 0' }}><Cross color={accent} size={14} /><div style={{ marginTop: 8 }}>{verse}{ref}</div></div>
    if (variant === 'ribbon') return <div style={{ background: NAVY, padding: '15px 16px', textAlign: 'center', borderRadius: 8 }}>{verse}{ref}</div>
    return (
        <div style={{ position: 'relative', margin: '12px 0', padding: '15px 14px 11px', textAlign: 'center', background: `${accent}12`, borderTop: `2px solid ${accent}`, borderBottom: `2px solid ${accent}` }}>
            <span aria-hidden="true" style={{ position: 'absolute', top: -10, left: 10, fontFamily: "'Playfair Display', serif", fontSize: 42, lineHeight: 1, color: accent, opacity: 0.5 }}>&ldquo;</span>
            {verse}{ref}
        </div>
    )
}
function Prayer({ c, onDark }: { c: DesignCtx; onDark?: boolean }) {
    const { data, accent } = c
    if (!data.cta_text && !data.cta_detail) return null
    return (
        <div style={{ background: onDark ? 'rgba(255,255,255,0.08)' : NAVY, border: onDark ? `1px solid ${accent}55` : 'none', color: '#fff', padding: '13px 15px', borderRadius: 8, textAlign: 'center' }}>
            {data.cta_text && <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, lineHeight: 1.2, margin: 0, color: accent }}>{data.cta_text}</h2>}
            {data.cta_detail && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.5, margin: '8px 0 0', color: 'rgba(255,255,255,.92)' }}>{data.cta_detail}</p>}
        </div>
    )
}
function Join({ c, compact }: { c: DesignCtx; compact?: boolean }) {
    const { data, accent, contactLines } = c
    if (!data.service_times && !contactLines.length) return null
    return (
        <div style={{ background: NAVY, color: '#fff', padding: compact ? '11px 12px 13px' : '13px 14px 15px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: accent }}>Join us</div>
            <div aria-hidden="true" style={{ height: 2, width: 24, background: accent, margin: '6px auto 8px' }} />
            {data.service_times && <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.45, marginBottom: contactLines.length ? 7 : 0 }}>{data.service_times}</div>}
            {contactLines.map((l, i) => <div key={i} style={{ fontSize: 10, lineHeight: 1.45, color: 'rgba(255,255,255,.9)', wordBreak: 'break-word' }}>{l}</div>)}
        </div>
    )
}
function ChurchName({ c, color }: { c: DesignCtx; color: string }) {
    return <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color }}>{c.data.church_name || 'Light Encounter Tabernacle Worldwide'}</div>
}
/* eslint-disable @next/next/no-img-element */
function Logo({ src, h = 42 }: { src: string; h?: number }) {
    return <img src={src} alt="" style={{ height: h, width: 'auto', objectFit: 'contain' }} />
}

// ── Designs ───────────────────────────────────────────────────────────────────

const classic: LeafletDesign = {
    id: 'classic', name: 'Classic', inset: 24, baseBg: CREAM,
    background: c => (
        <>
            <div aria-hidden style={{ position: 'absolute', inset: 9, border: `2px solid ${c.accent}` }} />
            <div aria-hidden style={{ position: 'absolute', inset: 14, border: `1px solid ${NAVY}33` }} />
        </>
    ),
    content: c => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Logo src={c.logo} /><span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: c.accentDeep, maxWidth: 180, lineHeight: 1.3 }}>{c.data.church_name}</span>
            </div>
            <div style={{ textAlign: 'center', margin: '10px 0 2px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: c.accentDeep, marginBottom: 5 }}>A message of hope for you</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 44, lineHeight: 1.03, margin: 0, color: NAVY }}>{c.data.headline || 'God Loves You'}</h1>
                {c.data.subheadline && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 600, fontSize: 18, margin: '6px 0 0', color: c.accentDeep }}>{c.data.subheadline}</p>}
                <Flourish color={c.accent} />
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'flex-start' }}>
                {(c.data.service_times || c.contactLines.length) ? <div style={{ width: 132, flexShrink: 0 }}><Join c={c} /></div> : null}
                <div style={{ flex: 1, minWidth: 0 }}><Message c={c} color="#33322f" dropCap={c.accent} /><Scripture c={c} variant="boxed" /><Prayer c={c} /></div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 12, textAlign: 'center' }}>
                <Flourish color={c.accent} />
                {c.data.footer_note && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: '#5a5852', margin: '8px 0 4px' }}>{c.data.footer_note}</p>}
                <ChurchName c={c} color={c.accentDeep} />
            </div>
        </div>
    ),
}

const modern: LeafletDesign = {
    id: 'modern', name: 'Modern', inset: 0, baseBg: CREAM,
    background: c => (
        <>
            <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42%', background: `radial-gradient(120% 120% at 80% -20%, ${c.accent}55, ${NAVY} 60%)` }} />
            <div aria-hidden style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: 5, background: c.accent }} />
        </>
    ),
    content: c => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '26px 28px 20px', color: '#fff', minHeight: '38%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                    <Logo src={c.logo} h={34} /><span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.accent }}>{c.data.church_name}</span>
                </div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 46, lineHeight: 1.0, margin: 0, letterSpacing: '-0.015em' }}>{c.data.headline || 'God Loves You'}</h1>
                {c.data.subheadline && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 18, margin: '8px 0 0', color: c.accent }}>{c.data.subheadline}</p>}
            </div>
            <div style={{ padding: '18px 28px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Message c={c} color="#33322f" dropCap={c.accent} />
                <div style={{ marginTop: 12 }}><Scripture c={c} variant="boxed" /></div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'stretch' }}>
                    <div style={{ flex: 1 }}><Prayer c={c} /></div>
                    {(c.data.service_times || c.contactLines.length) ? <div style={{ width: 128, flexShrink: 0 }}><Join c={c} compact /></div> : null}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 12, textAlign: 'center' }}>
                    {c.data.footer_note && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12.5, color: '#5a5852', margin: '0 0 4px' }}>{c.data.footer_note}</p>}
                    <ChurchName c={c} color={c.accentDeep} />
                </div>
            </div>
        </div>
    ),
}

const minimal: LeafletDesign = {
    id: 'minimal', name: 'Minimal', inset: 34, baseBg: '#ffffff',
    background: c => <div aria-hidden style={{ position: 'absolute', inset: 20, border: `1px solid ${c.accent}44` }} />,
    content: c => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Logo src={c.logo} h={44} />
                <ChurchName c={c} color={c.accentDeep} />
            </div>
            <div style={{ margin: '20px 0 4px' }}>
                <span style={{ display: 'inline-block', height: 1, width: 40, background: c.accent, verticalAlign: 'middle' }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: c.accentDeep, margin: '0 12px' }}>Good news</span>
                <span style={{ display: 'inline-block', height: 1, width: 40, background: c.accent, verticalAlign: 'middle' }} />
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 44, lineHeight: 1.05, margin: '6px 0 0', color: NAVY, letterSpacing: '0.01em' }}>{c.data.headline || 'God Loves You'}</h1>
            {c.data.subheadline && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, margin: '6px 0 0', color: c.accentDeep }}>{c.data.subheadline}</p>}
            <div style={{ maxWidth: 380, margin: '18px auto 0' }}><Scripture c={c} variant="bare" /></div>
            <div style={{ maxWidth: 400, margin: '4px auto 0', textAlign: 'left' }}><Message c={c} color="#4a4844" dropCap={c.accent} /></div>
            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                {c.data.cta_text && <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: NAVY, margin: '0 0 4px' }}>{c.data.cta_text}</p>}
                {c.data.service_times && <p style={{ fontSize: 11, fontWeight: 600, color: c.accentDeep, letterSpacing: '0.02em', margin: '2px 0' }}>{c.data.service_times}</p>}
                <p style={{ fontSize: 10.5, color: '#7a7873', margin: '2px 0' }}>{c.contactLines.join('  ·  ')}</p>
            </div>
        </div>
    ),
}

const bold: LeafletDesign = {
    id: 'bold', name: 'Bold', inset: 18, baseBg: NAVY, dark: true,
    background: c => (
        <>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${c.accent} 0%, ${c.accentDeep} 100%)` }} />
            <div aria-hidden style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
            <div aria-hidden style={{ position: 'absolute', bottom: -50, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(20,1,82,0.18)' }} />
        </>
    ),
    content: c => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 4px 12px' }}>
                <span style={{ background: '#fff', borderRadius: '50%', padding: 4, display: 'inline-flex' }}><Logo src={c.logo} h={26} /></span>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: NAVY }}>{c.data.church_name}</span>
            </div>
            <div style={{ padding: '0 4px' }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 50, lineHeight: 0.98, margin: 0, color: NAVY, letterSpacing: '-0.02em' }}>{c.data.headline || 'God Loves You'}</h1>
                {c.data.subheadline && <p style={{ fontWeight: 700, fontSize: 15, margin: '8px 0 0', color: NAVY }}>{c.data.subheadline}</p>}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 16px', marginTop: 14, display: 'flex', flexDirection: 'column', flex: 1, boxShadow: '0 8px 24px rgba(20,1,82,0.18)' }}>
                <Message c={c} color="#33322f" dropCap={c.accent} />
                <div style={{ marginTop: 10 }}><Scripture c={c} variant="ribbon" /></div>
                {(c.data.cta_text || c.data.cta_detail) && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                        {c.data.cta_text && <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 16, color: NAVY }}>{c.data.cta_text}</div>}
                        {c.data.cta_detail && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: '#55524c', margin: '6px 0 0' }}>{c.data.cta_detail}</p>}
                    </div>
                )}
                <div style={{ marginTop: 'auto', paddingTop: 12, textAlign: 'center', borderTop: `1px solid ${c.accent}33` }}>
                    {c.data.service_times && <p style={{ fontSize: 11, fontWeight: 700, color: NAVY, margin: '8px 0 2px' }}>{c.data.service_times}</p>}
                    <p style={{ fontSize: 10, color: '#7a7873', margin: 0 }}>{c.contactLines.join('  ·  ')}</p>
                </div>
            </div>
        </div>
    ),
}

export const DESIGNS: Record<string, LeafletDesign> = { classic, modern, minimal, bold }
export const DESIGN_OPTIONS = [classic, modern, minimal, bold].map(d => ({ id: d.id, name: d.name }))
export function getDesign(id?: string): LeafletDesign { return DESIGNS[id || 'classic'] || classic }

'use client'
/**
 * LeafletDocument — renders a single FIXED physical page (A5 portrait) and
 * AUTO-FITS the content so the leaflet always stays on exactly one page. The
 * visual style comes from a pluggable design (see leafletDesigns): the design's
 * full-bleed background is drawn on the page (never scaled) and its content is
 * scaled to fit. Display scaling for preview/print is handled by LeafletCanvas.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Leaflet } from '@/lib/api'
import { getDesign, toHtml, type DesignCtx } from './leafletDesigns'

export { toHtml }

const DEFAULT_LOGO = '/NewLETWlogo.png'

export default function LeafletDocument({ data }: { data: Partial<Leaflet> }) {
    const design = getDesign(data.design)
    const accent = data.accent_color || '#f5bb00'
    const ctx: DesignCtx = {
        data,
        accent,
        accentDeep: accent.toLowerCase() === '#f5bb00' ? '#b8860b' : accent,
        logo: data.logo_url || DEFAULT_LOGO,
        bodyHtml: toHtml(data.body_html || ''),
        contactLines: [data.contact_phone, data.contact_website, data.contact_address].filter(Boolean) as string[],
    }

    // Auto-fit: scale content down so it never overflows the fixed page.
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

    return (
        <div className="leaflet-doc" style={{ position: 'relative', width: '148mm', height: '210mm', background: design.baseBg, overflow: 'hidden', fontFamily: "'Lora', Georgia, serif", color: '#2c2b28' }}>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" />

            {/* Full-bleed background (never scaled) */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>{design.background(ctx)}</div>

            {/* Auto-fit content */}
            <div ref={boxRef} style={{ position: 'absolute', inset: design.inset, zIndex: 1, overflow: 'hidden' }}>
                <div ref={colRef} style={{ height: '100%', width: '100%', transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                    {design.content(ctx)}
                </div>
            </div>

            <style jsx global>{`
                .leaflet-body p { margin: 0 0 0.6em; }
                .leaflet-body p:last-child { margin-bottom: 0; }
                .leaflet-body p:first-of-type::first-letter {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 2.9em; font-weight: 800; float: left; line-height: 0.8;
                    margin: 3px 7px 0 0; color: var(--dropcap, #140152);
                }
            `}</style>
        </div>
    )
}

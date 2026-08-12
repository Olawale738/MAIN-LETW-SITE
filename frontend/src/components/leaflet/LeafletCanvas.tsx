'use client'
/**
 * LeafletCanvas — wraps the fixed physical LeafletDocument and scales it down to
 * fit whatever width it's given (preview column, phone, etc.). In print the
 * scale is reset (see each page's @media print rules) so it prints at true A5 /
 * A4 size. The scaled #leaflet node is what pages target for printing + export.
 */
import { useEffect, useRef, useState } from 'react'
import LeafletDocument from './LeafletDocument'
import type { Leaflet } from '@/lib/api'

const PX_PER_MM = 96 / 25.4 // 3.7795

export default function LeafletCanvas({ data }: { data: Partial<Leaflet> }) {
    const isTrifold = data.layout === 'tri-fold'
    const wpx = Math.round((isTrifold ? 297 : 148) * PX_PER_MM)
    const hpx = Math.round(210 * PX_PER_MM)

    const ref = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const measure = () => setScale(Math.min(1, el.clientWidth / wpx))
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [wpx])

    return (
        <div ref={ref} className="leaflet-canvas-fit" style={{ width: '100%' }}>
            <div className="leaflet-canvas-box" style={{ width: Math.round(wpx * scale), height: Math.round(hpx * scale), margin: '0 auto', boxShadow: '0 12px 40px rgba(20,1,82,0.22)', overflow: 'hidden' }}>
                <div id="leaflet" style={{ width: wpx, height: hpx, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    <LeafletDocument data={data} />
                </div>
            </div>
        </div>
    )
}

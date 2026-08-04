'use client'
/**
 * /leaflet/[id] — public, shareable & printable view of a published evangelism
 * leaflet. Renders the same ministry-branded design as the admin preview via
 * the shared LeafletDocument.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer, Loader2 } from 'lucide-react'
import { leafletsApi, type Leaflet } from '@/lib/api'
import LeafletDocument from '@/components/leaflet/LeafletDocument'

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

    return (
        <main className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="print:hidden max-w-[420px] mx-auto mb-4 flex justify-end">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-full text-sm shadow">
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
            </div>

            <div id="leaflet" className="mx-auto shadow-2xl overflow-hidden print:shadow-none" style={{ maxWidth: 420 }}>
                <LeafletDocument data={lf} />
            </div>

            <style jsx global>{`
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

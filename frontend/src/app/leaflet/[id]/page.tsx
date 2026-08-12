'use client'
/**
 * /leaflet/[id] — public, shareable & printable view of a published evangelism
 * leaflet. Renders the shared LeafletDocument, and lets anyone print it, save it
 * as an image, or share it to WhatsApp / Facebook for digital evangelism.
 */
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer, Loader2, Download, Share2, Link as LinkIcon } from 'lucide-react'
import { leafletsApi, type Leaflet } from '@/lib/api'
import LeafletCanvas from '@/components/leaflet/LeafletCanvas'

export default function PublicLeafletPage() {
    const { id } = useParams<{ id: string }>()
    const [lf, setLf] = useState<Leaflet | null>(null)
    const [err, setErr] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [toast, setToast] = useState<string | null>(null)
    const nodeRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!id) return
        leafletsApi.publicGet(id).then(setLf).catch(e => setErr((e as Error).message))
    }, [id])

    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) } }, [toast])

    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    const shareText = lf ? `${lf.headline}${lf.subheadline ? ' — ' + lf.subheadline : ''}` : 'God loves you'

    const makePng = async (): Promise<Blob | null> => {
        const node = nodeRef.current?.querySelector('.leaflet-doc') as HTMLElement | null
        if (!node) return null
        const { toBlob } = await import('html-to-image')
        return toBlob(node, { pixelRatio: 2, cacheBust: true, backgroundColor: '#fbf9f2' })
    }

    const download = async () => {
        setBusy(true)
        try {
            const blob = await makePng()
            if (!blob) throw new Error('no image')
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${(lf?.title || 'leaflet').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            setToast('Could not build image — use Print / Save as PDF instead.')
        } finally { setBusy(false) }
    }

    const shareImage = async () => {
        setBusy(true)
        try {
            const blob = await makePng()
            const file = blob ? new File([blob], 'leaflet.png', { type: 'image/png' }) : null
            const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
            if (file && nav.share && nav.canShare && nav.canShare({ files: [file] })) {
                await nav.share({ files: [file], title: shareText, text: shareText })
            } else if (nav.share) {
                await nav.share({ title: shareText, text: shareText, url: shareUrl })
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, '_blank')
            }
        } catch { /* user cancelled */ }
        finally { setBusy(false) }
    }

    const copyLink = () => navigator.clipboard.writeText(shareUrl).then(() => setToast('Link copied.')).catch(() => {})

    if (err) return <main className="min-h-screen flex items-center justify-center p-6 text-center text-gray-500">This leaflet is not available.</main>
    if (!lf) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></main>

    const trifold = lf.layout === 'tri-fold'
    const maxW = trifold ? 680 : 420

    return (
        <main className="min-h-screen bg-gray-100 py-8 px-4">
            {/* Action bar — hidden when printing */}
            <div className="print:hidden mx-auto mb-4 flex flex-wrap items-center justify-center gap-2" style={{ maxWidth: maxW }}>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-full text-sm shadow"><Printer className="w-4 h-4" /> Print / PDF</button>
                <button onClick={download} disabled={busy} className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-full text-sm shadow disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save image</button>
                <button onClick={shareImage} disabled={busy} className="inline-flex items-center gap-2 bg-[#25D366] hover:brightness-95 text-white font-bold px-4 py-2.5 rounded-full text-sm shadow disabled:opacity-50"><Share2 className="w-4 h-4" /> Share</button>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#1877F2] hover:brightness-95 text-white font-bold px-4 py-2.5 rounded-full text-sm shadow">Facebook</a>
                <button onClick={copyLink} className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 font-bold px-4 py-2.5 rounded-full text-sm shadow"><LinkIcon className="w-4 h-4" /> Copy link</button>
            </div>
            {toast && <p className="print:hidden text-center text-sm text-[#140152] mb-3">{toast}</p>}

            <div ref={nodeRef} className="mx-auto" style={{ maxWidth: maxW }}>
                <LeafletCanvas data={lf} />
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    body * { visibility: hidden !important; }
                    #leaflet, #leaflet * { visibility: visible !important; }
                    #leaflet { position: absolute !important; left: 0 !important; top: 0 !important; transform: none !important; }
                    .leaflet-canvas-box { width: auto !important; height: auto !important; margin: 0 !important; box-shadow: none !important; }
                    @page { size: ${trifold ? 'A4 landscape' : 'A5 portrait'}; margin: 0; }
                }
            `}</style>
        </main>
    )
}

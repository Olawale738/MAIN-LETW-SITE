'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Radio, ArrowRight } from 'lucide-react'
import { onlineCampusApi } from '@/lib/api'

interface ServiceLite {
    status: string
    title?: string
    description?: string | null
    livestream_url?: string | null
    cover_image_url?: string | null
}

/**
 * If a service is live, render a hero card at the top of /sermons embedding the
 * livestream — no altar-call buttons here (per request: those stay on /live).
 */
export default function SermonsLiveBanner() {
    const [svc, setSvc] = useState<ServiceLite | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const c = await onlineCampusApi.current() as ServiceLite
                setSvc(c)
            } catch { setSvc(null) }
        }
        load()
        const id = setInterval(load, 30000)
        return () => clearInterval(id)
    }, [])

    if (!svc || svc.status !== 'live') return null
    const url = svc.livestream_url || ''

    const embed = url.includes('youtube.com/watch') || url.includes('youtu.be/')
        ? `https://www.youtube.com/embed/${(url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [])[1] || ''}?autoplay=1`
        : url

    return (
        <section className="mb-16">
            <div className="bg-gradient-to-br from-red-600 via-rose-500 to-orange-500 rounded-3xl p-1 shadow-2xl shadow-red-500/30">
                <div className="bg-[#140152] rounded-[1.4rem] overflow-hidden">
                    <div className="grid lg:grid-cols-2">
                        <div className="aspect-video lg:aspect-auto bg-black relative">
                            {embed ? (
                                <iframe src={embed} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                            ) : (
                                <img src={svc.cover_image_url || '/SERMONS.png'} alt="" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                </span>
                                LIVE NOW
                            </div>
                        </div>
                        <div className="p-8 lg:p-10 flex flex-col justify-center text-white">
                            <p className="text-[#f5bb00] text-xs font-black uppercase tracking-[0.3em] mb-3 inline-flex items-center gap-2"><Radio className="w-3.5 h-3.5" /> Streaming Now</p>
                            <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight">{svc.title}</h2>
                            {svc.description && <p className="text-white/70 mb-6 leading-relaxed line-clamp-3">{svc.description}</p>}
                            <Link href="/live" className="inline-flex items-center gap-2 bg-white hover:bg-yellow-50 text-[#140152] font-black px-6 py-3 rounded-full text-sm w-fit shadow-lg">
                                Open full live experience <ArrowRight className="w-4 h-4" />
                            </Link>
                            <p className="text-white/40 text-[11px] mt-4">Altar response & raise-hand are available on the full /live page.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

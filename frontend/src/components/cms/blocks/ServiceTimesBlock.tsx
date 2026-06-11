'use client'
import React from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { cmsApi } from '@/lib/api'

interface ServiceItem {
    day: string
    time: string
    title: string
    description?: string
    image?: string        // optional photo blended into the card background
    blend?: number | string  // 0..1 — how strong the photo shows through (default 0.45)
}

function resolveImg(src?: string): string | null {
    if (!src) return null
    return src.startsWith('http') || src.startsWith('/') ? src : cmsApi.getImageUrl(src)
}

interface Props {
    data: {
        title?: string
        subtitle?: string
        location?: string
        map_link?: string
        services?: ServiceItem[]
        bg?: 'light' | 'brand'
    }
}

export default function ServiceTimesBlock({ data }: Props) {
    const { title = "When We Gather", subtitle = "Join us this week — come as you are.", location, map_link, services = [], bg = 'brand' } = data
    if (services.length === 0) return null

    const isBrand = bg === 'brand'
    const sectionBg = isBrand
        ? 'bg-gradient-to-br from-[#140152] via-[#1a0270] to-[#0d0138]'
        : 'bg-gradient-to-b from-white to-gray-50'
    const titleColor = isBrand ? 'text-white' : 'text-[#140152]'
    const subColor = isBrand ? 'text-white/70' : 'text-gray-600'
    const cardBg = isBrand ? 'bg-white/10 backdrop-blur-md border border-white/15' : 'bg-white border border-gray-100 shadow-sm'
    const cardText = isBrand ? 'text-white' : 'text-[#140152]'
    const cardSub = isBrand ? 'text-white/70' : 'text-gray-500'

    return (
        <section className={`relative py-20 overflow-hidden ${sectionBg}`}>
            {isBrand && <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#f5bb00]/15 blur-3xl pointer-events-none" />}
            {isBrand && <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-[#7c3aed]/20 blur-3xl pointer-events-none" />}

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#f5bb00] mb-3">Plan Your Visit</p>
                    <h2 className={`text-3xl md:text-5xl font-black ${titleColor}`}>{title}</h2>
                    {subtitle && <p className={`mt-4 text-lg ${subColor}`}>{subtitle}</p>}
                    <div className="mt-6 mx-auto h-1.5 w-24 rounded-full bg-gradient-to-r from-[#f5bb00] to-[#7c3aed]" />
                </div>

                <div className={`grid gap-5 ${services.length >= 3 ? 'md:grid-cols-3' : services.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-xl mx-auto'}`}>
                    {services.map((s, i) => {
                        const img = resolveImg(s.image)
                        const rawBlend = typeof s.blend === 'string' ? parseFloat(s.blend) : (s.blend ?? 0.45)
                        const showThrough = Math.min(0.85, Math.max(0.15, isNaN(rawBlend as number) ? 0.45 : (rawBlend as number)))
                        return (
                            <div key={i}
                                className={`relative overflow-hidden rounded-2xl p-6 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${img ? 'border ' + (isBrand ? 'border-white/15' : 'border-gray-200') : cardBg}`}
                                style={{
                                    animationDelay: `${i * 120}ms`, animationDuration: '600ms', animationFillMode: 'both',
                                    // Solid brand/light fill underneath the image — this is what we blend with.
                                    background: img ? (isBrand ? '#140152' : '#ffffff') : undefined,
                                }}>
                                {/* Layer 1 — the photo itself, blended with the underlying brand color */}
                                {img && (
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage: `url(${img})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            opacity: showThrough,
                                            mixBlendMode: isBrand ? 'screen' : 'multiply',
                                        }}
                                        aria-hidden="true"
                                    />
                                )}
                                {/* Layer 2 — directional gradient veil so headline + body stay legible */}
                                {img && (
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: isBrand
                                                ? 'linear-gradient(135deg, rgba(20,1,82,0.78) 0%, rgba(20,1,82,0.45) 60%, rgba(20,1,82,0.78) 100%)'
                                                : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0.85) 100%)',
                                        }}
                                        aria-hidden="true"
                                    />
                                )}
                                {/* Layer 3 — soft brand-accent corner glow (only on brand bg) */}
                                {img && isBrand && (
                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#f5bb00]/25 blur-2xl pointer-events-none" aria-hidden="true" />
                                )}

                                {/* Content — sits on top of all the layers */}
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-11 h-11 rounded-xl ${img ? 'bg-[#f5bb00]/30 backdrop-blur-sm' : 'bg-[#f5bb00]/20'} flex items-center justify-center`}>
                                            <Calendar className="w-5 h-5 text-[#f5bb00]" />
                                        </div>
                                        <p className={`text-sm font-bold uppercase tracking-wider ${isBrand ? 'text-[#f5bb00]' : 'text-[#140152]/60'}`}>{s.day}</p>
                                    </div>
                                    <h3 className={`text-2xl font-black ${cardText} mb-2 ${img ? 'drop-shadow-sm' : ''}`}>{s.title}</h3>
                                    <p className={`flex items-center gap-2 text-base font-semibold ${isBrand ? 'text-white/95' : 'text-[#140152]/85'} mb-3`}>
                                        <Clock className="w-4 h-4" /> {s.time}
                                    </p>
                                    {s.description && <p className={`text-sm leading-relaxed ${isBrand ? 'text-white/85' : cardSub}`}>{s.description}</p>}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {location && (
                    <div className="mt-10 text-center">
                        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${isBrand ? 'bg-white/10 backdrop-blur-md text-white border border-white/15' : 'bg-white text-[#140152] border border-gray-200 shadow-sm'}`}>
                            <MapPin className={`w-5 h-5 ${isBrand ? 'text-[#f5bb00]' : 'text-[#f5bb00]'}`} />
                            <span className="font-semibold">{location}</span>
                            {map_link && (
                                <Link href={map_link} target="_blank" rel="noopener noreferrer"
                                    className="ml-2 px-3 py-1 rounded-full bg-[#f5bb00] text-[#140152] font-bold text-sm hover:bg-yellow-300 transition-colors">
                                    Get Directions
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

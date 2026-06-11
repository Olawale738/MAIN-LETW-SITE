'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { cmsApi } from '@/lib/api'

interface Milestone {
    year: string
    title: string
    description?: string
    image?: string
}

interface Props {
    data: {
        title?: string
        subtitle?: string
        eyebrow?: string
        bg?: 'brand' | 'light' | 'dark'
        milestones?: Milestone[]
    }
}

function resolveImg(src?: string): string | null {
    if (!src) return null
    return src.startsWith('http') || src.startsWith('/') ? src : cmsApi.getImageUrl(src)
}

/** Visibility hook so each milestone fades/slides in as it enters the viewport. */
function useReveal<T extends HTMLElement>() {
    const ref = useRef<T | null>(null)
    const [shown, setShown] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return }
        const io = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) { setShown(true); io.disconnect() } }),
            { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])
    return { ref, shown }
}

export default function TimelineBlock({ data }: Props) {
    const { title = "Our Story", subtitle, eyebrow = "A Journey of Faith", bg = 'brand', milestones = [] } = data
    if (milestones.length === 0) return null

    const sectionBg =
        bg === 'brand' ? 'bg-gradient-to-br from-[#0d0138] via-[#140152] to-[#1a0270]' :
        bg === 'dark' ? 'bg-black' :
        'bg-gradient-to-b from-white via-gray-50 to-white'
    const isLight = bg === 'light'
    const titleColor = isLight ? 'text-[#140152]' : 'text-white'
    const subColor = isLight ? 'text-gray-600' : 'text-white/70'
    const eyebrowColor = isLight ? 'text-[#140152]/70' : 'text-[#f5bb00]'
    const cardBg = isLight ? 'bg-white border border-gray-100 shadow-lg' : 'bg-white/[0.06] backdrop-blur-md border border-white/15'
    const cardTitle = isLight ? 'text-[#140152]' : 'text-white'
    const cardBody = isLight ? 'text-gray-600' : 'text-white/75'
    const lineGrad = isLight
        ? 'bg-gradient-to-b from-transparent via-[#140152]/30 to-transparent'
        : 'bg-gradient-to-b from-transparent via-[#f5bb00]/60 to-transparent'

    return (
        <section className={`relative py-24 md:py-32 overflow-hidden ${sectionBg}`}>
            {/* Atmospheric blobs (non-light) */}
            {!isLight && (
                <>
                    <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#7c3aed]/25 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[#f5bb00]/15 blur-3xl pointer-events-none" />
                </>
            )}

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-20">
                    {eyebrow && (
                        <p className={`text-xs sm:text-sm font-bold uppercase tracking-[0.35em] mb-4 ${eyebrowColor}`}>
                            {eyebrow}
                        </p>
                    )}
                    <h2 className={`text-4xl md:text-6xl font-black ${titleColor} leading-tight`}>{title}</h2>
                    {subtitle && <p className={`mt-5 text-lg ${subColor}`}>{subtitle}</p>}
                    <div className="mt-7 mx-auto h-1.5 w-24 rounded-full bg-gradient-to-r from-[#140152] via-[#7c3aed] to-[#f5bb00]" />
                </div>

                {/* Timeline */}
                <div className="relative max-w-5xl mx-auto">
                    {/* Vertical line */}
                    <div className={`absolute left-4 md:left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 ${lineGrad}`} />

                    {milestones.map((m, i) => {
                        const left = i % 2 === 0     // alternate sides on desktop
                        const img = resolveImg(m.image)
                        return <TimelineRow key={i} milestone={m} idx={i} left={left} img={img}
                            cardBg={cardBg} cardTitle={cardTitle} cardBody={cardBody} eyebrowColor={eyebrowColor} />
                    })}

                    {/* Closing dot */}
                    <div className="relative flex justify-start md:justify-center mt-2">
                        <div className="relative left-4 md:left-0 -translate-x-1/2 md:translate-x-0 flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f5bb00] to-[#7c3aed] shadow-lg shadow-[#f5bb00]/40" />
                            <p className={`mt-3 text-xs uppercase tracking-[0.3em] font-bold ${eyebrowColor}`}>And the story continues...</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

interface RowProps {
    milestone: Milestone
    idx: number
    left: boolean
    img: string | null
    cardBg: string
    cardTitle: string
    cardBody: string
    eyebrowColor: string
}
function TimelineRow({ milestone, idx, left, img, cardBg, cardTitle, cardBody, eyebrowColor }: RowProps) {
    const { ref, shown } = useReveal<HTMLDivElement>()
    return (
        <div ref={ref} className="relative pl-10 md:pl-0 mb-12 md:mb-20">
            {/* Node on the line */}
            <div className="absolute left-4 md:left-1/2 -translate-x-1/2 top-6 w-7 h-7 rounded-full bg-gradient-to-br from-[#f5bb00] to-[#7c3aed] shadow-[0_0_0_6px_rgba(245,187,0,0.15)] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>

            <div className={`grid md:grid-cols-2 gap-8 items-stretch transition-all duration-700 ease-out ${
                shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
                style={{ transitionDelay: `${idx * 60}ms` }}>
                {/* On desktop: card on alternating side, image on the opposite. On mobile: stacked. */}
                <div className={`${left ? 'md:order-1' : 'md:order-2'} ${left ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className={`${cardBg} rounded-3xl p-7`}>
                        <p className={`text-xs font-black tracking-[0.25em] uppercase ${eyebrowColor}`}>{milestone.year}</p>
                        <h3 className={`mt-2 text-2xl md:text-3xl font-black ${cardTitle}`}>{milestone.title}</h3>
                        {milestone.description && (
                            <p className={`mt-3 text-base leading-relaxed ${cardBody}`}>{milestone.description}</p>
                        )}
                    </div>
                </div>

                {img && (
                    <div className={`${left ? 'md:order-2' : 'md:order-1'} ${left ? 'md:pl-12' : 'md:pr-12'}`}>
                        <div className="relative h-56 md:h-full min-h-[14rem] rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5">
                            <Image src={img} alt={milestone.title} fill className="object-cover hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

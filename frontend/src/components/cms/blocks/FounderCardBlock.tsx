'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cmsApi } from '@/lib/api'

interface Props {
    data: {
        eyebrow?: string
        name?: string
        quote?: string
        bio?: string
        image?: string
        badge?: string                  // optional gold corner badge
        button_text?: string
        button_link?: string
        reverse?: boolean               // image on right (default), or image on left
        bg?: 'white' | 'gray' | 'brand'
        // Optional mission + vision cards rendered BELOW the founder content
        mission_title?: string
        mission_text?: string
        vision_title?: string
        vision_text?: string
    }
}

function resolveImg(src?: string): string | null {
    if (!src) return null
    return src.startsWith('http') || src.startsWith('/') ? src : cmsApi.getImageUrl(src)
}

export default function FounderCardBlock({ data }: Props) {
    const {
        eyebrow = 'The Heart Behind the House',
        name = 'Our Founder',
        quote,
        bio,
        image,
        badge,
        button_text,
        button_link,
        reverse = false,
        bg = 'white',
        mission_title,
        mission_text,
        vision_title,
        vision_text,
    } = data

    const showMission = !!(mission_title || mission_text)
    const showVision = !!(vision_title || vision_text)
    const showMV = showMission || showVision

    const img = resolveImg(image)

    const sectionBg =
        bg === 'brand' ? 'bg-gradient-to-br from-[#0d0138] via-[#140152] to-[#1a0270] text-white' :
        bg === 'gray' ? 'bg-gray-50' : 'bg-white'
    const isDark = bg === 'brand'
    const headingColor = isDark ? 'text-white' : 'text-[#140152]'
    const bodyColor = isDark ? 'text-white/80' : 'text-gray-600'
    const quoteColor = isDark ? 'text-white' : 'text-[#140152]'

    return (
        <section className={`py-20 md:py-24 ${sectionBg}`}>
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center max-w-6xl mx-auto">
                    {/* TEXT */}
                    <div className={`md:col-span-7 ${reverse ? 'md:order-2' : 'md:order-1'}`}>
                        {eyebrow && (
                            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f5bb00] mb-3">
                                {eyebrow}
                            </p>
                        )}
                        <h2 className={`text-3xl md:text-5xl font-black leading-[1.1] mb-6 ${headingColor}`}>
                            {name}
                        </h2>

                        {quote && (
                            <div className="relative pl-6 border-l-4 border-[#f5bb00] mb-6">
                                <p
                                    className={`text-lg md:text-2xl italic leading-snug ${quoteColor}`}
                                    style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
                                >
                                    &ldquo;{quote}&rdquo;
                                </p>
                            </div>
                        )}

                        {bio && (
                            <p className={`text-base md:text-lg leading-relaxed ${bodyColor}`}>{bio}</p>
                        )}

                        {button_text && button_link && (
                            <div className="mt-7">
                                <Link
                                    href={button_link}
                                    className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 shadow-md"
                                >
                                    {button_text} <span aria-hidden>→</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* IMAGE */}
                    <div className={`md:col-span-5 ${reverse ? 'md:order-1' : 'md:order-2'}`}>
                        {img ? (
                            <div className="relative">
                                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-gray-100">
                                    {/* Use a fixed aspect so the image NEVER blows up to full-page even
                                        if a parent container's width is huge. */}
                                    <div className="relative aspect-[4/5] w-full">
                                        <Image
                                            src={img}
                                            alt={name}
                                            fill
                                            sizes="(min-width: 768px) 40vw, 100vw"
                                            className="object-cover"
                                            priority={false}
                                        />
                                    </div>
                                </div>
                                {badge && (
                                    <div
                                        className={`hidden md:flex absolute -bottom-5 ${reverse ? '-right-5 rotate-6' : '-left-5 -rotate-6'} w-24 h-24 rounded-2xl bg-[#f5bb00] text-[#140152] font-black text-[11px] leading-tight tracking-wider shadow-xl items-center justify-center text-center px-2`}
                                    >
                                        {badge}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-[2rem] aspect-[4/5] w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                Add a photo in the admin editor
                            </div>
                        )}
                    </div>
                </div>

                {/* MISSION + VISION — rendered inside the founder card, below the photo/bio grid */}
                {showMV && (
                    <div className="max-w-6xl mx-auto mt-14 md:mt-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {showMission && (
                                <div className={`relative rounded-3xl p-7 md:p-9 border shadow-lg overflow-hidden ${isDark ? 'bg-white/[0.04] border-white/10 backdrop-blur-sm' : 'bg-white border-gray-100'}`}>
                                    <div className="absolute top-0 left-0 h-full w-1.5 bg-[#f5bb00]" aria-hidden />
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#f5bb00]/20 flex items-center justify-center text-[#f5bb00]" aria-hidden>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <circle cx="12" cy="12" r="6" />
                                                <circle cx="12" cy="12" r="2" />
                                            </svg>
                                        </div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f5bb00]">Our Mission</p>
                                    </div>
                                    <h3 className={`text-xl md:text-2xl font-black leading-tight mb-3 ${headingColor}`}>
                                        {mission_title || 'Awaken. Restore. Release.'}
                                    </h3>
                                    {mission_text && (
                                        <p className={`text-sm md:text-base leading-relaxed ${bodyColor}`}>{mission_text}</p>
                                    )}
                                </div>
                            )}
                            {showVision && (
                                <div className={`relative rounded-3xl p-7 md:p-9 border shadow-lg overflow-hidden ${isDark ? 'bg-white/[0.04] border-white/10 backdrop-blur-sm' : 'bg-[#140152] text-white border-transparent'}`}>
                                    <div className="absolute top-0 left-0 h-full w-1.5 bg-[#f5bb00]" aria-hidden />
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#f5bb00]/20 flex items-center justify-center text-[#f5bb00]" aria-hidden>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f5bb00]">Our Vision</p>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black leading-tight mb-3 text-white">
                                        {vision_title || 'A people of light, sent into every darkness.'}
                                    </h3>
                                    {vision_text && (
                                        <p className="text-sm md:text-base leading-relaxed text-white/80">{vision_text}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

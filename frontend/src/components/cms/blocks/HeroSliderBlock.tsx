'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cmsApi } from '@/lib/api'

interface Slide {
    eyebrow?: string
    title: string        // HTML allowed
    subtitle?: string
    bg_image?: string
    cta_text?: string
    cta_link?: string
    cta2_text?: string
    cta2_link?: string
    align?: 'left' | 'center'
}

interface HeroSliderBlockProps {
    data: {
        slides?: Slide[]
        autoplay?: boolean
        interval?: number          // seconds
        height?: 'medium' | 'tall' | 'full'
    }
}

function resolveImg(img?: string): string | null {
    if (!img) return null
    return img.startsWith('http') || img.startsWith('/') ? img : cmsApi.getImageUrl(img)
}

export default function HeroSliderBlock({ data }: HeroSliderBlockProps) {
    const { slides = [], autoplay = true, interval = 6, height = 'tall' } = data
    const count = slides.length
    const [current, setCurrent] = useState(0)

    const go = useCallback((i: number) => {
        if (count === 0) return
        setCurrent(((i % count) + count) % count)
    }, [count])

    // Always auto-advance (no pause-on-hover — the hero fills the viewport,
    // so hover-pause would make it appear static on desktop).
    useEffect(() => {
        if (!autoplay || count <= 1) return
        const ms = Math.max(2, interval) * 1000
        const t = setInterval(() => setCurrent(c => (c + 1) % count), ms)
        return () => clearInterval(t)
    }, [autoplay, count, interval])

    if (count === 0) return null

    const heightClass =
        height === 'full' ? 'h-screen' :
        height === 'medium' ? 'min-h-[540px]' :
        'min-h-[90vh]'

    const active = slides[current]
    const isLeft = active?.align === 'left'

    return (
        <section className={`relative ${heightClass} overflow-hidden bg-[#0d0138]`}>
            {/* Background layers (cross-fade) */}
            {slides.map((slide, idx) => {
                const bg = resolveImg(slide.bg_image)
                const isActive = idx === current
                return (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-[1100ms] ease-out ${isActive ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'}`}
                        aria-hidden={!isActive}
                    >
                        {bg && (
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: `url(${bg})`,
                                    animation: isActive ? 'letwKenburns 9s ease-out both' : 'none',
                                }}
                            />
                        )}
                        {/* Readability overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0138] via-transparent to-transparent" />
                    </div>
                )
            })}

            {/* Active slide content — keyed to re-animate on every change */}
            <div
                key={current}
                className={`relative z-10 h-full container mx-auto px-6 pt-32 md:pt-36 pb-24 flex flex-col justify-center ${isLeft ? 'items-start text-left' : 'items-center text-center'}`}
            >
                <div className={`max-w-4xl ${isLeft ? '' : 'mx-auto'}`}>
                    {active?.eyebrow && (
                        <p
                            className="inline-block text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#f5bb00] mb-5 animate-in fade-in slide-in-from-bottom-3"
                            style={{ animationDuration: '700ms', animationFillMode: 'both' }}
                        >
                            {active.eyebrow}
                        </p>
                    )}

                    <h1
                        className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.05] animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDuration: '800ms', animationDelay: '100ms', animationFillMode: 'both' }}
                        dangerouslySetInnerHTML={{ __html: active?.title ?? '' }}
                    />

                    {active?.subtitle && (
                        <p
                            className={`mt-6 text-lg sm:text-xl md:text-2xl text-gray-200/90 ${isLeft ? 'max-w-2xl' : 'max-w-2xl mx-auto'} animate-in fade-in slide-in-from-bottom-4`}
                            style={{ animationDuration: '800ms', animationDelay: '250ms', animationFillMode: 'both' }}
                        >
                            {active.subtitle}
                        </p>
                    )}

                    {(active?.cta_text || active?.cta2_text) && (
                        <div
                            className={`mt-9 flex flex-wrap gap-4 ${isLeft ? '' : 'justify-center'} animate-in fade-in slide-in-from-bottom-4`}
                            style={{ animationDuration: '800ms', animationDelay: '400ms', animationFillMode: 'both' }}
                        >
                            {active?.cta_text && active?.cta_link && (
                                <Link
                                    href={active.cta_link}
                                    className="inline-flex items-center gap-2 bg-[#f5bb00] text-[#140152] font-black px-8 py-4 rounded-full text-base hover:bg-yellow-300 hover:scale-105 transition-all shadow-xl shadow-[#f5bb00]/25"
                                >
                                    {active.cta_text}
                                </Link>
                            )}
                            {active?.cta2_text && active?.cta2_link && (
                                <Link
                                    href={active.cta2_link}
                                    className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-bold px-8 py-4 rounded-full text-base hover:bg-white hover:text-[#140152] transition-all backdrop-blur-sm"
                                >
                                    {active.cta2_text}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Arrow controls */}
            {count > 1 && (
                <>
                    <button
                        onClick={() => go(current - 1)}
                        aria-label="Previous slide"
                        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-[#f5bb00] hover:text-[#140152] text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => go(current + 1)}
                        aria-label="Next slide"
                        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-[#f5bb00] hover:text-[#140152] text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {count > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => go(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? 'w-9 bg-[#f5bb00]' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                        />
                    ))}
                </div>
            )}

            {/* Scroll cue */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-2 pointer-events-none">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">Scroll</span>
                <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
                    <div className="w-1 h-2 rounded-full bg-[#f5bb00]" style={{ animation: 'letwScrollCue 1.6s ease-in-out infinite' }} />
                </div>
            </div>

            {/* Ken-burns keyframes */}
            <style dangerouslySetInnerHTML={{ __html: '@keyframes letwKenburns{from{transform:scale(1.08)}to{transform:scale(1)}}@keyframes letwScrollCue{0%{transform:translateY(0);opacity:1}80%{transform:translateY(14px);opacity:0}100%{transform:translateY(0);opacity:0}}' }} />
        </section>
    )
}

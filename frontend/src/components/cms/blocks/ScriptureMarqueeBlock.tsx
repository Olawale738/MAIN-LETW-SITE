'use client'
import React, { useState, useEffect } from 'react'

interface Verse { text: string; reference?: string }

interface Props {
    data: {
        verses?: Verse[]
        bg?: 'gold' | 'brand' | 'dark' | 'light'
        speed?: number   // seconds per verse (rotation interval)
    }
}

// Decorative quote glyph
const Quote = ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M10 7h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2h-2v-2h4v-2a2 2 0 0 0-2-2zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2h-2v-2h4v-2a2 2 0 0 0-2-2z" />
    </svg>
)

export default function ScriptureMarqueeBlock({ data }: Props) {
    const { verses = [], bg = 'brand', speed = 8 } = data
    const [idx, setIdx] = useState(0)
    const count = verses.length

    useEffect(() => {
        if (count <= 1) return
        const ms = Math.max(3, speed) * 1000
        const t = setInterval(() => setIdx(i => (i + 1) % count), ms)
        return () => clearInterval(t)
    }, [count, speed])

    if (count === 0) return null

    const sectionBg =
        bg === 'brand' ? 'bg-gradient-to-br from-[#140152] via-[#1a0270] to-[#0d0138]' :
        bg === 'dark'  ? 'bg-black' :
        bg === 'light' ? 'bg-gradient-to-b from-gray-50 to-white' :
        'bg-gradient-to-r from-[#f5bb00] via-[#ffd633] to-[#f5bb00]'
    const isLight = bg === 'light' || bg === 'gold'
    const textColor = isLight ? 'text-[#140152]' : 'text-white'
    const refColor = isLight ? 'text-[#140152]/70' : 'text-[#f5bb00]'
    const accentColor = isLight ? 'text-[#140152]/15' : 'text-white/10'

    const active = verses[idx]

    return (
        <section className={`relative py-16 md:py-24 overflow-hidden ${sectionBg}`}>
            {/* Soft decorative blobs */}
            {!isLight && (
                <>
                    <div className="absolute -top-24 right-1/4 w-80 h-80 rounded-full bg-[#f5bb00]/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-[#7c3aed]/15 blur-3xl pointer-events-none" />
                </>
            )}
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${isLight ? 'bg-[#140152]/20' : 'bg-gradient-to-r from-transparent via-[#f5bb00]/60 to-transparent'}`} />
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isLight ? 'bg-[#140152]/20' : 'bg-gradient-to-r from-transparent via-[#f5bb00]/60 to-transparent'}`} />

            {/* Giant ghost quote mark */}
            <Quote className={`absolute -top-4 left-4 md:left-12 w-28 md:w-40 h-28 md:h-40 ${accentColor}`} />
            <Quote className={`absolute -bottom-4 right-4 md:right-12 w-28 md:w-40 h-28 md:h-40 ${accentColor} rotate-180`} />

            <div className="relative z-10 container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <p className={`text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-6 ${refColor}`}>
                        Word of the Day
                    </p>

                    {/* Cross-fade verse (key change = re-animate) */}
                    <div
                        key={idx}
                        className={`animate-in fade-in slide-in-from-bottom-4 ${textColor}`}
                        style={{ animationDuration: '700ms', animationFillMode: 'both' }}
                    >
                        <p
                            className="font-serif italic text-2xl md:text-4xl leading-snug md:leading-[1.25]"
                            style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
                        >
                            &ldquo;{active.text}&rdquo;
                        </p>
                        {active.reference && (
                            <p className={`mt-6 text-base md:text-lg font-bold tracking-wide ${refColor}`}>
                                — {active.reference}
                            </p>
                        )}
                    </div>

                    {/* Dot indicators */}
                    {count > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-2.5">
                            {verses.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIdx(i)}
                                    aria-label={`Show verse ${i + 1}`}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        i === idx
                                            ? `w-8 ${isLight ? 'bg-[#140152]' : 'bg-[#f5bb00]'}`
                                            : `w-2 ${isLight ? 'bg-[#140152]/30 hover:bg-[#140152]/50' : 'bg-white/30 hover:bg-white/60'}`
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

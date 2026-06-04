'use client'
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

interface Testimony {
    quote: string
    name: string
    location?: string
    avatar?: string   // emoji fallback or URL
}

interface TestimoniesBlockProps {
    data: {
        title?: string
        subtitle?: string
        testimonies: Testimony[]
        style?: 'slider' | 'grid'
        bg?: 'light' | 'dark' | 'brand'
    }
}

export default function TestimoniesBlock({ data }: TestimoniesBlockProps) {
    const { title, subtitle, testimonies = [], style = 'grid', bg = 'light' } = data
    const [idx, setIdx] = useState(0)

    const bgClass = bg === 'dark'
        ? 'bg-gray-900 text-white'
        : bg === 'brand'
        ? 'bg-gradient-to-br from-[#140152] to-[#1d0175] text-white'
        : 'bg-gray-50 text-gray-900'

    const cardClass = bg === 'light'
        ? 'bg-white border border-gray-100 shadow-sm'
        : 'bg-white/10 border border-white/15'

    const textMuted = bg === 'light' ? 'text-gray-500' : 'text-white/60'
    const textMain  = bg === 'light' ? 'text-gray-800' : 'text-white'

    const prev = () => setIdx(i => (i - 1 + testimonies.length) % testimonies.length)
    const next = () => setIdx(i => (i + 1) % testimonies.length)

    if (!testimonies.length) return null

    return (
        <section className={`py-20 ${bgClass}`}>
            <div className="max-w-6xl mx-auto px-4">
                {(title || subtitle) && (
                    <div className="text-center mb-14">
                        {subtitle && (
                            <p className="text-[#f5bb00] font-bold uppercase tracking-[0.25em] text-xs mb-3">{subtitle}</p>
                        )}
                        {title && (
                            <h2 className={`text-3xl md:text-4xl font-black ${textMain}`}>{title}</h2>
                        )}
                        <div className="w-16 h-1 bg-[#f5bb00] mx-auto rounded-full mt-4" />
                    </div>
                )}

                {style === 'slider' ? (
                    <div className="relative max-w-3xl mx-auto">
                        <div className={`${cardClass} rounded-3xl p-10 text-center`}>
                            <Quote className="w-10 h-10 text-[#f5bb00] mx-auto mb-6 opacity-80" />
                            <p className={`text-xl md:text-2xl italic leading-relaxed ${textMain} mb-8`}>
                                "{testimonies[idx].quote}"
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#f5bb00] flex items-center justify-center text-[#140152] font-black text-xl">
                                    {testimonies[idx].avatar || testimonies[idx].name[0]}
                                </div>
                                <div className="text-left">
                                    <p className={`font-black ${textMain}`}>{testimonies[idx].name}</p>
                                    {testimonies[idx].location && (
                                        <p className={`text-sm ${textMuted}`}>{testimonies[idx].location}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-6">
                            <button onClick={prev}
                                className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <ChevronLeft className={`w-5 h-5 ${textMuted}`} />
                            </button>
                            <div className="flex gap-2">
                                {testimonies.map((_, i) => (
                                    <button key={i} onClick={() => setIdx(i)}
                                        className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-[#f5bb00] w-6' : 'bg-white/30'}`} />
                                ))}
                            </div>
                            <button onClick={next}
                                className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <ChevronRight className={`w-5 h-5 ${textMuted}`} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`grid gap-6 ${testimonies.length === 1 ? 'max-w-2xl mx-auto' : testimonies.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                        {testimonies.map((t, i) => (
                            <div key={i} className={`${cardClass} rounded-2xl p-7 flex flex-col`}>
                                <Quote className="w-7 h-7 text-[#f5bb00] mb-4 opacity-70" />
                                <p className={`italic ${textMain} leading-relaxed flex-1 mb-6`}>"{t.quote}"</p>
                                <div className="flex items-center gap-3 border-t border-white/10 pt-5 mt-auto">
                                    <div className="w-10 h-10 rounded-full bg-[#f5bb00] flex items-center justify-center text-[#140152] font-black">
                                        {t.avatar || t.name[0]}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${textMain}`}>{t.name}</p>
                                        {t.location && <p className={`text-xs ${textMuted}`}>{t.location}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

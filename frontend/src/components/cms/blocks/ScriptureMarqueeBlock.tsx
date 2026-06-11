'use client'
import React from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
    data: {
        verses?: { text: string; reference?: string }[]
        bg?: 'gold' | 'brand' | 'dark'
        speed?: number   // seconds for full cycle
    }
}

export default function ScriptureMarqueeBlock({ data }: Props) {
    const { verses = [], bg = 'gold', speed = 40 } = data
    if (verses.length === 0) return null

    const sectionBg =
        bg === 'brand' ? 'bg-[#140152]' :
        bg === 'dark' ? 'bg-black' : 'bg-[#f5bb00]'
    const textColor = bg === 'gold' ? 'text-[#140152]' : 'text-white'
    const sepColor = bg === 'gold' ? 'text-[#140152]/40' : 'text-white/40'

    const items = [...verses, ...verses, ...verses]   // triple for seamless loop

    return (
        <section className={`relative py-4 overflow-hidden border-y ${bg === 'gold' ? 'border-[#140152]/15' : 'border-white/10'} ${sectionBg}`}>
            <div className="flex items-center gap-8 whitespace-nowrap"
                style={{ animation: `letwScroll ${Math.max(15, speed)}s linear infinite`, width: 'max-content' }}>
                {items.map((v, i) => (
                    <div key={i} className={`flex items-center gap-3 text-base md:text-lg font-semibold ${textColor}`}>
                        <Sparkles className="w-4 h-4" />
                        <span className="italic">&ldquo;{v.text}&rdquo;</span>
                        {v.reference && <span className={`font-bold ${sepColor}`}>— {v.reference}</span>}
                        <span className={sepColor}>•</span>
                    </div>
                ))}
            </div>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes letwScroll{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}' }} />
        </section>
    )
}

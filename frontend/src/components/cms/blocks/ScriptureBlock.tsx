import React from 'react'

interface ScriptureBlockProps {
    data: {
        verse: string
        reference: string
        context?: string
        bg?: 'dark' | 'brand' | 'gold'
        align?: 'left' | 'center'
    }
}

export default function ScriptureBlock({ data }: ScriptureBlockProps) {
    const { verse, reference, context, bg = 'brand', align = 'center' } = data

    const bgClass =
        bg === 'dark' ? 'bg-gray-900' :
        bg === 'gold' ? 'bg-[#f5bb00]' :
        'bg-gradient-to-br from-[#140152] via-[#1a0270] to-[#0d0133]'

    const textClass = bg === 'gold' ? 'text-[#140152]' : 'text-white'
    const verseClass = bg === 'gold' ? 'text-[#140152]/90' : 'text-white/90'
    const refClass = bg === 'gold' ? 'text-[#140152]/70 border-[#140152]/30' : 'text-[#f5bb00] border-[#f5bb00]/30'

    return (
        <section className={`relative py-20 overflow-hidden ${bgClass}`}>
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            <div className={`relative z-10 max-w-4xl mx-auto px-6 ${align === 'center' ? 'text-center' : 'text-left'}`}>
                {context && (
                    <p className={`text-xs font-bold uppercase tracking-[0.25em] mb-6 ${bg === 'gold' ? 'text-[#140152]/60' : 'text-[#f5bb00]/80'}`}>
                        {context}
                    </p>
                )}
                <blockquote className={`text-2xl md:text-4xl font-bold italic leading-relaxed ${verseClass} mb-8`}>
                    "{verse}"
                </blockquote>
                <cite className={`not-italic text-base font-black uppercase tracking-widest border-t pt-4 inline-block ${refClass}`}>
                    — {reference}
                </cite>
            </div>
        </section>
    )
}

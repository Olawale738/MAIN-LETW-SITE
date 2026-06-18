'use client'
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { dailyVerseApi, type TodayVerse } from '@/lib/api'

const FALLBACK: TodayVerse = {
    id: 'fallback',
    reference: 'Lamentations 3:22-23',
    text: 'The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.',
    translation: 'ESV',
    date: new Date().toISOString().slice(0, 10),
}

export default function DailyVerseWidget() {
    const [verse, setVerse] = useState<TodayVerse | null>(null)

    useEffect(() => {
        dailyVerseApi.today()
            .then((v) => setVerse(v || FALLBACK))
            .catch(() => setVerse(FALLBACK))
    }, [])

    if (!verse) return null

    const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

    return (
        <section className="py-16 px-4 bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                    <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase">
                        <Sparkles className="w-3.5 h-3.5" /> Verse of the day · {today}
                    </p>
                </div>
                <blockquote className="relative bg-white border border-[#f5bb00]/30 rounded-3xl shadow-xl px-6 py-10 sm:px-12 sm:py-14 text-center">
                    <span className="absolute top-2 left-6 text-[80px] leading-none font-black text-[#f5bb00]/15 select-none">"</span>
                    <p className="relative text-xl sm:text-2xl md:text-3xl font-medium text-[#140152] leading-snug" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
                        {verse.text}
                    </p>
                    <footer className="mt-6 text-[#f5bb00] font-black tracking-wider uppercase text-sm">
                        — {verse.reference}{verse.translation ? <span className="text-gray-400 font-bold ml-2">({verse.translation})</span> : null}
                    </footer>
                </blockquote>
            </div>
        </section>
    )
}

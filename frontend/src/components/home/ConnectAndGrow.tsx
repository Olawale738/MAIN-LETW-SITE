'use client'
import Link from 'next/link'
import { Sparkles, Users, MessageCircle, Brain, Globe2, Mic, Download, ArrowUpRight } from 'lucide-react'

interface Tile {
    href: string
    title: string
    blurb: string
    icon: React.ReactNode
    tint: string
}

const TILES: Tile[] = [
    {
        href: '/groups', title: 'Small Groups',
        blurb: 'Find your people. Search by city, day, audience — every group has a real leader you can meet.',
        icon: <Users className="w-5 h-5" />, tint: 'from-rose-500 to-orange-500',
    },
    {
        href: '/family', title: 'Member Directory',
        blurb: 'Connect with believers across the LETW family — gifts, languages, prayer partners, safe in-app messaging.',
        icon: <MessageCircle className="w-5 h-5" />, tint: 'from-emerald-500 to-cyan-500',
    },
    {
        href: '/grow', title: 'Grow — Verses & Habits',
        blurb: 'Memorise scripture with spaced repetition. Track prayer, fasting, scripture habits with streaks.',
        icon: <Brain className="w-5 h-5" />, tint: 'from-violet-500 to-fuchsia-500',
    },
    {
        href: '/tour', title: 'Virtual Church Tour',
        blurb: 'Walk through the campus before you visit — 8 cinematic stops from Welcome Plaza to Mission Hub.',
        icon: <Globe2 className="w-5 h-5" />, tint: 'from-amber-500 to-yellow-400',
    },
    {
        href: '/voice', title: 'Voice & Smart Speakers',
        blurb: 'Hear today\'s verse, a prayer, or a sermon snippet on Alexa, Google, Siri, or your browser.',
        icon: <Mic className="w-5 h-5" />, tint: 'from-blue-500 to-indigo-600',
    },
    {
        href: '/download', title: 'Free Resources',
        blurb: 'PDFs, e-books, sermon audio, music, devotionals — free for the journey.',
        icon: <Download className="w-5 h-5" />, tint: 'from-pink-500 to-rose-500',
    },
]

/**
 * Surface every new community + growth feature on the homepage so the public
 * can discover them without having to know the URL.
 */
export default function ConnectAndGrow() {
    return (
        <section className="relative bg-gradient-to-b from-white via-[#fbf5e6] to-white py-20 md:py-28 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-14">
                    <p className="text-[#f5bb00] font-bold tracking-[0.35em] text-[10px] uppercase mb-3 inline-flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" /> The Family Hub
                    </p>
                    <h2 className="font-serif text-4xl md:text-6xl font-black text-[#140152] leading-tight">
                        Take your <span className="bg-gradient-to-r from-[#f5bb00] via-amber-500 to-[#f5bb00] bg-clip-text text-transparent">next step</span>
                    </h2>
                    <p className="font-sans text-[#140152]/70 mt-4 max-w-2xl mx-auto leading-relaxed">
                        From spiritual growth to community connection — everything you need to walk this faith with people who'll walk it with you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {TILES.map(t => (
                        <Link key={t.href} href={t.href}
                            className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden">
                            {/* Top gradient stripe */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.tint}`} />

                            <div className="flex items-start gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.tint} text-white flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                    {t.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-[#140152] text-lg leading-tight flex items-start justify-between gap-2">
                                        <span>{t.title}</span>
                                        <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#140152] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 mt-0.5" />
                                    </h3>
                                    <p className="text-sm text-[#140152]/70 leading-relaxed mt-1.5">{t.blurb}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}

'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Users, BookOpen, Heart, Phone, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { cmsApi, type Block } from '@/lib/api'
import PageRenderer from '@/components/cms/PageRenderer'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

const STEPS = [
    { n: 1, title: 'Plan Your Visit', desc: "Attend a Sunday service — in person or online. We'll save you a seat.", href: '/services/sunday-service', icon: Calendar, color: 'from-[#140152] to-[#7c3aed]' },
    { n: 2, title: 'Connect with a Pastor', desc: "Book a 30-minute welcome call. We want to know your name, not just your face.", href: '/contact', icon: Phone, color: 'from-[#7c3aed] to-rose-500' },
    { n: 3, title: 'Discover What We Believe', desc: "Read our Statement of Faith. Know what you're stepping into.", href: '/about', icon: BookOpen, color: 'from-rose-500 to-[#f5bb00]' },
    { n: 4, title: 'Join a Small Group', desc: 'Faith grows in community. Find a midweek group near you.', href: '/bible-study', icon: Users, color: 'from-[#f5bb00] to-emerald-500' },
    { n: 5, title: 'Get Baptized & Serve', desc: 'Make your faith public, then put it to work. Join a ministry team.', href: '/life-events', icon: Heart, color: 'from-emerald-500 to-cyan-500' },
]

export default function OnboardingPage() {
    // Optional admin-loaded CMS template. If saved, renders INSTEAD of the
    // default 5-step flow below.
    const [cmsBlocks, setCmsBlocks] = useState<Block[] | null>(null)
    const [loaded, setLoaded] = useState(false)
    useEffect(() => {
        cmsApi.getPage('onboarding')
            .then(d => setCmsBlocks((d?.content?.blocks && d.content.blocks.length > 0) ? d.content.blocks : null))
            .catch(() => setCmsBlocks(null))
            .finally(() => setLoaded(true))
    }, [])

    if (!loaded) {
        return <div className="min-h-screen flex items-center justify-center bg-[#fbf5e6]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
    }

    if (cmsBlocks) {
        return (
            <>
                <PageCmsOverlay slug="onboarding" position="top" />
                <PageRenderer blocks={cmsBlocks} />
                <PageCmsOverlay slug="onboarding" position="bottom" />
            </>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <PageCmsOverlay slug="onboarding" position="top" />

            {/* Hero */}
            <section className="relative overflow-hidden py-24 px-4">
                <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-[#f5bb00]/15 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] rounded-full bg-[#140152]/10 blur-[120px] pointer-events-none" />
                <div className="relative max-w-3xl mx-auto text-center">
                    <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.4em] text-xs uppercase mb-4">
                        <Sparkles className="w-3.5 h-3.5" /> Welcome
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black text-[#140152] leading-[1.05] tracking-tight">
                        Welcome to the Family
                    </h1>
                    <p className="text-lg text-[#140152]/70 mt-5 max-w-xl mx-auto leading-relaxed">
                        Five short steps to make LETW your home. Start where you are, finish closer to Jesus.
                    </p>
                    <a href="#step-1" className="inline-flex items-center gap-2 mt-8 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-[#140152]/20">
                        Begin Step 1 <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </section>

            {/* Steps */}
            <section className="max-w-4xl mx-auto px-4 pb-20">
                <div className="space-y-6">
                    {STEPS.map(s => (
                        <div key={s.n} id={`step-${s.n}`} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow overflow-hidden">
                            <div className="grid sm:grid-cols-[120px_1fr] items-stretch">
                                <div className={`bg-gradient-to-br ${s.color} text-white flex flex-col items-center justify-center p-6 gap-2`}>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-70">Step</p>
                                    <p className="text-5xl font-black leading-none">{s.n}</p>
                                    <s.icon className="w-5 h-5 mt-1 opacity-70" />
                                </div>
                                <div className="p-6 sm:p-8 flex flex-col justify-center">
                                    <h2 className="text-2xl font-black text-[#140152]">{s.title}</h2>
                                    <p className="text-gray-600 mt-2 leading-relaxed">{s.desc}</p>
                                    <Link href={s.href} className="inline-flex items-center gap-1.5 mt-4 text-sm font-black text-[#140152] hover:gap-2.5 transition-all">
                                        Get started <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scripture */}
                <div className="text-center mt-16 max-w-2xl mx-auto">
                    <p className="text-xl md:text-2xl italic text-[#140152] leading-relaxed">
                        "Therefore, as you have received Christ Jesus the Lord, so walk in him, rooted and built up in him and established in the faith."
                    </p>
                    <p className="text-[#f5bb00] font-bold uppercase tracking-[0.3em] text-xs mt-4">Colossians 2:6-7</p>
                </div>

                {/* Final CTA */}
                <div className="mt-16 bg-gradient-to-br from-[#140152] via-[#1d0175] to-[#2d0b8e] text-white rounded-3xl p-10 text-center shadow-2xl">
                    <h2 className="text-3xl md:text-4xl font-black mb-3">Ready to make it official?</h2>
                    <p className="text-blue-200 max-w-lg mx-auto mb-6">Fill the membership form and a pastor will personally reach out within 48 hours.</p>
                    <Link href="/join" className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-8 py-4 rounded-full shadow-lg">
                        Become a Member <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            <PageCmsOverlay slug="onboarding" position="bottom" />
        </main>
    )
}

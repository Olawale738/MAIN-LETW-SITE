'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Mic2, Music2, Flame, Globe, Sparkles } from 'lucide-react'
import Link from 'next/link'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'
import { alterSoundApi, AlterSoundPageSettings } from '@/lib/api'

export default function SoundAltarPage() {
    const [settings, setSettings] = useState<AlterSoundPageSettings | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await alterSoundApi.getPageData()
                setSettings(data.settings)
            } catch (error) {
                console.error('Failed to load Alter Sound settings:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    // Default values if settings not loaded
    const ctaButtonLink = settings?.cta_button_link || '/join'

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Hero Section */}
            <div className="w-full">
                <img
                    src="/altersound.png"
                    alt="Alter Sound"
                    className="w-full h-auto block"
                />
            </div>

            <SectionWrapper>
                {/* Announcements */}
                <div className="mb-20">
                    <ServiceAnnouncements serviceName="Choir" />
                </div>

                {/* Core Identity */}
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                    <div className="space-y-8">
                        <div>
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Core Identity</span>
                            <h2 className="text-4xl font-black text-[#140152] mt-2">Not a Performance Choir</h2>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            We are not built on talent alone, nor driven by applause or stage presence. Alter Sound exists as a ministry of consecrated servants who offer sound as spiritual sacrifice, releasing heaven&apos;s atmosphere through surrendered voices and instruments.
                        </p>
                        <div className="space-y-6">
                            {[
                                { title: "Sound as Spiritual Offering", desc: "Every note is presented as worship unto the Lord." },
                                { title: "Worship as Ministry", desc: "We serve by creating space for divine encounter." },
                                { title: "Servants at the Altar", desc: "Our role is priestly—ministering to the Lord." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="w-12 h-12 bg-[#140152]/5 rounded-full flex items-center justify-center text-[#140152] flex-shrink-0">
                                        <Flame className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-[#140152]">{item.title}</h4>
                                        <p className="text-sm text-gray-600">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=2670" alt="Worship" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                </div>

                {/* Dimensions of Sound */}
                <div className="text-center mb-16">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Spiritual Depth</span>
                    <h2 className="text-4xl font-black text-[#140152] mt-2">Dimensions of Sound Ministry</h2>
                </div>

                <BentoGrid className="max-w-6xl mx-auto mb-24">
                    {[
                        {
                            title: "Worship Sound",
                            desc: "Hosts God's presence and leads into adoration.",
                            icon: Music2,
                            bg: "bg-blue-50",
                            bgImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Prophetic Sound",
                            desc: "Spirit-led melodies aligning with divine instruction.",
                            icon: Mic2,
                            bg: "bg-purple-50",
                            bgImage: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Healing Sound",
                            desc: "Anointed expressions for freedom and restoration.",
                            icon: Sparkles,
                            bg: "bg-green-50",
                            bgImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Missional Sound",
                            desc: "Songs crafted for nations and global contexts.",
                            icon: Globe,
                            bg: "bg-orange-50",
                            bgImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60"
                        },
                    ].map((dim, i) => (
                        <div key={i} className={`p-8 rounded-3xl border border-gray-100 hover:border-[#f5bb00] transition-all group shadow-lg overflow-hidden relative min-h-[280px] ${i === 0 || i === 3 ? "md:col-span-2" : "md:col-span-2 lg:col-span-1"}`}>
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url(${dim.bgImage})` }}
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#140152]/85 via-[#140152]/80 to-[#140152]/90" />

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-[#f5bb00]/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-[#f5bb00] transition-all">
                                    <dim.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#f5bb00] transition-colors">{dim.title}</h3>
                                <p className="text-gray-200 leading-relaxed font-medium text-sm">{dim.desc}</p>
                            </div>
                        </div>
                    ))}
                </BentoGrid>
            </SectionWrapper>

            <SectionWrapper background="gray">
                {/* Formation Journey & Operations */}
                <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl">
                        <h3 className="text-2xl font-bold mb-8 text-[#140152]">Sound Formation Journey</h3>
                        <div className="space-y-8 relative pl-4">
                            <div className="absolute left-[34px] top-4 bottom-8 w-[2px] bg-gray-100" />
                            {[
                                "Consecration (Heart alignment)",
                                "Vocal & Musical Formation",
                                "Spiritual Sensitivity",
                                "Corporate Sound Unity",
                                "Sound Release"
                            ].map((step, i) => (
                                <div key={i} className="flex gap-6 relative z-10 items-center">
                                    <div className="w-10 h-10 bg-[#140152] rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg ring-4 ring-white">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-[#140152]">{step}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-[#140152] text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-6">How We Operate</h3>
                                <p className="mb-6 opacity-80 text-lg">Every gathering is prayer-led and Spirit-directed.</p>
                                <ul className="space-y-4 font-medium">
                                    <li className="flex items-center gap-3"><div className="w-2 h-2 bg-[#f5bb00] rounded-full" />Formation rehearsals</li>
                                    <li className="flex items-center gap-3"><div className="w-2 h-2 bg-[#f5bb00] rounded-full" />Prayer-soaked sessions</li>
                                    <li className="flex items-center gap-3"><div className="w-2 h-2 bg-[#f5bb00] rounded-full" />Worship retreats</li>
                                    <li className="flex items-center gap-3"><div className="w-2 h-2 bg-[#f5bb00] rounded-full" />Ministry service</li>
                                </ul>
                            </div>

                        </div>

                        <div className="bg-[#140152] text-white p-10 rounded-[2.5rem] text-center shadow-xl" id="audio-library">
                            <h3 className="text-2xl font-black mb-4">Experience Worship Sound</h3>
                            <p className="mb-8 font-bold opacity-90">Listen to anointed worship and prophetic sound that carries heaven&apos;s presence</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/services/alter-sound/library" className="flex-1">
                                    <Button className="w-full bg-[#f5bb00] text-white hover:bg-[#140152]/90 py-6 rounded-xl font-bold shadow-lg">
                                        Browse Audio Library
                                    </Button>
                                </Link>
                                <Link href="/prayer" className="flex-1">
                                    <Button className="w-full bg-white text-[#140152] hover:bg-white/90 py-6 rounded-xl font-bold shadow-lg border-2 border-[#140152]">
                                        Prayer Ministry
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    )
}

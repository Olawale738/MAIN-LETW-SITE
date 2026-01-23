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
    const heroTitle = settings?.hero_title || "Raising Sound That|Carries Heaven's Intention"
    const heroSubtitle = settings?.hero_subtitle || "Alter Sound"
    const heroDescription = settings?.hero_description || "Not entertainment. A consecrated space where worship, prophetic sound, and spiritual alignment converge to release God's presence."
    const heroBackground = settings?.hero_background_url || "https://images.unsplash.com/photo-1525926477800-7a3be580c765?q=80&w=2670"
    const ctaText = settings?.cta_text || "For those called to serve God through sound."
    const ctaButtonText = settings?.cta_button_text || "Apply to Join"
    const ctaButtonLink = settings?.cta_button_link || "/join"
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Hero Section */}
            <div className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center bg-[#140152] pt-24">
                <img
                    src={heroBackground}
                    alt="Alter Sound"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 text-center text-white px-4 max-w-5xl mx-auto"
                >
                    <div className="text-[#f5bb00] font-bold tracking-widest uppercase mb-4 text-sm md:text-base">{heroSubtitle}</div>
                    <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight">
                        Raising Sound That<br /><span className="text-[#f5bb00]">Carries Heaven’s Intention</span>
                    </h1>
                    <p className="text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto font-light mb-8">
                        Not entertainment. A consecrated space where worship, prophetic sound, and spiritual alignment converge to release God’s presence.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <PremiumButton href="#audio-library" className="bg-[#f5bb00] text-[#140152] hover:bg-white">
                            Explore Audio Library
                        </PremiumButton>
                        <PremiumButton href="/prayer" className="bg-white/10 text-white hover:bg-white hover:text-[#140152] border-2 border-white/30">
                            Join Prayer
                        </PremiumButton>
                    </div>
                </motion.div>
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
                            We are not built on talent alone, nor driven by applause or stage presence. Alter Sound exists as a ministry of consecrated servants who offer sound as spiritual sacrifice, releasing heaven’s atmosphere through surrendered voices and instruments.
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
                        { title: "Worship Sound", desc: "Hosts God’s presence and leads into adoration.", icon: Music2, bg: "bg-blue-50" },
                        { title: "Prophetic Sound", desc: "Spirit-led melodies aligning with divine instruction.", icon: Mic2, bg: "bg-purple-50" },
                        { title: "Healing Sound", desc: "Anointed expressions for freedom and restoration.", icon: Sparkles, bg: "bg-green-50" },
                        { title: "Missional Sound", desc: "Songs crafted for nations and global contexts.", icon: Globe, bg: "bg-orange-50" },
                    ].map((dim, i) => (
                        <div key={i} className={`p-8 rounded-3xl border border-gray-100 hover:border-[#f5bb00] transition-all group bg-white shadow-lg ${i === 0 || i === 3 ? "md:col-span-2" : "md:col-span-2 lg:col-span-1"}`}>
                            <div className={`w-14 h-14 ${dim.bg} rounded-2xl flex items-center justify-center text-[#140152] mb-6 group-hover:scale-110 transition-transform`}>
                                <dim.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-[#140152] mb-3">{dim.title}</h3>
                            <p className="text-gray-600 leading-relaxed font-medium text-sm">{dim.desc}</p>
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

                        <div className="bg-[#f5bb00] text-[#140152] p-10 rounded-[2.5rem] text-center shadow-xl" id="audio-library">
                            <h3 className="text-2xl font-black mb-4">Experience Worship Sound</h3>
                            <p className="mb-8 font-bold opacity-90">Listen to anointed worship and prophetic sound that carries heaven's presence</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/services/alter-sound/library" className="flex-1">
                                    <Button className="w-full bg-[#140152] text-white hover:bg-[#140152]/90 py-6 rounded-xl font-bold shadow-lg">
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

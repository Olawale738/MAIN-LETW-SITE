'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Mic2, Music2, Flame, Globe, Sparkles } from 'lucide-react'
import Link from 'next/link'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'

export default function SoundAltarPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <div className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1525926477800-7a3be580c765?q=80&w=2670')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-4 max-w-5xl"
                >
                    <div className="inline-block px-4 py-1 border border-[#f5bb00] text-[#f5bb00] rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-6">
                        The Sound Altar
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight leading-none">
                        Raising Sound That<br />Carries <span className="text-[#f5bb00]">Heaven’s Intention</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 font-light">
                        Not entertainment. A consecrated space where worship, prophetic sound, and spiritual alignment converge to release God’s presence.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button size="lg" className="bg-[#f5bb00] text-black hover:bg-white font-bold py-6 px-8 rounded-full text-lg">
                            Enter the Sound Altar
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black font-bold py-6 px-8 rounded-full text-lg">
                            Join the Ministry
                        </Button>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-24">
                {/* Announcements */}
                <div className="mb-12">
                    <ServiceAnnouncements serviceName="Choir" />
                </div>

                {/* Core Identity */}
                <section className="mb-24">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-black mb-4"><span className="text-[#f5bb00]">Core Identity</span><br />Not a Performance Choir</h2>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                We are not built on talent alone, nor driven by applause or stage presence. The Sound Altar exists as a ministry of consecrated servants who offer sound as spiritual sacrifice, releasing heaven’s atmosphere through surrendered voices and instruments.
                            </p>
                            <ul className="space-y-4 pt-4">
                                {[
                                    { title: "Sound as Spiritual Offering", desc: "Every note is presented as worship unto the Lord." },
                                    { title: "Worship as Ministry", desc: "We serve by creating space for divine encounter." },
                                    { title: "Servants at the Altar", desc: "Our role is priestly—ministering to the Lord." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center text-[#f5bb00] flex-shrink-0">
                                            <Flame className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{item.title}</h4>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative h-[600px] rounded-[2rem] overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=2670" alt="Worship" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>
                    </div>
                </section>

                {/* Dimensions of Sound */}
                <section className="mb-24">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">Dimensions of Sound Ministry</h2>
                        <p className="text-gray-400">The Sound Altar operates in multiple spiritual dimensions.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: "Worship Sound", desc: "Hosts God’s presence and leads into adoration.", icon: Music2, color: "bg-blue-500" },
                            { title: "Prophetic Sound", desc: "Spirit-led melodies aligning with divine instruction.", icon: Mic2, color: "bg-purple-500" },
                            { title: "Healing Sound", desc: "Anointed expressions for freedom and restoration.", icon: Sparkles, color: "bg-green-500" },
                            { title: "Missional Sound", desc: "Songs crafted for nations and global contexts.", icon: Globe, color: "bg-orange-500" },
                        ].map((dim, i) => (
                            <div key={i} className="bg-[#111] p-8 rounded-2xl border border-[#222] hover:border-[#f5bb00] transition-all group">
                                <div className={`w-12 h-12 ${dim.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                                    <dim.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{dim.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{dim.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Formation Journey & Operations */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-[#111] p-10 rounded-[2.5rem] border border-[#222]">
                        <h3 className="text-2xl font-bold mb-8 text-[#f5bb00]">Sound Formation Journey</h3>
                        <div className="space-y-6 relative">
                            <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-[#333]" />
                            {[
                                "Consecration (Heart alignment)",
                                "Vocal & Musical Formation",
                                "Spiritual Sensitivity",
                                "Corporate Sound Unity",
                                "Sound Release"
                            ].map((step, i) => (
                                <div key={i} className="flex gap-6 relative z-10">
                                    <div className="w-14 h-14 bg-[#222] rounded-full border border-[#f5bb00]/30 text-[#f5bb00] flex items-center justify-center font-bold text-lg flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="py-3">
                                        <h4 className="font-bold text-lg">{step}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white text-black p-10 rounded-[2.5rem]">
                            <h3 className="text-2xl font-bold mb-6">How We Operate</h3>
                            <p className="mb-6 opacity-80">Every gathering is prayer-led and Spirit-directed.</p>
                            <ul className="space-y-3 font-medium">
                                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-black rounded-full" />Formation rehearsals</li>
                                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-black rounded-full" />Prayer-soaked sessions</li>
                                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-black rounded-full" />Worship retreats</li>
                                <li className="flex items-center gap-3"><div className="w-2 h-2 bg-black rounded-full" />Ministry service</li>
                            </ul>
                        </div>

                        <div className="bg-[#f5bb00] text-black p-10 rounded-[2.5rem] text-center">
                            <h3 className="text-2xl font-black mb-4">Join The Ministry</h3>
                            <p className="mb-6 font-medium opacity-90">For those called to serve God through sound.</p>
                            <Button className="w-full bg-black text-white hover:bg-black/80 py-6 rounded-xl font-bold">
                                Apply to Join
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

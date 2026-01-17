'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, BookOpen, Scroll, Users, Globe, Award } from 'lucide-react'
import Link from 'next/link'

export default function TheologySchoolPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero Section – School of Theology & Ministry Formation */}
            <div className="relative h-[80vh] md:h-[60vh] w-full overflow-hidden flex items-center justify-center bg-[#2c1a0f] pt-24">
                <img
                    src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2574&auto=format&fit=crop"
                    alt="Theology School"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f08] via-transparent to-black/30" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto"
                >
                    <div className="text-[#f5bb00] font-bold tracking-widest uppercase mb-4 text-sm md:text-base">School of Theology</div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">Ministry Formation</h1>
                    <p className="text-lg md:text-2xl text-orange-100 max-w-2xl mx-auto font-medium mb-8">
                        Training Sound Minds. Forming Faithful Ministers. Shaping Kingdom Leaders.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <PremiumButton className="bg-[#f5bb00] text-[#140152] hover:bg-white hover:text-[#140152] font-bold">Apply for Theology School</PremiumButton>
                        <PremiumButton className="border-white text-white hover:bg-white hover:text-[#140152] border bg-transparent">View Programme Structure</PremiumButton>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-20">
                <Link href="/education" className="inline-flex items-center text-amber-700 mb-12 hover:underline font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Education Overview
                </Link>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-16">

                    {/* Left Content */}
                    <div className="lg:col-span-2 space-y-16">

                        {/* Why the School of Theology Exists */}
                        <section>
                            <div className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm mb-4">Our Purpose</div>
                            <h2 className="text-4xl font-black text-[#140152] mb-6">Why the School of Theology Exists</h2>
                            <p className="text-lg text-gray-700 leading-relaxed mb-8">
                                The School of Theology provides structured theological education that equips believers with biblical understanding, doctrinal clarity, and ministry competence for service in church, community, and the nations.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    "To Teach Sound Doctrine",
                                    "To Raise Biblically Grounded Ministers",
                                    "To Combine Theology with Spiritual Formation",
                                    "To Prepare Students for Global Service"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                        <div className="w-2 h-2 rounded-full bg-[#f5bb00]" />
                                        <span className="font-bold text-[#140152]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Programme Structure */}
                        <section>
                            <h3 className="text-3xl font-bold text-[#140152] mb-8">Programme Structure</h3>
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-[#f5bb00]">
                                    <h4 className="text-xl font-black text-[#140152]">Certificate in Theology – Level 1</h4>
                                    <p className="text-gray-600 mt-2">Foundational biblical and doctrinal studies for believers seeking theological grounding.</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-[#140152]">
                                    <h4 className="text-xl font-black text-[#140152]">Diploma in Theology & Ministry – Level 2</h4>
                                    <p className="text-gray-600 mt-2">Deeper theology, practical ministry skills, and leadership development.</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-red-600">
                                    <h4 className="text-xl font-black text-[#140152]">Advanced Ministerial Training – Level 3</h4>
                                    <p className="text-gray-600 mt-2">Intensive formation for teaching, pastoral care, and apostolic leadership.</p>
                                </div>
                            </div>
                        </section>

                        {/* Core Areas of Study */}
                        <section>
                            <h3 className="text-3xl font-bold text-[#140152] mb-8">Core Areas of Study</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                {[
                                    { title: "Biblical Studies", desc: "Old & New Testament Exegesis" },
                                    { title: "Systematic Theology", desc: "Doctrine of God, Christ, Salvation" },
                                    { title: "Christian Doctrine", desc: "Historical & Contemporary Beliefs" },
                                    { title: "Ministry & Leadership", desc: "Pastoral Care, Preaching, Administration" },
                                    { title: "Ethics & Living", desc: "Moral Theology and Discipleship" },
                                    { title: "Practical Ministry", desc: "Spiritual Disciplines & Service" }
                                ].map((area, i) => (
                                    <div key={i} className="p-5 bg-orange-50 rounded-xl">
                                        <h4 className="font-bold text-[#140152] mb-1">{area.title}</h4>
                                        <p className="text-sm text-gray-700">{area.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        {/* Apply Section */}
                        <div className="bg-[#140152] text-white p-8 rounded-[2rem] shadow-xl">
                            <h3 className="text-2xl font-bold mb-4">Ready to Begin?</h3>
                            <p className="text-blue-200 mb-6 leading-relaxed">
                                Join a structured programme that forms sound ministers and kingdom leaders.
                            </p>
                            <PremiumButton className="bg-[#f5bb00] text-[#140152] hover:bg-white hover:text-[#140152] font-bold rounded-xl py-6">
                                Apply Now
                            </PremiumButton>
                        </div>

                        {/* Study Options */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold text-[#140152] mb-6">Study Options</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Globe className="w-5 h-5 text-blue-600" />
                                        <h4 className="font-bold">Online Study</h4>
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                                        <li>Live online classes</li>
                                        <li>Access from anywhere</li>
                                        <li>Recorded sessions</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-5 h-5 text-green-600" />
                                        <h4 className="font-bold">Onsite Study</h4>
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                                        <li>Physical classroom sessions</li>
                                        <li>In-person lectures & mentorship</li>
                                        <li>Community formation</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Who This Is For */}
                        <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200">
                            <h3 className="text-xl font-bold text-[#140152] mb-4">Who Is This For?</h3>
                            <ul className="space-y-3">
                                {[
                                    "Believers seeking grounding",
                                    "Ministry workers and leaders",
                                    "Aspiring pastors & teachers",
                                    "Missionaries & students"
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                                        <Award className="w-4 h-4 text-[#f5bb00] flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SectionWrapper from '@/components/shared/SectionWrapper'
import Hero from '@/components/shared/Hero'
import { BookOpen, Cross, Flame, Heart, Sun } from 'lucide-react'

export default function BibleStudyPage() {
    const themes = [
        {
            id: 1,
            title: "The Cost of Discipleship",
            scripture: "Luke 14:27–35",
            description: "A call to wholehearted commitment—embracing sacrifice, obedience, and unwavering devotion to Christ, regardless of the cost.",
            icon: <Cross className="w-8 h-8 text-[#f5bb00]" />
        },
        {
            id: 2,
            title: "Experiencing Transformative Power Through Fruitfulness",
            scripture: "John 15:16",
            description: "Understanding divine selection and purpose, and walking in a life that produces lasting spiritual fruit through abiding in Christ.",
            icon: <Heart className="w-8 h-8 text-[#f5bb00]" />
        },
        {
            id: 3,
            title: "The Sustaining Power of the Holy Spirit",
            scripture: "Acts 1:8; Hebrews 12:22–24",
            description: "Living daily by the enabling strength of the Holy Spirit—empowered for witness, endurance, and victorious Christian living.",
            icon: <Flame className="w-8 h-8 text-[#f5bb00]" />
        },
        {
            id: 4,
            title: "Enter into His Rest Through Faith",
            scripture: "Hebrews 11:24–26",
            description: "Choosing faith over fear and eternal reward over temporary pleasure, as believers rest in God’s promises and purposes.",
            icon: <Sun className="w-8 h-8 text-[#f5bb00]" />
        }
    ]

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <Hero
                title="Bible Study"
                subtitle="Deepening our knowledge of God's Word together."
                height="medium"
            />

            <SectionWrapper>
                <div className="text-center mb-16 space-y-4">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">2026 Curriculum</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Quarterly Themes</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                    <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mt-4">
                        This year, we embark on a journey of deeper discipleship, spiritual empowerment, and fruitful living.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {themes.map((theme) => (
                        <motion.div
                            key={theme.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: theme.id * 0.1 }}
                        >
                            <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
                                <CardHeader className="space-y-4">
                                    <div className="w-14 h-14 bg-[#140152]/5 rounded-xl flex items-center justify-center group-hover:bg-[#140152] transition-colors duration-300">
                                        {theme.icon}
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-[#f5bb00] uppercase tracking-wider">Quarter {theme.id}</span>
                                        <CardTitle className="text-2xl font-bold text-[#140152] mt-2 group-hover:text-[#f5bb00] transition-colors">
                                            {theme.title}
                                        </CardTitle>
                                        <p className="text-sm font-semibold text-gray-500 mt-1">{theme.scripture}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 leading-relaxed">
                                        {theme.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-[#140152] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <BookOpen className="w-full h-full text-white" />
                    </div>
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-[#f5bb00]">Closing Theme Statement</h3>
                        <p className="text-lg md:text-xl leading-relaxed text-gray-200">
                            "The 2026 Quarterly Themes call believers into deeper discipleship, Spirit-empowered living, fruitful purpose, and a faith that enters into God’s promised rest."
                        </p>
                    </div>
                </motion.div>
            </SectionWrapper>
        </div>
    )
}

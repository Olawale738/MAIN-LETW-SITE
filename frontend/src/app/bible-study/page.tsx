'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SectionWrapper from '@/components/shared/SectionWrapper'
import Hero from '@/components/shared/Hero'
import { BookOpen, Cross, Flame, Heart, Sun, Users, Calendar, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function BibleStudyPage() {
    const themes = [
        {
            id: 1,
            title: "The Cost of Discipleship",
            scripture: "Luke 14:27–35",
            description: "A call to wholehearted commitment—embracing sacrifice, obedience, and unwavering devotion to Christ, regardless of the cost.",
            icon: <Cross className="w-8 h-8 text-white" />,
            bgImage: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=60"
        },
        {
            id: 2,
            title: "Experiencing Transformative Power Through Fruitfulness",
            scripture: "John 15:16",
            description: "Understanding divine selection and purpose, and walking in a life that produces lasting spiritual fruit through abiding in Christ.",
            icon: <Heart className="w-8 h-8 text-white" />,
            bgImage: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=60"
        },
        {
            id: 3,
            title: "The Sustaining Power of the Holy Spirit",
            scripture: "Acts 1:8; Hebrews 12:22–24",
            description: "Living daily by the enabling strength of the Holy Spirit—empowered for witness, endurance, and victorious Christian living.",
            icon: <Flame className="w-8 h-8 text-white" />,
            bgImage: "https://images.unsplash.com/photo-1501952476817-d7ae22e3f2d2?w=800&auto=format&fit=crop&q=60"
        },
        {
            id: 4,
            title: "Enter into His Rest Through Faith",
            scripture: "Hebrews 11:24–26",
            description: "Choosing faith over fear and eternal reward over temporary pleasure, as believers rest in God's promises and purposes.",
            icon: <Sun className="w-8 h-8 text-white" />,
            bgImage: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=60"
        }
    ]

    const benefits = [
        {
            icon: <Users className="w-6 h-6 text-[#f5bb00]" />,
            title: "Community Learning",
            description: "Study alongside fellow believers in a supportive environment"
        },
        {
            icon: <Calendar className="w-6 h-6 text-[#f5bb00]" />,
            title: "Structured Curriculum",
            description: "Follow our carefully designed quarterly themes throughout the year"
        },
        {
            icon: <MessageCircle className="w-6 h-6 text-[#f5bb00]" />,
            title: "Interactive Discussions",
            description: "Engage in meaningful conversations and share insights"
        },
        {
            icon: <BookOpen className="w-6 h-6 text-[#f5bb00]" />,
            title: "Deep Bible Study",
            description: "Dive deeper into Scripture with expert guidance and resources"
        }
    ]

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <Hero
                title="Bible Study"
                subtitle="Deepening our knowledge of God's Word together."
                height="medium"
                backgroundImage="https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?w=1200&auto=format&fit=crop&q=60"
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
                            <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
                                {/* Background Image */}
                                <div 
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundImage: `url(${theme.bgImage})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-[#140152]/90 via-[#140152]/85 to-[#140152]/95" />
                                
                                {/* Content */}
                                <CardHeader className="space-y-4 relative z-10">
                                    <div className="w-14 h-14 bg-[#f5bb00]/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-[#f5bb00] transition-colors duration-300">
                                        {theme.icon}
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-[#f5bb00] uppercase tracking-wider">Quarter {theme.id}</span>
                                        <CardTitle className="text-2xl font-bold text-white mt-2 group-hover:text-[#f5bb00] transition-colors">
                                            {theme.title}
                                        </CardTitle>
                                        <p className="text-sm font-semibold text-gray-300 mt-1">{theme.scripture}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <p className="text-gray-200 leading-relaxed">
                                        {theme.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Why Join Our Bible Study Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 bg-white dark:bg-neutral-800 rounded-3xl p-8 md:p-12 shadow-lg"
                >
                    <div className="text-center mb-12">
                        <h3 className="text-3xl md:text-4xl font-black text-[#140152] dark:text-white mb-4">
                            Why Join Our Bible Study?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Experience transformative growth through our comprehensive Bible study program
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-700 hover:bg-[#140152]/5 dark:hover:bg-[#140152]/20 transition-colors"
                            >
                                <div className="w-12 h-12 bg-[#f5bb00]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    {benefit.icon}
                                </div>
                                <h4 className="font-bold text-[#140152] dark:text-white mb-2">{benefit.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* How It Works Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="text-center mb-12">
                        <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Simple Process</span>
                        <h3 className="text-3xl md:text-4xl font-black text-[#140152] dark:text-white mt-2">
                            How It Works
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Register", description: "Create your account and join our Bible study community" },
                            { step: "02", title: "Access Resources", description: "Get instant access to study materials, guides, and recordings" },
                            { step: "03", title: "Grow Together", description: "Participate in live sessions and connect with fellow believers" }
                        ].map((item, index) => (
                            <div key={index} className="relative">
                                <div className="text-[#f5bb00]/20 font-black text-7xl mb-4">{item.step}</div>
                                <h4 className="text-xl font-bold text-[#140152] dark:text-white mb-2">{item.title}</h4>
                                <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-[#140152] to-[#1a0670] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden mb-16"
                >
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <BookOpen className="w-full h-full text-white" />
                    </div>
                    <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#f5bb00]">Ready to Begin Your Journey?</h3>
                            <p className="text-lg md:text-xl leading-relaxed text-gray-200 mb-6">
                                Join our Bible study community today and experience transformative growth in your faith journey.
                            </p>
                        </div>
                        
                        <Link href="/auth/login">
                            <Button 
                                size="lg" 
                                className="bg-[#f5bb00] hover:bg-[#f5bb00]/90 text-[#140152] font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
                            >
                                Get Started Now
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-4 h-4 text-[#f5bb00]" />
                            <span>Free to join • Instant access • Community support</span>
                        </div>
                    </div>
                </motion.div>

                {/* Closing Theme Statement */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-neutral-100 dark:bg-neutral-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
                >
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-[#f5bb00]">Closing Theme Statement</h3>
                        <p className="text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-200">
                            "The 2026 Quarterly Themes call believers into deeper discipleship, Spirit-empowered living, fruitful purpose, and a faith that enters into God's promised rest."
                        </p>
                    </div>
                </motion.div>
            </SectionWrapper>
        </div>
    )
}

'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Hammer, Monitor, Clock, Users } from 'lucide-react'

export default function SkillDevelopmentPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero */}
            <div className="relative h-[60vh] bg-neutral-900 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-900/50 to-black/50 z-10" />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 text-center text-white px-4 max-w-4xl"
                >
                    <h1 className="text-5xl md:text-7xl font-black mb-6">Skill Development &<br />Capacity Building</h1>
                    <p className="text-xl md:text-2xl text-orange-100 mb-8">
                        Practical skills for real-world impact. Grow in competence and confidence.
                    </p>
                    <Link href="/auth/register?redirect=/skill-development/dashboard">
                        <Button size="lg" className="bg-[#f5bb00] text-[#140152] hover:bg-[#f5bb00]/90 font-bold px-8 py-6 text-lg rounded-full">
                            Start Learning
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Skills Areas */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-[#140152] mb-4">What You Will Learn</h2>
                    <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                        Equipping individuals with practical, transferable skills through structured training and guided practice.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { title: "Practical Skills", icon: Hammer, desc: "Hands-on training for everyday effectiveness." },
                        { title: "Digital Skills", icon: Monitor, desc: "Technology and digital literacy for the modern world." },
                        { title: "Productivity", icon: Clock, desc: "Time management and personal organization." },
                        { title: "Communication", icon: Users, desc: "Public speaking and interpersonal skills." }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center"
                        >
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                                <item.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-[#140152]">{item.title}</h3>
                            <p className="text-gray-600">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}

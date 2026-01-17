'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Compass, Users, BookOpen, Target } from 'lucide-react'

export default function CareerGuidancePage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero */}
            <div className="relative h-[60vh] bg-[#140152] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20 z-10" />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 text-center text-white px-4 max-w-4xl"
                >
                    <h1 className="text-5xl md:text-7xl font-black mb-6">Career Guidance &<br />Mentorship</h1>
                    <p className="text-xl md:text-2xl text-blue-200 mb-8">
                        Discover your direction. Build confidence. Lead with integrity.
                    </p>
                    <Link href="/auth/register?redirect=/career-guidance/dashboard">
                        <Button size="lg" className="bg-[#f5bb00] text-[#140152] hover:bg-[#f5bb00]/90 font-bold px-8 py-6 text-lg rounded-full">
                            Join Programme
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Purpose */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-[#140152] mb-4">Why This Matters</h2>
                    <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                        Career guidance exists to help young people discover direction, build confidence, and make wise career decisions. This programme combines mentorship, practical tools, and values-based guidance to support professional growth.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { title: "Career Discovery", icon: Compass, desc: "Find the path God has designed for you." },
                        { title: "Mentorship", icon: Users, desc: "Learn from experienced professionals." },
                        { title: "Skill Building", icon: BookOpen, desc: "Practical resources for the workplace." },
                        { title: "Goal Setting", icon: Target, desc: "Clear steps to reach your potential." }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                        >
                            <item.icon className="w-10 h-10 text-[#f5bb00] mb-4" />
                            <h3 className="text-xl font-bold mb-2 text-[#140152]">{item.title}</h3>
                            <p className="text-gray-600">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Join Section */}
            <section className="bg-[#140152] py-20 px-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">Start Your Journey Today</h2>
                <p className="text-blue-200 mb-8 max-w-xl mx-auto">
                    Register to receive programme access, mentorship schedules, and exclusive career resources.
                </p>
                <Link href="/auth/register?redirect=/career-guidance/dashboard">
                    <Button size="lg" className="bg-white text-[#140152] hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-full">
                        Join Career Guidance
                    </Button>
                </Link>
            </section>
        </div>
    )
}

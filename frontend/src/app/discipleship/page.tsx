'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { BookOpen, Users, TrendingUp, ArrowRight, Heart } from 'lucide-react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent } from '@/components/ui/card'

export default function DiscipleshipPage() {
    return (
        <>
            {/* Spotlight Hero Section */}
            <div 
                className="relative bg-[#140152] pt-32 pb-24 px-4 md:px-12 overflow-hidden min-h-screen flex flex-col justify-center bg-cover bg-center" 
                style={{ backgroundImage: 'url("/Discipleship.png")' }}
            >
                <div className="absolute inset-0 bg-[#140152]/60 pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-7xl mx-auto relative z-10 text-center"
                >
                    <span className="text-[#f5bb00] font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-4 block">Walk with Christ</span>
                    <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 tracking-tight">
                        Follow. Learn. Lead.
                    </h1>
                    <p className="text-blue-200 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        The journey of a disciple is a lifelong pursuit of knowing Jesus and making Him known.
                    </p>
                </motion.div>
            </div>

            <SectionWrapper>
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] mb-6">What is Discipleship?</h2>
                        <div className="w-24 h-1.5 bg-[#f5bb00] rounded-full mb-8" />
                        <p className="text-lg text-gray-700 leading-relaxed mb-6">
                            Discipleship is more than just learning facts about the Bible; it's about life transformation. It is the process of becoming more like Christ in character, conduct, and calling.
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            At Light Encounter Tabernacle, we believe every believer is called to be a disciple and a disciple-maker. Our pathway is designed to help you grow from a new believer to a mature spiritual leader.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <Card className="bg-[#140152] text-white border-none shadow-xl transform translate-y-8">
                            <CardContent className="p-8 text-center">
                                <BookOpen className="w-12 h-12 text-[#f5bb00] mx-auto mb-4" />
                                <h3 className="font-bold text-xl mb-2">Word</h3>
                                <p className="text-sm text-blue-200">Grounded in Scripture</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white text-[#140152] border-none shadow-xl">
                            <CardContent className="p-8 text-center">
                                <Users className="w-12 h-12 text-[#f5bb00] mx-auto mb-4" />
                                <h3 className="font-bold text-xl mb-2">Community</h3>
                                <p className="text-sm text-gray-500">Living life together</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white text-[#140152] border-none shadow-xl transform translate-y-8">
                            <CardContent className="p-8 text-center">
                                <Heart className="w-12 h-12 text-[#f5bb00] mx-auto mb-4" />
                                <h3 className="font-bold text-xl mb-2">Service</h3>
                                <p className="text-sm text-gray-500">Love in action</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#f5bb00] text-[#140152] border-none shadow-xl">
                            <CardContent className="p-8 text-center">
                                <TrendingUp className="w-12 h-12 text-[#140152] mx-auto mb-4" />
                                <h3 className="font-bold text-xl mb-2">Growth</h3>
                                <p className="text-sm text-[#140152]/80">Continuous progress</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper background="gray">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-[#140152] mb-6">The Discipleship Pathway</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">A clear path for your spiritual journey, meeting you where you are and helping you take the next step.</p>
                    </div>

                    <div className="space-y-8">
                        {[
                            { title: "Foundation (New Believers)", desc: "Understanding salvation, baptism, and the basic habits of a Christian.", color: "border-l-4 border-green-500" },
                            { title: "Formation (Growing)", desc: "Deepening your prayer life, bible study skills, and discovering your spiritual gifts.", color: "border-l-4 border-blue-500" },
                            { title: "Ministry (Serving)", desc: "Finding your place in the body of Christ and serving with excellence.", color: "border-l-4 border-purple-500" },
                            { title: "Leadership (Multiplying)", desc: "Mentoring others and leading small groups or ministries.", color: "border-l-4 border-orange-500" }
                        ].map((step, i) => (
                            <div key={i} className={`bg-white p-8 rounded-2xl shadow-md flex flex-col md:flex-row items-center gap-6 ${step.color}`}>
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center font-black text-2xl text-gray-300">
                                    {i + 1}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-bold text-[#140152] mb-2">{step.title}</h3>
                                    <p className="text-gray-600 font-medium">{step.desc}</p>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper>
                <div className="rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5bb00] rounded-full blur-[100px] opacity-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20" />

                    <h2 className="text-4xl md:text-6xl font-black text-black mb-8 relative z-10">Ready to Grow?</h2>
                    <p className="text-xl text-black mb-12 max-w-2xl mx-auto relative z-10">
                        Sign up for our next 'Foundations' class. Your journey starts today.
                    </p>
                    <div className="relative z-10 flex flex-col md:flex-row gap-4 justify-center">
                        <PremiumButton href="/auth/login" className="bg-[#f5bb00] text-[#140152] hover:bg-white hover:text-[#140152]">
                            Join Now
                        </PremiumButton>

                    </div>
                </div>
            </SectionWrapper>
        </>
    )
}

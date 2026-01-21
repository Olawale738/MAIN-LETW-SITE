'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, BookOpen, Heart, Shield, Star, Users, Music, Smile } from 'lucide-react'
import Link from 'next/link'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function SundaySchoolPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero */}
            <div className="relative h-[80vh] md:h-[60vh] w-full overflow-hidden flex items-center justify-center bg-[#140152] pt-24">
                <img
                    src="https://images.unsplash.com/photo-1502781252888-9143ba7f32ee?q=80&w=2670"
                    alt="Sunday School"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140152] via-transparent to-black/30" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto"
                >
                    <div className="text-[#f5bb00] font-bold tracking-widest uppercase mb-4 text-sm md:text-base">raising Kingdom Giants</div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">Children's<br /><span className="text-[#f5bb00]">Church</span></h1>
                    <p className="text-lg md:text-2xl text-white/80 max-w-2xl mx-auto font-medium">Where faith is fun, God is real, and every child is loved.</p>
                </motion.div>
            </div>

            <SectionWrapper>
                <div className="max-w-7xl mx-auto">
                    {/* Intro */}
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <h2 className="text-4xl font-black text-[#140152] mb-6">Growing in God's Love</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Our Sunday School is a vibrant, safe, and exciting place where children encounter Jesus on their level. Through engaging Bible stories, worship, and interactive lessons, we are planting seeds of faith that will last a lifetime.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                        {[
                            { title: "Fun Bible Lessons", desc: "Interactive teaching that makes the Word come alive.", icon: BookOpen },
                            { title: "Kids Worship", desc: "High-energy praise and intimate worship for little hearts.", icon: Music },
                            { title: "Safe & Secure", desc: "Check-in systems and vetted volunteers for your peace of mind.", icon: Shield },
                            { title: "Faith Friends", desc: "Building godly friendships in a loving community.", icon: Users },
                        ].map((item, i) => (
                            <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                <CardHeader>
                                    <div className="w-14 h-14 bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center text-[#f5bb00] mb-4">
                                        <item.icon className="w-7 h-7" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-[#140152]">{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 font-medium">{item.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Age Groups */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                        <div className="space-y-8">
                            <div>
                                <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Classes</span>
                                <h2 className="text-4xl font-black text-[#140152] mt-2 mb-6">Designed for Every Age</h2>
                                <p className="text-gray-600 text-lg">We have age-appropriate environments tailored to meet the developmental and spiritual needs of your child.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { name: "Nursery / Toddlers", age: "0 - 3 Years", desc: "A loving environment where babies are cared for and toddlers learn that God made them." },
                                    { name: "Preschool", age: "4 - 5 Years", desc: "Discovering Jesus through play, stories, and crafts." },
                                    { name: "Elementary", age: "6 - 12 Years", desc: "Deeper Bible study, small groups, and practical life application." },
                                ].map((group, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:border-[#f5bb00]/30 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-[#140152] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#140152] text-lg">{group.name} <span className="text-sm font-normal text-gray-500 ml-2">({group.age})</span></h4>
                                            <p className="text-gray-600 text-sm mt-1">{group.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?q=80&w=2669"
                                alt="Kids Worship"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#140152]/80 to-transparent flex flex-col justify-end p-10 text-white">
                                <h3 className="text-3xl font-bold mb-2">"Let the children come to me..."</h3>
                                <p className="font-medium opacity-90">- Matthew 19:14</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-[#f5bb00] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mb-6">Plan Your Visit</h2>
                            <p className="text-xl text-[#140152]/80 font-medium max-w-2xl mx-auto mb-10">
                                We can't wait to meet your family! Register your children in advance for a quick and easy check-in experience.
                            </p>
                            <PremiumButton href="/contact" className="bg-[#140152] text-white hover:bg-white hover:text-[#140152]">
                                Pre-Register Kids
                            </PremiumButton>
                        </div>
                        <Smile className="absolute -left-10 -bottom-10 w-64 h-64 text-white/20 rotate-12" />
                        <Star className="absolute -right-10 -top-10 w-64 h-64 text-white/20 -rotate-12" />
                    </div>

                </div>
            </SectionWrapper>
        </div>
    )
}

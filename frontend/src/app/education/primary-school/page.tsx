'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, BookOpen, Heart, Shield, Star, Users } from 'lucide-react'
import Link from 'next/link'

export default function PrimarySchoolPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero */}
            <div className="w-full">
                <img
                    src="/primary.png"
                    alt="Primary School"
                    className="w-full h-auto block"
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 py-20">

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-16">

                    {/* Left Content */}
                    <div className="lg:col-span-2 space-y-16">

                        {/* Intro */}
                        <section>
                            <h2 className="text-4xl font-black text-[#140152] mb-6">Building Strong Foundations for Lifelong Learning</h2>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Our Primary School is dedicated to nurturing young minds through quality education, strong moral values, and a supportive learning environment that prepares children for academic excellence and responsible citizenship.
                            </p>
                        </section>

                        {/* Educational Philosophy */}
                        <section className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-orange-50/50">
                            <h3 className="text-3xl font-bold text-[#140152] mb-6">Our Educational Philosophy</h3>
                            <p className="text-gray-700 leading-relaxed mb-8">
                                At the heart of our Primary School is a commitment to holistic development that integrates academic rigor with moral and character education. We believe in creating a nurturing space where children can grow intellectually, emotionally, and spiritually, fostering a love for learning that lasts a lifetime.
                            </p>

                            <div className="grid md:grid-cols-2 gap-8">
                                {[
                                    { title: "Holistic Development", desc: "Addressing the whole child – mind, body, and spirit.", icon: Heart },
                                    { title: "Academic Excellence", desc: "Rigorous curriculum aligned with national standards.", icon: Star },
                                    { title: "Moral Formation", desc: "Instilling respect, integrity, and responsibility.", icon: BookOpen },
                                    { title: "Safe Environment", desc: "Prioritising safety with zero-tolerance for bullying.", icon: Shield },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#140152] mb-1">{item.title}</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* What We Provide */}
                        <section>
                            <h3 className="text-3xl font-bold text-[#140152] mb-8">What We Provide</h3>
                            <div className="space-y-6">
                                {[
                                    { title: "Structured Curriculum", desc: "Mathematics, language arts, science, social studies, and arts." },
                                    { title: "Qualified Teachers", desc: "Experienced educators passionate about teaching." },
                                    { title: "Child-Friendly Environment", desc: "Bright classrooms with modern learning tools." },
                                    { title: "Values & Discipline", desc: "Character-building lessons and positive behavior rewards." },
                                    { title: "Balanced Development", desc: "Sports, arts, music, and clubs." },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                                        <div className="w-8 h-8 rounded-full bg-[#140152] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#140152] text-lg">{item.title}</h4>
                                            <p className="text-gray-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Class Levels */}
                        <section>
                            <h3 className="text-3xl font-bold text-[#140152] mb-8">Class Levels</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    { name: "Early Years", age: "Ages 3–5", focus: "Play-based learning" },
                                    { name: "Lower Primary", age: "Ages 6–8", focus: "Foundational skills" },
                                    { name: "Upper Primary", age: "Ages 9–11", focus: "Critical thinking" },
                                ].map((level, i) => (
                                    <div key={i} className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                        <h4 className="font-black text-[#140152] text-xl mb-1">{level.name}</h4>
                                        <span className="inline-block px-3 py-1 bg-white rounded-full text-xs font-bold text-orange-600 mb-4">{level.age}</span>
                                        <p className="text-gray-700 text-sm font-medium">{level.focus}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-[#140152] text-white p-8 rounded-[2rem] shadow-xl sticky top-24">
                            <h3 className="text-2xl font-bold mb-6">Admissions Open</h3>
                            <p className="text-blue-200 mb-6 leading-relaxed">
                                We accept children based on age, developmental readiness, and space availability.
                            </p>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">1</div>
                                    <span>School Visit</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">2</div>
                                    <span>Interview</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">3</div>
                                    <span>Documentation</span>
                                </div>
                            </div>
                            <PremiumButton href="/education/coming-soon" className="bg-[#f5bb00] text-[#140152] hover:bg-white hover:text-[#140152] font-bold ">
                                Apply Now
                            </PremiumButton>
                            <p className="text-center text-xs text-blue-300 mt-4">Limited spaces available.</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold text-[#140152] mb-4">Safety & Support</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">Secure campus with monitored entrances</span>
                                </li>
                                <li className="flex gap-3">
                                    <Users className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">Dedicated emotional support staff</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
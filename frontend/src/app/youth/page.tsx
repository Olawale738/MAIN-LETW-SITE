'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import SectionWrapper from '@/components/shared/SectionWrapper'
import {
    Users, BookOpen, Briefcase, TrendingUp, Heart,
    Music, MessageCircle, Star, ArrowRight, CheckCircle,
    Loader2, Flame, Target, Zap, Globe
} from 'lucide-react'

const programs = [
    {
        icon: Users,
        color: 'bg-blue-100 text-blue-600',
        accent: '#3b82f6',
        title: 'Leadership Training',
        description: 'Empowering the next generation of leaders through monthly sessions, mentorship, and real-world leadership experience.',
        href: '/leadership',
        cta: 'Join Now',
    },
    {
        icon: Briefcase,
        color: 'bg-purple-100 text-purple-600',
        accent: '#8b5cf6',
        title: 'Career Guidance',
        description: 'Expert mentorship, CV workshops, interview coaching, and professional networking to launch your career.',
        href: '/career-guidance',
        cta: 'Learn More',
    },
    {
        icon: TrendingUp,
        color: 'bg-green-100 text-green-600',
        accent: '#22c55e',
        title: 'Skill Development',
        description: 'Practical workshops in tech, creative arts, entrepreneurship, and vocational skills to sharpen your abilities.',
        href: '/skill-development',
        cta: 'Get Started',
    },
    {
        icon: MessageCircle,
        color: 'bg-pink-100 text-pink-600',
        accent: '#ec4899',
        title: 'Counselling',
        description: 'Safe, confidential counselling for youth navigating challenges — mental health, relationships, identity, and faith.',
        href: '/services/counselling',
        cta: 'Book Session',
    },
    {
        icon: Music,
        color: 'bg-amber-100 text-amber-600',
        accent: '#f59e0b',
        title: 'Alter Sound',
        description: 'A consecrated space of worship and prophetic sound. Join the youth worship ministry and flow in the Spirit.',
        href: '/services/alter-sound',
        cta: 'Enter Alter Sound',
    },
    {
        icon: BookOpen,
        color: 'bg-indigo-100 text-indigo-600',
        accent: '#6366f1',
        title: 'Bible Study',
        description: 'Interactive weekly Bible study every Tuesday at 6:00 PM. Deepen your understanding of the Word.',
        href: '/bible-study',
        cta: 'Learn More',
    },
    {
        icon: Heart,
        color: 'bg-red-100 text-red-600',
        accent: '#ef4444',
        title: 'Prayer Meeting',
        description: 'Power-packed youth prayer meetings every Friday at 8:00 PM. Come pray, intercede, and encounter God.',
        href: '/prayer',
        cta: 'Join Prayer',
    },
    {
        icon: Star,
        color: 'bg-orange-100 text-orange-600',
        accent: '#f97316',
        title: 'Discipleship Training',
        description: 'Structured discipleship pathway from new believer to mature leader — walk with Christ and multiply His kingdom.',
        href: '/discipleship',
        cta: 'Start Journey',
    },
]

const stats = [
    { value: '500+', label: 'Youth Members' },
    { value: '8', label: 'Active Programs' },
    { value: '12+', label: 'Events Per Year' },
    { value: '100%', label: 'Faith-Based' },
]

const values = [
    { icon: Flame, title: 'Faith on Fire', desc: 'We cultivate passionate, authentic faith in young people.' },
    { icon: Target, title: 'Purpose-Driven', desc: 'Every youth is helped to discover and pursue their God-given purpose.' },
    { icon: Zap, title: 'Empowered', desc: 'Equipped with skills, knowledge, and the Spirit to make an impact.' },
    { icon: Globe, title: 'Global Vision', desc: 'Raising world-changers with a heart for the nations.' },
]

export default function YouthMinistryPage() {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', ageGroup: '16–19', interest: '' })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { serviceRequestApi } = await import('@/lib/api')
            await serviceRequestApi.submitRequests(
                ['Youth Ministry'],
                `Age group: ${formData.ageGroup}\nPhone: ${formData.phone}\nInterest: ${formData.interest}`
            )
            setSuccess(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Please log in to register.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* ─── HERO ─────────────────────────────────────────────── */}
            <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#140152]">
                {/* Animated gradient orbs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#f5bb00]/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px]" />
                </div>

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <span className="inline-flex items-center gap-2 bg-[#f5bb00]/20 text-[#f5bb00] font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full mb-8 border border-[#f5bb00]/30">
                            <Flame className="w-4 h-4" />
                            Light Encounter Youth Ministry
                        </span>
                        <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-none tracking-tight">
                            Rise.<br />
                            <span className="text-[#f5bb00]">Shine.</span><br />
                            Lead.
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto font-light leading-relaxed mb-10">
                            A generation set apart. Discover your purpose, develop your gifts, and ignite your world for Christ.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <PremiumButton href="#join" className="py-6 px-10 text-lg rounded-full bg-[#f5bb00] text-[#140152] hover:bg-white border-none shadow-2xl shadow-[#f5bb00]/30">
                                Join Youth Ministry
                            </PremiumButton>
                            <Link href="#programs"
                                className="py-4 px-8 text-lg rounded-full border-2 border-white/30 text-white hover:bg-white/10 transition-all font-semibold flex items-center gap-2 justify-center">
                                Explore Programs <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
                    <span className="text-xs uppercase tracking-widest">Scroll</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-0.5 h-8 bg-white/20 rounded-full"
                    />
                </div>
            </div>

            {/* ─── STATS ────────────────────────────────────────────── */}
            <div className="bg-[#f5bb00] py-12">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map(({ value, label }) => (
                            <div key={label}>
                                <p className="text-4xl md:text-5xl font-black text-[#140152]">{value}</p>
                                <p className="text-sm font-bold text-[#140152]/70 uppercase tracking-wider mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── ABOUT ────────────────────────────────────────────── */}
            <SectionWrapper>
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-[#f5bb00] font-bold uppercase tracking-widest text-sm mb-4 block">Who We Are</span>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] mb-6 leading-tight">
                            More Than a Youth Group
                        </h2>
                        <div className="w-24 h-1.5 bg-[#f5bb00] rounded-full mb-8" />
                        <p className="text-lg text-gray-600 leading-relaxed mb-6">
                            LETW Youth Ministry is a vibrant, Spirit-filled community for young people aged 13–35. We exist to raise a generation of believers who are rooted in the Word, empowered by the Spirit, and equipped to transform their world.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed mb-8">
                            From practical skills to spiritual depth — from career guidance to prophetic worship — we walk with young people through every dimension of life, helping them become who God created them to be.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {['Ages 13–35', 'Free to join', 'Weekly meetings', 'All welcome'].map(item => (
                                <div key={item} className="flex items-center gap-2 text-gray-700 font-medium">
                                    <CheckCircle className="w-5 h-5 text-[#f5bb00]" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {values.map(({ icon: Icon, title, desc }) => (
                            <Card key={title} className="border-none shadow-lg hover:shadow-xl transition-shadow group">
                                <CardContent className="p-6">
                                    <div className="w-10 h-10 bg-[#140152] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#f5bb00] transition-colors">
                                        <Icon className="w-5 h-5 text-white group-hover:text-[#140152]" />
                                    </div>
                                    <h3 className="font-bold text-[#140152] mb-2">{title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* ─── PROGRAMS ─────────────────────────────────────────── */}
            <div id="programs" className="bg-gray-50 py-24">
                <SectionWrapper>
                    <div className="text-center mb-16">
                        <span className="text-[#f5bb00] font-bold uppercase tracking-widest text-sm mb-4 block">What We Offer</span>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] mb-4">Youth Programs</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                            Eight distinct programs to develop every area of your life — spiritual, professional, and personal.
                        </p>
                        <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full mt-6" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {programs.map(({ icon: Icon, color, title, description, href, cta }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="border-none shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col group hover:-translate-y-1">
                                    <CardContent className="p-6 flex flex-col h-full">
                                        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-[#140152] text-lg mb-2">{title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">{description}</p>
                                        <Link href={href}
                                            className="text-[#140152] font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                            {cta} <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </SectionWrapper>
            </div>

            {/* ─── WEEKLY SCHEDULE ──────────────────────────────────── */}
            <SectionWrapper>
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-[#f5bb00] font-bold uppercase tracking-widest text-sm mb-4 block">Our Rhythm</span>
                        <h2 className="text-4xl font-black text-[#140152]">Weekly Schedule</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { day: 'Tuesday', time: '6:00 PM', activity: 'Youth Bible Study', desc: 'Interactive, in-depth Bible study sessions', color: 'bg-blue-500' },
                            { day: 'Friday', time: '8:00 PM', activity: 'Youth Prayer Meeting', desc: 'Power-packed intercession and worship', color: 'bg-purple-500' },
                            { day: 'Saturday', time: '10:00 AM', activity: 'Skills & Leadership', desc: 'Rotating workshops — leadership, skills, career', color: 'bg-[#f5bb00]' },
                            { day: 'Sunday', time: '9:00 AM', activity: 'Main Worship Service', desc: 'Join the full congregation for Sunday service', color: 'bg-[#140152]' },
                        ].map(({ day, time, activity, desc, color }) => (
                            <div key={day} className="flex items-center gap-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                                <div className={`w-14 h-14 ${color} rounded-xl flex flex-col items-center justify-center text-white shrink-0`}>
                                    <span className="text-xs font-bold opacity-80">{day.slice(0, 3)}</span>
                                    <span className="text-xs font-black">{time.split(' ')[0]}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[#140152] text-lg">{activity}</h3>
                                    <p className="text-sm text-gray-500">{desc}</p>
                                </div>
                                <span className="text-xs text-gray-400 font-medium hidden sm:block">{time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
            <div className="bg-[#140152] py-24">
                <SectionWrapper>
                    <div className="text-center mb-12">
                        <span className="text-[#f5bb00] font-bold uppercase tracking-widest text-sm mb-4 block">Voices</span>
                        <h2 className="text-4xl font-black text-white">What Youth Are Saying</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: 'Chidera A.', age: '22', quote: 'LETW Youth Ministry completely transformed my life. The leadership training gave me confidence I never thought I had.' },
                            { name: 'Adaeze O.', age: '19', quote: 'The Bible study sessions are unlike any I have attended. Deep, practical, and life-changing every single week.' },
                            { name: 'Emeka B.', age: '25', quote: 'Through the Career Guidance program, I landed my dream job. The mentors here genuinely invest in your future.' },
                        ].map(({ name, age, quote }) => (
                            <Card key={name} className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex mb-4">
                                        {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-[#f5bb00] fill-[#f5bb00]" />)}
                                    </div>
                                    <p className="text-blue-100 italic leading-relaxed mb-6">"{quote}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#f5bb00] flex items-center justify-center text-[#140152] font-black">
                                            {name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{name}</p>
                                            <p className="text-xs text-blue-300">Age {age}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </SectionWrapper>
            </div>

            {/* ─── JOIN FORM ────────────────────────────────────────── */}
            <div id="join">
                <SectionWrapper>
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-12">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-widest text-sm mb-4 block">Get Involved</span>
                            <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Join Youth Ministry</h2>
                            <p className="text-gray-500 mt-4 text-lg">Register your interest and we'll reach out to welcome you in.</p>
                        </div>

                        {success ? (
                            <div className="bg-green-50 border border-green-100 rounded-3xl p-12 text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-black text-[#140152] mb-3">Welcome to the Family!</h3>
                                <p className="text-gray-600 mb-6">Your registration has been received. Our team will be in touch with next steps.</p>
                                <Button onClick={() => setSuccess(false)} className="bg-[#140152] text-white px-8">
                                    Register Another
                                </Button>
                            </div>
                        ) : (
                            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                                <div className="bg-[#140152] px-8 py-6">
                                    <h3 className="text-white font-black text-xl">Registration Form</h3>
                                    <p className="text-blue-200 text-sm mt-1">You must be logged in to submit this form.</p>
                                </div>
                                <CardContent className="p-8">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
                                            {error} — <Link href="/auth/login" className="font-bold underline">Login here</Link>
                                        </div>
                                    )}
                                    <form onSubmit={handleJoin} className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                                                <input required type="text" placeholder="John Doe"
                                                    value={formData.name}
                                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] outline-none bg-gray-50 focus:bg-white transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                                                <input required type="email" placeholder="you@example.com"
                                                    value={formData.email}
                                                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] outline-none bg-gray-50 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                                <input type="tel" placeholder="+234 800 000 0000"
                                                    value={formData.phone}
                                                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] outline-none bg-gray-50 focus:bg-white transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Age Group</label>
                                                <select value={formData.ageGroup}
                                                    onChange={e => setFormData(p => ({ ...p, ageGroup: e.target.value }))}
                                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] outline-none bg-gray-50 focus:bg-white transition-all">
                                                    <option>13–15</option>
                                                    <option>16–19</option>
                                                    <option>20–24</option>
                                                    <option>25–35</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Which programs interest you?</label>
                                            <textarea rows={3} placeholder="Leadership Training, Skill Development, Bible Study…"
                                                value={formData.interest}
                                                onChange={e => setFormData(p => ({ ...p, interest: e.target.value }))}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] outline-none bg-gray-50 focus:bg-white resize-none transition-all"
                                            />
                                        </div>
                                        <Button type="submit" disabled={loading}
                                            className="w-full bg-[#140152] hover:bg-[#1d0175] text-white font-black py-6 text-lg rounded-xl disabled:opacity-50 transition-all">
                                            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2 inline" />Submitting…</> : 'Register Now'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </SectionWrapper>
            </div>

            {/* ─── CTA BANNER ───────────────────────────────────────── */}
            <div className="bg-[#f5bb00] py-20 text-center">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-4xl md:text-5xl font-black text-[#140152] mb-4">Your best chapter starts here.</h2>
                    <p className="text-[#140152]/70 text-lg mb-8">Don't wait for the right moment. The moment is now. Come alive in your purpose.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <PremiumButton href="#join" className="bg-[#140152] text-white hover:bg-[#1d0175] border-none">
                            Join Youth Ministry
                        </PremiumButton>
                        <PremiumButton href="/auth/register" className="bg-white text-[#140152] hover:bg-gray-100 border-none">
                            Create Account
                        </PremiumButton>
                    </div>
                </div>
            </div>
        </div>
    )
}

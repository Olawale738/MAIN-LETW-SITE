'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import SectionWrapper from '@/components/shared/SectionWrapper'
import {
    Users, BookOpen, Briefcase, TrendingUp, Heart,
    Music, MessageCircle, Star, ArrowRight, CheckCircle,
    Loader2, Flame, Target, Zap, Globe, Tent, Wifi,
    Dumbbell, DollarSign, Drama, HandHeart, ShieldCheck, Mic2,
    LogIn, UserPlus, Lock,
} from 'lucide-react'

const programs = [
    {
        icon: Tent,
        color: 'bg-sky-100 text-sky-600',
        image: '/Impact.png',
        title: 'Youth Retreat & Camp',
        description: 'Every year we pull young people away from the noise and into the presence of God. Our annual retreat is three days of deep worship, prophetic encounters, outdoor fellowship, and life-defining moments. Many of our strongest testimonies were born in a camp setting — this could be yours.',
        badge: 'Annual Event',
        href: '/youth#join',
        cta: 'Reserve a Spot',
    },
    {
        icon: Users,
        color: 'bg-violet-100 text-violet-600',
        image: '/Join.png',
        title: 'Mentorship Circles',
        description: 'You don\'t have to figure life out alone. We pair young people with seasoned believers and industry professionals who have walked the road before you. Through monthly one-on-one sessions and small group circles, you gain wisdom, accountability, and real-world insight tailored to your season.',
        badge: 'One-on-One',
        href: '/youth#join',
        cta: 'Find a Mentor',
    },
    {
        icon: Wifi,
        color: 'bg-cyan-100 text-cyan-600',
        image: '/EducationHero.jpg',
        title: 'Digital Missions',
        description: 'The internet is the largest mission field in human history — and we are equipping young believers to occupy it. Learn content creation, storytelling, social media strategy, and online evangelism. Turn your phone into a pulpit and your platform into a ministry that reaches thousands.',
        badge: 'Tech-Powered',
        href: '/youth#join',
        cta: 'Go Digital',
    },
    {
        icon: Dumbbell,
        color: 'bg-green-100 text-green-600',
        image: '/PrayerMeeting.png',
        title: 'Faith & Fitness',
        description: 'Your body is the temple of the Holy Spirit — and we treat it that way. Our Faith & Fitness program combines weekly sport sessions, fitness challenges, and devotional discussions. Build physical discipline, forge friendships, and discover how taking care of your body honours God and sharpens your mind.',
        badge: 'Body & Spirit',
        href: '/youth#join',
        cta: 'Get Active',
    },
    {
        icon: Mic2,
        color: 'bg-rose-100 text-rose-600',
        image: '/Discipleship.png',
        title: 'Drama & Spoken Word',
        description: 'Art is one of the most powerful ways to move a heart. This creative arts track trains youth in drama, spoken word poetry, dance, and visual storytelling — all as tools for Gospel proclamation. Perform at church events, community outreaches, and special services. Let your creativity carry the message.',
        badge: 'Creative Arts',
        href: '/youth#join',
        cta: 'Express Your Gift',
    },
    {
        icon: DollarSign,
        color: 'bg-emerald-100 text-emerald-600',
        image: '/Bible-study.png',
        title: 'Financial Stewardship',
        description: 'Nobody taught most of us how to handle money — and it shows in a generation drowning in debt. This program teaches biblical principles of stewardship, budgeting, saving, investing, and entrepreneurship. We raise young people who are not chasing money but commanding it for the Kingdom.',
        badge: 'Kingdom Finance',
        href: '/youth#join',
        cta: 'Build Wealth Wisely',
    },
    {
        icon: HandHeart,
        color: 'bg-orange-100 text-orange-600',
        image: '/altersound.png',
        title: 'Social Impact Projects',
        description: 'Faith without works is dead. Our youth-led social impact initiatives take the church outside its four walls — feeding the hungry, visiting the elderly, cleaning communities, and advocating for the vulnerable. These projects build compassion, character, and civic responsibility all at once.',
        badge: 'Community Love',
        href: '/youth#join',
        cta: 'Make an Impact',
    },
    {
        icon: ShieldCheck,
        color: 'bg-indigo-100 text-indigo-600',
        image: '/Counselling.png',
        title: 'Relationships & Identity',
        description: 'In a world that is constantly redefining who you should be and who you should love, we anchor young people in God\'s truth. This program tackles identity, self-worth, healthy relationships, biblical courtship, purity, and emotional wholeness — giving you a foundation nothing can shake.',
        badge: 'Identity First',
        href: '/youth#join',
        cta: 'Know Who You Are',
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
    const [authChecked, setAuthChecked] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        if (!token) { setAuthChecked(true); return }
        import('@/lib/dept-api').then(({ getCurrentUser }) =>
            getCurrentUser()
                .then(user => {
                    setIsLoggedIn(true)
                    setFormData(p => ({ ...p, name: user.name || '', email: user.email || '' }))
                })
                .catch(() => { /* token invalid */ })
                .finally(() => setAuthChecked(true))
        )
    }, [])

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            // Submit interest as a service request so the coordinator can review and manually add the member.
            // We do NOT call joinDepartment here — that would enrol them immediately (possibly as active).
            // The Youth Leader uses the Youth Coordinator dashboard to add and approve members.
            const { serviceRequestApi } = await import('@/lib/api')
            await serviceRequestApi.submitRequests(
                ['Youth Ministry'],
                `Age group: ${formData.ageGroup}\nPhone: ${formData.phone}\nInterest: ${formData.interest}`
            )
            setSuccess(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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
                        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
                            <PremiumButton href="#join" className="py-6 px-10 text-lg rounded-full bg-[#f5bb00] text-[#140152] hover:bg-white border-none shadow-2xl shadow-[#f5bb00]/30">
                                Join Youth Ministry
                            </PremiumButton>
                            <Link href="#programs"
                                className="py-4 px-8 text-lg rounded-full border-2 border-white/30 text-white hover:bg-white/10 transition-all font-semibold flex items-center gap-2 justify-center">
                                Explore Programs <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/youth/dashboard"
                                className="py-4 px-8 text-lg rounded-full border-2 border-[#f5bb00]/50 text-[#f5bb00] hover:bg-[#f5bb00]/10 transition-all font-semibold flex items-center gap-2 justify-center">
                                <Zap className="w-5 h-5" /> Enter Dashboard
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

            {/* ─── YOUTH BANNER ─────────────────────────────────────── */}
            <div className="bg-[#0d0138] py-14">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-[#f5bb00] font-black text-xs uppercase tracking-widest mb-3">
                        🔥 Light Encounter Youth Ministry
                    </p>
                    <h2 className="text-center text-white font-black text-2xl mb-8">Rise. Shine. Lead.</h2>
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <img
                            src="/Youth.png"
                            alt="LETW Youth Ministry"
                            className="w-full object-cover"
                        />
                    </div>
                    <div className="flex justify-center mt-6">
                        <a
                            href="#join"
                            className="bg-[#f5bb00] text-[#140152] font-black px-10 py-4 rounded-full text-sm hover:bg-yellow-300 transition-colors shadow-lg inline-flex items-center gap-2"
                        >
                            Join Youth Ministry <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
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
                            Eight transformative programs — each one designed to develop a specific dimension of who God made you to be. Spiritual. Professional. Purposeful. Unstoppable.
                        </p>
                        <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full mt-6" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {programs.map(({ icon: Icon, color, image, title, description, badge, href, cta }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="border-none shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col group hover:-translate-y-1 overflow-hidden">
                                    {/* Image banner */}
                                    <div className="relative w-full h-52 overflow-hidden">
                                        <Image
                                            src={image}
                                            alt={title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {/* Gradient overlay so badge reads clearly */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                        {badge && (
                                            <span className="absolute top-3 right-3 text-xs font-bold bg-white/90 text-[#140152] px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                                {badge}
                                            </span>
                                        )}
                                        {/* Icon chip over image */}
                                        <div className={`absolute bottom-3 left-4 w-11 h-11 ${color} rounded-xl flex items-center justify-center shadow-lg`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <CardContent className="p-7 flex flex-col flex-1">
                                        <h3 className="font-black text-[#140152] text-xl mb-3">{title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5">{description}</p>
                                        <Link href={href}
                                            className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#1d0175] transition-all group-hover:gap-3 self-start">
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
                            { day: 'Tuesday', time: '6:00 PM', activity: 'Mentorship Circles', desc: 'Small-group peer mentorship & life discussions', color: 'bg-violet-500' },
                            { day: 'Wednesday', time: '5:00 PM', activity: 'Faith & Fitness', desc: 'Sports, fitness challenges & devotional', color: 'bg-green-500' },
                            { day: 'Friday', time: '8:00 PM', activity: 'Youth Prayer Night', desc: 'Intercession, worship & spiritual warfare', color: 'bg-purple-500' },
                            { day: 'Saturday', time: '10:00 AM', activity: 'Creative Arts & Digital', desc: 'Drama, spoken word & digital missions training', color: 'bg-rose-500' },
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

            {/* ─── JOIN FORM ────────────────────────────────────────── */}
            <div id="join">
                <SectionWrapper>
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-12">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-widest text-sm mb-4 block">Get Involved</span>
                            <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Join Youth Ministry</h2>
                            <p className="text-gray-500 mt-4 text-lg">Register your interest and we'll reach out to welcome you in.</p>
                        </div>

                        {!authChecked ? (
                            /* Loading spinner while checking auth */
                            <div className="flex justify-center py-16">
                                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
                            </div>
                        ) : success ? (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-12 text-center">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-amber-600" />
                                </div>
                                <h3 className="text-2xl font-black text-[#140152] mb-3">Application Received! 🙌</h3>
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                    Your application to join Youth Ministry has been received.
                                </p>
                                <div className="bg-amber-100 border border-amber-300 rounded-2xl px-5 py-4">
                                    <div className="flex items-center gap-2 justify-center mb-2">
                                        <Lock className="w-5 h-5 text-amber-700" />
                                        <span className="text-amber-800 font-black text-sm uppercase tracking-wide">Awaiting Youth Leader Approval</span>
                                    </div>
                                    <p className="text-amber-700 text-sm leading-relaxed">
                                        Your application has been sent to our Youth Leader and Admin for review. Once they approve and add you to the ministry, you will gain access to the Youth dashboard. This usually takes 24–48 hours.
                                    </p>
                                </div>
                            </div>
                        ) : !isLoggedIn ? (
                            /* Guest — show clean login/register prompt */
                            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                                <div className="bg-[#140152] px-8 py-8 text-center">
                                    <div className="w-16 h-16 bg-[#f5bb00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Lock className="w-8 h-8 text-[#f5bb00]" />
                                    </div>
                                    <h3 className="text-white font-black text-2xl mb-2">Ready to Join?</h3>
                                    <p className="text-blue-200 text-base">Sign in or create a free account to register for Youth Ministry.</p>
                                </div>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Link href="/auth/login?next=/youth%23join"
                                            className="flex items-center justify-center gap-3 bg-[#140152] text-white font-black px-6 py-4 rounded-2xl hover:bg-[#1d0175] transition-all text-lg shadow-lg">
                                            <LogIn className="w-6 h-6" />
                                            Sign In
                                        </Link>
                                        <Link href="/auth/register?next=/youth%23join"
                                            className="flex items-center justify-center gap-3 bg-[#f5bb00] text-[#140152] font-black px-6 py-4 rounded-2xl hover:bg-yellow-300 transition-all text-lg shadow-lg">
                                            <UserPlus className="w-6 h-6" />
                                            Create Account
                                        </Link>
                                    </div>
                                    <p className="text-center text-sm text-gray-400 mt-6">It&apos;s free and takes less than a minute.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            /* Logged in — show registration form */
                            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                                <div className="bg-[#140152] px-8 py-6">
                                    <h3 className="text-white font-black text-xl">Registration Form</h3>
                                    <p className="text-blue-200 text-sm mt-1">Complete your details to join the Youth Ministry.</p>
                                </div>
                                <CardContent className="p-8">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
                                            {error}
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
                                            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2 inline" />Joining…</> : 'Join Youth Ministry'}
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

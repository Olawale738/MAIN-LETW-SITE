'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
    BookOpen,
    Globe,
    Users,
    ArrowRight,
    CheckCircle,
    Scroll,
    Flame,
    Heart,
    Anchor,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import SectionWrapper from '@/components/shared/SectionWrapper'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'
import ServicePageLayout from '@/components/shared/ServicePageLayout'

const CAROUSEL_IMAGES = [
    { src: '/theology1.png', alt: 'Theology Flyer 1' },
    { src: '/theology2.png', alt: 'Theology Flyer 2' },
    { src: '/theology3.png', alt: 'Theology Flyer 3' },
]

const IMPACT_POINTS = [
    {
        id: "01",
        title: "Biblical Foundation",
        desc: "Master the complete biblical narrative from Genesis to Revelation. Develop rigorous exegetical skills in Hebrew and Greek to unlock the original languages of Scripture and interpret God's Word with precision.",
        icon: BookOpen
    },
    {
        id: "02",
        title: "Theological Depth",
        desc: "Journey through systematic theology, exploring the doctrine of God, pneumatology, ecclesiology, and more. Engage with historical and contemporary theological frameworks that shape Christian thought.",
        icon: Scroll
    },
    {
        id: "03",
        title: "Ministry Excellence",
        desc: "From pastoral care to church planting, homiletics to leadership—gain practical ministry skills tested through internships and real-world application. Graduate ready to serve with competence and confidence.",
        icon: Users
    },
    {
        id: "04",
        title: "Global Perspective",
        desc: "Understand Christianity in its global context. Explore cross-cultural ministry, world religions, political theologies, and engage with the Bible's response to contemporary global challenges.",
        icon: Globe
    },
    {
        id: "05",
        title: "Spiritual Formation",
        desc: "Your education is not merely academic—it's transformational. Through spiritual disciplines, worship studies, and intentional formation, cultivate a deep, authentic walk with God that sustains lifelong ministry.",
        icon: Flame
    },
    {
        id: "06",
        title: "Mission & Impact",
        desc: "Graduate equipped for evangelism, apologetics, social transformation, and kingdom advancement. Whether in local churches or global missions, make an eternal impact for Christ.",
        icon: Anchor
    }
]

const GAINS = [
    "Comprehensive biblical and theological training across three progressive levels",
    "Mastery of biblical languages (Hebrew & Greek) for original text study",
    "Practical ministry skills in preaching, teaching, pastoral care, and leadership",
    "Global perspective on Christianity and cross-cultural ministry",
    "Hands-on ministry experience through internship placements",
    "Internationally recognized qualifications (Certificate, Diploma, Advanced Diploma)",
    "Spiritual formation and personal transformation",
    "Network of like-minded ministry professionals and lifelong mentors"
]

export default function TheologyDashboardPage() {
    const [activeLevel, setActiveLevel] = useState(1)
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [])

    return (
        <ServicePageLayout serviceName="Theology school" brandTitle="Theology School" brandColor="#f5bb00">
        <div className="bg-gray-50 pb-20">
            {/* Hero Carousel */}
            <div className="w-full relative">
                {/* All images stacked; only active one is visible */}
                {CAROUSEL_IMAGES.map((img, i) => (
                    <img
                        key={img.src}
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-auto block transition-opacity duration-700"
                        style={{
                            position: i === 0 ? 'relative' : 'absolute',
                            top: 0,
                            left: 0,
                            opacity: i === currentSlide ? 1 : 0,
                            pointerEvents: i === currentSlide ? 'auto' : 'none',
                        }}
                    />
                ))}

                {/* Prev / Next */}
                <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    aria-label="Previous"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    aria-label="Next"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {CAROUSEL_IMAGES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-white scale-125' : 'bg-white/50'}`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Service Announcements */}
            <ServiceAnnouncements serviceName="Theology school" />

            <SectionWrapper>
                <div className="max-w-7xl mx-auto space-y-24">
                    <div className="space-y-12">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-4">The Impact of Theological Education</h2>
                            <p className="text-lg text-gray-600">
                                Our comprehensive programs don't just impart knowledge—they transform lives, build leaders, and equip servants for kingdom work.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {IMPACT_POINTS.map((point, idx) => (
                                <motion.div
                                    key={point.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-[#140152]/5 flex items-center justify-center text-[#140152] group-hover:bg-[#140152] group-hover:text-white transition-colors">
                                            <point.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-4xl font-black text-gray-100 select-none group-hover:text-[#f5bb00]/20 transition-colors">
                                            {point.id}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#140152] mb-3">{point.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {point.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#140152] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#f5bb00] rounded-full blur-[100px] opacity-10 pointer-events-none" />

                        <div className="grid lg:grid-cols-2 gap-16 relative z-10">
                            <div className="space-y-8">
                                <div>
                                    <div className="text-[#f5bb00] font-bold tracking-widest uppercase mb-4 text-sm">Why Join Us?</div>
                                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                                        Begin Your <br />
                                        Theological Journey
                                    </h2>
                                    <p className="text-blue-100 text-lg leading-relaxed">
                                        Take the first step toward transformative theological education and impactful ministry.
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    className="h-14 px-8 rounded-full bg-[#f5bb00] text-[#140152] hover:bg-white hover:text-[#140152] font-bold text-lg w-full sm:w-auto"
                                >
                                    <a href="https://live.letw.org" target="_blank" rel="noopener noreferrer">
                                        Apply Now <ArrowRight className="ml-2 w-5 h-5" />
                                    </a>
                                </Button>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white mb-6">What You'll Gain</h3>
                                <div className="space-y-4">
                                    {GAINS.map((gain, i) => (
                                        <div key={i} className="flex gap-4 text-blue-100">
                                            <div className="w-6 h-6 rounded-full bg-[#f5bb00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <CheckCircle className="w-3.5 h-3.5 text-[#f5bb00]" />
                                            </div>
                                            <span className="text-sm md:text-base">{gain}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600 bg-gray-100/50 p-8 rounded-2xl">
                        <div>
                            <h4 className="font-bold text-[#140152] mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Language & Study Readiness
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>All programs taught in English with sufficient proficiency required</li>
                                <li>Support resources available for academic writing and study skills development</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#140152] mb-3 flex items-center gap-2">
                                <Heart className="w-4 h-4" /> Character & Community
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Demonstrate Christian character and ethical conduct</li>
                                <li>Participate actively in spiritual formation activities</li>
                                <li>Respect diversity within the global Christian community</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </SectionWrapper>
        </div>
        </ServicePageLayout>
    )
}

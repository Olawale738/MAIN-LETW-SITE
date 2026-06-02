'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    HandHeart, Phone, CalendarDays, CheckCircle2,
    ArrowRight, BookOpen, Music, Users, Baby, Mic2,
    Heart, Camera, Coffee, Shield, Loader2, Clock,
    LayoutDashboard, Library, ChevronRight, Star
} from 'lucide-react'
import { serviceRequestApi, ServiceRequest } from '@/lib/api'

// ── Department config ─────────────────────────────────────────────────────────

interface DeptConfig {
    icon: React.ReactNode
    color: string          // Tailwind bg color class
    textColor: string
    description: string
    dashboard?: {
        label: string
        href: string
        icon: React.ReactNode
        description: string
    }
    resources?: { label: string; href: string }[]
}

const DEPT_CONFIG: Record<string, DeptConfig> = {
    'Worship Team': {
        icon: <Music className="w-6 h-6" />,
        color: 'bg-purple-600',
        textColor: 'text-purple-700',
        description: 'You lead worship through music, song, and sound. Your gift creates an atmosphere for God\'s presence.',
        dashboard: {
            label: 'Alter Sound Dashboard',
            href: '/services/alter-sound/dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            description: 'Access your worship team hub — track rehearsals, view the music library, and connect with the choir.',
        },
        resources: [
            { label: 'Music Library', href: '/services/alter-sound/library' },
            { label: 'Alter Sound Home', href: '/services/alter-sound' },
        ],
    },
    "Children's Ministry": {
        icon: <Baby className="w-6 h-6" />,
        color: 'bg-pink-500',
        textColor: 'text-pink-700',
        description: 'You nurture the next generation — teaching, guiding, and protecting children in their faith journey.',
        dashboard: {
            label: 'Children Ministry Dashboard',
            href: '/children/dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            description: 'View your roster, attendance records, upcoming sessions, and team announcements.',
        },
        resources: [
            { label: 'Children Ministry Home', href: '/children' },
        ],
    },
    'Youth Ministry': {
        icon: <Mic2 className="w-6 h-6" />,
        color: 'bg-blue-600',
        textColor: 'text-blue-700',
        description: 'You mentor and empower teens and young adults to pursue God-given purpose and lead in their generation.',
        dashboard: {
            label: 'Youth Ministry Dashboard',
            href: '/youth/dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            description: 'Track activities, view announcements, check attendance, and connect with your youth team.',
        },
        resources: [
            { label: 'Youth Ministry Home', href: '/youth' },
        ],
    },
    'Bible Study Facilitator': {
        icon: <BookOpen className="w-6 h-6" />,
        color: 'bg-emerald-600',
        textColor: 'text-emerald-700',
        description: 'You guide members through Scripture, lead group discussions, and help the church dig deeper into God\'s Word.',
        dashboard: {
            label: 'Bible Reading Hub',
            href: '/services/bible-reading',
            icon: <Library className="w-5 h-5" />,
            description: 'Access reading plans, track member progress, view resources, and prepare for your next session.',
        },
        resources: [
            { label: 'My Progress', href: '/services/bible-reading/my-progress' },
            { label: 'Bible Study Home', href: '/bible-study' },
        ],
    },
    'Counselling Support': {
        icon: <Heart className="w-6 h-6" />,
        color: 'bg-rose-600',
        textColor: 'text-rose-700',
        description: 'You assist the counselling team through administration, scheduling, and intercession for those seeking support.',
        dashboard: {
            label: 'Counselling Services',
            href: '/services/counselling',
            icon: <Heart className="w-5 h-5" />,
            description: 'Access the counselling portal to see session schedules and support resources.',
        },
    },
    'Media & Creative': {
        icon: <Camera className="w-6 h-6" />,
        color: 'bg-violet-600',
        textColor: 'text-violet-700',
        description: 'You capture and create — photography, videography, graphics, and social media that spread the church\'s message.',
        dashboard: {
            label: 'Media Team Dashboard',
            href: '/services/media',
            icon: <LayoutDashboard className="w-5 h-5" />,
            description: 'Access your media hub — view upcoming shoots, post notices, track attendance, and chat with the team.',
        },
    },
    'Hospitality Team': {
        icon: <Coffee className="w-6 h-6" />,
        color: 'bg-amber-600',
        textColor: 'text-amber-700',
        description: 'You make everyone feel at home — through food, fellowship events, and a warm, welcoming environment.',
        dashboard: {
            label: 'Hospitality Dashboard',
            href: '/services/hospitality',
            icon: <LayoutDashboard className="w-5 h-5" />,
            description: 'View upcoming events needing hospitality, team announcements, duty roster, and group chat.',
        },
    },
    'Ushering & Welcome': {
        icon: <Users className="w-6 h-6" />,
        color: 'bg-cyan-600',
        textColor: 'text-cyan-700',
        description: 'You are the first face people see. You create a warm, orderly atmosphere that sets the tone for worship.',
        dashboard: {
            label: 'Ushering Dashboard',
            href: '/services/ushering',
            icon: <LayoutDashboard className="w-5 h-5" />,
            description: 'View your service rota, briefing schedules, attendance records, and communicate with the ushering team.',
        },
    },
    'Security & Safety': {
        icon: <Shield className="w-6 h-6" />,
        color: 'bg-slate-600',
        textColor: 'text-slate-700',
        description: 'You keep the church environment safe and orderly so that every member can worship in peace and security.',
        dashboard: {
            label: 'Security Dashboard',
            href: '/services/security',
            icon: <LayoutDashboard className="w-5 h-5" />,
            description: 'Access duty shift schedules, incident tracking, team briefings, and the security group chat.',
        },
    },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseVolunteerMessage(msg?: string) {
    if (!msg) return {}
    const extract = (key: string) => {
        const match = msg.match(new RegExp(`${key}:\\s*([^|]+)`))
        return match ? match[1].trim() : undefined
    }
    return {
        department:   extract('Department'),
        availability: extract('Availability'),
        phone:        extract('Phone'),
        experience:   extract('Experience'),
    }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VolunteerDashboardPage() {
    const router = useRouter()
    const [request, setRequest] = useState<ServiceRequest | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const loggedIn = localStorage.getItem('isLoggedIn')
        if (!loggedIn) { router.push('/auth/login'); return }

        serviceRequestApi.getMyRequests().then(data => {
            const vol = data.approved.find(r => r.service_name === 'Volunteer')
            if (vol) setRequest(vol)
            else {
                const pending = data.pending.find(r => r.service_name === 'Volunteer')
                if (pending) setRequest(pending)
                else setNotFound(true)
            }
        }).catch(() => setNotFound(true))
          .finally(() => setLoading(false))
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]/30" />
            </div>
        )
    }

    if (notFound || !request) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <HandHeart className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-[#140152] mb-3">No Volunteer Record Found</h2>
                    <p className="text-gray-500 mb-8">You haven't submitted a volunteer application yet, or it hasn't been processed.</p>
                    <Link href="/volunteer"
                        className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1d0175] transition-colors">
                        Apply to Volunteer <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        )
    }

    const isPending  = request.status === 'pending'
    const isApproved = request.status === 'approved'
    const { department, availability, phone, experience } = parseVolunteerMessage(request.message)
    const cfg = department ? DEPT_CONFIG[department] : undefined

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* ── Hero banner ── */}
            <div className="bg-gradient-to-br from-[#140152] to-purple-900 text-white">
                <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
                    <div className="flex items-center gap-2 text-[#f5bb00]/80 text-sm font-bold uppercase tracking-widest mb-4">
                        <Link href="/dashboard" className="hover:text-[#f5bb00] transition-colors">Dashboard</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>My Volunteer Profile</span>
                    </div>

                    <div className="flex items-start gap-5">
                        {/* Avatar */}
                        <div className={`w-16 h-16 rounded-2xl ${cfg?.color ?? 'bg-purple-600'} flex items-center justify-center shrink-0 shadow-lg`}>
                            {cfg?.icon ?? <HandHeart className="w-8 h-8 text-white" />}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                                {department ?? 'Church Volunteer'}
                            </h1>
                            <p className="text-white/70 mt-1 text-sm">Light Encounter Tabernacle Worldwide</p>

                            {/* Status badge */}
                            <div className="mt-3 inline-flex items-center gap-2">
                                {isApproved ? (
                                    <span className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Active Volunteer
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                        <Clock className="w-3.5 h-3.5" /> Application Pending Review
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 -mt-4 space-y-5">

                {/* ── Pending notice ── */}
                {isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4"
                    >
                        <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-800">Application under review</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Our team will review your application and reach out within 3–5 business days. You'll receive a notification once approved.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── Contact / profile card ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50">
                            <h2 className="font-black text-[#140152]">My Profile</h2>
                        </div>
                        <div className="px-6 py-5 grid sm:grid-cols-2 gap-4">
                            {availability && (
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="w-5 h-5 text-[#f5bb00] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Availability</p>
                                        <p className="font-semibold text-[#140152]">{availability}</p>
                                    </div>
                                </div>
                            )}
                            {phone && (
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-[#f5bb00] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
                                        <a href={`tel:${phone}`} className="font-semibold text-[#140152] hover:text-blue-600 transition-colors">
                                            {phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {experience && (
                                <div className="flex items-start gap-3 sm:col-span-2">
                                    <Star className="w-5 h-5 text-[#f5bb00] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Experience / Skills</p>
                                        <p className="text-gray-700 leading-relaxed text-sm">{experience}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── Department description ── */}
                {cfg && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl ${cfg.color} flex items-center justify-center text-white`}>
                                    {cfg.icon}
                                </div>
                                <h2 className="font-black text-[#140152]">Your Department</h2>
                            </div>
                            <div className="px-6 py-5">
                                <p className="text-gray-600 leading-relaxed">{cfg.description}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Service dashboard integration ── */}
                {isApproved && cfg?.dashboard && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="rounded-2xl overflow-hidden border-2 border-[#140152]/20 shadow-sm">
                            {/* Header */}
                            <div className="bg-[#140152] px-6 py-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#f5bb00]/20 rounded-lg flex items-center justify-center text-[#f5bb00]">
                                    {cfg.dashboard.icon}
                                </div>
                                <div>
                                    <p className="text-xs text-white/60 uppercase tracking-widest font-bold">Connected Service</p>
                                    <h2 className="text-white font-black">{cfg.dashboard.label}</h2>
                                </div>
                            </div>
                            {/* Body */}
                            <div className="bg-white px-6 py-5">
                                <p className="text-gray-600 text-sm mb-5">{cfg.dashboard.description}</p>
                                <Link
                                    href={cfg.dashboard.href}
                                    className="flex items-center justify-between bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl transition-colors group"
                                >
                                    <span>Open {cfg.dashboard.label}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Additional resources ── */}
                {cfg?.resources && cfg.resources.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50">
                                <h2 className="font-black text-[#140152]">Quick Links</h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {cfg.resources.map(r => (
                                    <Link key={r.href} href={r.href}
                                        className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors group">
                                        <span className="font-semibold text-gray-700 group-hover:text-[#140152] text-sm">{r.label}</span>
                                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#140152] group-hover:translate-x-0.5 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── No dashboard yet ── */}
                {isApproved && !cfg?.dashboard && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="bg-[#140152]/5 border border-[#140152]/10 rounded-2xl px-6 py-5 text-center">
                            <p className="text-sm text-[#140152]/70 font-semibold">
                                A dedicated online dashboard for your department is coming soon.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Your coordinator will reach out directly with your schedule and assignments.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── Coordinator note ── */}
                {isApproved && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <div className="bg-gradient-to-r from-[#f5bb00]/20 to-yellow-100 border border-[#f5bb00]/40 rounded-2xl px-6 py-5">
                            <p className="text-sm font-bold text-[#140152] mb-1">📋 What to expect next</p>
                            <ul className="text-sm text-[#140152]/80 space-y-1 list-disc list-inside">
                                <li>Your department coordinator will contact you at the phone number provided</li>
                                <li>You'll receive your first assignment and orientation details</li>
                                <li>Check the dashboard above regularly for updates and announcements</li>
                            </ul>
                        </div>
                    </motion.div>
                )}

                {/* ── Back link ── */}
                <div className="text-center pt-4">
                    <Link href="/dashboard" className="text-sm text-gray-400 hover:text-[#140152] transition-colors font-semibold">
                        ← Back to My Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}

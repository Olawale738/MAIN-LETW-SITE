'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Loader2, ArrowLeft, Megaphone, Calendar, BookOpen, ChevronRight,
    Lock, LayoutDashboard, Flower2, Heart, Sparkles,
} from 'lucide-react'

const ROSE = '#1e3a8a'  // blue palette (variable name kept to minimize diff)
const GOLD = '#f5bb00'
const NAVY = '#140152'

export default function WomenDashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        setIsLoggedIn(!!token)
        setAuthChecked(true)
    }, [])

    if (!authChecked) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-blue-50/40">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: ROSE }} />
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-blue-50/40 text-center p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: ROSE }}>
                    <Lock className="w-8 h-8 text-[#f5bb00]" />
                </div>
                <p className="text-2xl font-black text-[#140152] mb-2">Sign in to view your dashboard</p>
                <p className="text-gray-500 mb-6 max-w-md">Members-only area for our sisterhood.</p>
                <Link href="/auth/login?next=/women/dashboard" className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full">
                    Sign In
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-blue-50/40">
            {/* Header */}
            <div className="text-white" style={{ background: `linear-gradient(135deg, ${ROSE}, ${NAVY})` }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <Link href="/women" className="inline-flex items-center gap-2 text-white/70 hover:text-[#f5bb00] text-sm font-bold mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Women&apos;s Ministry
                    </Link>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-[#f5bb00]/30" style={{ background: 'rgba(245,187,0,0.2)' }}>
                            <Flower2 className="w-8 h-8 text-[#f5bb00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-1 inline-flex items-center gap-1.5">
                                <LayoutDashboard className="w-3 h-3" /> Member Dashboard
                            </p>
                            <h1 className="text-3xl md:text-5xl font-black leading-tight">Welcome, sister 🌹</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 space-y-8">
                {/* Quote card */}
                <Card>
                    <CardContent className="p-8 text-center">
                        <Sparkles className="w-8 h-8 mx-auto mb-4" style={{ color: GOLD }} />
                        <p className="text-2xl md:text-3xl leading-snug font-bold italic text-[#140152]" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
                            &ldquo;She is clothed with strength and dignity, and she laughs without fear of the future.&rdquo;
                        </p>
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.4em]" style={{ color: ROSE }}>— Proverbs 31:25</p>
                    </CardContent>
                </Card>

                {/* Announcements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5" style={{ color: ROSE }} /> Announcements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-10 text-gray-500">
                            <p className="font-bold">No announcements yet.</p>
                            <p className="text-sm mt-1">When the women&apos;s lead posts updates, they appear here.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming + Resources */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" style={{ color: ROSE }} /> Upcoming Events
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm text-center py-6">No upcoming events yet — check back soon for retreats and gatherings.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" style={{ color: ROSE }} /> Resources
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm text-center py-6">PDFs, devotionals, and study guides from the women&apos;s team will appear here.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* CTA */}
                <Card>
                    <CardContent className="p-8 text-center" style={{ background: `linear-gradient(135deg, ${ROSE}11, white)` }}>
                        <Heart className="w-10 h-10 mx-auto mb-4" style={{ color: ROSE }} />
                        <h3 className="text-xl font-black text-[#140152] mb-3">Bring a sister with you</h3>
                        <p className="text-sm text-gray-600 mb-5">Share Women&apos;s Ministry with someone who needs this season of healing and sisterhood.</p>
                        <Link href="/women" className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full text-white transition-all hover:scale-105"
                              style={{ background: `linear-gradient(135deg, ${ROSE}, ${NAVY})` }}>
                            Share This Ministry <ChevronRight className="w-4 h-4" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

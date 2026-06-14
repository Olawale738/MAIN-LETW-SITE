'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Loader2, ArrowLeft, Megaphone, Calendar, BookOpen, ChevronRight,
    Lock, LayoutDashboard, Sword, Shield, Sparkles,
} from 'lucide-react'

const STEEL_DARK = '#0f172a'
const STEEL = '#1f2937'
const GOLD = '#f5bb00'
const NAVY = '#140152'

export default function MenDashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        setIsLoggedIn(!!token)
        setAuthChecked(true)
    }, [])

    if (!authChecked) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: STEEL }} />
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 text-center p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: STEEL_DARK }}>
                    <Lock className="w-8 h-8 text-[#f5bb00]" />
                </div>
                <p className="text-2xl font-black text-[#140152] mb-2">Sign in to view your dashboard</p>
                <p className="text-gray-500 mb-6 max-w-md">Members-only area for the brotherhood.</p>
                <Link href="/auth/login?next=/men/dashboard" className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full">
                    Sign In
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="text-white" style={{ background: `linear-gradient(135deg, ${STEEL_DARK}, ${NAVY})` }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <Link href="/men" className="inline-flex items-center gap-2 text-white/70 hover:text-[#f5bb00] text-sm font-bold mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Men&apos;s Ministry
                    </Link>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-[#f5bb00]/30" style={{ background: 'rgba(245,187,0,0.2)' }}>
                            <Sword className="w-8 h-8 text-[#f5bb00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-1 inline-flex items-center gap-1.5">
                                <LayoutDashboard className="w-3 h-3" /> Member Dashboard
                            </p>
                            <h1 className="text-3xl md:text-5xl font-black leading-tight">Welcome, brother ⚔️</h1>
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
                            &ldquo;Be on your guard; stand firm in the faith; be courageous; be strong.&rdquo;
                        </p>
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.4em]" style={{ color: STEEL }}>— 1 Corinthians 16:13</p>
                    </CardContent>
                </Card>

                {/* Announcements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5" style={{ color: STEEL }} /> Announcements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-10 text-gray-500">
                            <p className="font-bold">No announcements yet.</p>
                            <p className="text-sm mt-1">When the men&apos;s lead posts updates, they appear here.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming + Resources */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" style={{ color: STEEL }} /> Upcoming Events
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm text-center py-6">Retreats, breakfasts, and brotherhood meetups will appear here.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" style={{ color: STEEL }} /> Resources
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm text-center py-6">PDFs, devotionals, and study guides from the men&apos;s team will appear here.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* CTA */}
                <Card>
                    <CardContent className="p-8 text-center" style={{ background: 'linear-gradient(135deg, #f3f4f6, white)' }}>
                        <Shield className="w-10 h-10 mx-auto mb-4" style={{ color: STEEL }} />
                        <h3 className="text-xl font-black text-[#140152] mb-3">Bring a brother with you</h3>
                        <p className="text-sm text-gray-600 mb-5">Iron sharpens iron — share this ministry with a brother who needs a band.</p>
                        <Link href="/men" className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full text-white transition-all hover:scale-105"
                              style={{ background: `linear-gradient(135deg, ${STEEL_DARK}, ${NAVY})` }}>
                            Share This Ministry <ChevronRight className="w-4 h-4" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

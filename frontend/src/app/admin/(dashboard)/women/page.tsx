'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Flower2, ExternalLink, ArrowRight, UserCheck, Megaphone,
    Calendar, BookOpen, Sparkles,
} from 'lucide-react'

const ROSE = '#be1c5e'
const GOLD = '#f5bb00'

export default function AdminWomenPage() {

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3" style={{ color: '#140152' }}>
                        <Flower2 className="w-7 h-7" style={{ color: ROSE }} /> Women&apos;s Ministry
                    </h1>
                    <p className="text-gray-600 mt-1">Admin overview for the women&apos;s sisterhood.</p>
                </div>
                <a href="/women" target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg transition-colors text-sm">
                    View live /women <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-[#f5bb00]">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Programs</p>
                        <p className="text-3xl font-black mt-1" style={{ color: GOLD }}>6</p>
                        <p className="text-xs text-gray-500 mt-0.5">defined on /women</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4" style={{ borderLeftColor: ROSE }}>
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Pillars</p>
                        <p className="text-3xl font-black mt-1" style={{ color: ROSE }}>4</p>
                        <p className="text-xs text-gray-500 mt-0.5">foundation values</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#7c3aed]">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Service label</p>
                        <p className="text-base font-black mt-2 text-[#7c3aed]">Women&apos;s Ministry</p>
                        <p className="text-xs text-gray-500 mt-0.5">match key for join requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/service-requests" className="block">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-center gap-3">
                            <UserCheck className="w-10 h-10 p-2 rounded-xl" style={{ color: ROSE, background: `${ROSE}1a` }} />
                            <div className="flex-1">
                                <p className="font-black text-[#140152]">Approve join requests</p>
                                <p className="text-xs text-gray-500">Filter service requests for &ldquo;Women&apos;s Ministry&rdquo;</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/announcements" className="block">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-center gap-3">
                            <Megaphone className="w-10 h-10 p-2 rounded-xl bg-[#140152]/10 text-[#140152]" />
                            <div className="flex-1">
                                <p className="font-black text-[#140152]">Post Announcements</p>
                                <p className="text-xs text-gray-500">Send updates to members</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/events" className="block">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-center gap-3">
                            <Calendar className="w-10 h-10 p-2 rounded-xl bg-[#f5bb00]/15 text-[#f5bb00]" />
                            <div className="flex-1">
                                <p className="font-black text-[#140152]">Schedule Events</p>
                                <p className="text-xs text-gray-500">Retreats, gatherings, fellowship</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* What's on /women */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" style={{ color: ROSE }} /> What&apos;s on /women right now
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Programs</p>
                            <ul className="space-y-1 text-sm text-gray-700">
                                <li>· Sister&apos;s Circle</li>
                                <li>· Crown of Beauty (healing track)</li>
                                <li>· Daughters of Worth (mentorship)</li>
                                <li>· Word &amp; Tea (Bible study)</li>
                                <li>· Hand to Hand (outreach)</li>
                                <li>· The Annual Retreat</li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pillars</p>
                            <ul className="space-y-1 text-sm text-gray-700">
                                <li>· Word-Anchored</li>
                                <li>· Heart-Healing</li>
                                <li>· Hands-Outstretched</li>
                                <li>· Beautifully Bold</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

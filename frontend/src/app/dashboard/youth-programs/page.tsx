'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Loader2, CheckCircle2, Clock, Lock, ArrowRight, Plus, Sparkles, ExternalLink,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { youthProgramApi, YouthProgram, serviceRequestApi } from '@/lib/api'

type Status = 'approved' | 'pending' | 'none'

const getIcon = (name?: string) => {
    if (!name) return Sparkles
    const I = (LucideIcons as any)[name]
    return I || Sparkles
}

// Tailwind 'bg-violet-100 text-violet-600' → hex for inline styles
function pickAccentHex(colorClass?: string): string {
    if (!colorClass) return '#7c3aed'
    const map: Record<string, string> = {
        sky: '#0284c7', violet: '#7c3aed', cyan: '#0891b2', green: '#16a34a',
        rose: '#e11d48', emerald: '#059669', orange: '#ea580c', indigo: '#4f46e5',
        purple: '#9333ea', amber: '#d97706', blue: '#2563eb', red: '#dc2626',
        teal: '#0d9488', pink: '#db2777', yellow: '#ca8a04', gray: '#4b5563',
    }
    const m = colorClass.match(/bg-(\w+)-\d+/)
    return (m && map[m[1]]) || '#7c3aed'
}

export default function YouthProgramsHubDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')
    const [programs, setPrograms] = useState<YouthProgram[]>([])
    const [statuses, setStatuses] = useState<Record<string, Status>>({})

    useEffect(() => {
        const init = async () => {
            const loggedIn = typeof window !== 'undefined' &&
                (localStorage.getItem('isLoggedIn') || localStorage.getItem('access_token'))
            if (!loggedIn) {
                router.push('/auth/login?next=/dashboard/youth-programs')
                return
            }
            setUserName(localStorage.getItem('userName') || 'Member')

            try {
                const [progs, reqs] = await Promise.all([
                    youthProgramApi.list().catch(() => [] as YouthProgram[]),
                    serviceRequestApi.getMyRequests().catch(() => ({
                        approved: [] as { service_name: string }[],
                        pending: [] as { service_name: string }[],
                    })),
                ])
                setPrograms(progs)

                const approvedLabels = new Set((reqs.approved || []).map(r => r.service_name))
                const pendingLabels = new Set((reqs.pending || []).map(r => r.service_name))
                const result: Record<string, Status> = {}
                for (const p of progs) {
                    const label = p.service_request_label || `Youth :: ${p.title}`
                    if (approvedLabels.has(label)) result[p.id] = 'approved'
                    else if (pendingLabels.has(label)) result[p.id] = 'pending'
                    else result[p.id] = 'none'
                }
                setStatuses(result)
            } catch (e) {
                /* swallow — empty list will show empty-state */
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#140152] to-[#220263]">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
        )
    }

    const approvedCount = Object.values(statuses).filter(s => s === 'approved').length
    const pendingCount = Object.values(statuses).filter(s => s === 'pending').length
    const sorted = [...programs].sort((a, b) => a.order_index - b.order_index)

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#140152] to-[#220263]">
            {/* Hero */}
            <div className="px-4 md:px-12 pt-12 pb-20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#7c3aed] rounded-full blur-3xl opacity-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f5bb00] rounded-full blur-3xl opacity-10 pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-3">Youth Member Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Youth Programs Dashboard</h1>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        Welcome, {userName}! {approvedCount > 0
                            ? `You have access to ${approvedCount} program${approvedCount !== 1 ? 's' : ''}.`
                            : 'Browse and request to join a program below.'}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                        <span className="bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-sm text-white/80">
                            <span className="font-black text-white">{approvedCount}</span> approved
                        </span>
                        {pendingCount > 0 && (
                            <span className="bg-amber-400/15 border border-amber-300/30 rounded-full px-4 py-1.5 text-sm text-amber-200">
                                <span className="font-black">{pendingCount}</span> awaiting approval
                            </span>
                        )}
                        <Link href="/youth" className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-full px-4 py-1.5 text-sm text-white inline-flex items-center gap-1.5">
                            All youth ministry <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 md:px-12 pb-20 -mt-8">
                {sorted.length === 0 ? (
                    <Card className="bg-white p-10 text-center">
                        <Sparkles className="w-12 h-12 text-[#f5bb00] mx-auto mb-3" />
                        <p className="font-black text-[#140152] text-lg mb-2">No programs available yet</p>
                        <p className="text-sm text-gray-500 mb-5">The youth team hasn&apos;t published any programs. Check back soon, or visit the main Youth Ministry page.</p>
                        <Link href="/youth">
                            <Button className="bg-[#140152] text-white">Open Youth Ministry</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {sorted.map((p, i) => {
                            const status = statuses[p.id] ?? 'none'
                            const Icon = getIcon(p.icon)
                            const accent = pickAccentHex(p.color_class)
                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    {status === 'approved' ? (
                                        <Card className="bg-white hover:shadow-2xl transition-all overflow-hidden h-full">
                                            <div className="h-1.5" style={{ backgroundColor: accent }} />
                                            <div className="p-6 flex flex-col h-full">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${accent}1a` }}>
                                                        <Icon className="w-6 h-6" style={{ color: accent }} />
                                                    </div>
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <h3 className="text-lg font-black text-[#140152]">{p.title}</h3>
                                                    {p.badge && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#f5bb00]/20 text-[#140152] px-2 py-0.5 rounded-full">{p.badge}</span>
                                                    )}
                                                </div>
                                                <p className="text-gray-500 text-sm mb-5 leading-relaxed flex-1 line-clamp-3">
                                                    {p.short_description || p.long_description}
                                                </p>
                                                <Link href={`/youth/${p.slug}/dashboard`} className="w-full">
                                                    <Button className="w-full text-white rounded-xl" style={{ background: accent }}>
                                                        Open Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    ) : status === 'pending' ? (
                                        <Card className="bg-amber-50/60 border border-amber-200 overflow-hidden h-full">
                                            <div className="h-1.5 bg-amber-300" />
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                                                        <Icon className="w-6 h-6 text-amber-600" />
                                                    </div>
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                                                        <Clock className="w-3.5 h-3.5" /> Pending
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <h3 className="text-lg font-black text-[#140152]">{p.title}</h3>
                                                    {p.badge && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#f5bb00]/20 text-[#140152] px-2 py-0.5 rounded-full">{p.badge}</span>
                                                    )}
                                                </div>
                                                <p className="text-gray-500 text-sm mb-5 leading-relaxed line-clamp-3">
                                                    {p.short_description || p.long_description}
                                                </p>
                                                <div className="w-full bg-amber-100 text-amber-700 rounded-xl py-2.5 text-center text-sm font-bold flex items-center justify-center gap-1.5">
                                                    <Lock className="w-4 h-4" /> Awaiting coordinator approval
                                                </div>
                                            </div>
                                        </Card>
                                    ) : (
                                        <Card className="bg-white/5 border border-white/10 overflow-hidden h-full">
                                            <div className="h-1.5 bg-white/10" />
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                                        <Icon className="w-6 h-6 text-white/50" />
                                                    </div>
                                                    {p.registration_open ? (
                                                        <span className="text-[11px] font-bold text-white/40 bg-white/5 px-2.5 py-1 rounded-full">Open</span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-white/40 bg-white/5 px-2.5 py-1 rounded-full">Closed</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <h3 className="text-lg font-black text-white">{p.title}</h3>
                                                    {p.badge && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#f5bb00]/20 text-[#f5bb00] px-2 py-0.5 rounded-full">{p.badge}</span>
                                                    )}
                                                </div>
                                                <p className="text-white/50 text-sm mb-5 leading-relaxed line-clamp-3">
                                                    {p.short_description || p.long_description}
                                                </p>
                                                {p.registration_open ? (
                                                    <Link href={`/youth/${p.slug}#join`} className="block">
                                                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
                                                            <Plus className="w-4 h-4 mr-1" /> {p.join_cta_text || 'Request to Join'}
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <div className="w-full border border-white/10 text-white/60 rounded-xl py-2.5 text-center text-sm font-bold">
                                                        Registration closed
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}

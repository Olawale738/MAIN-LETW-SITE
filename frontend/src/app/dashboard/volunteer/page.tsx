'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { serviceRequestApi } from '@/lib/api'
import { checkMembership, type Department } from '@/lib/dept-api'
import {
    Music, Baby, Users, BookOpen, Camera, Coffee, Zap, Shield, MessageCircle,
    Lock, CheckCircle2, ArrowRight, Loader2, Clock, Plus, HandHeart, Globe,
} from 'lucide-react'
import Link from 'next/link'

type Status = 'approved' | 'pending' | 'none'
type CoordMap = Record<string, boolean>   // key → is_coordinator

interface VDept {
    key: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    color: string
    kind: 'dept' | 'service'
    dept?: Department      // for kind === 'dept'
    service?: string       // for kind === 'service'
    dashboardUrl: string   // where an approved member goes
    requestUrl: string     // where to request/join
}

const DEPARTMENTS: VDept[] = [
    { key: 'worship',     name: 'Worship Team',           description: 'Singers, musicians, and sound engineers glorifying God through music.', icon: Music,          color: '#be123c', kind: 'dept', dept: 'choir',       dashboardUrl: '/services/alter-sound/dashboard', requestUrl: '/services/alter-sound/dashboard' },
    { key: 'children',    name: "Children's Ministry",    description: 'Teach, nurture, and protect the next generation in faith.',            icon: Baby,           color: '#0891b2', kind: 'dept', dept: 'children',    dashboardUrl: '/children/dashboard',             requestUrl: '/children/dashboard' },
    { key: 'ushering',    name: 'Ushering & Welcome',     description: 'Be the first smile people see. Create a warm atmosphere for all.',      icon: Users,          color: '#0369a1', kind: 'dept', dept: 'ushering',    dashboardUrl: '/services/ushering',              requestUrl: '/services/ushering' },
    { key: 'evangelism',  name: 'Evangelism Team',        description: 'Share the Gospel and reach souls for Christ with love and boldness.', icon: Globe,          color: '#dc2626', kind: 'dept', dept: 'evangelism',  dashboardUrl: '/services/evangelism',            requestUrl: '/services/evangelism' },
    { key: 'bible-study', name: 'Bible Study Facilitator', description: 'Lead small-group discussions and help members dig into the Word.',      icon: BookOpen,       color: '#7c3aed', kind: 'service', service: 'Bible study', dashboardUrl: '/bible-study/facilitator',        requestUrl: '/onboarding/services' },
    { key: 'media',       name: 'Media & Creative',       description: 'Photography, videography, graphics, and social media for the church.',  icon: Camera,         color: '#9333ea', kind: 'dept', dept: 'media',       dashboardUrl: '/services/media',                 requestUrl: '/services/media' },
    { key: 'hospitality', name: 'Hospitality Team',       description: 'Food, fellowship events, and making everyone feel at home.',            icon: Coffee,         color: '#b45309', kind: 'dept', dept: 'hospitality', dashboardUrl: '/services/hospitality',           requestUrl: '/services/hospitality' },
    { key: 'youth',       name: 'Youth Ministry',         description: 'Mentor and empower teens and young adults to lead lives of purpose.',   icon: Zap,            color: '#d97706', kind: 'dept', dept: 'youth',       dashboardUrl: '/youth/dashboard',                requestUrl: '/youth/dashboard' },
    { key: 'security',    name: 'Security & Safety',      description: 'Keep the church environment safe and orderly for all members.',         icon: Shield,         color: '#374151', kind: 'dept', dept: 'security',    dashboardUrl: '/services/security',              requestUrl: '/services/security' },
    { key: 'counselling', name: 'Counselling Support',    description: 'Assist our counselling team with admin, scheduling, and prayer support.', icon: MessageCircle, color: '#059669', kind: 'service', service: 'Counselling', dashboardUrl: '/services/counselling',       requestUrl: '/onboarding/services' },
]

export default function VolunteerDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')
    const [statuses, setStatuses] = useState<Record<string, Status>>({})
    const [coordinators, setCoordinators] = useState<CoordMap>({})

    useEffect(() => {
        const init = async () => {
            const loggedIn = localStorage.getItem('isLoggedIn') || localStorage.getItem('access_token')
            if (!loggedIn) { router.push('/auth/login?next=/dashboard/volunteer'); return }
            setUserName(localStorage.getItem('userName') || 'Volunteer')

            const result: Record<string, Status> = {}

            // Service-based departments (approved/pending from service requests)
            let approvedServices: string[] = []
            let pendingServices: string[] = []
            try {
                const reqs = await serviceRequestApi.getMyRequests()
                approvedServices = reqs.approved.map(r => r.service_name)
                pendingServices = reqs.pending.map(r => r.service_name)
            } catch { /* ignore */ }

            // Department-based: check membership in parallel
            const deptDepts = DEPARTMENTS.filter(d => d.kind === 'dept')
            const memResults = await Promise.allSettled(
                deptDepts.map(d => checkMembership(d.dept as Department))
            )
            const coordResult: CoordMap = {}
            deptDepts.forEach((d, i) => {
                const r = memResults[i]
                if (r.status === 'fulfilled' && r.value) {
                    if (r.value.is_member && r.value.is_active) result[d.key] = 'approved'
                    else if (r.value.is_member) result[d.key] = 'pending'
                    else result[d.key] = 'none'
                    coordResult[d.key] = !!(r.value.is_coordinator)
                } else result[d.key] = 'none'
            })
            setCoordinators(coordResult)

            DEPARTMENTS.filter(d => d.kind === 'service').forEach(d => {
                if (d.service && approvedServices.includes(d.service)) result[d.key] = 'approved'
                else if (d.service && pendingServices.includes(d.service)) result[d.key] = 'pending'
                else result[d.key] = 'none'
            })

            setStatuses(result)
            setLoading(false)
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#140152] to-[#220263]">
            {/* Hero */}
            <div className="px-4 md:px-12 pt-12 pb-20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#7c3aed] rounded-full blur-3xl opacity-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f5bb00] rounded-full blur-3xl opacity-10 pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Volunteer Dashboard</h1>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        Welcome, {userName}! {approvedCount > 0
                            ? `You have access to ${approvedCount} department${approvedCount !== 1 ? 's' : ''}.`
                            : 'Request to join a department below.'}
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
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 md:px-12 pb-20 -mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {DEPARTMENTS.map((d, i) => {
                        const status = statuses[d.key] ?? 'none'
                        const Icon = d.icon
                        return (
                            <motion.div key={d.key}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                {status === 'approved' ? (
                                    <Card className="bg-white hover:shadow-2xl transition-all overflow-hidden h-full">
                                        <div className="h-1.5" style={{ backgroundColor: d.color }} />
                                        <div className="p-6 flex flex-col h-full">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${d.color}1a` }}>
                                                    <Icon className="w-6 h-6" style={{ color: d.color }} />
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                                    </span>
                                                    {coordinators[d.key] && (
                                                        <span className="text-[10px] font-bold text-[#f5bb00] bg-[#140152] px-2 py-0.5 rounded-full">
                                                            👑 Coordinator
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-black text-[#140152] mb-1.5">{d.name}</h3>
                                            <p className="text-gray-500 text-sm mb-5 leading-relaxed flex-1">{d.description}</p>

                                            {/* Coordinator: show both Open Dashboard + Message Volunteers */}
                                            {coordinators[d.key] && d.kind === 'dept' ? (
                                                <div className="flex flex-col gap-2">
                                                    <Link href={`${d.dashboardUrl}?tab=team`} className="w-full">
                                                        <Button className="w-full text-white rounded-xl flex items-center gap-2" style={{ background: d.color }}>
                                                            <MessageCircle className="w-4 h-4" /> Message Volunteers
                                                        </Button>
                                                    </Link>
                                                    <Link href={d.dashboardUrl} className="w-full">
                                                        <Button variant="outline" className="w-full rounded-xl border-2 text-sm" style={{ borderColor: d.color, color: d.color }}>
                                                            Open Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            ) : (
                                                <Link href={d.dashboardUrl} className="w-full">
                                                    <Button className="w-full text-white rounded-xl" style={{ background: d.color }}>
                                                        Open Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                </Link>
                                            )}
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
                                            <h3 className="text-lg font-black text-[#140152] mb-1.5">{d.name}</h3>
                                            <p className="text-gray-500 text-sm mb-5 leading-relaxed">{d.description}</p>
                                            <div className="w-full bg-amber-100 text-amber-700 rounded-xl py-2.5 text-center text-sm font-bold flex items-center justify-center gap-1.5">
                                                <Lock className="w-4 h-4" /> Awaiting admin approval
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
                                                <span className="text-[11px] font-bold text-white/40 bg-white/5 px-2.5 py-1 rounded-full">Open spots</span>
                                            </div>
                                            <h3 className="text-lg font-black text-white mb-1.5">{d.name}</h3>
                                            <p className="text-white/50 text-sm mb-5 leading-relaxed">{d.description}</p>
                                            <Link href={d.requestUrl}>
                                                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
                                                    <Plus className="w-4 h-4 mr-1" /> Request to Join
                                                </Button>
                                            </Link>
                                        </div>
                                    </Card>
                                )}
                            </motion.div>
                        )
                    })}
                </div>

                {/* Footer note */}
                <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <HandHeart className="w-8 h-8 text-[#f5bb00] mx-auto mb-3" />
                    <p className="text-white/70 text-sm max-w-xl mx-auto mb-5">
                        Only departments approved by an admin are accessible. Once approved, open a dashboard to see
                        notices, events, attendance, and chat with your coordinator.
                    </p>
                    <Link href="/dashboard/messages"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
                        <MessageCircle className="w-4 h-4 text-[#f5bb00]" />
                        Open My Messages
                    </Link>
                </div>
            </main>
        </div>
    )
}

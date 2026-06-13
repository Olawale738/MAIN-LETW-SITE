'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import {
    Loader2, Sparkles, Plus, Users, UserCheck, Eye, EyeOff, AlertCircle,
    Settings, MessageCircle, ClipboardCheck, Megaphone, BookOpen, ChevronRight,
    Crown, Zap, ExternalLink, ArrowRight,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { youthProgramApi, YouthProgram } from '@/lib/api'

const getIcon = (name?: string) => {
    if (!name) return Sparkles
    const I = (LucideIcons as any)[name]
    return I || Sparkles
}

export default function AdminYouthOverviewPage() {
    const router = useRouter()
    const [programs, setPrograms] = useState<YouthProgram[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                const list = await youthProgramApi.admin.listAll()
                setPrograms(list)
            } catch (e) {
                // empty state shows
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
            </div>
        )
    }

    const activePrograms = programs.filter(p => p.is_active)
    const openForReg = activePrograms.filter(p => p.registration_open)
    const totalCoordinators = new Set(
        programs.flatMap(p => (p.coordinator_user_ids || []))
    ).size
    const programsWithoutCoord = activePrograms.filter(p => !(p.coordinator_user_ids || []).length)
    const programsWithoutAnnouncements = activePrograms.filter(p => !(p.announcements || []).length)
    const totalAnnouncements = programs.reduce((acc, p) => acc + (p.announcements || []).length, 0)
    const totalResources = programs.reduce((acc, p) => acc + (p.resources || []).length, 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3">
                        <Zap className="w-7 h-7 text-[#f5bb00]" />
                        Youth Overview
                    </h1>
                    <p className="text-gray-600 mt-1">
                        At-a-glance view of every youth program — what&apos;s live, who&apos;s coordinating, what needs attention.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <a href="/youth" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg transition-colors text-sm">
                        <Eye className="w-4 h-4" /> View live /youth <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <PremiumButton
                        onClick={() => router.push('/admin/youth/programs')}
                        className="bg-[#140152] text-white hover:bg-[#1d0175]"
                    >
                        <Settings className="w-4 h-4 mr-2" /> Manage Programs
                    </PremiumButton>
                </div>
            </div>

            {/* Top stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-l-4 border-l-[#140152]">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Total programs</p>
                        <p className="text-3xl font-black text-[#140152] mt-1">{programs.length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activePrograms.length} live · {programs.length - activePrograms.length} hidden</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-400">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Open for reg.</p>
                        <p className="text-3xl font-black text-emerald-500 mt-1">{openForReg.length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">accepting new members</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#f5bb00]">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Coordinators</p>
                        <p className="text-3xl font-black text-[#f5bb00] mt-1">{totalCoordinators}</p>
                        <p className="text-xs text-gray-500 mt-0.5">unique people assigned</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-400">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Announcements</p>
                        <p className="text-3xl font-black text-blue-500 mt-1">{totalAnnouncements}</p>
                        <p className="text-xs text-gray-500 mt-0.5">across all programs</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#7c3aed]">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Resources</p>
                        <p className="text-3xl font-black text-[#7c3aed] mt-1">{totalResources}</p>
                        <p className="text-xs text-gray-500 mt-0.5">PDFs, videos, links</p>
                    </CardContent>
                </Card>
            </div>

            {/* Needs attention */}
            {(programsWithoutCoord.length > 0 || programsWithoutAnnouncements.length > 0) && (
                <Card className="border-l-4 border-l-amber-400 bg-amber-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" /> Needs attention
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {programsWithoutCoord.length > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-amber-200">
                                <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#140152] text-sm">{programsWithoutCoord.length} program{programsWithoutCoord.length === 1 ? '' : 's'} without a coordinator</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{programsWithoutCoord.slice(0, 3).map(p => p.title).join(', ')}{programsWithoutCoord.length > 3 ? ` +${programsWithoutCoord.length - 3} more` : ''}</p>
                                </div>
                                <Link href="/admin/youth/programs" className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900">
                                    Assign <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                        {programsWithoutAnnouncements.length > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-amber-200">
                                <Megaphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#140152] text-sm">{programsWithoutAnnouncements.length} program{programsWithoutAnnouncements.length === 1 ? '' : 's'} with no announcements yet</p>
                                    <p className="text-xs text-gray-600 mt-0.5">Members may think the program isn&apos;t active</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Per-program grid */}
            <div>
                <div className="flex items-baseline gap-3 mb-4">
                    <h2 className="text-xl font-black text-[#140152]">Programs at a glance</h2>
                    <span className="text-xs text-gray-500">click a card to open its admin editor or dashboard</span>
                </div>
                {programs.length === 0 ? (
                    <Card>
                        <CardContent className="p-10 text-center">
                            <Sparkles className="w-12 h-12 text-[#f5bb00] mx-auto mb-3" />
                            <p className="font-black text-[#140152] text-lg mb-1">No programs yet</p>
                            <p className="text-sm text-gray-500 mb-4">Visit Manage Programs to seed the 8 defaults or create your own.</p>
                            <PremiumButton onClick={() => router.push('/admin/youth/programs')} className="bg-[#140152] text-white">
                                <Plus className="w-4 h-4 mr-2" /> Open Manage Programs
                            </PremiumButton>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...programs].sort((a, b) => a.order_index - b.order_index).map(p => {
                            const Icon = getIcon(p.icon)
                            const coordCount = (p.coordinator_user_ids || []).length
                            const annCount = (p.announcements || []).length
                            const resCount = (p.resources || []).length
                            return (
                                <Card key={p.id} className={`overflow-hidden border-l-4 ${p.is_active ? 'border-l-emerald-400' : 'border-l-gray-300'} hover:shadow-lg transition-shadow`}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#140152] to-[#1d0175] flex items-center justify-center shrink-0">
                                                <Icon className="w-6 h-6 text-[#f5bb00]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-[#140152] text-base leading-tight truncate">{p.title}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5 font-mono">/youth/{p.slug}</p>
                                            </div>
                                            {!p.is_active && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded shrink-0">
                                                    <EyeOff className="w-3 h-3" /> Hidden
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 leading-tight">Coord.</p>
                                                <p className={`text-base font-black mt-0.5 ${coordCount > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>{coordCount}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 leading-tight">Anns.</p>
                                                <p className="text-base font-black mt-0.5 text-blue-500">{annCount}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 leading-tight">Res.</p>
                                                <p className="text-base font-black mt-0.5 text-[#7c3aed]">{resCount}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <Link href={`/admin/youth/programs/${p.id}`} className="flex-1 bg-[#140152] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#1d0175] inline-flex items-center justify-center gap-1.5">
                                                Edit <ArrowRight className="w-3 h-3" />
                                            </Link>
                                            <a href={`/youth/${p.slug}/dashboard`} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-[#140152] text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-200 inline-flex items-center gap-1.5">
                                                <ExternalLink className="w-3 h-3" /> Dashboard
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/youth/programs')}>
                    <CardContent className="p-5 flex items-center gap-3">
                        <Settings className="w-10 h-10 text-[#140152] bg-[#140152]/10 p-2 rounded-xl" />
                        <div className="flex-1">
                            <p className="font-black text-[#140152]">Manage Programs</p>
                            <p className="text-xs text-gray-500">Create, edit, reorder, assign coordinators</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/youth/coordinator')}>
                    <CardContent className="p-5 flex items-center gap-3">
                        <Crown className="w-10 h-10 text-[#f5bb00] bg-[#f5bb00]/10 p-2 rounded-xl" />
                        <div className="flex-1">
                            <p className="font-black text-[#140152]">Youth Coordinator</p>
                            <p className="text-xs text-gray-500">Overall ministry coordinator view</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/coordinators')}>
                    <CardContent className="p-5 flex items-center gap-3">
                        <Users className="w-10 h-10 text-[#7c3aed] bg-[#7c3aed]/10 p-2 rounded-xl" />
                        <div className="flex-1">
                            <p className="font-black text-[#140152]">All Department Coords</p>
                            <p className="text-xs text-gray-500">Assign department coordinators</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
    Loader2, CheckCircle, XCircle, Crown, Mail, Clock,
    Users, RefreshCw, Bell, Music, Camera, Coffee,
    User, Shield, Mic2, Heart, BookOpen, MessageCircle,
} from 'lucide-react'
import Link from 'next/link'
import {
    adminPendingDeptRequests, adminApproveDeptMember, adminRejectDeptMember,
    adminAssignCoordinator,
    type PendingDeptRequest, type Department,
} from '@/lib/dept-api'
import { serviceRequestApi, type ServiceRequest } from '@/lib/api'

// ─── Config ──────────────────────────────────────────────────────────────────

const DEPT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    choir:       { label: 'Worship Team',          icon: Music,        color: '#be123c', bg: '#fee2e2' },
    media:       { label: 'Media & Creative',       icon: Camera,       color: '#9333ea', bg: '#f3e8ff' },
    hospitality: { label: 'Hospitality Team',       icon: Coffee,       color: '#b45309', bg: '#fef3c7' },
    ushering:    { label: 'Ushering & Welcome',     icon: Users,        color: '#0369a1', bg: '#e0f2fe' },
    security:    { label: 'Security & Safety',      icon: Shield,       color: '#374151', bg: '#f3f4f6' },
    youth:       { label: 'Youth Ministry',         icon: Mic2,         color: '#d97706', bg: '#fef9c3' },
    children:    { label: "Children's Ministry",    icon: Heart,        color: '#0891b2', bg: '#e0f7fa' },
}

// ─── Dept Request Card ────────────────────────────────────────────────────────

function DeptRequestCard({
    req,
    onApprove,
    onReject,
    onAssignCoord,
    busy,
}: {
    req: PendingDeptRequest
    onApprove: (r: PendingDeptRequest) => void
    onReject: (r: PendingDeptRequest) => void
    onAssignCoord: (r: PendingDeptRequest) => void
    busy: string | null
}) {
    const cfg = DEPT_CONFIG[req.department]
    const Icon = cfg?.icon ?? User
    const isBusy = busy === req.id
    const daysAgo = req.joined_at
        ? Math.floor((Date.now() - new Date(req.joined_at).getTime()) / 86_400_000)
        : null

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                {/* Dept icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cfg?.bg || '#f3f4f6' }}>
                    <Icon className="w-5 h-5" style={{ color: cfg?.color || '#374151' }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="font-black text-[#140152]">{req.name}</p>
                            <a href={`mailto:${req.email}`}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {req.email}
                            </a>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                            style={{ background: cfg?.bg || '#f3f4f6', color: cfg?.color || '#374151' }}>
                            {cfg?.label || req.department}
                        </span>
                    </div>

                    {daysAgo !== null && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 mb-3">
                            <Clock className="w-3 h-3" />
                            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => onApprove(req)} disabled={isBusy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors">
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve
                        </button>
                        <button onClick={() => onReject(req)} disabled={isBusy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button onClick={() => onAssignCoord(req)} disabled={isBusy}
                            title="Approve and make them coordinator"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5bb00]/10 text-[#92400e] border border-[#f5bb00]/30 rounded-xl text-xs font-bold hover:bg-[#f5bb00]/20 disabled:opacity-50 transition-colors">
                            <Crown className="w-3.5 h-3.5 text-[#f5bb00]" /> Make Coordinator
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Service Request Card ─────────────────────────────────────────────────────

function ServiceReqCard({
    req,
    onApprove,
    onReject,
    busy,
}: {
    req: ServiceRequest
    onApprove: (r: ServiceRequest) => void
    onReject: (r: ServiceRequest) => void
    busy: string | null
}) {
    const isBusy = busy === req.id
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#140152]/5 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-[#140152]" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="font-black text-[#140152]">{req.user_name || 'Unknown'}</p>
                            {req.user_email && (
                                <a href={`mailto:${req.user_email}`}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> {req.user_email}
                                </a>
                            )}
                        </div>
                        <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full shrink-0">
                            {req.service_name}
                        </span>
                    </div>
                    {req.message && (
                        <p className="text-xs text-gray-500 italic mt-1 mb-3 line-clamp-2">"{req.message}"</p>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => onApprove(req)} disabled={isBusy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors">
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve
                        </button>
                        <button onClick={() => onReject(req)} disabled={isBusy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
    const [deptPending, setDeptPending] = useState<PendingDeptRequest[]>([])
    const [svcPending, setSvcPending]   = useState<ServiceRequest[]>([])
    const [loading, setLoading]         = useState(true)
    const [busy, setBusy]               = useState<string | null>(null)
    const [toast, setToast]             = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [deptRes, svcRes] = await Promise.all([
                adminPendingDeptRequests(),
                serviceRequestApi.getAllRequests('pending').catch(() => ({ requests: [] })),
            ])
            setDeptPending(deptRes)
            setSvcPending(svcRes.requests)
        } catch (e: any) {
            showToast(e?.message || 'Failed to load', 'err')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    // ── Dept actions ──────────────────────────────────────────────────────────

    const approveD = async (r: PendingDeptRequest) => {
        setBusy(r.id)
        try {
            await adminApproveDeptMember(r.department as Department, r.user_id)
            setDeptPending(p => p.filter(x => x.id !== r.id))
            showToast(`✅ ${r.name} approved for ${DEPT_CONFIG[r.department]?.label || r.department}`)
        } catch (e: any) {
            showToast(e?.message || 'Failed to approve', 'err')
        } finally { setBusy(null) }
    }

    const rejectD = async (r: PendingDeptRequest) => {
        if (!confirm(`Decline ${r.name}'s request to join ${DEPT_CONFIG[r.department]?.label || r.department}?`)) return
        setBusy(r.id)
        try {
            await adminRejectDeptMember(r.department as Department, r.user_id)
            setDeptPending(p => p.filter(x => x.id !== r.id))
            showToast(`Request from ${r.name} declined`)
        } catch (e: any) {
            showToast(e?.message || 'Failed to decline', 'err')
        } finally { setBusy(null) }
    }

    const assignCoord = async (r: PendingDeptRequest) => {
        if (!confirm(`Approve ${r.name} AND make them the ${DEPT_CONFIG[r.department]?.label || r.department} Coordinator? A direct-message thread will be opened between you and them.`)) return
        setBusy(r.id)
        try {
            const res = await adminAssignCoordinator(r.department as Department, r.user_id, true)
            setDeptPending(p => p.filter(x => x.id !== r.id))
            showToast(`🎖️ ${r.name} is now the ${DEPT_CONFIG[r.department]?.label || r.department} Coordinator!`)
            if (res.conversation_id) {
                // Give the admin an easy way to open the DM
                setTimeout(() => {
                    if (confirm(`A direct-message thread was opened with ${r.name}. Open it now?`)) {
                        window.location.href = '/admin/chat'
                    }
                }, 600)
            }
        } catch (e: any) {
            showToast(e?.message || 'Failed', 'err')
        } finally { setBusy(null) }
    }

    // ── Service request actions ───────────────────────────────────────────────

    const approveS = async (r: ServiceRequest) => {
        setBusy(r.id)
        try {
            await serviceRequestApi.approve(r.id)
            setSvcPending(p => p.filter(x => x.id !== r.id))
            showToast(`✅ ${r.user_name || 'Request'} approved for ${r.service_name}`)
        } catch (e: any) {
            showToast(e?.message || 'Failed', 'err')
        } finally { setBusy(null) }
    }

    const rejectS = async (r: ServiceRequest) => {
        if (!confirm(`Decline ${r.user_name}'s request for ${r.service_name}?`)) return
        setBusy(r.id)
        try {
            await serviceRequestApi.reject(r.id)
            setSvcPending(p => p.filter(x => x.id !== r.id))
            showToast(`Request from ${r.user_name} declined`)
        } catch (e: any) {
            showToast(e?.message || 'Failed', 'err')
        } finally { setBusy(null) }
    }

    const total = deptPending.length + svcPending.length

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl transition-all
                    ${toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#140152] flex items-center gap-2">
                        <Bell className="w-6 h-6 text-[#f5bb00]" /> Pending Approvals
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        All join requests waiting for your decision — dept memberships and services
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {total > 0 && (
                        <span className="text-2xl font-black text-[#140152] bg-amber-100 text-amber-800 px-4 py-2 rounded-xl">
                            {total} pending
                        </span>
                    )}
                    <button onClick={load} disabled={loading}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#140152] bg-[#140152]/5 hover:bg-[#140152]/10 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-10 h-10 animate-spin text-[#140152]/30" />
                </div>
            ) : total === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <p className="text-xl font-black text-gray-500">All caught up!</p>
                    <p className="text-gray-400 text-sm mt-1">No pending requests at the moment.</p>
                </div>
            ) : (
                <>
                    {/* Department join requests */}
                    {deptPending.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-black text-[#140152] flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#f5bb00]" />
                                    Department Join Requests
                                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{deptPending.length}</span>
                                </h2>
                                <Link href="/admin/volunteers" className="text-xs text-[#140152] underline hover:no-underline">
                                    View all dept members →
                                </Link>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {deptPending.map(r => (
                                    <DeptRequestCard key={r.id} req={r}
                                        onApprove={approveD} onReject={rejectD}
                                        onAssignCoord={assignCoord} busy={busy} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Service requests */}
                    {svcPending.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-black text-[#140152] flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#f5bb00]" />
                                    Service Requests
                                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{svcPending.length}</span>
                                </h2>
                                <Link href="/admin/service-requests" className="text-xs text-[#140152] underline hover:no-underline">
                                    Full view →
                                </Link>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {svcPending.map(r => (
                                    <ServiceReqCard key={r.id} req={r}
                                        onApprove={approveS} onReject={rejectS} busy={busy} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Coordinator info box */}
            <div className="bg-gradient-to-r from-[#140152]/5 to-[#f5bb00]/10 rounded-2xl p-5 border border-[#140152]/10">
                <div className="flex items-start gap-3">
                    <Crown className="w-5 h-5 text-[#f5bb00] mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-black text-[#140152] mb-1">About Coordinator Assignment</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Use <strong>"Make Coordinator"</strong> to approve a member AND simultaneously appoint them as the department coordinator. They'll receive a notification, get elevated permissions to manage dept members and activities, and a direct-message thread will be opened between you and them for ongoing communication.
                        </p>
                        <Link href="/admin/volunteers" className="text-xs font-bold text-[#140152] underline hover:no-underline mt-2 inline-block">
                            View coordinator assignments in Volunteer Directory →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

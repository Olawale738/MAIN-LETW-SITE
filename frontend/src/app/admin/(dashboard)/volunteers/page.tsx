'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    HandHeart, Phone, Mail, CalendarDays, Loader2,
    Search, Copy, CheckCheck, Users, BookOpen, Music,
    Camera, Coffee, Mic2, Shield, Heart, ChevronDown, ChevronUp,
    Trash2, AlertTriangle, X, PauseCircle, Play, Check, UserMinus, Crown
} from 'lucide-react'
import { serviceRequestApi, ServiceRequest } from '@/lib/api'
import {
    adminAllDeptMembers, updateMember, removeMember, adminAssignCoordinator,
    adminApproveDeptMember, adminRejectDeptMember,
    type AdminDeptMember, type Department
} from '@/lib/dept-api'

const DEPT_LABELS: Record<string, string> = {
    choir: 'Worship Team', media: 'Media & Creative', hospitality: 'Hospitality Team',
    ushering: 'Ushering & Welcome', security: 'Security & Safety',
    youth: 'Youth Ministry', children: "Children's Ministry",
    'Bible study': 'Bible Study Facilitator', 'Counselling': 'Counselling Support',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

const DEPT_ICONS: Record<string, React.ReactNode> = {
    'Worship Team':           <Music   className="w-4 h-4" />,
    "Children's Ministry":    <Heart   className="w-4 h-4" />,
    'Ushering & Welcome':     <Users   className="w-4 h-4" />,
    'Bible Study Facilitator':<BookOpen className="w-4 h-4" />,
    'Media & Creative':       <Camera  className="w-4 h-4" />,
    'Hospitality Team':       <Coffee  className="w-4 h-4" />,
    'Youth Ministry':         <Mic2    className="w-4 h-4" />,
    'Security & Safety':      <Shield  className="w-4 h-4" />,
    'Counselling Support':    <Heart   className="w-4 h-4" />,
}

// ── Volunteer Card ───────────────────────────────────────────────────────────

function VolunteerCard({ request, onDelete, onSuspend, onReinstate }: {
    request: ServiceRequest
    onDelete: (id: string) => void
    onSuspend: (id: string) => void
    onReinstate: (id: string) => void
}) {
    const isSuspended = String(request.status) === 'suspended'
    const parsed = parseVolunteerMessage(request.message)
    // For service-based types (Bible study, Counselling), fall back to service_name
    const department = parsed.department || (request.service_name !== 'Volunteer' ? DEPT_LABELS[request.service_name] || request.service_name : undefined)
    const { availability, phone, experience } = parsed
    const [copied, setCopied] = useState(false)
    const [showExp, setShowExp] = useState(false)

    const copyPhone = () => {
        if (!phone) return
        navigator.clipboard.writeText(phone)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const approvedDate = request.reviewed_at
        ? new Date(request.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : new Date(request.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
            {/* Header stripe */}
            <div className="h-2 bg-gradient-to-r from-[#140152] to-purple-700" />

            <CardContent className="p-5 space-y-4">
                {/* Name + email */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#140152] flex items-center justify-center text-white font-black text-lg shrink-0">
                            {(request.user_name || 'V').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-black text-[#140152] leading-tight">{request.user_name || 'Unknown'}</p>
                            {request.user_email && (
                                <a href={`mailto:${request.user_email}`}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                                    <Mail className="w-3 h-3" />
                                    {request.user_email}
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {isSuspended ? (
                            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">⏸ Suspended</span>
                        ) : (
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">✓ Approved</span>
                        )}
                        {isSuspended ? (
                            <button onClick={() => onReinstate(request.id)} title="Reinstate volunteer"
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                <Play className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={() => onSuspend(request.id)} title="Suspend volunteer"
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                <PauseCircle className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => onDelete(request.id)} title="Delete volunteer"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Department */}
                {department && (
                    <div className="flex items-center gap-2 bg-[#140152]/5 rounded-xl px-3 py-2">
                        <span className="text-[#140152]">
                            {DEPT_ICONS[department] ?? <HandHeart className="w-4 h-4" />}
                        </span>
                        <span className="font-bold text-[#140152] text-sm">{department}</span>
                    </div>
                )}

                {/* Availability + date */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {availability && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <CalendarDays className="w-4 h-4 text-[#f5bb00] shrink-0" />
                            <span>{availability}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <span>Approved {approvedDate}</span>
                    </div>
                </div>

                {/* Phone — primary contact action */}
                {phone ? (
                    <div className="flex items-center gap-2">
                        <a href={`tel:${phone}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#140152] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#1d0175] transition-colors">
                            <Phone className="w-4 h-4" />
                            Call {phone}
                        </a>
                        <button
                            onClick={copyPhone}
                            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500"
                            title="Copy phone number"
                        >
                            {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        No phone number provided — contact via email above
                    </div>
                )}

                {/* Experience accordion */}
                {experience && (
                    <div>
                        <button
                            onClick={() => setShowExp(v => !v)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            {showExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {showExp ? 'Hide experience' : 'View experience / skills'}
                        </button>
                        {showExp && (
                            <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
                                {experience || <span className="text-gray-400 italic">Not provided</span>}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
    volunteer,
    onConfirm,
    onClose,
    deleting,
}: {
    volunteer: ServiceRequest | null
    onConfirm: () => void
    onClose: () => void
    deleting: boolean
}) {
    if (!volunteer) return null
    const { department } = parseVolunteerMessage(volunteer.message)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Remove Volunteer</h3>
                            <p className="text-red-100 text-sm">This will revoke their volunteer access</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500">You are about to remove:</p>
                        <p className="font-bold text-[#140152] mt-1">{volunteer.user_name || 'Unknown'}</p>
                        {department && <p className="text-sm text-gray-500 mt-0.5">Department: {department}</p>}
                    </div>
                    <p className="text-sm text-gray-600">
                        The volunteer will lose access and receive a notification. This action cannot be undone.
                    </p>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex gap-3 justify-end">
                    <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
                    <Button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Remove Volunteer
                    </Button>
                </div>
            </div>
        </div>
    )
}


// ── Department Volunteers (membership-based, matches the volunteer dashboard) ──

function DeptMembersSection() {
    const [members, setMembers] = useState<AdminDeptMember[]>([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState<string | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        setLoadError(null)
        try { setMembers(await adminAllDeptMembers()) }
        catch (e: any) {
            const status = e?.status ?? e?.response?.status
            if (status === 404 || /not found|404/i.test(e?.message || '')) {
                setLoadError('The /admin/department-members endpoint returned 404 — the backend needs to be redeployed.')
            } else if (status === 403 || status === 401) {
                setLoadError('Permission denied — make sure you are signed in as an admin.')
            } else {
                setLoadError(e?.message || 'Failed to load department members. Check the backend logs.')
            }
        }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const act = async (m: AdminDeptMember, action: 'approve' | 'suspend' | 'remove' | 'coordinator' | 'uncoord') => {
        const key = m.id + action
        const deptLabel = DEPT_LABELS[m.department] ?? m.department
        setBusy(key)
        try {
            if (action === 'remove') {
                if (!confirm(`Remove ${m.name} from ${deptLabel}?`)) { setBusy(null); return }
                await adminRejectDeptMember(m.department as Department, m.user_id)
            } else if (action === 'approve') {
                await adminApproveDeptMember(m.department as Department, m.user_id)
            } else if (action === 'suspend') {
                await updateMember(m.department as Department, m.user_id, { is_active: false })
            } else if (action === 'coordinator') {
                const openDm = confirm(
                    `Make ${m.name} the ${deptLabel} Coordinator?\n\n` +
                    `This will:\n• Approve and elevate their access\n• Send them a notification\n• Open a direct-message channel between you and them\n\n` +
                    `Click OK to confirm.`
                )
                if (!openDm && openDm !== false) { setBusy(null); return }  // cancelled
                const res = await adminAssignCoordinator(m.department as Department, m.user_id, openDm)
                if (res.conversation_id) {
                    setTimeout(() => {
                        if (confirm(`${m.name} is now the ${deptLabel} Coordinator! A direct-message thread was opened. Open it now?`)) {
                            window.location.href = '/admin/chat'
                        }
                    }, 400)
                }
            } else if (action === 'uncoord') {
                await updateMember(m.department as Department, m.user_id, { is_coordinator: false } as never)
            }
            await load()
        } catch (e: any) {
            const status = e?.status
            alert(status === 404 ? 'This action needs the backend to be redeployed.' : `Action failed: ${e?.message || 'error'}`)
        } finally { setBusy(null) }
    }

    const byDept = members.reduce((acc, m) => {
        (acc[m.department] ??= []).push(m); return acc
    }, {} as Record<string, AdminDeptMember[]>)
    const depts = Object.keys(byDept).sort()
    const pendingCount = members.filter(m => !m.is_active).length

    return (
        <Card className="border border-gray-100">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                    <CardTitle className="text-lg font-black text-[#140152] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#f5bb00]" /> Department Volunteers
                        {pendingCount > 0 && <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{pendingCount} pending approval</span>}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">Live from each volunteer's dashboard. Approve pending requests, suspend, or remove access.</p>
                </div>
                <button onClick={load} disabled={loading}
                    className="shrink-0 text-xs font-bold text-[#140152] bg-[#140152]/5 hover:bg-[#140152]/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '↻'} Refresh
                </button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-[#140152]/40" /></div>
                ) : loadError ? (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-4 space-y-2">
                        <p className="text-sm font-bold text-red-700">⚠ Could not load department volunteers</p>
                        <p className="text-xs text-red-600">{loadError}</p>
                        <button onClick={load} className="text-xs font-bold text-red-700 underline hover:no-underline">
                            Retry
                        </button>
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-400">
                        No department volunteers yet.
                        <button onClick={load} className="block mx-auto mt-2 text-xs text-[#140152] underline hover:no-underline">Refresh</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {depts.map(dept => (
                            <div key={dept}>
                                <h3 className="text-sm font-black text-[#140152] mb-2">{DEPT_LABELS[dept] ?? dept}
                                    <span className="text-xs font-medium text-gray-400 ml-2">{byDept[dept].length} member{byDept[dept].length !== 1 ? 's' : ''}</span>
                                </h3>
                                <div className="space-y-2">
                                    {byDept[dept].map(m => (
                                        <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 flex-wrap">
                                            <div className="w-9 h-9 rounded-full bg-[#140152] text-white flex items-center justify-center font-black text-sm shrink-0">
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-[#140152] truncate">{m.name}
                                                    {m.is_coordinator && <Crown className="w-3.5 h-3.5 text-[#f5bb00] inline ml-1" />}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">{m.email}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {m.is_active ? '✓ Active' : '⌛ Pending'}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {!m.is_active ? (
                                                    <button onClick={() => act(m, 'approve')} disabled={!!busy} title="Approve"
                                                        className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                                                        <Check className="w-3.5 h-3.5" /> Approve
                                                    </button>
                                                ) : (
                                                    <button onClick={() => act(m, 'suspend')} disabled={!!busy} title="Suspend"
                                                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"><PauseCircle className="w-4 h-4" /></button>
                                                )}
                                                {m.is_active && (
                                                    <button onClick={() => act(m, m.is_coordinator ? 'uncoord' : 'coordinator')} disabled={!!busy}
                                                        title={m.is_coordinator ? 'Remove coordinator' : 'Make coordinator'}
                                                        className={`p-1.5 rounded-lg ${m.is_coordinator ? 'text-gray-400 hover:bg-gray-100' : 'text-[#f5bb00] hover:bg-yellow-50'}`}>
                                                        <Crown className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => act(m, 'remove')} disabled={!!busy} title="Remove"
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><UserMinus className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function VolunteersPage() {
    const [volunteers, setVolunteers] = useState<ServiceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [deptFilter, setDeptFilter] = useState<string>('All')
    const [deletingVolunteer, setDeletingVolunteer] = useState<ServiceRequest | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const load = async () => {
        try {
            // Only service_name === 'Volunteer' belongs in this section.
            // 'Bible study' and 'Counselling' are regular services, not volunteer roles.
            const VOLUNTEER_SERVICES = ['Volunteer']
            const [approvedRes, suspendedRes] = await Promise.all([
                serviceRequestApi.getAllRequests('approved'),
                serviceRequestApi.getAllRequests('suspended').catch(() => ({ requests: [] })),
            ])
            const all = [...approvedRes.requests, ...suspendedRes.requests]
            setVolunteers(all.filter(r => VOLUNTEER_SERVICES.includes(r.service_name)))
        } catch (e: any) {
            setError(e.message || 'Failed to load volunteers')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const describeErr = (e: any, action: string) => {
        const status = e?.status ?? e?.response?.status
        if (status === 404 || status === 405 || /not found|404|405/i.test(e?.message || '')) {
            return `Could not ${action}: the server endpoint isn't available yet. The backend needs to be redeployed for this feature.`
        }
        if (status === 401 || status === 403) return `Could not ${action}: you don't have permission (admin only). Try signing in again.`
        return `Could not ${action}: ${e?.message || 'unknown error'}`
    }

    const handleDeleteConfirm = async () => {
        if (!deletingVolunteer) return
        setIsDeleting(true)
        try {
            await serviceRequestApi.deleteRequest(deletingVolunteer.id)
            setVolunteers(prev => prev.filter(v => v.id !== deletingVolunteer.id))
            setDeletingVolunteer(null)
        } catch (e: any) {
            const msg = describeErr(e, 'delete volunteer')
            setError(msg); alert(msg)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSuspend = async (id: string) => {
        if (!confirm('Suspend this volunteer? Their access is paused until you reinstate them.')) return
        try {
            const updated = await serviceRequestApi.suspend(id)
            // Merge so we never lose user_name / user_email if the response omits them
            setVolunteers(prev => prev.map(v => v.id === id
                ? { ...v, ...updated, user_name: updated.user_name || v.user_name, user_email: updated.user_email || v.user_email }
                : v
            ))
        } catch (e: any) { const msg = describeErr(e, 'suspend volunteer'); setError(msg); alert(msg) }
    }

    const handleReinstate = async (id: string) => {
        try {
            const updated = await serviceRequestApi.reinstate(id)
            setVolunteers(prev => prev.map(v => v.id === id
                ? { ...v, ...updated, user_name: updated.user_name || v.user_name, user_email: updated.user_email || v.user_email }
                : v
            ))
        } catch (e: any) { const msg = describeErr(e, 'reinstate volunteer'); setError(msg); alert(msg) }
    }

    // Collect unique departments from all volunteers
    const departments = ['All', ...Array.from(new Set(
        volunteers
            .map(v => parseVolunteerMessage(v.message).department)
            .filter(Boolean) as string[]
    )).sort()]

    const filtered = volunteers.filter(v => {
        const { department, phone } = parseVolunteerMessage(v.message)
        const name   = (v.user_name  || '').toLowerCase()
        const email  = (v.user_email || '').toLowerCase()
        const dept   = (department   || '').toLowerCase()
        const ph     = (phone        || '').toLowerCase()
        const q      = search.toLowerCase()

        const matchesSearch = !q || name.includes(q) || email.includes(q) || dept.includes(q) || ph.includes(q)
        const matchesDept   = deptFilter === 'All' || department === deptFilter

        return matchesSearch && matchesDept
    })

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#140152] flex items-center gap-2">
                        <HandHeart className="w-6 h-6 text-[#f5bb00]" />
                        Volunteer Directory
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        All approved volunteers — call or email to assign them their first task
                    </p>
                </div>
                <div className="bg-[#140152] text-white rounded-2xl px-4 py-2 text-center">
                    <span className="text-2xl font-black">{volunteers.length}</span>
                    <p className="text-xs text-white/70 uppercase tracking-widest">Approved</p>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email, phone, department…"
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white"
                    />
                </div>

                {/* Department filter */}
                <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 bg-white min-w-[200px]"
                >
                    {departments.map(d => (
                        <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                    ))}
                </select>
            </div>

            {/* Stats by department */}
            {!loading && volunteers.length > 0 && deptFilter === 'All' && !search && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {departments.slice(1).map(dept => {
                        const count = volunteers.filter(v => parseVolunteerMessage(v.message).department === dept).length
                        return (
                            <button
                                key={dept}
                                onClick={() => setDeptFilter(dept)}
                                className="bg-white border border-gray-100 rounded-2xl p-3 text-left hover:border-[#140152]/30 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-1 text-[#140152]">
                                    {DEPT_ICONS[dept] ?? <HandHeart className="w-4 h-4" />}
                                    <span className="text-xs font-bold truncate">{dept}</span>
                                </div>
                                <span className="text-2xl font-black text-[#140152]">{count}</span>
                                <p className="text-xs text-gray-400">volunteer{count !== 1 ? 's' : ''}</p>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Department volunteers (membership-based — matches each volunteer dashboard) */}
            <DeptMembersSection />

            {/* Service-request volunteers (legacy "Volunteer" applications) */}
            <h2 className="text-sm font-black text-[#140152] uppercase tracking-wider pt-2">Volunteer Applications</h2>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-10 h-10 animate-spin text-[#140152]/30" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <HandHeart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-semibold">
                        {volunteers.length === 0
                            ? 'No approved volunteers yet'
                            : 'No volunteers match your search'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(v => (
                        <VolunteerCard
                            key={v.id}
                            request={v}
                            onDelete={id => setDeletingVolunteer(volunteers.find(x => x.id === id) ?? null)}
                            onSuspend={handleSuspend}
                            onReinstate={handleReinstate}
                        />
                    ))}
                </div>
            )}

            <DeleteModal
                volunteer={deletingVolunteer}
                onConfirm={handleDeleteConfirm}
                onClose={() => setDeletingVolunteer(null)}
                deleting={isDeleting}
            />
        </div>
    )
}

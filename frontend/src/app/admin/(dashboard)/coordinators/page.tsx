'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users, Plus, Trash2, Loader2, AlertCircle, Check, X,
    Music, Baby, Users as UsersIcon, Heart, Camera, Coffee, Zap, Shield, MessageCircle, Globe
} from 'lucide-react'
import { dashboardApi, type AdminUser, type Department } from '@/lib/api'
import * as deptApi from '@/lib/dept-api'

interface DeptInfo {
    key: string
    dept: Department
    name: string
    icon: React.ComponentType<{ className?: string }>
    color: string
}

const DEPARTMENTS: DeptInfo[] = [
    { key: 'choir', dept: 'choir', name: 'Worship Team (Choir)', icon: Music, color: '#be123c' },
    { key: 'children', dept: 'children', name: "Children's Ministry", icon: Baby, color: '#0891b2' },
    { key: 'ushering', dept: 'ushering', name: 'Ushering & Welcome', icon: UsersIcon, color: '#0369a1' },
    { key: 'evangelism', dept: 'evangelism', name: 'Evangelism Team', icon: Globe, color: '#dc2626' },
    { key: 'media', dept: 'media', name: 'Media & Creative', icon: Camera, color: '#9333ea' },
    { key: 'hospitality', dept: 'hospitality', name: 'Hospitality Team', icon: Coffee, color: '#b45309' },
    { key: 'youth', dept: 'youth', name: 'Youth Ministry', icon: Zap, color: '#d97706' },
    { key: 'security', dept: 'security', name: 'Security & Safety', icon: Shield, color: '#374151' },
]

interface Coordinator {
    user_id: string
    user_name: string
    dept: Department
}

export default function CoordinatorsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<AdminUser[]>([])
    const [coordinators, setCoordinators] = useState<Coordinator[]>([])
    const [saving, setSaving] = useState(false)
    const [expandedDept, setExpandedDept] = useState<string | null>(null)
    const [selectedUser, setSelectedUser] = useState<{ [key: string]: string }>({})

    useEffect(() => {
        const init = async () => {
            try {
                const [u, members] = await Promise.all([
                    dashboardApi.getUsers(undefined, 500, 0).then(r => r.users),
                    deptApi.adminAllDeptMembers().catch(() => [])
                ])
                setUsers(u)
                // Filter to only coordinators
                const coords = members
                    .filter(m => m.is_coordinator)
                    .map(m => ({
                        user_id: m.user_id,
                        user_name: m.name,
                        dept: m.department as Department,
                    }))
                setCoordinators(coords)
            } catch (e) {
                console.error(e)
                alert('Failed to load data')
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    const getDeptCoordinator = (dept: Department) => {
        return coordinators.find(c => c.dept === dept)
    }

    const handleAssign = async (dept: Department) => {
        const userId = selectedUser[dept]
        if (!userId) return

        setSaving(true)
        try {
            await deptApi.adminAssignCoordinator(dept, userId, false)
            const user = users.find(u => u.id === userId)

            // Update local state
            setCoordinators(prev => [...prev.filter(c => c.dept !== dept), {
                user_id: userId,
                user_name: user?.name || 'Unknown',
                dept,
            }])
            setSelectedUser(prev => ({ ...prev, [dept]: '' }))
            setExpandedDept(null)
            alert(`${user?.name || 'User'} assigned as coordinator!`)
        } catch (e) {
            console.error(e)
            alert('Failed to assign coordinator')
        } finally {
            setSaving(false)
        }
    }

    const handleRemove = async (dept: Department, userId: string) => {
        if (!confirm('Remove this coordinator?')) return

        setSaving(true)
        try {
            await deptApi.updateMember(dept, userId, { is_coordinator: false })
            setCoordinators(prev => prev.filter(c => !(c.dept === dept && c.user_id === userId)))
            alert('Coordinator removed')
        } catch (e) {
            console.error(e)
            alert('Failed to remove coordinator')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-[#140152] mb-2">Department Coordinators</h1>
                    <p className="text-gray-600">Assign and manage coordinators for each department</p>
                </div>

                {/* Coordinators Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {DEPARTMENTS.map(dept => {
                        const Icon = dept.icon
                        const current = getDeptCoordinator(dept.dept)
                        const isExpanded = expandedDept === dept.key

                        return (
                            <Card key={dept.key} className="overflow-hidden hover:shadow-lg transition-all">
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                                                style={{ backgroundColor: dept.color }}
                                            >
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{dept.name}</h3>
                                                <p className="text-sm text-gray-500">{dept.dept}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Coordinator */}
                                    {current ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-green-600" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-green-900">{current.user_name}</p>
                                                        <p className="text-xs text-green-700">Currently assigned</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(dept.dept, current.user_id)}
                                                    disabled={saving}
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                                                    title="Remove coordinator"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                                <p className="text-sm text-amber-700 font-semibold">No coordinator assigned</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Assign Button */}
                                    <Button
                                        onClick={() => setExpandedDept(isExpanded ? null : dept.key)}
                                        className="w-full mb-4"
                                        style={{ backgroundColor: dept.color }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {current ? 'Change Coordinator' : 'Assign Coordinator'}
                                    </Button>

                                    {/* Selection Dropdown */}
                                    {isExpanded && (
                                        <div className="space-y-3 border-t pt-4">
                                            <select
                                                value={selectedUser[dept.dept] || ''}
                                                onChange={(e) => setSelectedUser(prev => ({ ...prev, [dept.dept]: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/50"
                                            >
                                                <option value="">-- Select a user --</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name} ({u.email})
                                                    </option>
                                                ))}
                                            </select>

                                            <Button
                                                onClick={() => handleAssign(dept.dept)}
                                                disabled={!selectedUser[dept.dept] || saving}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                                {saving ? 'Assigning...' : 'Confirm Assignment'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>

                {/* Info Box */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex gap-4">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-blue-900 mb-1">How Coordinators Work</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>✓ Coordinators manage their department members</li>
                                <li>✓ They can message members directly via the department dashboard</li>
                                <li>✓ They can approve/reject new member requests</li>
                                <li>✓ They can add members to activities and events</li>
                                <li>✓ Only one coordinator per department at a time</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

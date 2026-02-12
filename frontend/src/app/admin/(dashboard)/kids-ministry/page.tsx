'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { Loader2, X, Eye, Trash2, Baby, User, Mail, Phone } from 'lucide-react'
import { kidsMinistryApi, KidsMinistryRegistration } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminKidsMinistryPage() {
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [registrations, setRegistrations] = useState<KidsMinistryRegistration[]>([])
    const [statusFilter, setStatusFilter] = useState('')
    const [selected, setSelected] = useState<KidsMinistryRegistration | null>(null)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchRegistrations()
    }, [statusFilter])

    const fetchRegistrations = async () => {
        try {
            setLoading(true)
            const data = await kidsMinistryApi.admin.getRegistrations(statusFilter || undefined)
            setRegistrations(data)
        } catch (error) {
            showToast('Failed to load registrations', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            setUpdating(id)
            await kidsMinistryApi.admin.updateRegistration(id, status)
            showToast('Status updated!', 'success')
            fetchRegistrations()
        } catch (error) {
            showToast('Failed to update status', 'error')
        } finally {
            setUpdating(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this registration?')) return
        try {
            await kidsMinistryApi.admin.deleteRegistration(id)
            showToast('Registration deleted', 'success')
            setSelected(null)
            fetchRegistrations()
        } catch (error) {
            showToast('Failed to delete', 'error')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700'
            case 'approved': return 'bg-green-100 text-green-700'
            case 'declined': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getAgeGroupColor = (group: string) => {
        switch (group) {
            case 'Nursery': return 'bg-pink-100 text-pink-700'
            case 'Elementary': return 'bg-blue-100 text-blue-700'
            case 'Youth': return 'bg-purple-100 text-purple-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f5bb00] rounded-xl flex items-center justify-center">
                        <Baby className="w-5 h-5 text-[#140152]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#140152]">Kids Ministry Registrations</h1>
                        <p className="text-gray-600 mt-1">Manage children registrations</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {['pending', 'approved', 'declined'].map((s) => {
                    const count = registrations.filter((r) => r.status === s).length
                    return (
                        <Card key={s} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(s === statusFilter ? '' : s)}>
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-black text-[#140152]">{count}</p>
                                <p className={`text-sm font-semibold capitalize ${s === statusFilter ? 'text-[#f5bb00]' : 'text-gray-500'}`}>{s}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Filter by status:</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                </select>
                <span className="text-sm text-gray-500">
                    {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {registrations.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No registrations found</p>
                        </CardContent>
                    </Card>
                ) : (
                    registrations.map((reg) => (
                        <Card key={reg.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-xl font-bold text-[#140152]">{reg.child_name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reg.status)}`}>
                                                {reg.status}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAgeGroupColor(reg.age_group)}`}>
                                                {reg.age_group} · Age {reg.child_age}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" /> {reg.parent_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5" /> {reg.parent_email}
                                            </span>
                                            {reg.parent_phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5" /> {reg.parent_phone}
                                                </span>
                                            )}
                                            <span>{new Date(reg.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {reg.special_needs && (
                                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">
                                                <strong>Notes:</strong> {reg.special_needs}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <PremiumButton
                                            onClick={() => setSelected(reg)}
                                            className="bg-blue-500 text-white hover:bg-blue-600 text-sm"
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </PremiumButton>
                                        <select
                                            value={reg.status}
                                            onChange={(e) => handleUpdateStatus(reg.id, e.target.value)}
                                            disabled={updating === reg.id}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#140152]"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="declined">Declined</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selected && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                                <h2 className="text-2xl font-black text-[#140152]">Registration Details</h2>
                                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-500 mb-1">Child's Name</label>
                                        <p className="text-lg font-bold text-[#140152]">{selected.child_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-500 mb-1">Age</label>
                                        <p className="text-lg font-bold text-[#140152]">{selected.child_age} years</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-500 mb-1">Age Group</label>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getAgeGroupColor(selected.age_group)}`}>
                                            {selected.age_group}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-500 mb-1">Status</label>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selected.status)}`}>
                                            {selected.status}
                                        </span>
                                    </div>
                                </div>

                                <hr />

                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Parent / Guardian</label>
                                    <p className="text-gray-800 font-medium">{selected.parent_name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-500 mb-1">Email</label>
                                        <p className="text-gray-700">{selected.parent_email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-500 mb-1">Phone</label>
                                        <p className="text-gray-700">{selected.parent_phone || 'Not provided'}</p>
                                    </div>
                                </div>

                                {selected.special_needs && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-500 mb-1">Special Needs / Notes</label>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selected.special_needs}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 mb-1">Registered On</label>
                                    <p className="text-gray-700">{new Date(selected.created_at).toLocaleString()}</p>
                                </div>

                                <div className="pt-4 border-t flex gap-3">
                                    <select
                                        value={selected.status}
                                        onChange={(e) => {
                                            handleUpdateStatus(selected.id, e.target.value)
                                            setSelected(null)
                                        }}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152]"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="declined">Declined</option>
                                    </select>
                                    <PremiumButton
                                        onClick={() => handleDelete(selected.id)}
                                        className="bg-red-500 text-white hover:bg-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </PremiumButton>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, Loader2, X, Eye, Check, XCircle, Trash2 } from 'lucide-react'
import { testimonyApi, TestimonyItem } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminTestimoniesPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [testimonies, setTestimonies] = useState<TestimonyItem[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [selectedTestimony, setSelectedTestimony] = useState<TestimonyItem | null>(null)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchTestimonies()
    }, [statusFilter])

    const fetchTestimonies = async () => {
        try {
            setLoading(true)
            const data = await testimonyApi.admin.getAll(statusFilter || undefined)
            setTestimonies(data)
        } catch (error) {
            console.error('Failed to fetch testimonies:', error)
            showToast('Failed to load testimonies', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            setUpdating(id)
            await testimonyApi.admin.updateStatus(id, status)
            showToast(`Testimony ${status}!`, 'success')
            fetchTestimonies()
            if (selectedTestimony?.id === id) {
                setSelectedTestimony(null)
            }
        } catch (error) {
            console.error('Failed to update status:', error)
            showToast('Failed to update status', 'error')
        } finally {
            setUpdating(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this testimony?')) return

        try {
            setUpdating(id)
            await testimonyApi.admin.delete(id)
            showToast('Testimony deleted', 'success')
            fetchTestimonies()
            if (selectedTestimony?.id === id) {
                setSelectedTestimony(null)
            }
        } catch (error) {
            console.error('Failed to delete testimony:', error)
            showToast('Failed to delete testimony', 'error')
        } finally {
            setUpdating(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700'
            case 'approved':
                return 'bg-green-100 text-green-700'
            case 'rejected':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-gray-100 text-gray-700'
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
                <div className="flex items-center gap-4">
                    <PremiumButton
                        onClick={() => router.push('/admin')}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </PremiumButton>
                    <div>
                        <h1 className="text-3xl font-black text-[#140152]">Testimonies</h1>
                        <p className="text-gray-600 mt-1">Review and manage user testimonies</p>
                    </div>
                </div>
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
                    <option value="rejected">Rejected</option>
                </select>
                <span className="text-sm text-gray-500">
                    {testimonies.length} testimon{testimonies.length !== 1 ? 'ies' : 'y'}
                </span>
            </div>

            {/* Testimonies List */}
            <div className="grid gap-4">
                {testimonies.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-gray-500">No testimonies found</p>
                        </CardContent>
                    </Card>
                ) : (
                    testimonies.map((testimony) => (
                        <Card key={testimony.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-[#140152]">{testimony.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(testimony.status)}`}>
                                                {testimony.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">{testimony.email}</p>
                                        <p className="text-gray-600 mb-3 line-clamp-3 italic">&ldquo;{testimony.testimony_text}&rdquo;</p>
                                        <p className="text-xs text-gray-400">
                                            Submitted {new Date(testimony.created_at).toLocaleDateString()} at {new Date(testimony.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <PremiumButton
                                            onClick={() => setSelectedTestimony(testimony)}
                                            className="bg-blue-500 text-white hover:bg-blue-600 text-sm"
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </PremiumButton>
                                        {testimony.status === 'pending' && (
                                            <>
                                                <PremiumButton
                                                    onClick={() => handleUpdateStatus(testimony.id, 'approved')}
                                                    disabled={updating === testimony.id}
                                                    className="bg-green-500 text-white hover:bg-green-600 text-sm"
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Approve
                                                </PremiumButton>
                                                <PremiumButton
                                                    onClick={() => handleUpdateStatus(testimony.id, 'rejected')}
                                                    disabled={updating === testimony.id}
                                                    className="bg-red-500 text-white hover:bg-red-600 text-sm"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Reject
                                                </PremiumButton>
                                            </>
                                        )}
                                        {testimony.status !== 'pending' && (
                                            <select
                                                value={testimony.status}
                                                onChange={(e) => handleUpdateStatus(testimony.id, e.target.value)}
                                                disabled={updating === testimony.id}
                                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        )}
                                        <PremiumButton
                                            onClick={() => handleDelete(testimony.id)}
                                            disabled={updating === testimony.id}
                                            className="bg-gray-100 text-red-600 hover:bg-red-50 text-sm"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </PremiumButton>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedTestimony && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                                <h2 className="text-2xl font-black text-[#140152]">Testimony Details</h2>
                                <button
                                    onClick={() => setSelectedTestimony(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                                        <p className="text-lg font-bold text-[#140152]">{selectedTestimony.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                        <p className="text-gray-700">{selectedTestimony.email}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedTestimony.status)}`}>
                                        {selectedTestimony.status}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Testimony</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <p className="text-gray-700 whitespace-pre-wrap italic">&ldquo;{selectedTestimony.testimony_text}&rdquo;</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Submitted</label>
                                    <p className="text-gray-700">{new Date(selectedTestimony.created_at).toLocaleString()}</p>
                                </div>

                                <div className="pt-4 border-t flex items-center gap-3">
                                    <PremiumButton
                                        onClick={() => handleUpdateStatus(selectedTestimony.id, 'approved')}
                                        disabled={updating === selectedTestimony.id}
                                        className="bg-green-500 text-white hover:bg-green-600 flex-1"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve
                                    </PremiumButton>
                                    <PremiumButton
                                        onClick={() => handleUpdateStatus(selectedTestimony.id, 'rejected')}
                                        disabled={updating === selectedTestimony.id}
                                        className="bg-red-500 text-white hover:bg-red-600 flex-1"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </PremiumButton>
                                    <PremiumButton
                                        onClick={() => handleDelete(selectedTestimony.id)}
                                        disabled={updating === selectedTestimony.id}
                                        className="bg-gray-100 text-red-600 hover:bg-red-50"
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

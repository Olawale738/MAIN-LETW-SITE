'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { serviceRequestApi, ServiceRequest, ServiceRequestStatus } from '@/lib/api'
import { Loader2, CheckCircle, XCircle, Clock, User, Mail, X, AlertTriangle } from 'lucide-react'

// Custom Modal Component
function RejectModal({
    isOpen,
    onClose,
    onConfirm,
    serviceName,
    userName
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: (note: string) => void
    serviceName: string
    userName: string
}) {
    const [note, setNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleConfirm = async () => {
        setIsSubmitting(true)
        await onConfirm(note)
        setIsSubmitting(false)
        setNote('')
    }

    const handleClose = () => {
        setNote('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Reject Request</h3>
                                <p className="text-red-100 text-sm">This action cannot be undone</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500">You are about to reject:</p>
                        <p className="font-semibold text-[#140152] mt-1">{serviceName}</p>
                        <p className="text-sm text-gray-500 mt-1">Requested by <span className="font-medium text-gray-700">{userName}</span></p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for rejection <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Provide a reason that will be shared with the member..."
                            className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none text-gray-700 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                    <Button
                        onClick={handleClose}
                        variant="outline"
                        className="px-6"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="px-6 bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Rejecting...
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Request
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function ServiceRequestsPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<ServiceRequestStatus | 'all'>('pending')
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [error, setError] = useState('')

    // Reject modal state
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectingRequest, setRejectingRequest] = useState<ServiceRequest | null>(null)

    const loadRequests = async () => {
        setLoading(true)
        setError('')
        try {
            const status = filter === 'all' ? undefined : filter
            const response = await serviceRequestApi.getAllRequests(status)
            setRequests(response.requests)
        } catch (err) {
            console.error('Failed to load requests', err)
            setError('Failed to load service requests')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRequests()
    }, [filter])

    const handleApprove = async (requestId: string) => {
        setProcessingId(requestId)
        try {
            await serviceRequestApi.approve(requestId)
            // Remove from list or update status
            setRequests(prev => prev.filter(r => r.id !== requestId))
        } catch (err) {
            console.error('Failed to approve request', err)
            alert('Failed to approve request')
        } finally {
            setProcessingId(null)
        }
    }

    const openRejectModal = (request: ServiceRequest) => {
        setRejectingRequest(request)
        setShowRejectModal(true)
    }

    const handleReject = async (note: string) => {
        if (!rejectingRequest) return

        try {
            await serviceRequestApi.reject(rejectingRequest.id, note || undefined)
            // Remove from list
            setRequests(prev => prev.filter(r => r.id !== rejectingRequest.id))
            setShowRejectModal(false)
            setRejectingRequest(null)
        } catch (err) {
            console.error('Failed to reject request', err)
            alert('Failed to reject request')
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Group requests by user
    const groupedRequests = requests.reduce((acc, request) => {
        const userId = request.user_id
        if (!acc[userId]) {
            acc[userId] = {
                user_name: request.user_name || 'Unknown User',
                user_email: request.user_email || '',
                requests: []
            }
        }
        acc[userId].requests.push(request)
        return acc
    }, {} as Record<string, { user_name: string; user_email: string; requests: ServiceRequest[] }>)

    return (
        <>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#140152]">Service Requests</h1>
                        <p className="text-gray-500 mt-2">Approve or reject member service requests</p>
                    </div>
                    <div className="flex gap-2">
                        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                            <Button
                                key={status}
                                onClick={() => setFilter(status)}
                                variant={filter === status ? 'default' : 'outline'}
                                className={filter === status
                                    ? 'bg-[#140152] text-white'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                    </div>
                ) : Object.keys(groupedRequests).length === 0 ? (
                    <Card className="border-none shadow-md">
                        <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">No {filter !== 'all' ? filter : ''} requests</h3>
                            <p className="text-gray-500 mt-2">
                                {filter === 'pending'
                                    ? 'All service requests have been processed!'
                                    : `No ${filter} requests to show`
                                }
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedRequests).map(([userId, group]) => (
                            <Card key={userId} className="border-none shadow-md overflow-hidden">
                                <CardHeader className="bg-gray-50 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold text-lg">
                                                {group.user_name.charAt(0)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-[#140152] flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {group.user_name}
                                                </CardTitle>
                                                {group.user_email && (
                                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                        <Mail className="w-3 h-3" />
                                                        {group.user_email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {group.requests.length} request(s)
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {group.requests.map((request, index) => (
                                        <div
                                            key={request.id}
                                            className={`p-4 flex items-center justify-between ${index !== group.requests.length - 1 ? 'border-b border-gray-100' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${request.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                                        request.status === 'approved' ? 'bg-green-100 text-green-600' :
                                                            'bg-red-100 text-red-600'
                                                    }`}>
                                                    {request.status === 'pending' ? <Clock className="w-5 h-5" /> :
                                                        request.status === 'approved' ? <CheckCircle className="w-5 h-5" /> :
                                                            <XCircle className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#140152]">{request.service_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Requested {formatDate(request.created_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            {request.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleApprove(request.id)}
                                                        disabled={processingId === request.id}
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        {processingId === request.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Approve
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={() => openRejectModal(request)}
                                                        disabled={processingId === request.id}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}

                                            {request.status !== 'pending' && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === 'approved'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            <RejectModal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false)
                    setRejectingRequest(null)
                }}
                onConfirm={handleReject}
                serviceName={rejectingRequest?.service_name || ''}
                userName={rejectingRequest?.user_name || 'Unknown'}
            />
        </>
    )
}

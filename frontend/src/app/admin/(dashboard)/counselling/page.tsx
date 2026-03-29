'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { counsellingApi, CounsellingResponse, CounsellingStatus } from '@/lib/api'
import { Loader2, CheckCircle, XCircle, Clock, User, Mail, Trash2, Send, MessageSquare } from 'lucide-react'

// Reply Modal Component
function ReplyModal({
    isOpen,
    onClose,
    onConfirm,
    userName,
    userEmail
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: (subject: string, message: string) => Promise<void>
    userName: string
    userEmail: string
}) {
    const [subject, setSubject] = useState('Response from Light Encounter Tabernacle')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleConfirm = async () => {
        if (!message.trim()) return
        setIsSubmitting(true)
        await onConfirm(subject, message)
        setIsSubmitting(false)
        setMessage('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#140152] to-[#2a0e8f] px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Reply to Request</h3>
                                <p className="text-blue-100 text-sm">Responds to {userName} ({userEmail})</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152]"
                            placeholder="Response Subject (Min 5 chars)"
                            minLength={5}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                            {subject.length}/5
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your response here... (Min 10 chars)"
                            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152] resize-none"
                            minLength={10}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                            {message.length}/10
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting || message.length < 10 || subject.length < 5}
                        className="bg-[#140152] hover:bg-[#2a0e8f] text-white disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Reply
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function CounsellingPage() {
    const [requests, setRequests] = useState<CounsellingResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<CounsellingStatus | 'all'>('new')
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [error, setError] = useState('')

    // Reply modal state
    const [showReplyModal, setShowReplyModal] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<CounsellingResponse | null>(null)

    const loadRequests = async () => {
        setLoading(true)
        setError('')
        try {
            const status = filter === 'all' ? undefined : filter
            const response = await counsellingApi.getAll(status)
            setRequests(response.items)
        } catch (err) {
            console.error('Failed to load requests', err)
            setError('Failed to load counselling requests')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRequests()
    }, [filter])

    const handleStatusUpdate = async (id: string, newStatus: CounsellingStatus) => {
        setProcessingId(id)
        try {
            const updated = await counsellingApi.update(id, { status: newStatus })
            setRequests(prev => prev.map(r => r.id === id ? updated : r))
        } catch (err) {
            console.error('Failed to update status', err)
            alert('Failed to update status')
        } finally {
            setProcessingId(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request? This cannot be undone.')) return
        setProcessingId(id)
        try {
            await counsellingApi.delete(id)
            setRequests(prev => prev.filter(r => r.id !== id))
        } catch (err) {
            console.error('Failed to delete request', err)
            alert('Failed to delete request')
        } finally {
            setProcessingId(null)
        }
    }

    const handleReply = async (subject: string, message: string) => {
        if (!selectedRequest) return
        try {
            await counsellingApi.reply(selectedRequest.id, { subject, message })
            // Auto update status to In Progress if it was New
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {
                ...r,
                status: r.status === 'new' ? 'in_progress' : r.status,
                admin_notes: (r.admin_notes || '') + `\n[${new Date().toLocaleString()}] Replied via email.`
            } : r))
            alert('Reply sent successfully')
        } catch (err) {
            console.error('Failed to send reply', err)
            alert('Failed to send reply')
        }
    }

    const openReplyModal = (request: CounsellingResponse) => {
        setSelectedRequest(request)
        setShowReplyModal(true)
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

    return (
        <>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#140152]">Counselling Requests</h1>
                        <p className="text-gray-500 mt-2">Manage and respond to confidential counselling inquiries</p>
                    </div>
                    <div className="flex gap-2">
                        {(['new', 'in_progress', 'resolved', 'all'] as const).map((status) => (
                            <Button
                                key={status}
                                onClick={() => setFilter(status)}
                                variant={filter === status ? 'primary' : 'outline'}
                                className={filter === status
                                    ? 'bg-[#140152] text-white'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }
                            >
                                {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
                ) : requests.length === 0 ? (
                    <Card className="border-none shadow-md">
                        <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">No {filter !== 'all' ? filter.replace('_', ' ') : ''} requests</h3>
                            <p className="text-gray-500 mt-2">
                                {filter === 'all'
                                    ? 'No counselling requests found.'
                                    : `No requests with status "${filter.replace('_', ' ')}"`
                                }
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {requests.map((request) => (
                            <Card key={request.id} className="border-none shadow-md overflow-hidden">
                                <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#140152]/10 flex items-center justify-center text-[#140152] font-bold">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-[#140152] text-lg">
                                                    {request.name}
                                                </CardTitle>
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {request.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                                request.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {request.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </span>
                                            <span className="text-sm text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(request.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {request.message}
                                            </p>
                                        </div>

                                        {request.admin_notes && (
                                            <div className="px-4 py-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
                                                <p className="font-semibold mb-1">Admin Notes:</p>
                                                <p className="whitespace-pre-wrap">{request.admin_notes}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            {request.status !== 'resolved' && (
                                                <Button
                                                    onClick={() => openReplyModal(request)}
                                                    variant="outline"
                                                    className="gap-2"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    Reply
                                                </Button>
                                            )}

                                            {request.status === 'new' && (
                                                <Button
                                                    onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                                                    disabled={processingId === request.id}
                                                    variant="outline"
                                                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                                >
                                                    Mark In Progress
                                                </Button>
                                            )}

                                            {request.status !== 'resolved' && (
                                                <Button
                                                    onClick={() => handleStatusUpdate(request.id, 'resolved')}
                                                    disabled={processingId === request.id}
                                                    variant="outline"
                                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Mark Resolved
                                                </Button>
                                            )}

                                            <Button
                                                onClick={() => handleDelete(request.id)}
                                                disabled={processingId === request.id}
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ReplyModal
                isOpen={showReplyModal}
                onClose={() => setShowReplyModal(false)}
                onConfirm={handleReply}
                userName={selectedRequest?.name || ''}
                userEmail={selectedRequest?.email || ''}
            />
        </>
    )
}

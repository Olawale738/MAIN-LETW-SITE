'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, Loader2, X, Eye, User, Trash2 } from 'lucide-react'
import { prayerApi, PrayerRequest } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function PrayerRequestsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<PrayerRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await prayerApi.admin.getAllRequests(statusFilter || undefined)
      setRequests(data)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      showToast('Failed to load prayer requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmation(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return

    try {
      setUpdating(deleteConfirmation)
      await prayerApi.admin.deleteRequest(deleteConfirmation)
      showToast('Request deleted successfully', 'success')
      fetchRequests()
      if (selectedRequest?.id === deleteConfirmation) {
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Failed to delete request:', error)
      showToast('Failed to delete request', 'error')
    } finally {
      setUpdating(null)
      setDeleteConfirmation(null)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id)
      await prayerApi.admin.updateRequest(id, { status: status as any })
      showToast('Request status updated!', 'success')
      fetchRequests()
    } catch (error) {
      console.error('Failed to update status:', error)
      showToast('Failed to update status', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'praying':
        return 'bg-blue-100 text-blue-700'
      case 'answered':
        return 'bg-green-100 text-green-700'
      case 'archived':
        return 'bg-gray-100 text-gray-700'
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
            onClick={() => router.push('/admin/prayer')}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </PremiumButton>
          <div>
            <h1 className="text-3xl font-black text-[#140152]">Prayer Requests</h1>
            <p className="text-gray-600 mt-1">Manage user prayer requests</p>
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
          <option value="praying">Praying</option>
          <option value="answered">Answered</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-sm text-gray-500">
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No prayer requests found</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#140152]">{request.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.is_anonymous && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Anonymous
                        </span>
                      )}
                      {!request.is_public && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{request.description}</p>

                    {/* User Details */}
                    {!request.is_anonymous && request.user ? (
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-[#140152] text-white flex items-center justify-center">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-gray-800">
                          {request.user.first_name} {request.user.last_name}
                        </span>
                        {request.user.email && (
                          <span className="text-gray-400">• {request.user.email}</span>
                        )}
                      </div>
                    ) : request.is_anonymous ? (
                      <div className="flex items-center gap-2 mb-3 text-sm text-gray-400 italic">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-400" />
                        </div>
                        <span>Anonymous submission</span>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>{request.prayer_count} prayers</span>
                      {request.category && <span>Category: {request.category}</span>}
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                    {request.testimony && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-sm font-semibold text-green-800 mb-1">Testimony:</p>
                        <p className="text-sm text-green-700">{request.testimony}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <PremiumButton
                      onClick={() => setSelectedRequest(request)}
                      className="bg-blue-500 text-white hover:bg-blue-600 text-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </PremiumButton>
                    <select
                      value={request.status}
                      onChange={(e) => handleUpdateStatus(request.id, e.target.value)}
                      disabled={updating === request.id}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="praying">Praying</option>
                      <option value="answered">Answered</option>
                      <option value="archived">Archived</option>
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
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-black text-[#140152]">Prayer Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <p className="text-lg font-bold text-[#140152]">{selectedRequest.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Prayer Count</label>
                    <p className="text-2xl font-black text-[#f5bb00]">{selectedRequest.prayer_count}</p>
                  </div>
                </div>

                {selectedRequest.category && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <p className="text-gray-700">{selectedRequest.category}</p>
                  </div>
                )}

                {/* User Details in Modal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Submitted By</label>
                  {selectedRequest.is_anonymous ? (
                    <p className="text-gray-500 italic">Anonymous</p>
                  ) : selectedRequest.user ? (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <p className="text-gray-800 font-medium">
                        {selectedRequest.user.first_name} {selectedRequest.user.last_name}
                      </p>
                      {selectedRequest.user.email && (
                        <p className="text-gray-500 text-sm">{selectedRequest.user.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">User info unavailable</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Anonymous</label>
                    <p className="text-gray-700">{selectedRequest.is_anonymous ? 'Yes' : 'No'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Public</label>
                    <p className="text-gray-700">{selectedRequest.is_public ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Created At</label>
                  <p className="text-gray-700">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>

                {selectedRequest.testimony && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Testimony</label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-700 whitespace-pre-wrap">{selectedRequest.testimony}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Update Status</label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => {
                      handleUpdateStatus(selectedRequest.id, e.target.value)
                      setSelectedRequest(null)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="praying">Praying</option>
                    <option value="answered">Answered</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <PremiumButton
                    onClick={() => handleDelete(selectedRequest.id)}
                    className="w-full bg-red-100 text-red-700 hover:bg-red-200"
                    disabled={updating === selectedRequest.id}
                  >
                    {updating === selectedRequest.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete Request
                  </PremiumButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Prayer Request?</h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete this prayer request? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmation(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={updating === deleteConfirmation}
                    className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    {updating === deleteConfirmation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

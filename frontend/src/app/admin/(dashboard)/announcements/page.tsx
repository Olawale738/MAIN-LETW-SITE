'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Trash2, Loader2, Send, AlertCircle } from 'lucide-react'
import { announcementApi, Announcement } from '@/lib/api'

// Available services for announcements
const AVAILABLE_SERVICES = [
    "Bible study",
    "Prayer meeting",
    "Evangelism",
    "Choir",
    "Theology school (paid)",
    "Counselling",
    "Skill Development",
    "Leadership Training",
    "Career Guidance"
]

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        service_name: '',
        title: '',
        content: ''
    })

    useEffect(() => {
        loadAnnouncements()
    }, [])

    const loadAnnouncements = async () => {
        try {
            setLoading(true)
            const data = await announcementApi.getAll()
            setAnnouncements(data.announcements)
        } catch (err) {
            console.error('Failed to load announcements', err)
            setError('Failed to load announcements')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!formData.service_name || !formData.title || !formData.content) {
            setError('Please fill in all fields')
            return
        }

        try {
            setSubmitting(true)
            await announcementApi.create(formData)
            setSuccess('Announcement posted successfully! Notifications sent to all users.')
            setFormData({ service_name: '', title: '', content: '' })
            await loadAnnouncements()
        } catch (err: any) {
            setError(err.message || 'Failed to create announcement')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return

        try {
            await announcementApi.delete(id)
            setAnnouncements(prev => prev.filter(a => a.id !== id))
            setSuccess('Announcement deleted')
        } catch (err: any) {
            setError(err.message || 'Failed to delete announcement')
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[#140152]">Announcements</h1>
                <p className="text-gray-500 mt-2">Post announcements to service members. Users will receive in-app and email notifications.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Create Announcement Form */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-[#140152] flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-[#f5bb00]" />
                            Post New Announcement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Target Service
                                </label>
                                <select
                                    required
                                    value={formData.service_name}
                                    onChange={e => setFormData({ ...formData, service_name: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                                >
                                    <option value="">Select a service...</option>
                                    {AVAILABLE_SERVICES.map(service => (
                                        <option key={service} value={service}>{service}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Announcement Title
                                </label>
                                <input
                                    required
                                    placeholder="e.g., Important Update for Next Week"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message Content
                                </label>
                                <textarea
                                    required
                                    placeholder="Write your announcement message here..."
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    rows={5}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#140152] hover:bg-[#1d0175] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Post Announcement
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Recent Announcements */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-[#140152]">Recent Announcements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No announcements yet. Create your first one!
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {announcements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className={`p-4 rounded-xl border ${announcement.is_active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium text-[#f5bb00] bg-[#140152] px-2 py-0.5 rounded-full">
                                                        {announcement.service_name}
                                                    </span>
                                                    {!announcement.is_active && (
                                                        <span className="text-xs text-red-500">Deleted</span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-[#140152] truncate">
                                                    {announcement.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                                    {announcement.content}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatDate(announcement.created_at)}
                                                </p>
                                            </div>
                                            {announcement.is_active && (
                                                <button
                                                    onClick={() => handleDelete(announcement.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Calendar, Clock, User, Trash, Edit, Loader2 } from 'lucide-react'
import { careerApi, CareerSession, CareerSessionCreate } from '@/lib/api'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function CareerSessionsPage() {
    const router = useRouter()
    const [sessions, setSessions] = useState<CareerSession[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [sessionForm, setSessionForm] = useState<CareerSessionCreate>({
        user_id: '',
        title: '',
        description: '',
        session_date: '',
        duration_minutes: 60,
        meeting_link: '',
        status: 'scheduled'
    })

    useEffect(() => {
        loadSessions()
    }, [])

    const loadSessions = async () => {
        try {
            setLoading(true)
            const data = await careerApi.admin.getSessions()
            setSessions(data)
        } catch (err) {
            console.error('Failed to load sessions', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await careerApi.admin.createSession(sessionForm)
            setShowModal(false)
            setSessionForm({
                user_id: '',
                title: '',
                description: '',
                session_date: '',
                duration_minutes: 60,
                meeting_link: '',
                status: 'scheduled'
            })
            await loadSessions()
        } catch (err) {
            console.error('Failed to create session', err)
            toast.error('Failed to create session. Please try again.')
        }
    }

    const handleDeleteSession = async (id: string) => {
        if (!confirm('Are you sure you want to delete this session?')) return

        try {
            await careerApi.admin.deleteSession(id)
            await loadSessions()
        } catch (err) {
            console.error('Failed to delete session', err)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
            case 'completed': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            case 'cancelled': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            case 'rescheduled': return 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/admin/career')}
                    className="-ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-primary">Mentorship Sessions</h1>
                    <p className="text-gray-500 dark:text-gray-400">Schedule and manage career guidance sessions</p>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Session
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Sessions ({sessions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sessions scheduled</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Schedule your first mentorship session to get started.</p>
                            <Button
                                onClick={() => setShowModal(true)}
                                className="bg-primary hover:bg-primary/90 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Schedule Session
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{session.title}</h3>
                                                {session.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{session.description}</p>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                {session.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                {session.user_name || session.user_id}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(session.session_date), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {format(new Date(session.session_date), 'h:mm a')} ({session.duration_minutes} min)
                                            </div>
                                        </div>
                                        {session.meeting_link && (
                                            <a
                                                href={session.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline mt-2 inline-block"
                                            >
                                                Join Meeting →
                                            </a>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Session Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleCreateSession}>
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedule Session</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        User ID *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={sessionForm.user_id}
                                        onChange={(e) => setSessionForm({ ...sessionForm, user_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        placeholder="Enter user ID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Session Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={sessionForm.title}
                                        onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        placeholder="e.g., Career Planning Session"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={sessionForm.description}
                                        onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Date & Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={sessionForm.session_date}
                                            onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Duration (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            value={sessionForm.duration_minutes}
                                            onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            min="15"
                                            step="15"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Meeting Link
                                    </label>
                                    <input
                                        type="url"
                                        value={sessionForm.meeting_link}
                                        onChange={(e) => setSessionForm({ ...sessionForm, meeting_link: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        placeholder="https://zoom.us/..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={sessionForm.status}
                                        onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="rescheduled">Rescheduled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                                    Schedule Session
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}


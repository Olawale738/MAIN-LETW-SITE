'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
    Book, CheckCircle2, Circle, ArrowLeft, Calendar, TrendingUp,
    Edit3, Save, X
} from 'lucide-react'
import {
    bibleStudyApi, UserProgressWithDetails, ReadingStatus, DailyReading,
    tokenManager, authApi
} from '@/lib/api'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function MyProgressPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const { showToast, ToastComponent } = useToast()
    const [progress, setProgress] = useState<UserProgressWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [editingNotes, setEditingNotes] = useState<string | null>(null)
    const [notes, setNotes] = useState('')

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = tokenManager.getAccessToken()
        if (!token) {
            router.push('/auth/login')
            return
        }
        try {
            const userData = await authApi.getCurrentUser()
            setUser(userData)
            fetchProgress()
        } catch (error) {
            console.error('Failed to get user:', error)
            router.push('/auth/login')
        }
    }

    const fetchProgress = async () => {
        try {
            const data = await bibleStudyApi.getMyProgress()
            setProgress(data)
        } catch (error) {
            console.error('Failed to fetch progress:', error)
            showToast('Failed to load progress', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleMarkComplete = async (progressId: string, readingId: string, currentStatus: ReadingStatus) => {
        try {
            const newStatus = currentStatus === ReadingStatus.COMPLETED 
                ? ReadingStatus.NOT_STARTED 
                : ReadingStatus.COMPLETED

            await bibleStudyApi.updateDailyReading(progressId, readingId, newStatus)
            showToast(
                newStatus === ReadingStatus.COMPLETED ? 'Reading marked as complete!' : 'Reading unmarked',
                'success'
            )
            await fetchProgress()
        } catch (error) {
            console.error('Failed to update reading:', error)
            showToast('Failed to update reading', 'error')
        }
    }

    const handleSaveNotes = async (progressId: string, readingId: string, currentStatus: ReadingStatus) => {
        try {
            await bibleStudyApi.updateDailyReading(progressId, readingId, currentStatus, notes)
            showToast('Notes saved successfully!', 'success')
            setEditingNotes(null)
            setNotes('')
            await fetchProgress()
        } catch (error) {
            console.error('Failed to save notes:', error)
            showToast('Failed to save notes', 'error')
        }
    }

    const getProgressPercentage = (prog: UserProgressWithDetails) => {
        if (!prog.plan) return 0
        return Math.round((prog.completed_days / prog.plan.duration_days) * 100)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Book className="w-12 h-12 animate-pulse text-[#140152]" />
            </div>
        )
    }

    const activeProgress = progress.find(p => p.is_active)

    if (!activeProgress) {
        return (
            <div className="min-h-screen bg-neutral-50">
                <div className="container mx-auto px-4 py-12">
                    <Card className="p-12 text-center">
                        <Book className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">No Active Reading Plan</h2>
                        <p className="text-gray-600 mb-6">Start a reading plan to track your progress</p>
                        <Link href="/services/bible-reading">
                            <Button className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]">
                                Browse Reading Plans
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        )
    }

    // Get readings with their completion status
    const readingsWithStatus = activeProgress.plan.readings?.map(reading => {
        const userReading = activeProgress.daily_readings.find(ur => ur.daily_reading_id === reading.id)
        return {
            ...reading,
            userReading
        }
    }).sort((a, b) => a.day_number - b.day_number) || []

    return (
        <div className="min-h-screen bg-neutral-50">
            {ToastComponent()}
            
            {/* Header */}
            <div className="bg-gradient-to-br from-[#140152] to-purple-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <Link href="/services/bible-reading">
                        <Button variant="ghost" className="text-white hover:text-[#f5bb00] mb-4">
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Back to Bible Reading
                        </Button>
                    </Link>

                    <h1 className="text-4xl md:text-5xl font-black mb-6">My Reading Progress</h1>
                    <p className="text-xl text-gray-200">{activeProgress.plan.title}</p>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="container mx-auto px-4 py-8">
                <Card className="p-8 mb-8 bg-gradient-to-br from-white to-gray-50">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-5xl font-black text-[#f5bb00] mb-2">
                                {getProgressPercentage(activeProgress)}%
                            </div>
                            <p className="text-gray-600">Complete</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-black text-[#140152] mb-2">
                                {activeProgress.completed_days}
                            </div>
                            <p className="text-gray-600">Days Completed</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-black text-purple-600 mb-2">
                                {activeProgress.plan.duration_days - activeProgress.completed_days}
                            </div>
                            <p className="text-gray-600">Days Remaining</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-6 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgressPercentage(activeProgress)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-gradient-to-r from-[#140152] to-[#f5bb00] h-full rounded-full"
                        />
                    </div>
                </Card>

                {/* Daily Readings List */}
                <div className="space-y-4">
                    {readingsWithStatus.map((reading, index) => {
                        const isCompleted = reading.userReading?.status === ReadingStatus.COMPLETED
                        const isEditing = editingNotes === reading.id

                        return (
                            <motion.div
                                key={reading.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={`p-6 transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                                    <div className="flex items-start gap-4">
                                        {/* Day Number */}
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            isCompleted
                                                ? 'bg-green-500'
                                                : 'bg-gradient-to-br from-[#140152] to-purple-900'
                                        }`}>
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-6 h-6 text-white" />
                                            ) : (
                                                <span className="text-[#f5bb00] font-bold">{reading.day_number}</span>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-[#140152] mb-1">{reading.title}</h3>
                                                    <p className="text-gray-600">
                                                        <Book className="inline w-4 h-4 mr-1" />
                                                        {reading.scripture_reference}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => handleMarkComplete(
                                                        activeProgress.id,
                                                        reading.id,
                                                        reading.userReading?.status || ReadingStatus.NOT_STARTED
                                                    )}
                                                    variant={isCompleted ? "outline" : "primary"}
                                                    className={isCompleted
                                                        ? "border-green-500 text-green-600 hover:bg-green-50"
                                                        : "bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                                                    }
                                                >
                                                    {isCompleted ? (
                                                        <>
                                                            <CheckCircle2 className="mr-2 w-4 h-4" />
                                                            Completed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Circle className="mr-2 w-4 h-4" />
                                                            Mark Complete
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {reading.key_verse && (
                                                <div className="bg-[#f5bb00]/10 border-l-4 border-[#f5bb00] p-3 mb-3">
                                                    <p className="text-sm italic text-gray-700">"{reading.key_verse}"</p>
                                                </div>
                                            )}

                                            {reading.reflection && (
                                                <p className="text-sm text-gray-600 mb-3">{reading.reflection}</p>
                                            )}

                                            {/* Notes Section */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                {isEditing ? (
                                                    <div>
                                                        <Textarea
                                                            value={notes}
                                                            onChange={(e) => setNotes(e.target.value)}
                                                            placeholder="Add your personal notes and reflections..."
                                                            className="mb-2 text-gray-900"
                                                            rows={4}
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => handleSaveNotes(
                                                                    activeProgress.id,
                                                                    reading.id,
                                                                    reading.userReading?.status || ReadingStatus.NOT_STARTED
                                                                )}
                                                                className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                                                            >
                                                                <Save className="mr-2 w-4 h-4" />
                                                                Save Notes
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setEditingNotes(null)
                                                                    setNotes('')
                                                                }}
                                                                variant="outline"
                                                            >
                                                                <X className="mr-2 w-4 h-4" />
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {reading.userReading?.notes ? (
                                                            <div className="bg-gray-50 p-3 rounded-lg mb-2">
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                    {reading.userReading.notes}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic mb-2">No notes yet</p>
                                                        )}
                                                        <Button
                                                            onClick={() => {
                                                                setEditingNotes(reading.id)
                                                                setNotes(reading.userReading?.notes || '')
                                                            }}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-[#140152] hover:text-[#f5bb00]"
                                                        >
                                                            <Edit3 className="mr-2 w-4 h-4" />
                                                            {reading.userReading?.notes ? 'Edit Notes' : 'Add Notes'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}


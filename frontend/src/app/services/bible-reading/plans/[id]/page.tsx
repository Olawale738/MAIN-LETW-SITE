'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    Book, BookOpen, Calendar, ArrowLeft, Play, CheckCircle2
} from 'lucide-react'
import {
    bibleStudyApi, BibleReadingPlanWithReadings, UserProgressWithDetails,
    tokenManager, authApi
} from '@/lib/api'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function PlanDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const { showToast, ToastComponent } = useToast()
    const [plan, setPlan] = useState<BibleReadingPlanWithReadings | null>(null)
    const [myProgress, setMyProgress] = useState<UserProgressWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState(false)

    useEffect(() => {
        checkAuth()
        fetchData()
    }, [params.id])

    const checkAuth = async () => {
        const token = tokenManager.getAccessToken()
        if (token) {
            try {
                const userData = await authApi.getCurrentUser()
                setUser(userData)
            } catch (error) {
                console.error('Failed to get user:', error)
            }
        }
    }

    const fetchData = async () => {
        try {
            const planData = await bibleStudyApi.getPlanWithReadings(params.id as string)
            setPlan(planData)

            if (user) {
                const progress = await bibleStudyApi.getMyProgress()
                setMyProgress(progress)
            }
        } catch (error) {
            console.error('Failed to fetch plan:', error)
            showToast('Failed to load reading plan', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleStartPlan = async () => {
        if (!user) {
            router.push('/auth/login')
            return
        }

        setStarting(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            await bibleStudyApi.startPlan(params.id as string, today)
            showToast('Reading plan started successfully!', 'success')
            router.push('/services/bible-reading/my-progress')
        } catch (error: any) {
            console.error('Failed to start plan:', error)
            showToast(error.message || 'Failed to start plan', 'error')
        } finally {
            setStarting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Book className="w-12 h-12 animate-pulse text-[#140152]" />
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <p className="text-red-600">Plan not found</p>
            </div>
        )
    }

    const activeProgress = myProgress.find(p => p.plan_id === plan.id && p.is_active)
    const sortedReadings = [...plan.readings].sort((a, b) => a.day_number - b.day_number)

    return (
        <div className="min-h-screen bg-neutral-50">
            {ToastComponent()}
            
            {/* Header */}
            <div className="bg-gradient-to-br from-[#140152] to-purple-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <Link href="/services/bible-reading">
                        <Button variant="ghost" className="text-white hover:text-[#f5bb00] mb-4">
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Back to Plans
                        </Button>
                    </Link>

                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-[#f5bb00] rounded-2xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-10 h-10 text-[#140152]" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-black mb-4">{plan.title}</h1>
                            <div className="flex flex-wrap gap-4 text-gray-200">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    <span>{plan.duration_days} days</span>
                                </div>
                                {plan.target_audience && (
                                    <div className="flex items-center gap-2">
                                        <span>•</span>
                                        <span>{plan.target_audience}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                {/* Description */}
                {plan.description && (
                    <Card className="p-6 mb-8">
                        <h2 className="text-2xl font-bold text-[#140152] mb-4">About This Plan</h2>
                        <p className="text-gray-700 leading-relaxed">{plan.description}</p>
                    </Card>
                )}

                {/* Action Button */}
                <div className="mb-8">
                    {activeProgress ? (
                        <Link href="/services/bible-reading/my-progress">
                            <Button className="w-full md:w-auto bg-[#f5bb00] text-[#140152] hover:bg-[#140152] hover:text-white px-8 py-6 text-lg">
                                <CheckCircle2 className="mr-2 w-5 h-5" />
                                Continue Reading (Day {activeProgress.current_day})
                            </Button>
                        </Link>
                    ) : (
                        <Button 
                            onClick={handleStartPlan}
                            disabled={starting}
                            className="w-full md:w-auto bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] px-8 py-6 text-lg"
                        >
                            <Play className="mr-2 w-5 h-5" />
                            {starting ? 'Starting...' : 'Start This Plan'}
                        </Button>
                    )}
                </div>

                {/* Daily Readings */}
                <div>
                    <h2 className="text-2xl font-bold text-[#140152] mb-6">Daily Readings</h2>
                    <div className="space-y-4">
                        {sortedReadings.map((reading, index) => (
                            <motion.div
                                key={reading.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="p-6 hover:shadow-lg transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#140152] to-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-[#f5bb00] font-bold">{reading.day_number}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-[#140152] mb-2">{reading.title}</h3>
                                            <p className="text-gray-600 mb-3">
                                                <Book className="inline w-4 h-4 mr-1" />
                                                {reading.scripture_reference}
                                            </p>

                                            {reading.key_verse && (
                                                <div className="bg-[#f5bb00]/10 border-l-4 border-[#f5bb00] p-3 mb-3">
                                                    <p className="text-sm italic text-gray-700">"{reading.key_verse}"</p>
                                                </div>
                                            )}

                                            {reading.reflection && (
                                                <p className="text-sm text-gray-600">{reading.reflection}</p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}


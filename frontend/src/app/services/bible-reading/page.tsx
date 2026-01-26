'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    Book, BookOpen, CheckCircle2, Circle, Play, Calendar,
    TrendingUp, Award, Target, ChevronRight
} from 'lucide-react'
import {
    bibleStudyApi, BibleStudyPageData, BibleReadingPlan,
    UserProgressWithDetails, ReadingStatus, tokenManager, authApi
} from '@/lib/api'
import Link from 'next/link'

export default function BibleReadingPage() {
    const [user, setUser] = useState<any>(null)
    const [pageData, setPageData] = useState<BibleStudyPageData | null>(null)
    const [myProgress, setMyProgress] = useState<UserProgressWithDetails[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
        fetchData()
    }, [])

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
            const data = await bibleStudyApi.getPageData()
            setPageData(data)

            if (user) {
                const progress = await bibleStudyApi.getMyProgress()
                setMyProgress(progress)
            }
        } catch (error) {
            console.error('Failed to fetch Bible study data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getProgressPercentage = (progress: UserProgressWithDetails) => {
        if (!progress.plan) return 0
        return Math.round((progress.completed_days / progress.plan.duration_days) * 100)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <Book className="w-12 h-12 animate-pulse text-[#140152] mx-auto mb-4" />
                    <p className="text-gray-600">Loading Bible study...</p>
                </div>
            </div>
        )
    }

    if (!pageData) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <p className="text-red-600">Failed to load Bible study page</p>
            </div>
        )
    }

    const { settings, featured_plans, all_plans } = pageData
    const activeProgress = myProgress.find(p => p.is_active)

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Hero Section */}
            <div 
                className="relative bg-gradient-to-br from-[#140152] via-purple-900 to-[#140152] text-white py-24 overflow-hidden"
                style={{
                    backgroundImage: settings.hero_background_url 
                        ? `linear-gradient(rgba(20, 1, 82, 0.85), rgba(20, 1, 82, 0.85)), url(${settings.hero_background_url})`
                        : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6">
                            {settings.hero_title}
                        </h1>
                        <p className="text-2xl md:text-3xl text-[#f5bb00] font-bold mb-4">
                            {settings.hero_subtitle}
                        </p>
                        <p className="text-xl text-gray-200 mb-8">
                            {settings.hero_description}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                {/* User Progress Section */}
                {user && activeProgress && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <Card className="bg-white p-8 shadow-lg border-2 border-[#140152]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-[#140152] mb-2">Your Progress</h2>
                                    <p className="text-gray-600">{activeProgress.plan.title}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-[#f5bb00]">
                                        {getProgressPercentage(activeProgress)}%
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {activeProgress.completed_days} of {activeProgress.plan.duration_days} days
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getProgressPercentage(activeProgress)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="bg-gradient-to-r from-[#140152] to-[#f5bb00] h-full rounded-full"
                                />
                            </div>

                            <Link href="/services/bible-reading/my-progress">
                                <Button className="w-full bg-[#140152] hover:bg-[#f5bb00] hover:text-[#140152] text-white">
                                    View Detailed Progress
                                    <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                        </Card>
                    </motion.div>
                )}

                {/* Featured Plans */}
                {featured_plans.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-[#140152] mb-6">Featured Reading Plans</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featured_plans.map((plan, index) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-[#f5bb00] h-full">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#140152] to-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="w-6 h-6 text-[#f5bb00]" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-[#140152] mb-1">{plan.title}</h3>
                                                <p className="text-sm text-gray-600">{plan.duration_days} days</p>
                                            </div>
                                        </div>

                                        {plan.description && (
                                            <p className="text-gray-700 mb-4 line-clamp-3">{plan.description}</p>
                                        )}

                                        {plan.target_audience && (
                                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                                                <Target className="w-4 h-4" />
                                                <span>{plan.target_audience}</span>
                                            </div>
                                        )}

                                        <Link href={`/services/bible-reading/plans/${plan.id}`}>
                                            <Button className="w-full bg-[#140152] hover:bg-[#f5bb00] hover:text-[#140152] text-white">
                                                {user && activeProgress?.plan_id === plan.id ? 'Continue Reading' : 'Start Plan'}
                                                <Play className="ml-2 w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Plans */}
                <div>
                    <h2 className="text-3xl font-bold text-[#140152] mb-6">All Reading Plans</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {all_plans.map((plan, index) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="p-6 hover:shadow-xl transition-all h-full">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Book className="w-6 h-6 text-[#140152]" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-[#140152] mb-1">{plan.title}</h3>
                                            <p className="text-sm text-gray-600">{plan.duration_days} days • {plan.plan_type}</p>
                                        </div>
                                    </div>

                                    {plan.description && (
                                        <p className="text-gray-700 mb-4 text-sm line-clamp-2">{plan.description}</p>
                                    )}

                                    <Link href={`/services/bible-reading/plans/${plan.id}`}>
                                        <Button variant="outline" className="w-full border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white">
                                            View Details
                                        </Button>
                                    </Link>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Call to Action for Non-Logged In Users */}
                {!user && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 text-center"
                    >
                        <Card className="p-8 bg-gradient-to-br from-[#140152] to-purple-900 text-white">
                            <Book className="w-16 h-16 mx-auto mb-4 text-[#f5bb00]" />
                            <h3 className="text-2xl font-bold mb-4">Start Your Bible Reading Journey</h3>
                            <p className="text-gray-200 mb-6 max-w-2xl mx-auto">
                                Sign in to track your progress, save notes, and build a consistent Bible reading habit.
                            </p>
                            <Link href="/auth/login">
                                <Button className="bg-[#f5bb00] text-[#140152] hover:bg-white px-8 py-6 text-lg">
                                    Sign In to Get Started
                                </Button>
                            </Link>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    )
}


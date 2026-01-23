'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    FileText, Calendar, Video, CheckCircle, BookOpen, Target,
    TrendingUp, Menu, X, Loader2, ExternalLink, PlayCircle,
    FileDown, Link as LinkIcon, Clock, MapPin
} from 'lucide-react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'
import { careerApi, UserCareerDashboard, CareerModule, CareerResource } from '@/lib/api'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import CareerModuleDetail from '@/components/CareerModuleDetail'

export default function CareerGuidancePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [dashboard, setDashboard] = useState<UserCareerDashboard | null>(null)
    const [selectedModule, setSelectedModule] = useState<CareerModule | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [completingTask, setCompletingTask] = useState<string | null>(null)

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            setLoading(true)
            const data = await careerApi.getDashboard()
            setDashboard(data)
        } catch (error) {
            console.error('Failed to load dashboard:', error)
            router.push('/auth/login?redirect=/career-guidance')
        } finally {
            setLoading(false)
        }
    }

    const loadModule = async (moduleId: string) => {
        try {
            const module = await careerApi.getModule(moduleId)
            setSelectedModule(module)
        } catch (error) {
            console.error('Failed to load module:', error)
        }
    }

    const handleCompleteTask = async (taskId: string) => {
        try {
            setCompletingTask(taskId)
            await careerApi.completeTask(taskId)
            await loadDashboard()
            if (selectedModule) {
                await loadModule(selectedModule.id)
            }
        } catch (error) {
            console.error('Failed to complete task:', error)
        } finally {
            setCompletingTask(null)
        }
    }

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'pdf': return FileDown
            case 'video': return PlayCircle
            case 'article': return FileText
            case 'link': return LinkIcon
            default: return FileText
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!dashboard) return null

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-lg shadow-lg"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <AnimatePresence>
                {(sidebarOpen || window.innerWidth >= 768) && (
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className={cn(
                            "w-64 bg-primary text-white p-6 fixed md:sticky top-0 h-screen overflow-y-auto z-40",
                            sidebarOpen ? "block" : "hidden md:block"
                        )}
                    >
                        <h1 className="text-xl font-bold mb-8 mt-12 md:mt-0">
                            Career<span className="text-accent">Track</span>
                        </h1>
                        <nav className="space-y-2">
                            <button
                                onClick={() => {
                                    setSelectedModule(null)
                                    setSidebarOpen(false)
                                }}
                                className={cn(
                                    "w-full text-left py-2 px-4 rounded-lg transition-colors",
                                    !selectedModule ? "bg-white/10" : "hover:bg-white/5 opacity-70"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Dashboard
                                </div>
                            </button>

                            {dashboard.modules.map((module) => (
                                <button
                                    key={module.id}
                                    onClick={() => {
                                        loadModule(module.id)
                                        setSidebarOpen(false)
                                    }}
                                    className={cn(
                                        "w-full text-left py-2 px-4 rounded-lg transition-colors",
                                        selectedModule?.id === module.id ? "bg-white/10" : "hover:bg-white/5 opacity-70"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        {module.title}
                                    </div>
                                    {module.progress_percent > 0 && (
                                        <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent transition-all"
                                                style={{ width: `${module.progress_percent}%` }}
                                            />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                {!selectedModule ? (
                    <>
                        {/* Dashboard View */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome 👋</h2>
                            <p className="text-gray-600 dark:text-gray-400">Your career growth journey continues here.</p>
                        </div>

                        {/* Announcements */}
                        <ServiceAnnouncements serviceName="Career Guidance" />

                        {/* Stats Cards */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Focus</div>
                                </div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                    {dashboard.current_focus || 'Not set'}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="w-5 h-5 text-accent" />
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Next Session</div>
                                </div>
                                <div className="text-xl font-bold text-accent">
                                    {dashboard.next_session
                                        ? format(new Date(dashboard.next_session.session_date), 'MMM dd, h:mm a')
                                        : 'No upcoming session'
                                    }
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                                </div>
                                <div className="text-xl font-bold text-green-600">
                                    {dashboard.overall_progress}% Completed
                                </div>
                            </div>
                        </div>

                        {/* Modules Grid */}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Career Modules</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {dashboard.modules.map((module) => (
                                <motion.div
                                    key={module.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => loadModule(module.id)}
                                    className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{module.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {module.description}
                                            </p>
                                        </div>
                                    </div>
                                    {module.progress_percent > 0 && (
                                        <div className="mt-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                                <span className="text-primary font-semibold">{module.progress_percent}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${module.progress_percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Pending Tasks */}
                        {dashboard.pending_tasks.length > 0 && (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Action Items</h3>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                                    {dashboard.pending_tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                disabled={completingTask === task.id}
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                    task.is_completed
                                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                        : "border-gray-300 dark:border-gray-600 hover:border-primary"
                                                )}
                                            >
                                                {completingTask === task.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                ) : task.is_completed ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : null}
                                            </button>
                                            <div className="flex-1">
                                                <span className={cn(
                                                    "text-gray-900 dark:text-white",
                                                    task.is_completed && "line-through text-gray-400 dark:text-gray-600"
                                                )}>
                                                    {task.title}
                                                </span>
                                                {task.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    // Module Detail View
                    <CareerModuleDetail
                        module={selectedModule}
                        onBack={() => setSelectedModule(null)}
                        onTaskComplete={handleCompleteTask}
                    />
                )}
            </div>
        </div>
    )
}

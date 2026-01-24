'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Target, Users, Calendar, MoreVertical, Edit, Trash, BookOpen } from 'lucide-react'
import { careerApi, CareerModule, CareerSession } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminCareerPage() {
    const router = useRouter()
    const [modules, setModules] = useState<CareerModule[]>([])
    const [sessions, setSessions] = useState<CareerSession[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [modulesData, sessionsData] = await Promise.all([
                careerApi.admin.getModules(),
                careerApi.admin.getSessions()
            ])
            setModules(modulesData)
            setSessions(sessionsData)
        } catch (err) {
            console.error('Failed to load data', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteModule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this module?')) return
        
        try {
            await careerApi.admin.deleteModule(id)
            await loadData()
        } catch (err) {
            console.error('Failed to delete module', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const upcomingSessions = sessions.filter(s => s.status === 'scheduled').length

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Career Guidance</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage career modules, resources, and mentorship sessions</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => router.push('/admin/career/sessions')}
                        variant="outline"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Manage Sessions
                    </Button>
                    <Button
                        onClick={() => router.push('/admin/career/create')}
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Module
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Modules</p>
                            <h3 className="text-2xl font-bold text-primary">{modules.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
                            <h3 className="text-2xl font-bold text-primary">0</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Sessions</p>
                            <h3 className="text-2xl font-bold text-primary">{upcomingSessions}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modules Grid */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Career Modules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Target className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No modules yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Create your first career module to get started.</p>
                            <Button
                                onClick={() => router.push('/admin/career/create')}
                                className="bg-primary hover:bg-primary/90 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Module
                            </Button>
                        </div>
                    ) : (
                        modules.map((module) => (
                            <Card key={module.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{module.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {module.description || 'No description'}
                                            </p>
                                        </div>
                                        <div className="relative group">
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                <button
                                                    onClick={() => router.push(`/admin/career/${module.id}`)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit Module
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteModule(module.id)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            module.is_published
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                                        }`}>
                                            {module.is_published ? 'Published' : 'Draft'}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {module.resources?.length || 0} resources
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}


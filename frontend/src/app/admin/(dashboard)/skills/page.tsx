'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, BookOpen, Clock, Users, MoreVertical, Edit, Trash, PlayCircle } from 'lucide-react'
import { skillsApi, Course } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function AdminSkillsPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCourses()
    }, [])

    const loadCourses = async () => {
        try {
            const data = await skillsApi.getCourses()
            setCourses(data)
        } catch (err) {
            console.error('Failed to load courses', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#140152]">Skill Development</h1>
                    <p className="text-gray-500">Manage courses, curriculum, and student progress</p>
                </div>
                <Button
                    onClick={() => router.push('/admin/skills/create')}
                    className="bg-[#140152] hover:bg-[#1d0175] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Course
                </Button>
            </div>

            {/* Stats Cards (Placeholder data for now) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Courses</p>
                            <h3 className="text-2xl font-bold text-[#140152]">{courses.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Students</p>
                            <h3 className="text-2xl font-bold text-[#140152]">0</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Hours of Content</p>
                            <h3 className="text-2xl font-bold text-[#140152]">0</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No courses yet</h3>
                        <p className="text-gray-500 mt-1 mb-6">Create your first course to get started.</p>
                        <Button
                            onClick={() => router.push('/admin/skills/create')}
                            variant="outline"
                        >
                            Create Course
                        </Button>
                    </div>
                ) : (
                    courses.map((course) => (
                        <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                            <div className="h-40 bg-gray-200 relative">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                                        <BookOpen className="w-12 h-12 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${course.is_published
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {course.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-[#140152] mb-1 line-clamp-1">{course.title}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                                    {course.description || "No description provided."}
                                </p>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <div className="text-xs text-gray-500">
                                        {new Date(course.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => router.push(`/admin/skills/${course.id}`)}
                                        >
                                            <Edit className="w-4 h-4 text-gray-500 hover:text-[#140152]" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

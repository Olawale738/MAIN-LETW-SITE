'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlayCircle, Award, BookOpen, Loader2, ArrowRight, BarChart } from 'lucide-react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'
import { skillsApi, Course } from '@/lib/api'

export default function SkillDevelopmentPage() {
    const router = useRouter()
    const [user, setUser] = useState<string | null>(null)
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate Auth Check
        const isLoggedIn = localStorage.getItem('isLoggedIn')
        const userName = localStorage.getItem('userName')

        if (!isLoggedIn) {
            router.replace('/auth/login?redirect=/skill-development')
        } else {
            setUser(userName || 'User')
            loadCourses()
        }
    }, [router])

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

    if (!user) return null

    // Separate enrolled/active courses from others
    const enrolledCourses = courses.filter(c => c.is_enrolled)
    const availableCourses = courses.filter(c => !c.is_enrolled)

    // Calculate Stats
    const completedCourses = enrolledCourses.filter(c => (c.progress_percent || 0) >= 100).length
    const coursesInProgress = enrolledCourses.length - completedCourses

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-neutral-900 text-white hidden md:block p-6 fixed h-full z-10">
                <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
                    Skill<span className="text-orange-500">Builder</span>
                </h1>

                <div className="mb-8">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menu</p>
                    <nav className="space-y-2">
                        <button
                            onClick={() => scrollToSection('my-learning')}
                            className="w-full flex items-center gap-3 py-2 px-4 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all text-left"
                        >
                            <PlayCircle className="w-5 h-5" />
                            My Learning
                        </button>
                        <button
                            onClick={() => scrollToSection('all-courses')}
                            className="w-full flex items-center gap-3 py-2 px-4 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all text-left"
                        >
                            <BookOpen className="w-5 h-5" />
                            Browse Courses
                        </button>
                    </nav>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">My Stats</p>
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                <BookOpen className="w-4 h-4" /> Enrolled
                            </div>
                            <div className="text-2xl font-bold">{enrolledCourses.length}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                <BarChart className="w-4 h-4" /> In Progress
                            </div>
                            <div className="text-2xl font-bold">{coursesInProgress}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                <Award className="w-4 h-4" /> Completed
                            </div>
                            <div className="text-2xl font-bold text-orange-500">{completedCourses}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 md:ml-64 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Hello, {user} 🚀</h2>
                            <p className="text-gray-500">Ready to learn something new today?</p>
                        </div>
                    </div>

                    {/* Announcements */}
                    <ServiceAnnouncements serviceName="Skill Development" />

                    {/* My Learning Section */}
                    <div id="my-learning" className="scroll-mt-8">
                        <h3 className="text-xl font-bold text-[#140152] mb-6 flex items-center gap-2">
                            <PlayCircle className="w-6 h-6" />
                            My Learning
                        </h3>

                        {loading ? (
                            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                        ) : enrolledCourses.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-6 mb-12">
                                {enrolledCourses.map((course) => (
                                    <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-52 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/skill-development/${course.id}`)}>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-gray-800 w-3/4 line-clamp-2">{course.title}</h3>
                                            <PlayCircle className="text-orange-500 w-8 h-8 flex-shrink-0" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                <span>Progress</span>
                                                <span>{Math.round(course.progress_percent || 0)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${course.progress_percent || 0}%` }}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                className="p-0 h-auto mt-4 text-[#140152] font-semibold text-xs flex items-center gap-1 hover:bg-transparent"
                                            >
                                                Continue Learning <ArrowRight className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center mb-12">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">You haven't enrolled in any courses yet</h3>
                                <p className="text-gray-500 text-sm mt-1">Browse our catalog below and start learning!</p>
                            </div>
                        )}
                    </div>

                    {/* Available Courses */}
                    <div id="all-courses" className="scroll-mt-8">
                        <h3 className="text-xl font-bold text-[#140152] mb-6 flex items-center gap-2">
                            <BookOpen className="w-6 h-6" />
                            Available Courses
                        </h3>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {availableCourses.map((course) => (
                                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all">
                                    <div className="h-40 bg-gray-200 relative">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#140152] to-indigo-900">
                                                <BookOpen className="text-white/20 w-16 h-16" />
                                            </div>
                                        )}
                                        {course.instructor && (
                                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-xs">
                                                By {course.instructor}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-[#140152] mb-2 line-clamp-1">{course.title}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                                            {course.description || "No description available."}
                                        </p>
                                        <Button
                                            className="w-full bg-[#140152] hover:bg-[#1d0175] text-white"
                                            onClick={() => router.push(`/skill-development/${course.id}`)}
                                        >
                                            Enroll Now
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {availableCourses.length === 0 && !loading && (
                                <p className="text-gray-500 col-span-full text-center py-8">No new courses available right now.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

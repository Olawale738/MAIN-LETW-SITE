'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlayCircle, Download, Calendar } from 'lucide-react'

export default function SkillDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<string | null>(null)

    useEffect(() => {
        // Simulate Auth Check
        const isLoggedIn = localStorage.getItem('isLoggedIn')
        const userName = localStorage.getItem('userName')

        if (!isLoggedIn) {
            router.push('/auth/register?redirect=/skill-development/dashboard')
        } else {
            setUser(userName || 'User')
        }
    }, [router])

    if (!user) return null

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar Placeholder */}
            <div className="w-64 bg-neutral-900 text-white hidden md:block p-6">
                <h1 className="text-xl font-bold mb-8">Skill<span className="text-orange-500">Builder</span></h1>
                <nav className="space-y-4">
                    <a className="block py-2 px-4 bg-white/10 rounded-lg">My Learning</a>
                    <a className="block py-2 px-4 hover:bg-white/5 rounded-lg opacity-70">Workshops</a>
                    <a className="block py-2 px-4 hover:bg-white/5 rounded-lg opacity-70">Certificates</a>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Hello, {user} 🚀</h2>
                        <p className="text-gray-500">Ready to learn something new today?</p>
                    </div>
                    <Button onClick={() => { localStorage.clear(); router.push('/') }} variant="outline">Logout</Button>
                </div>

                {/* Dashboard Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {[
                        { title: "Introduction to Public Speaking", progress: 60, icon: PlayCircle },
                        { title: "Basic Graphic Design", progress: 10, icon: PlayCircle },
                        { title: "Time Management Workshop", progress: 100, icon: PlayCircle },
                    ].map((course, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-gray-800 w-3/4">{course.title}</h3>
                                <course.icon className="text-orange-500" />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-2">
                                    <span>Progress</span>
                                    <span>{course.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${course.progress}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Upcoming Workshops */}
                <h3 className="text-xl font-bold text-gray-800 mb-6">Upcoming Live Workshops</h3>
                <div className="space-y-4">
                    {[
                        { date: "Oct 15", title: "Digital Marketing Basics", time: "10:00 AM" },
                        { date: "Oct 22", title: "Effective Team Leadership", time: "2:00 PM" },
                    ].map((ws, i) => (
                        <div key={i} className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="bg-orange-50 text-orange-600 p-4 rounded-lg text-center min-w-[80px]">
                                <div className="font-bold text-lg">{ws.date.split(' ')[1]}</div>
                                <div className="text-xs uppercase">{ws.date.split(' ')[0]}</div>
                            </div>
                            <div className="ml-6 flex-1">
                                <h4 className="font-bold text-gray-800">{ws.title}</h4>
                                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                    <Calendar className="w-4 h-4" /> {ws.time}
                                </div>
                            </div>
                            <Button variant="outline">Register</Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

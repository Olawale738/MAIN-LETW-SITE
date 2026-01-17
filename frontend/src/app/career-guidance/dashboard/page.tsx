'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, Video, CheckCircle } from 'lucide-react'

export default function CareerDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<string | null>(null)

    useEffect(() => {
        // Simulate Auth Check
        const isLoggedIn = localStorage.getItem('isLoggedIn')
        const userName = localStorage.getItem('userName')

        if (!isLoggedIn) {
            router.push('/auth/register?redirect=/career-guidance/dashboard')
        } else {
            setUser(userName || 'User')
        }
    }, [router])

    if (!user) return null // or loading spinner

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Placeholder (could be a component) */}
            <div className="w-64 bg-[#140152] text-white hidden md:block p-6">
                <h1 className="text-xl font-bold mb-8">Career<span className="text-[#f5bb00]">Track</span></h1>
                <nav className="space-y-4">
                    <a className="block py-2 px-4 bg-white/10 rounded-lg">Dashboard</a>
                    <a className="block py-2 px-4 hover:bg-white/5 rounded-lg opacity-70">Mentorship</a>
                    <a className="block py-2 px-4 hover:bg-white/5 rounded-lg opacity-70">Resources</a>
                    <a className="block py-2 px-4 hover:bg-white/5 rounded-lg opacity-70">Settings</a>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Welcome, {user} 👋</h2>
                        <p className="text-gray-500">Your career growth journey continues here.</p>
                    </div>
                    <Button onClick={() => { localStorage.clear(); router.push('/') }} variant="outline">Logout</Button>
                </div>

                {/* User Overview */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Current Focus</div>
                        <div className="text-xl font-bold text-[#140152]">Career Discovery</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Next Session</div>
                        <div className="text-xl font-bold text-[#f5bb00]">Feb 15, 10:00 AM</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Progress</div>
                        <div className="text-xl font-bold text-green-600">30% Completed</div>
                    </div>
                </div>

                {/* Materials */}
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recommended Materials</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {[
                        { title: "Self-Assessment Guide", type: "PDF", icon: FileText },
                        { title: "Building Your CV", type: "Video", icon: Video },
                        { title: "Interview Prep 101", type: "Article", icon: FileText },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{item.title}</h4>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{item.type}</span>
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full justify-between text-blue-600 hover:text-blue-700 p-0 hover:bg-transparent">
                                Access Material <span>→</span>
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Action Items */}
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Action Items</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {[
                        "Complete Personality Test",
                        "Draft Initial Resume",
                        "Watch Introduction Video"
                    ].map((task, i) => (
                        <div key={i} className="p-4 border-b border-gray-50 last:border-0 flex items-center gap-4 hover:bg-gray-50">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${i === 2 ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                                {i === 2 && <CheckCircle className="w-4 h-4 text-green-600" />}
                            </div>
                            <span className={i === 2 ? 'line-through text-gray-400' : 'text-gray-700'}>{task}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Briefcase, TrendingUp, Users, LogOut, User } from 'lucide-react'

export default function UserDashboard() {
    const router = useRouter()
    const [userName, setUserName] = useState('')
    const [bibleProgress, setBibleProgress] = useState(0)
    const [attendance, setAttendance] = useState<string[]>([])

    useEffect(() => {
        const loggedIn = localStorage.getItem('isLoggedIn')
        if (!loggedIn) {
            router.push('/auth/login')
        }
        setUserName(localStorage.getItem('userName') || 'User')

        // Bible Reading Progress
        const completed = JSON.parse(localStorage.getItem('bibleReadingCompleted') || '{}')
        const totalWeeks = 54 // Based on the plan length in bible-reading page
        const completedCount = Object.values(completed).filter(Boolean).length
        setBibleProgress(Math.round((completedCount / totalWeeks) * 100))

        // Service Attendance
        const storedAttendance = JSON.parse(localStorage.getItem('serviceAttendance') || '[]')
        setAttendance(storedAttendance)
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userName')
        router.push('/')
    }

    const handleCheckIn = () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        const newAttendance = [today, ...attendance]
        setAttendance(newAttendance)
        localStorage.setItem('serviceAttendance', JSON.stringify(newAttendance))
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar Placeholder if global navbar is hidden on dashboard, ensuring consistency */}

            <header className="bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold">
                        {userName.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#140152]">Welcome, {userName}</h1>
                        <p className="text-sm text-gray-500">Member • Light Encounter Tabernacle</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="hidden md:block">Logout</span>
                </button>
            </header>

            <main className="flex-grow py-12 px-4 md:px-12">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Bible Progress Card */}
                        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-blue-100 text-sm uppercase tracking-wider font-medium">Bible Reading</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between mb-4">
                                    <span className="text-4xl font-bold">{bibleProgress}%</span>
                                    <span className="text-blue-200 text-sm mb-1">Completed</span>
                                </div>
                                <div className="w-full bg-blue-900/50 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${bibleProgress}%` }} />
                                </div>
                                <PremiumButton href="/bible-reading" className="mt-6 w-full bg-white/10 hover:bg-white/20 border-none text-white">Go to Reading Plan</PremiumButton>
                            </CardContent>
                        </Card>

                        {/* Attendance Card */}
                        <Card className="bg-white border-none shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-gray-500 text-sm uppercase tracking-wider font-medium">Service Attendance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between mb-4">
                                    <span className="text-4xl font-bold text-[#140152]">{attendance.length}</span>
                                    <span className="text-gray-400 text-sm mb-1">Services Joined</span>
                                </div>
                                <Button onClick={handleCheckIn} className="w-full bg-[#140152] hover:bg-blue-900 text-white">
                                    Check In Today
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Next Event Card (Static Simulation) */}
                        <Card className="bg-[#f5bb00] text-[#140152] border-none shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[#140152]/70 text-sm uppercase tracking-wider font-bold">Up Next</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <h3 className="text-2xl font-black">Sunday Service</h3>
                                    <p className="font-medium opacity-80">9:00 AM • Main Sanctuary</p>
                                </div>
                                <PremiumButton href="/services" className="w-full bg-[#140152] text-white hover:bg-[#140152]/90 border-none">View All Services</PremiumButton>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Career Track Card */}
                        <Card className="hover:shadow-xl transition-all duration-300 border-none group cursor-pointer" onClick={() => router.push('/career-guidance/dashboard')}>
                            <CardHeader>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-[#140152]">Career Guidance (Mentorship)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500 mb-6">Access your mentorship dashboard using our Mentorship Code feature.</p>
                                <PremiumButton href="/career-guidance/dashboard?code=MENTOR123">Access Career Track</PremiumButton>
                            </CardContent>
                        </Card>

                        {/* Skill Development Card */}
                        <Card className="hover:shadow-xl transition-all duration-300 border-none group cursor-pointer" onClick={() => router.push('/skill-development/dashboard')}>
                            <CardHeader>
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-[#140152]">Skill Development</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500 mb-6">Track your courses, workshops, and skill acquisition progress.</p>
                                <PremiumButton href="/skill-development/dashboard">Go to Skills Hub</PremiumButton>
                            </CardContent>
                        </Card>

                        {/* Leadership Track Card */}
                        <Card className="hover:shadow-xl transition-all duration-300 border-none group cursor-pointer" onClick={() => router.push('/leadership/dashboard')}>
                            <CardHeader>
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-[#140152]">Leadership Track</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-500 mb-6">View your leadership modules and ministry training status.</p>
                                <PremiumButton href="/leadership/dashboard">View Leadership</PremiumButton>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance History */}
                    {attendance.length > 0 && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-[#140152] mb-6">Recent Activity</h3>
                            <div className="space-y-4">
                                {attendance.slice(0, 5).map((date, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <div>
                                            <p className="font-bold text-[#140152]">Attended Service</p>
                                            <p className="text-sm text-gray-500">{date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-12 bg-[#140152] text-white rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Need Spiritual Support?</h2>
                            <p className="text-blue-200">Our pastoral team is here to pray with you and counsel you.</p>
                        </div>
                        <div className="flex gap-4">
                            <PremiumButton href="/prayer" className="bg-[#f5bb00] text-[#140152] hover:bg-white hover:text-[#140152]">Request Prayer</PremiumButton>
                            <Link href="/contact" className="px-6 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all">Contact Pastor</Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

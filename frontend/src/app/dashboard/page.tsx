'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Briefcase, TrendingUp, Users, LogOut, Loader2, Clock, Bell, X, BookOpen, Music, Heart, GraduationCap, MessageCircle, Megaphone } from 'lucide-react'
import ServiceCard from '@/components/shared/ServiceCard'

// Service configuration for cards - these only appear after user is approved for each service
const SERVICE_CONFIG: Record<string, { icon: React.ReactNode; description: string; buttonText: string; buttonLink: string }> = {
    "Bible study": {
        icon: <BookOpen className="w-6 h-6" />,
        description: "Deepen your understanding of Scripture through our comprehensive Bible study programs.",
        buttonText: "Join Bible Study",
        buttonLink: "/bible-reading"
    },
    "Prayer meeting": {
        icon: <Heart className="w-6 h-6" />,
        description: "Connect with fellow believers in powerful prayer sessions and intercession.",
        buttonText: "Join Prayer",
        buttonLink: "/prayer"
    },
    "Evangelism": {
        icon: <Megaphone className="w-6 h-6" />,
        description: "Be part of our outreach team spreading the Gospel in communities.",
        buttonText: "Go Evangelism",
        buttonLink: "/evangelism"
    },
    "Choir": {
        icon: <Music className="w-6 h-6" />,
        description: "Join our worship team and use your musical gifts to glorify God.",
        buttonText: "View Choir",
        buttonLink: "/services/alter-sound"
    },
    "Theology school (paid)": {
        icon: <GraduationCap className="w-6 h-6" />,
        description: "Advance your theological knowledge through our accredited courses.",
        buttonText: "Access School",
        buttonLink: "/education"
    },
    "Counselling": {
        icon: <MessageCircle className="w-6 h-6" />,
        description: "Access spiritual and pastoral counselling support services.",
        buttonText: "Get Counselling",
        buttonLink: "/services/counselling"
    },
    "Skill Development": {
        icon: <TrendingUp className="w-6 h-6" />,
        description: "Track your courses, workshops, and skill acquisition progress.",
        buttonText: "Go to Skills Hub",
        buttonLink: "/skill-development"
    },
    "Leadership Training": {
        icon: <Users className="w-6 h-6" />,
        description: "View your leadership modules and ministry training status.",
        buttonText: "View Leadership",
        buttonLink: "/leadership"
    },
    "Career Guidance": {
        icon: <Briefcase className="w-6 h-6" />,
        description: "Access your mentorship dashboard using our Mentorship Code feature.",
        buttonText: "Access Career Track",
        buttonLink: "/career-guidance"
    }
}
import { userApi, serviceRequestApi, notificationApi, tokenManager, Notification } from '@/lib/api'

export default function UserDashboard() {
    const router = useRouter()
    const [userName, setUserName] = useState('')
    const [bibleProgress, setBibleProgress] = useState(0)
    const [attendance, setAttendance] = useState<string[]>([])
    const [approvedServices, setApprovedServices] = useState<string[]>([])
    const [pendingServices, setPendingServices] = useState<string[]>([])
    const [servicesLoading, setServicesLoading] = useState(true)

    // Notifications state
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notificationsLoading, setNotificationsLoading] = useState(false)

    useEffect(() => {
        const init = async () => {
            const loggedIn = localStorage.getItem('isLoggedIn')
            if (!loggedIn) {
                router.push('/auth/login')
                return
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

            // Fetch My Services from service requests
            try {
                const myRequests = await serviceRequestApi.getMyRequests()
                setApprovedServices(myRequests.approved.map(r => r.service_name))
                setPendingServices(myRequests.pending.map(r => r.service_name))
            } catch (err) {
                console.error('Failed to load services', err)
            } finally {
                setServicesLoading(false)
            }

            // Fetch unread notification count
            try {
                const countData = await notificationApi.getUnreadCount()
                setUnreadCount(countData.unread_count)
            } catch (err) {
                console.error('Failed to load notifications count', err)
            }
        }
        init()
    }, [router])

    const loadNotifications = async () => {
        setNotificationsLoading(true)
        try {
            const data = await notificationApi.getNotifications(10, 0)
            setNotifications(data.notifications)
            setUnreadCount(data.unread_count)
        } catch (err) {
            console.error('Failed to load notifications', err)
        } finally {
            setNotificationsLoading(false)
        }
    }

    const toggleNotifications = async () => {
        if (!showNotifications) {
            await loadNotifications()
        }
        setShowNotifications(!showNotifications)
    }

    const markAsRead = async (notificationId: string) => {
        try {
            await notificationApi.markAsRead(notificationId)
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error('Failed to mark notification as read', err)
        }
    }

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error('Failed to mark all notifications as read', err)
        }
    }

    const handleLogout = () => {
        tokenManager.clearTokens()
        router.push('/')
    }

    const handleCheckIn = () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        const newAttendance = [today, ...attendance]
        setAttendance(newAttendance)
        localStorage.setItem('serviceAttendance', JSON.stringify(newAttendance))
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return `${diffDays}d ago`
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Welcome Section */}
            <div className="bg-white border-b border-gray-100 py-6 px-4 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#140152]">Welcome back, {userName}!</h1>
                    <p className="text-gray-500 mt-1">Here's what's happening with your ministries.</p>
                </div>
            </div>

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

                    {/* My Services Section */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#140152]">My Ministries & Services</h2>
                            <Button
                                onClick={() => router.push('/onboarding/services')}
                                variant="outline"
                                className="border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                            >
                                Manage Services
                            </Button>
                        </div>

                        {servicesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Always Available Services - No Approval Required */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Always Available</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {/* Counselling - Always accessible */}
                                        <ServiceCard
                                            title="Counselling"
                                            description="Access spiritual and pastoral counselling support services."
                                            buttonText="Get Counselling"
                                            buttonLink="/services/counselling"
                                            icon={<MessageCircle className="w-6 h-6" />}
                                        />
                                    </div>
                                </div>

                                {/* Approved Services - Filter out Counselling to prevent duplicates */}
                                {approvedServices.filter(s => s !== 'Counselling').length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Active</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {approvedServices.filter(s => s !== 'Counselling').map((service) => {
                                                const config = SERVICE_CONFIG[service]
                                                if (config) {
                                                    // Check for paid theology school
                                                    let buttonLink = config.buttonLink
                                                    let buttonText = config.buttonText

                                                    if (service === "Theology school (paid)") {
                                                        const paidServices = JSON.parse(localStorage.getItem('paidServices') || '{}')
                                                        if (paidServices['theology_school']) {
                                                            buttonLink = "/dashboard/theology-school"
                                                            buttonText = "Access Dashboard"
                                                        }
                                                    }

                                                    return (
                                                        <ServiceCard
                                                            key={service}
                                                            title={service}
                                                            description={config.description}
                                                            buttonText={buttonText}
                                                            buttonLink={buttonLink}
                                                            icon={config.icon}
                                                        />
                                                    )
                                                }
                                                // Fallback for unknown services
                                                return (
                                                    <ServiceCard
                                                        key={service}
                                                        title={service}
                                                        description="Access your enrolled service and start participating."
                                                        buttonText="Access Service"
                                                        buttonLink="/services"
                                                        icon={<Briefcase className="w-6 h-6" />}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Pending Services */}
                                {pendingServices.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pending Approval</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {pendingServices.map((service) => (
                                                <div key={service} className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-amber-800">{service}</span>
                                                        <p className="text-xs text-amber-600">Awaiting admin approval</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Show message if no other services besides Counselling */}
                                {approvedServices.filter(s => s !== 'Counselling').length === 0 && pendingServices.length === 0 && (
                                    <div className="text-center py-4 text-gray-400 text-sm">
                                        <p>No other services yet. Visit Manage Services to join additional ministries.</p>
                                    </div>
                                )}
                            </div>
                        )}
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

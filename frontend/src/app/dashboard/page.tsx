'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Briefcase, TrendingUp, Users, Loader2, Clock, BookOpen, Music, Heart, GraduationCap, MessageCircle, Megaphone } from 'lucide-react'
import ServiceCard from '@/components/shared/ServiceCard'
import { serviceRequestApi, notificationApi, Notification } from '@/lib/api'
import { Spotlight } from '@/components/ui/spotlight'

// Service configuration for cards
const SERVICE_CONFIG: Record<string, { icon: React.ReactNode; description: string; buttonText: string; buttonLink: string }> = {
    "Bible study": {
        icon: <BookOpen className="w-8 h-8" />,
        description: "Deepen your understanding of Scripture through our comprehensive Bible study programs.",
        buttonText: "Join Bible Study",
        buttonLink: "/bible-reading"
    },
    "Prayer meeting": {
        icon: <Heart className="w-8 h-8" />,
        description: "Connect with fellow believers in powerful prayer sessions and intercession.",
        buttonText: "Join Prayer",
        buttonLink: "/prayer"
    },
    "Evangelism": {
        icon: <Megaphone className="w-8 h-8" />,
        description: "Be part of our outreach team spreading the Gospel in communities.",
        buttonText: "Go Evangelism",
        buttonLink: "/evangelism"
    },
    "Choir": {
        icon: <Music className="w-8 h-8" />,
        description: "Join our worship team and use your musical gifts to glorify God.",
        buttonText: "View Choir",
        buttonLink: "/services/alter-sound"
    },
    "Theology school": {
        icon: <GraduationCap className="w-8 h-8" />,
        description: "Advance your theological knowledge through our accredited courses.",
        buttonText: "Access School",
        buttonLink: "/theology-school"
    },
    "Counselling": {
        icon: <MessageCircle className="w-8 h-8" />,
        description: "Access spiritual and pastoral counselling support services.",
        buttonText: "Get Counselling",
        buttonLink: "/services/counselling"
    },
    "Skill Development": {
        icon: <TrendingUp className="w-8 h-8" />,
        description: "Track your courses, workshops, and skill acquisition progress.",
        buttonText: "Go to Skills Hub",
        buttonLink: "/skill-development"
    },
    "Leadership Training": {
        icon: <Users className="w-8 h-8" />,
        description: "View your leadership modules and ministry training status.",
        buttonText: "View Leadership",
        buttonLink: "/leadership"
    },
    "Career Guidance": {
        icon: <Briefcase className="w-8 h-8" />,
        description: "Access your mentorship dashboard using our Mentorship Code feature.",
        buttonText: "Access Career Track",
        buttonLink: "/career-guidance"
    }
}

export default function UserDashboard() {
    const router = useRouter()
    const [userName, setUserName] = useState('')
    const [bibleProgress, setBibleProgress] = useState(0)
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden font-sans">

            {/* Spotlight Hero Section */}
            <div className="relative bg-[#140152] pt-32 pb-32 px-4 md:px-12 overflow-hidden">
                <Spotlight className="-top-10 left-0 md:left-60 md:-top-20" fill="white" />
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 tracking-tight">
                            Welcome back,<br /> {userName}.
                        </h1>
                        <p className="text-blue-200 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                            Your spiritual journey continues. Here's what's happening today.
                        </p>
                    </div>
                </div>
            </div>

            <main className="flex-grow py-16 px-4 md:px-12 -mt-20 relative z-20">
                <div className="max-w-7xl mx-auto space-y-16">

                    {/* Top Highlights Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Bible Progress Card */}
                        <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] transition-all duration-500 overflow-hidden group rounded-3xl h-full flex flex-col justify-between">
                            <CardHeader className="pb-2 relative p-8">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <CardTitle className="text-blue-600 text-sm uppercase tracking-widest font-bold z-10 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Bible Reading Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 px-8 pb-8 pt-0 flex-grow flex flex-col justify-end">
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-7xl font-black text-[#140152] tracking-tighter">{bibleProgress}%</span>
                                    <span className="text-gray-400 font-medium text-lg">completed</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-4 mb-8 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-[#140152] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(20,1,82,0.3)]" style={{ width: `${bibleProgress}%` }} />
                                </div>
                                <PremiumButton href="/bible-reading" className="w-full justify-center py-6 text-lg rounded-xl">Continue Reading</PremiumButton>
                            </CardContent>
                        </Card>

                        {/* Up Next Card */}
                        <Card className="bg-gradient-to-br from-[#f5bb00] to-[#e6a800] text-[#140152] border-none shadow-2xl hover:shadow-[0_20px_50px_rgba(245,187,0,0.4)] transition-all duration-500 rounded-3xl h-full flex flex-col justify-between">
                            <CardHeader className="p-8 pb-2">
                                <CardTitle className="text-[#140152]/60 text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Upcoming Event
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 flex-grow flex flex-col justify-end">
                                <div className="mb-8">
                                    <h3 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Sunday Service</h3>
                                    <p className="font-semibold opacity-80 text-xl border-l-4 border-[#140152]/20 pl-4 py-1">9:00 AM • Main Sanctuary</p>
                                </div>
                                <PremiumButton href="/services" className="w-full bg-[#140152] text-white hover:bg-[#140152]/90 border-none justify-center py-6 text-lg rounded-xl shadow-none">
                                    View Full Schedule
                                </PremiumButton>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ministries Section */}
                    <div>
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-3xl font-black text-[#140152] tracking-tight">My Ministries</h2>
                            <Button
                                onClick={() => router.push('/onboarding/services')}
                                variant="outline"
                                className="border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white transition-all rounded-full px-8 py-6 text-base font-bold shadow-sm hover:shadow-lg"
                            >
                                Manage Services
                            </Button>
                        </div>

                        {servicesLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-[#140152]" />
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Active Services Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Counselling - Always accessible */}
                                    <ServiceCard
                                        title="Counselling"
                                        description="Access spiritual and pastoral counselling support services."
                                        buttonText="Get Counselling"
                                        buttonLink="/services/counselling"
                                        icon={<MessageCircle className="w-8 h-8" />}
                                    />

                                    {/* Approved Services */}
                                    {approvedServices.filter(s => s !== 'Counselling').map((service) => {
                                        const config = SERVICE_CONFIG[service]
                                        if (config) {
                                            let buttonLink = config.buttonLink
                                            let buttonText = config.buttonText

                                            if (service === "Theology school") {
                                                const paidServices = JSON.parse(localStorage.getItem('paidServices') || '{}')
                                                if (paidServices['theology_school']) {
                                                    buttonLink = "/theology-school"
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
                                        return (
                                            <ServiceCard
                                                key={service}
                                                title={service}
                                                description="Access your enrolled service and start participating."
                                                buttonText="Access Service"
                                                buttonLink="/services"
                                                icon={<Briefcase className="w-8 h-8" />}
                                            />
                                        )
                                    })}
                                </div>

                                {/* Pending Services */}
                                {pendingServices.length > 0 && (
                                    <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                                        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-6 flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            Pending Approvals
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pendingServices.map((service) => (
                                                <div key={service} className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                                                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                        <Clock className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block text-lg mb-1">{service}</span>
                                                        <span className="text-sm text-amber-700 font-medium bg-amber-100 px-3 py-1 rounded-full">Awaiting review</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {approvedServices.filter(s => s !== 'Counselling').length === 0 && pendingServices.length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 hover:border-blue-200 transition-colors">
                                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300">
                                            <Briefcase className="w-10 h-10" />
                                        </div>
                                        <p className="text-gray-500 font-medium text-lg mb-4">You haven't joined any ministries yet.</p>
                                        <Button
                                            variant="link"
                                            className="text-[#140152] font-bold text-lg"
                                            onClick={() => router.push('/onboarding/services')}
                                        >
                                            Explore Available Ministries <Megaphone className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

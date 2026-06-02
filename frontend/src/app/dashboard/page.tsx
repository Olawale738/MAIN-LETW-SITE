'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Briefcase, TrendingUp, Users, Loader2, Clock, BookOpen, Music, Heart, GraduationCap, MessageCircle, Megaphone, Send, HandHeart, CheckCircle2, Phone, CalendarDays } from 'lucide-react'
import ServiceCard from '@/components/shared/ServiceCard'
import { serviceRequestApi, notificationApi, Notification, ServiceRequest } from '@/lib/api'
import { checkMembership } from '@/lib/dept-api'
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
        buttonLink: "/dashboard/alter-sound"
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
    },
    "Volunteer": {
        icon: <HandHeart className="w-8 h-8" />,
        description: "You're an approved LETW volunteer. Your coordinator will reach out with next steps.",
        buttonText: "View Volunteer Info",
        buttonLink: "/volunteer"
    }
}

/** Parses "Department: X | Availability: Y | Phone: Z | Experience: W" from volunteer message */
function parseVolunteerMessage(msg?: string) {
    if (!msg) return {}
    const extract = (key: string) => {
        const match = msg.match(new RegExp(`${key}:\\s*([^|]+)`))
        return match ? match[1].trim() : undefined
    }
    return {
        department: extract('Department'),
        availability: extract('Availability'),
        phone: extract('Phone'),
        experience: extract('Experience'),
    }
}

function VolunteerCard({ request }: { request: ServiceRequest }) {
    const { department, availability, phone } = parseVolunteerMessage(request.message)
    return (
        <div className="bg-gradient-to-br from-[#140152] to-purple-900 rounded-3xl p-6 text-white shadow-lg border border-purple-700/40 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#f5bb00]/20 flex items-center justify-center shrink-0">
                    <HandHeart className="w-6 h-6 text-[#f5bb00]" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#f5bb00]/80 mb-0.5">Active Volunteer</p>
                    <h3 className="font-black text-lg leading-tight">{department || 'Church Volunteer'}</h3>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto shrink-0" />
            </div>

            <div className="space-y-2">
                {availability && (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                        <CalendarDays className="w-4 h-4 text-[#f5bb00]/70 shrink-0" />
                        <span>Available: <span className="text-white font-semibold">{availability}</span></span>
                    </div>
                )}
                {phone && (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                        <Phone className="w-4 h-4 text-[#f5bb00]/70 shrink-0" />
                        <span>{phone}</span>
                    </div>
                )}
            </div>

            <div className="bg-white/10 rounded-2xl px-4 py-3 text-sm text-white/90 leading-relaxed">
                🎉 Your coordinator will contact you soon with your first assignment and orientation details.
            </div>

            <Link
                href="/dashboard/volunteer"
                className="text-center text-sm font-bold text-[#f5bb00] hover:text-yellow-300 transition-colors py-1"
            >
                Open Volunteer Dashboard →
            </Link>
        </div>
    )
}

export default function UserDashboard() {
    const router = useRouter()
    const [userName, setUserName] = useState('')
    const [bibleProgress, setBibleProgress] = useState(0)
    const [approvedServices, setApprovedServices] = useState<string[]>([])
    const [approvedRequests, setApprovedRequests] = useState<ServiceRequest[]>([])
    const [pendingServices, setPendingServices] = useState<string[]>([])
    const [activeDeptNames, setActiveDeptNames] = useState<string[]>([])
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
                setApprovedRequests(myRequests.approved)
                // Deduplicate pending services
                const rawPending = myRequests.pending.map(r => r.service_name)
                setPendingServices([...new Set(rawPending)])
            } catch (err) {
                console.error('Failed to load services', err)
            } finally {
                setServicesLoading(false)
            }

            // Cross-check actual dept membership so approved members don't see stale "pending" cards
            try {
                const DEPT_SERVICE_MAP: Record<string, string> = {
                    children: 'Children Ministry',
                    youth: 'Youth Ministry',
                }
                const results = await Promise.allSettled([
                    checkMembership('children'),
                    checkMembership('youth'),
                ])
                const active: string[] = []
                results.forEach((r, i) => {
                    const dept = ['children', 'youth'][i]
                    if (r.status === 'fulfilled' && r.value?.is_member && r.value?.is_active) {
                        active.push(DEPT_SERVICE_MAP[dept])
                    }
                })
                setActiveDeptNames(active)
            } catch (err) {
                console.error('Failed to check dept memberships', err)
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
                <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                        <h1 className="text-xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 tracking-tight">
                            Welcome back,<br /> {userName}.
                        </h1>
                        <p className="text-blue-200 text-md md:text-xl max-w-2xl font-light leading-relaxed">
                            Your spiritual journey continues. Here's what's happening today.
                        </p>
                    </div>
                </div>
            </div>

            <main className="flex-grow py-16 px-4 md:px-12 -mt-20 relative z-20">
                <div className="max-w-5xl mx-auto space-y-16">

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
                                    <span className="text-5xl font-black text-[#140152] tracking-tighter">{bibleProgress}%</span>
                                    <span className="text-gray-400 font-medium text-lg">completed</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-4 mb-8 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-[#140152] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(20,1,82,0.3)]" style={{ width: `${bibleProgress}%` }} />
                                </div>
                                <PremiumButton href="/bible-reading" className="justify-center text-lg rounded-xl">Continue Reading</PremiumButton>
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
                                <PremiumButton href="/services" className="bg-[#140152] text-white hover:bg-[#140152]/90 border-none justify-center text-lg rounded-xl shadow-none">
                                    View Full Schedule
                                </PremiumButton>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => {
                                const chatBtn = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement
                                chatBtn?.click()
                            }}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 bg-[#140152] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                <MessageCircle className="w-6 h-6 text-[#f5bb00]" />
                            </div>
                            <div>
                                <p className="font-bold text-[#140152]">Chat with Admin</p>
                                <p className="text-xs text-gray-400">Get support or ask a question</p>
                            </div>
                        </button>
                        <Link href="/prayer-request" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                <Heart className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-[#140152]">Prayer Request</p>
                                <p className="text-xs text-gray-400">Submit a prayer request</p>
                            </div>
                        </Link>
                        <Link href="/events" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-bold text-[#140152]">Upcoming Events</p>
                                <p className="text-xs text-gray-400">See what's happening</p>
                            </div>
                        </Link>
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
                                    {approvedServices.filter(s => s !== 'Counselling' && s !== 'Theology school').map((service) => {
                                        // Volunteer gets its own rich card showing department + availability
                                        if (service === 'Volunteer') {
                                            const volunteerRequest = approvedRequests.find(r => r.service_name === 'Volunteer')
                                            return volunteerRequest
                                                ? <VolunteerCard key={service} request={volunteerRequest} />
                                                : null
                                        }
                                        const config = SERVICE_CONFIG[service]
                                        if (config) {
                                            return (
                                                <ServiceCard
                                                    key={service}
                                                    title={service}
                                                    description={config.description}
                                                    buttonText={config.buttonText}
                                                    buttonLink={config.buttonLink}
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
                                {pendingServices.filter(s => s !== 'Theology school' && !activeDeptNames.includes(s)).length > 0 && (
                                    <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                                        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-6 flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            Pending Approvals
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pendingServices.filter(s => s !== 'Theology school' && !activeDeptNames.includes(s)).map((service) => (
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

                                {approvedServices.filter(s => s !== 'Counselling' && s !== 'Theology school').length === 0 && pendingServices.filter(s => s !== 'Theology school' && !activeDeptNames.includes(s)).length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 hover:border-blue-200 transition-colors">
                                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300">
                                            <Briefcase className="w-10 h-10" />
                                        </div>
                                        <p className="text-gray-500 font-medium text-lg mb-4">You haven't joined any ministries yet.</p>
                                        <PremiumButton
                                            href="/onboarding/services"
                                            className="justify-center py-6 text-lg rounded-xl mt-4"
                                        >
                                            Explore Available Ministries
                                        </PremiumButton>
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

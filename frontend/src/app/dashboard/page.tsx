'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Briefcase, TrendingUp, Users, Loader2, Clock, BookOpen, Music, Heart, GraduationCap, MessageCircle, Megaphone, Send, HandHeart, CheckCircle2, Phone, CalendarDays, Bell, X, ChevronRight, ArrowRight } from 'lucide-react'
import ServiceCard from '@/components/shared/ServiceCard'
import { serviceRequestApi, notificationApi, Notification, ServiceRequest } from '@/lib/api'
import { checkMembership, type Department } from '@/lib/dept-api'
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
    },
    "Bible Mentoring": {
        icon: <Users className="w-8 h-8" />,
        description: "Meet your mentor, track your mentoring sessions, and log growth evaluations.",
        buttonText: "Open Mentoring",
        buttonLink: "/bible-study?focus=mentoring"
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
    // All dept memberships with their status
    const [deptMemberships, setDeptMemberships] = useState<{ dept: string; label: string; url: string; active: boolean }[]>([])
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

            // Check membership in ALL departments and surface them on the main dashboard
            try {
                const ALL_DEPTS: { key: Department; label: string; url: string }[] = [
                    { key: 'choir',       label: 'Worship Team',        url: '/services/alter-sound/dashboard' },
                    { key: 'media',       label: 'Media & Creative',     url: '/services/media' },
                    { key: 'hospitality', label: 'Hospitality Team',     url: '/services/hospitality' },
                    { key: 'ushering',    label: 'Ushering & Welcome',   url: '/services/ushering' },
                    { key: 'security',    label: 'Security & Safety',    url: '/services/security' },
                    { key: 'youth',       label: 'Youth Ministry',       url: '/youth/dashboard' },
                    { key: 'children',    label: "Children's Ministry",  url: '/children/dashboard' },
                ]
                const results = await Promise.allSettled(ALL_DEPTS.map(d => checkMembership(d.key)))
                const memberships: { dept: string; label: string; url: string; active: boolean }[] = []
                const activeNames: string[] = []
                results.forEach((r, i) => {
                    const d = ALL_DEPTS[i]
                    if (r.status === 'fulfilled' && r.value?.is_member) {
                        memberships.push({ dept: d.key, label: d.label, url: d.url, active: !!r.value.is_active })
                        if (r.value.is_active) activeNames.push(d.label)
                    }
                })
                setDeptMemberships(memberships)
                setActiveDeptNames(activeNames)
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

    const visiblePending = pendingServices.filter(s => s !== 'Theology school' && !activeDeptNames.includes(s))
    const visibleApproved = approvedServices.filter(s => s !== 'Counselling' && s !== 'Theology school')

    return (
        <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans">

            {/* ── Hero ── */}
            <div className="relative bg-[#140152] pt-14 pb-24 px-4 md:px-12 overflow-hidden">
                <Spotlight className="-top-10 left-0 md:left-60 md:-top-20" fill="white" />

                {/* Notification bell */}
                <div className="absolute top-4 right-4 md:right-12 z-20">
                    <button onClick={toggleNotifications}
                        className="relative w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center justify-center transition-all">
                        <Bell className="w-5 h-5 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#f5bb00] rounded-full flex items-center justify-center text-[#140152] text-[10px] font-black">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification dropdown */}
                    {showNotifications && (
                        <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                                <p className="font-black text-[#140152] text-sm">Notifications</p>
                                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {notificationsLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#140152]" /></div>
                                ) : notifications.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-8">All caught up! 🎉</p>
                                ) : notifications.map(n => (
                                    <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-[#f5bb00]' : 'bg-gray-200'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#140152] truncate">{n.title}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href="/dashboard/notifications" onClick={() => setShowNotifications(false)}
                                className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold text-[#140152] hover:bg-gray-50 border-t border-gray-100 transition-colors">
                                View all <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <p className="text-[#f5bb00]/70 text-sm font-semibold mb-1">
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 tracking-tight">
                        Welcome back, {userName}. 👋
                    </h1>
                    <p className="text-white/50 text-sm md:text-base font-light">
                        Your spiritual journey continues. Here's what's happening.
                    </p>
                </div>
            </div>

            <main className="flex-grow px-4 md:px-12 -mt-12 relative z-20 pb-16">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* ── Top cards ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Bible Progress */}
                        <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-2xl">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Bible Reading Plan</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-black text-[#140152]">{bibleProgress}%</span>
                                    <span className="text-gray-400 font-medium">completed</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-500 to-[#140152] h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${bibleProgress}%` }} />
                                </div>
                                <PremiumButton href="/bible-reading" className="justify-center rounded-xl">
                                    Continue Reading
                                </PremiumButton>
                            </CardContent>
                        </Card>

                        {/* Upcoming */}
                        <Card className="bg-gradient-to-br from-[#f5bb00] to-[#e6a800] text-[#140152] border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                            <CardContent className="p-6 flex flex-col h-full justify-between">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-[#140152]/60" />
                                    <span className="text-xs font-bold text-[#140152]/60 uppercase tracking-wider">Next Service</span>
                                </div>
                                <div className="mb-5">
                                    <h3 className="text-3xl font-black mb-1.5">Sunday Service</h3>
                                    <p className="font-semibold opacity-70 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> 9:00 AM · Main Sanctuary
                                    </p>
                                </div>
                                <PremiumButton href="/services"
                                    className="bg-[#140152] text-white hover:bg-[#140152]/90 border-none justify-center rounded-xl shadow-none">
                                    View Full Schedule
                                </PremiumButton>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Quick Actions ── */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            {
                                label: 'Chat Admin', sub: 'Get support', icon: MessageCircle, bg: '#140152', iconColor: '#f5bb00',
                                action: () => (document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement)?.click()
                            },
                            { label: 'Prayer Request', sub: 'Submit request', icon: Heart,          bg: '#dbeafe', iconColor: '#2563eb', href: '/prayer-request' },
                            { label: 'Events',         sub: 'See schedule',  icon: CalendarDays,    bg: '#fef3c7', iconColor: '#d97706', href: '/events' },
                        ].map((a, i) => {
                            const inner = (
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center gap-2.5 text-center group">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                                        style={{ background: a.bg }}>
                                        <a.icon className="w-5 h-5" style={{ color: a.iconColor }} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#140152] text-sm">{a.label}</p>
                                        <p className="text-[10px] text-gray-400">{a.sub}</p>
                                    </div>
                                </div>
                            )
                            if ('href' in a && a.href) return <Link key={i} href={a.href}>{inner}</Link>
                            return <button key={i} onClick={a.action} className="text-left">{inner}</button>
                        })}
                    </div>

                    {/* ── My Ministries ── */}
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-black text-[#140152]">My Ministries</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Your approved and enrolled services</p>
                            </div>
                            <button onClick={() => router.push('/onboarding/services')}
                                className="flex items-center gap-1.5 text-xs font-bold text-[#140152] border border-[#140152]/20 hover:bg-[#140152] hover:text-white px-3.5 py-2 rounded-xl transition-all">
                                Manage <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {servicesLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-[#140152]/30" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Active grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <ServiceCard
                                        title="Counselling"
                                        description="Access spiritual and pastoral counselling support services."
                                        buttonText="Get Counselling"
                                        buttonLink="/services/counselling"
                                        icon={<MessageCircle className="w-8 h-8" />}
                                    />
                                    {visibleApproved.map((service) => {
                                        if (service === 'Volunteer') {
                                            const req = approvedRequests.find(r => r.service_name === 'Volunteer')
                                            return req ? <VolunteerCard key={service} request={req} /> : null
                                        }
                                        const config = SERVICE_CONFIG[service]
                                        return config ? (
                                            <ServiceCard key={service} title={service} description={config.description}
                                                buttonText={config.buttonText} buttonLink={config.buttonLink} icon={config.icon} />
                                        ) : (
                                            <ServiceCard key={service} title={service}
                                                description="Access your enrolled service and start participating."
                                                buttonText="Access Service" buttonLink="/services"
                                                icon={<Briefcase className="w-8 h-8" />} />
                                        )
                                    })}
                                </div>

                                {/* Pending */}
                                {visiblePending.length > 0 && (
                                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                                            Awaiting Approval
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {visiblePending.map((service) => (
                                                <div key={service} className="bg-white px-4 py-3.5 rounded-xl border border-amber-100 flex items-center gap-3 shadow-sm">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                                        <Clock className="w-4 h-4 text-amber-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-800 text-sm truncate">{service}</p>
                                                        <p className="text-[10px] text-amber-600 font-semibold">Under review</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Volunteer / Dept memberships */}
                                {deptMemberships.length > 0 && (
                                    <div className="bg-gradient-to-r from-[#140152]/5 to-purple-50 rounded-2xl p-5 border border-[#140152]/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <HandHeart className="w-4 h-4 text-[#140152]" />
                                                <p className="text-sm font-black text-[#140152] uppercase tracking-wider">Volunteer Departments</p>
                                            </div>
                                            <Link href="/dashboard/volunteer" className="text-xs font-bold text-[#140152] hover:underline flex items-center gap-1">
                                                Volunteer Dashboard <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {deptMemberships.map(m => (
                                                <Link key={m.dept} href={m.active ? m.url : '/dashboard/volunteer'}
                                                    className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-100 hover:border-[#140152]/30 hover:shadow-sm transition-all group">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.active ? 'bg-[#140152]' : 'bg-amber-100'}`}>
                                                        <HandHeart className={`w-4 h-4 ${m.active ? 'text-[#f5bb00]' : 'text-amber-600'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-[#140152] truncate">{m.label}</p>
                                                        <p className={`text-[11px] font-semibold ${m.active ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {m.active ? '✓ Approved — Open Dashboard' : '⌛ Awaiting Approval'}
                                                        </p>
                                                    </div>
                                                    {m.active && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#140152] transition-colors shrink-0" />}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty state */}
                                {visibleApproved.length === 0 && visiblePending.length === 0 && deptMemberships.length === 0 && (
                                    <div className="text-center py-14 bg-white rounded-2xl border-2 border-dashed border-gray-100 hover:border-[#140152]/20 transition-colors">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Briefcase className="w-7 h-7 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-semibold mb-1">No ministries yet</p>
                                        <p className="text-gray-400 text-sm mb-5">Explore and join ministries to grow in community</p>
                                        <PremiumButton href="/onboarding/services" className="justify-center rounded-xl mx-auto">
                                            Explore Ministries
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

'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    FileText, Calendar, Video, CheckCircle, BookOpen, Target,
    TrendingUp, Menu, X, Loader2, ExternalLink, PlayCircle,
    FileDown, Link as LinkIcon, Clock, MapPin, Bell, ArrowRight,
    Briefcase, Users, Star, Award, Globe, Lightbulb, Zap,
    MessageCircle, Shield, PenLine, Search, ChevronRight
} from 'lucide-react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'
import ServiceAnnouncementsList from '@/components/shared/ServiceAnnouncementsList'
import { careerApi, UserCareerDashboard, CareerModule, CareerResource } from '@/lib/api'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import CareerModuleDetail from '@/components/CareerModuleDetail'
import Link from 'next/link'
import SectionWrapper from '@/components/shared/SectionWrapper'

// ─── PUBLIC LANDING ──────────────────────────────────────────────────────────
function CareerLanding() {
    const services = [
        { icon: Briefcase, title: 'CV & Resume Workshop', desc: 'Build a professional, ATS-optimised CV that stands out to recruiters worldwide.', color: 'bg-blue-100 text-blue-600' },
        { icon: MessageCircle, title: 'Interview Coaching', desc: 'Master interview techniques, body language, and how to communicate your value.', color: 'bg-purple-100 text-purple-600' },
        { icon: Users, title: '1-on-1 Mentorship', desc: 'Paired with an experienced professional in your field for personalised career advice.', color: 'bg-green-100 text-green-600' },
        { icon: Globe, title: 'Professional Networking', desc: 'Connect with professionals, alumni, and employers through our ministry network.', color: 'bg-amber-100 text-amber-600' },
        { icon: TrendingUp, title: 'Career Path Planning', desc: "Discover God's purpose for your career and create a strategic 5-year growth plan.", color: 'bg-red-100 text-red-600' },
        { icon: Lightbulb, title: 'Entrepreneurship Track', desc: 'For those called to build — business planning, funding, and kingdom entrepreneurship.', color: 'bg-indigo-100 text-indigo-600' },
    ]

    const tracks = [
        { title: 'Career Starter', tag: 'For Job Seekers', icon: '🚀', desc: 'CV writing, job search strategy, interview prep, and professional presence.', steps: ['Profile Assessment', 'CV Workshop', 'Mock Interviews', 'Job Application Strategy'] },
        { title: 'Career Climber', tag: 'For Professionals', icon: '📈', desc: 'Leadership skills, promotion strategy, workplace influence, and salary negotiation.', steps: ['Leadership Audit', 'Promotion Roadmap', 'Salary Negotiation', 'Executive Presence'] },
        { title: 'Kingdom Builder', tag: 'For Entrepreneurs', icon: '🏗️', desc: 'Business idea validation, funding pathways, team building, and marketplace ministry.', steps: ['Idea Validation', 'Business Plan', 'Funding Strategy', 'Kingdom Marketplace'] },
    ]

    const testimonials = [
        { name: 'Adaeze O.', role: 'Software Engineer', text: 'The CV workshop and mock interview sessions helped me land my first tech job within 3 weeks. I\'m so grateful!', stars: 5 },
        { name: 'Emeka B.', role: 'Entrepreneur', text: 'The Kingdom Builder track gave me the framework to launch my business and keep God at the center.', stars: 5 },
        { name: 'Funke A.', role: 'Graduate', text: 'Having a mentor who understood both career and faith made all the difference in my journey.', stars: 5 },
    ]

    const mentors = [
        { name: 'Mr. Tunde Adeleke', role: 'Senior Partner, Tech Industry', specialty: 'IT & Digital Careers' },
        { name: 'Mrs. Kemi Johnson', role: 'HR Director', specialty: 'Career Transitions & HR' },
        { name: 'Dr. Biodun Olatunji', role: 'Business Consultant', specialty: 'Entrepreneurship & Finance' },
        { name: 'Miss Chioma Eze', role: 'Brand Strategist', specialty: 'Marketing & Creative Arts' },
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="relative min-h-[88vh] flex items-center justify-center bg-[#140152] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] bg-[#f5bb00]/15 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
                </div>
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-block px-5 py-2 bg-[#f5bb00]/20 text-[#f5bb00] rounded-full text-sm font-bold tracking-widest uppercase mb-6 border border-[#f5bb00]/30">
                            Career Guidance Ministry
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
                            Your Career.<br /><span className="text-[#f5bb00]">God's Purpose.</span>
                        </h1>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
                            Faith-based career coaching, mentorship, CV workshops, and professional networking — helping believers thrive in the marketplace with Kingdom purpose.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/register?redirect=/career-guidance">
                                <Button className="bg-[#f5bb00] text-[#140152] font-black px-8 py-6 rounded-full text-lg hover:bg-[#f5bb00]/90 shadow-xl">
                                    Join Career Guidance <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/auth/login?redirect=/career-guidance">
                                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 rounded-full text-lg">
                                    Access My Dashboard
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-[#f5bb00] py-8">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 text-center">
                    {[
                        { val: '300+', label: 'Lives Impacted' },
                        { val: '15+', label: 'Industry Mentors' },
                        { val: '3', label: 'Career Tracks' },
                        { val: '85%', label: 'Placement Rate' },
                    ].map((s, i) => (
                        <div key={i}>
                            <div className="text-3xl font-black text-[#140152]">{s.val}</div>
                            <div className="text-sm font-semibold text-[#140152]/70">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <SectionWrapper>
                {/* Services */}
                <div className="text-center mb-16">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">What We Offer</span>
                    <h2 className="text-4xl font-black text-[#140152] mt-2">Career Guidance Services</h2>
                    <div className="w-20 h-1.5 bg-[#f5bb00] mx-auto rounded-full mt-4" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                    {services.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#f5bb00] transition-all group">
                            <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center mb-6`}>
                                <s.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-[#140152] mb-3">{s.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Career Tracks */}
                <div className="text-center mb-16">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Program Tracks</span>
                    <h2 className="text-4xl font-black text-[#140152] mt-2">Which Track Is Yours?</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    {tracks.map((t, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#f5bb00] transition-all overflow-hidden group">
                            <div className="bg-gradient-to-br from-[#140152] to-[#1a0270] p-8 text-center">
                                <div className="text-5xl mb-4">{t.icon}</div>
                                <span className="text-xs font-bold text-[#f5bb00] uppercase tracking-wider">{t.tag}</span>
                                <h3 className="text-2xl font-black text-white mt-2">{t.title}</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-600 mb-6">{t.desc}</p>
                                <div className="space-y-3">
                                    {t.steps.map((step, j) => (
                                        <div key={j} className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-[#f5bb00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="w-3.5 h-3.5 text-[#f5bb00]" />
                                            </div>
                                            <span className="text-sm text-gray-700">{step}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/auth/register?redirect=/career-guidance" className="block mt-8">
                                    <Button className="w-full bg-[#140152] text-white rounded-xl hover:bg-[#1a0270]">
                                        Join This Track
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Mentors */}
                <div className="text-center mb-16">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Your Guides</span>
                    <h2 className="text-4xl font-black text-[#140152] mt-2">Industry Mentors</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {mentors.map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#140152] to-[#1a0270] rounded-full flex items-center justify-center mx-auto mb-5">
                                <Briefcase className="w-9 h-9 text-[#f5bb00]" />
                            </div>
                            <h3 className="font-bold text-[#140152]">{m.name}</h3>
                            <p className="text-[#f5bb00] font-semibold text-sm mt-1">{m.role}</p>
                            <p className="text-gray-400 text-xs mt-2">{m.specialty}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Testimonials */}
                <div className="bg-gray-50 rounded-[2.5rem] p-12 mb-24">
                    <div className="text-center mb-12">
                        <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Success Stories</span>
                        <h2 className="text-3xl font-black text-[#140152] mt-2">Lives Transformed</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <div className="flex gap-1 mb-5">
                                    {Array.from({ length: t.stars }).map((_, j) => <Star key={j} className="w-4 h-4 text-[#f5bb00] fill-[#f5bb00]" />)}
                                </div>
                                <p className="text-gray-700 italic mb-6">"{t.text}"</p>
                                <div>
                                    <p className="font-bold text-[#140152]">{t.name}</p>
                                    <p className="text-sm text-gray-500">{t.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* How to join */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Get Started</span>
                        <h2 className="text-3xl font-black text-[#140152] mt-2">How to Join</h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { step: '01', title: 'Register', desc: 'Create a free LETW account and apply for Career Guidance.' },
                            { step: '02', title: 'Assessment', desc: 'Complete our career profile to be placed in the right track.' },
                            { step: '03', title: 'Mentorship', desc: 'Get matched with an industry mentor and start your sessions.' },
                            { step: '04', title: 'Thrive', desc: 'Apply what you learn, grow your career, and impact the marketplace.' },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="text-[#f5bb00]/20 font-black text-7xl mb-3">{item.step}</div>
                                <h4 className="text-xl font-bold text-[#140152] mb-2">{item.title}</h4>
                                <p className="text-gray-500 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="bg-gradient-to-br from-[#140152] to-[#1a0270] rounded-3xl p-12 text-center text-white">
                    <Briefcase className="w-14 h-14 text-[#f5bb00] mx-auto mb-5" />
                    <h2 className="text-3xl font-black mb-4">Start Your Career Journey Today</h2>
                    <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                        "Whatever you do, work heartily, as for the Lord and not for men." — Colossians 3:23
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/register?redirect=/career-guidance">
                            <Button className="bg-[#f5bb00] text-[#140152] font-black px-10 py-5 rounded-full text-lg hover:bg-[#f5bb00]/90">
                                Join Now — It's Free <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-5 rounded-full text-lg">
                                Contact Us
                            </Button>
                        </Link>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    )
}

// ─── AUTHENTICATED DASHBOARD (existing functionality) ─────────────────────────
function CareerDashboard() {
    const router = useRouter()
    const [dashboard, setDashboard] = useState<UserCareerDashboard | null>(null)
    const [selectedModule, setSelectedModule] = useState<CareerModule | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [completingTask, setCompletingTask] = useState<string | null>(null)
    const [activeView, setActiveView] = useState<'dashboard' | 'announcements'>('dashboard')

    const loadDashboard = async () => {
        try {
            setLoading(true)
            const data = await careerApi.getDashboard()
            setDashboard(data)
        } catch {
            router.replace('/auth/login?redirect=/career-guidance')
        } finally {
            setLoading(false)
        }
    }

    const loadModule = async (moduleId: string) => {
        try {
            const module = await careerApi.getModule(moduleId)
            setSelectedModule(module)
        } catch { /* ignore */ }
    }

    const handleCompleteTask = async (taskId: string) => {
        try {
            setCompletingTask(taskId)
            await careerApi.completeTask(taskId)
            await loadDashboard()
            if (selectedModule) await loadModule(selectedModule.id)
        } catch { /* ignore */ } finally { setCompletingTask(null) }
    }

    useEffect(() => { loadDashboard() }, [])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
        </div>
    )
    if (!dashboard) return null

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#140152] text-white rounded-lg shadow-lg">
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <AnimatePresence>
                {(sidebarOpen) && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                        className="w-64 bg-[#140152] text-white p-6 fixed top-0 h-screen overflow-y-auto z-40">
                        <h1 className="text-xl font-bold mb-8 mt-12">Career<span className="text-[#f5bb00]">Track</span></h1>
                        <nav className="space-y-2">
                            <button onClick={() => { setSelectedModule(null); setSidebarOpen(false) }}
                                className={cn("w-full text-left py-2 px-4 rounded-lg transition-colors flex items-center gap-2", !selectedModule ? "bg-white/10" : "hover:bg-white/5 opacity-70")}>
                                <Target className="w-4 h-4" /> Dashboard
                            </button>
                            {dashboard.modules.map(m => (
                                <button key={m.id} onClick={() => { loadModule(m.id); setSidebarOpen(false) }}
                                    className={cn("w-full text-left py-2 px-4 rounded-lg transition-colors", selectedModule?.id === m.id ? "bg-white/10" : "hover:bg-white/5 opacity-70")}>
                                    <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {m.title}</div>
                                    {(m.progress_percent ?? 0) > 0 && (
                                        <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#f5bb00] transition-all" style={{ width: `${m.progress_percent ?? 0}%` }} />
                                        </div>
                                    )}
                                </button>
                            ))}
                            <button onClick={() => { setActiveView(v => v === 'announcements' ? 'dashboard' : 'announcements'); setSidebarOpen(false) }}
                                className={cn("w-full text-left py-2 px-4 rounded-lg transition-colors flex items-center gap-2", activeView === 'announcements' ? "bg-white/10" : "hover:bg-white/5 opacity-70")}>
                                <Bell className="w-4 h-4" /> Announcements
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop sidebar */}
            <div className="hidden md:block w-64 bg-[#140152] text-white p-6 sticky top-0 h-screen overflow-y-auto">
                <h1 className="text-xl font-bold mb-8">Career<span className="text-[#f5bb00]">Track</span></h1>
                <nav className="space-y-2">
                    <button onClick={() => setSelectedModule(null)}
                        className={cn("w-full text-left py-2 px-4 rounded-lg transition-colors flex items-center gap-2", !selectedModule ? "bg-white/10" : "hover:bg-white/5 opacity-70")}>
                        <Target className="w-4 h-4" /> Dashboard
                    </button>
                    {dashboard.modules.map(m => (
                        <button key={m.id} onClick={() => loadModule(m.id)}
                            className={cn("w-full text-left py-2 px-4 rounded-lg transition-colors", selectedModule?.id === m.id ? "bg-white/10" : "hover:bg-white/5 opacity-70")}>
                            <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {m.title}</div>
                            {(m.progress_percent ?? 0) > 0 && (
                                <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#f5bb00] transition-all" style={{ width: `${m.progress_percent ?? 0}%` }} />
                                </div>
                            )}
                        </button>
                    ))}
                    <button onClick={() => setActiveView(v => v === 'announcements' ? 'dashboard' : 'announcements')}
                        className={cn("w-full text-left py-2 px-4 rounded-lg transition-colors flex items-center gap-2", activeView === 'announcements' ? "bg-white/10" : "hover:bg-white/5 opacity-70")}>
                        <Bell className="w-4 h-4" /> Announcements
                    </button>
                </nav>
            </div>

            {/* Main */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                {activeView === 'announcements' ? (
                    <ServiceAnnouncementsList serviceName="Career Guidance" />
                ) : !selectedModule ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">Welcome back 👋</h2>
                            <p className="text-gray-600">Your career growth journey continues here.</p>
                        </div>

                        <ServiceAnnouncements serviceName="Career Guidance" />

                        {/* Stats */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-2"><Target className="w-5 h-5 text-[#140152]" /><span className="text-sm text-gray-600">Current Focus</span></div>
                                <div className="text-xl font-bold text-gray-900">{dashboard.current_focus || 'Not set'}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-2"><Calendar className="w-5 h-5 text-[#f5bb00]" /><span className="text-sm text-gray-600">Next Session</span></div>
                                <div className="text-xl font-bold text-[#f5bb00]">
                                    {dashboard.next_session ? format(new Date(dashboard.next_session.session_date), 'MMM dd, h:mm a') : 'No upcoming session'}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-2"><TrendingUp className="w-5 h-5 text-green-600" /><span className="text-sm text-gray-600">Progress</span></div>
                                <div className="text-xl font-bold text-green-600">{dashboard.overall_progress}% Completed</div>
                            </div>
                        </div>

                        {/* Modules */}
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Career Modules</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {dashboard.modules.map(m => (
                                <motion.div key={m.id} whileHover={{ scale: 1.02 }} onClick={() => loadModule(m.id)}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:border-[#f5bb00]">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-3 bg-[#140152]/10 rounded-xl text-[#140152]"><BookOpen className="w-6 h-6" /></div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-1">{m.title}</h4>
                                            <p className="text-sm text-gray-600 line-clamp-2">{m.description}</p>
                                        </div>
                                    </div>
                                    {(m.progress_percent ?? 0) > 0 && (
                                        <div className="mt-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Progress</span>
                                                <span className="text-[#140152] font-semibold">{m.progress_percent ?? 0}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#140152] transition-all" style={{ width: `${m.progress_percent}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Pending Tasks */}
                        {dashboard.pending_tasks.length > 0 && (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Your Action Items</h3>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                                    {dashboard.pending_tasks.map(task => (
                                        <div key={task.id} className="p-4 border-b border-gray-100 last:border-0 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                            <button onClick={() => handleCompleteTask(task.id)} disabled={completingTask === task.id}
                                                className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                    task.is_completed ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-[#140152]")}>
                                                {completingTask === task.id ? <Loader2 className="w-4 h-4 animate-spin text-[#140152]" />
                                                    : task.is_completed ? <CheckCircle className="w-4 h-4 text-green-600" /> : null}
                                            </button>
                                            <div className="flex-1">
                                                <span className={cn("text-gray-900", task.is_completed && "line-through text-gray-400")}>{task.title}</span>
                                                {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <CareerModuleDetail module={selectedModule} onBack={() => setSelectedModule(null)} onTaskComplete={handleCompleteTask} />
                )}
            </div>
        </div>
    )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function CareerGuidancePage() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

    useEffect(() => {
        const loggedIn = localStorage.getItem('isLoggedIn')
        setIsLoggedIn(!!loggedIn)
    }, [])

    if (isLoggedIn === null) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
        </div>
    )

    if (!isLoggedIn) return <CareerLanding />
    return <CareerDashboard />
}

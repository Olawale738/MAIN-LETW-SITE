'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Crown, Book, Users, ChevronDown, ChevronRight, Play, Download, FileText,
  Youtube, X, Loader2, CheckCircle2, Circle, Trophy, ArrowRight, Star,
  Flame, Target, Shield, Globe, Award, MessageSquare, Calendar, Clock,
  TrendingUp, Lightbulb, Heart, Mic2, BookOpen, Zap, Lock
} from 'lucide-react'
import { leadershipApi, LeadershipModule, LeadershipContent } from '@/lib/api'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'
import ServicePageLayout from '@/components/shared/ServicePageLayout'
import SectionWrapper from '@/components/shared/SectionWrapper'

// ─── PUBLIC LANDING (unauthenticated) ────────────────────────────────────────
function LeadershipLanding() {
  const pillars = [
    { icon: Flame, title: 'Servant Leadership', desc: 'Learn to lead from a posture of humility and sacrifice, putting others first.' },
    { icon: Shield, title: 'Integrity & Character', desc: 'Build an unshakeable foundation of godly character that inspires trust.' },
    { icon: Target, title: 'Vision & Strategy', desc: 'Develop the ability to cast vision, plan strategically, and execute with excellence.' },
    { icon: Globe, title: 'Kingdom Impact', desc: 'Lead beyond the church walls — influence family, community, and the marketplace.' },
    { icon: Users, title: 'Team Building', desc: 'Learn how to raise, empower, and multiply leaders around you.' },
    { icon: Lightbulb, title: 'Problem Solving', desc: 'Develop creative, Spirit-led approaches to real challenges.' },
  ]

  const tracks = [
    { level: 'Foundation', color: '#f5bb00', tag: 'Beginner', modules: 4, desc: 'Core leadership principles and biblical foundations for new leaders.' },
    { level: 'Development', color: '#3b82f6', tag: 'Intermediate', modules: 6, desc: 'Practical skills for ministry leadership, communication, and team management.' },
    { level: 'Advanced', color: '#8b5cf6', tag: 'Advanced', modules: 5, desc: 'Strategic leadership, organisational development, and mentoring others.' },
    { level: 'Excellence', color: '#ef4444', tag: 'Senior', modules: 3, desc: 'Legacy building, succession planning, and global kingdom influence.' },
  ]

  const mentors = [
    { name: 'Pastor Segun Wale', role: 'Senior Pastor', specialty: 'Visionary Leadership' },
    { name: 'Minister Grace', role: 'Ministry Director', specialty: 'Women in Leadership' },
    { name: 'Bro. Emmanuel', role: 'Admin Director', specialty: 'Organisational Excellence' },
  ]

  const journey = [
    { step: '01', title: 'Register & Enroll', desc: 'Create your account and express interest in Leadership Training.' },
    { step: '02', title: 'Assessment', desc: 'Take our leadership profile assessment to be placed on the right track.' },
    { step: '03', title: 'Learn & Practice', desc: 'Work through modules with video lessons, documents, and live sessions.' },
    { step: '04', title: 'Mentorship', desc: 'Be paired with an experienced ministry leader for one-on-one growth.' },
    { step: '05', title: 'Graduate & Lead', desc: 'Complete your track, receive your certificate, and step into leadership.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative min-h-[85vh] flex items-center justify-center bg-[#140152] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#f5bb00]/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-5 py-2 bg-[#f5bb00]/20 text-[#f5bb00] rounded-full text-sm font-bold tracking-widest uppercase mb-6 border border-[#f5bb00]/30">
              Leadership Training Program
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
              Raise the Next<br /><span className="text-[#f5bb00]">Generation</span> of Leaders
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
              A structured, Spirit-led leadership development program that transforms believers into effective servants, visionaries, and kingdom influencers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register?redirect=/leadership">
                <Button className="bg-[#f5bb00] text-[#140152] font-black px-8 py-6 rounded-full text-lg hover:bg-[#f5bb00]/90 shadow-xl">
                  Join the Program <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/auth/login?redirect=/leadership">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 rounded-full text-lg">
                  Access My Training
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
            { val: '18+', label: 'Training Modules' },
            { val: '4', label: 'Leadership Tracks' },
            { val: '200+', label: 'Leaders Trained' },
            { val: '100%', label: 'Faith-Based' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-black text-[#140152]">{s.val}</div>
              <div className="text-sm font-semibold text-[#140152]/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionWrapper>
        {/* Leadership Pillars */}
        <div className="text-center mb-16">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Core Curriculum</span>
          <h2 className="text-4xl font-black text-[#140152] mt-2">6 Pillars of Servant Leadership</h2>
          <div className="w-20 h-1.5 bg-[#f5bb00] mx-auto rounded-full mt-4" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {pillars.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#f5bb00] transition-all group">
              <div className="w-14 h-14 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#f5bb00]/10 transition-colors">
                <p.icon className="w-7 h-7 text-[#140152] group-hover:text-[#f5bb00] transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-[#140152] mb-3">{p.title}</h3>
              <p className="text-gray-600 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Training Tracks */}
        <div className="text-center mb-16">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Program Levels</span>
          <h2 className="text-4xl font-black text-[#140152] mt-2">Your Leadership Track</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {tracks.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ backgroundColor: t.color }} />
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4" style={{ backgroundColor: t.color }}>{t.tag}</span>
              <h3 className="text-xl font-black text-[#140152] mb-2">{t.level}</h3>
              <p className="text-sm text-gray-500 mb-4">{t.desc}</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#140152]">
                <BookOpen className="w-4 h-4" /> {t.modules} Modules
              </div>
            </motion.div>
          ))}
        </div>

        {/* Journey Steps */}
        <div className="bg-gradient-to-br from-[#140152] to-[#1a0270] rounded-[2.5rem] p-12 mb-24">
          <div className="text-center mb-12">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Your Pathway</span>
            <h2 className="text-4xl font-black text-white mt-2">The Leadership Journey</h2>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {journey.map((j, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-[#f5bb00] rounded-full flex items-center justify-center mx-auto mb-4 text-[#140152] font-black text-lg">{j.step}</div>
                <h4 className="font-bold text-white mb-2">{j.title}</h4>
                <p className="text-sm text-white/60">{j.desc}</p>
                {i < journey.length - 1 && (
                  <div className="hidden md:block absolute translate-x-full top-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mentorship */}
        <div className="text-center mb-16">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Personal Guidance</span>
          <h2 className="text-4xl font-black text-[#140152] mt-2">Meet Your Mentors</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {mentors.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all">
              <div className="w-20 h-20 bg-gradient-to-br from-[#140152] to-[#1a0270] rounded-full flex items-center justify-center mx-auto mb-6">
                <Crown className="w-9 h-9 text-[#f5bb00]" />
              </div>
              <h3 className="text-xl font-bold text-[#140152]">{m.name}</h3>
              <p className="text-[#f5bb00] font-semibold text-sm mb-2">{m.role}</p>
              <p className="text-gray-500 text-sm">{m.specialty}</p>
            </motion.div>
          ))}
        </div>

        {/* What you earn */}
        <div className="bg-gray-50 rounded-[2.5rem] p-12 mb-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Outcomes</span>
              <h2 className="text-4xl font-black text-[#140152] mt-2 mb-8">What You'll Gain</h2>
              <div className="space-y-5">
                {[
                  'Certificate of Completion for each track',
                  'Personalised leadership assessment & profile',
                  'One-on-one mentorship sessions',
                  'Access to exclusive leadership resources',
                  'Live workshops & leadership retreats',
                  'A network of like-minded kingdom leaders',
                  'Ministry placement opportunities',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#f5bb00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#f5bb00]" />
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#140152] rounded-[2rem] p-10 text-center text-white">
              <Award className="w-16 h-16 text-[#f5bb00] mx-auto mb-6" />
              <h3 className="text-2xl font-black mb-4">Leadership Certificate</h3>
              <p className="text-white/70 mb-8">Earn a recognised certificate upon completing each leadership track — a mark of your growth and commitment.</p>
              <Link href="/auth/register?redirect=/leadership">
                <Button className="bg-[#f5bb00] text-[#140152] font-black px-8 py-4 rounded-xl hover:bg-[#f5bb00]/90 w-full">
                  Start Your Journey
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quote CTA */}
        <div className="bg-[#140152] rounded-3xl p-12 text-center text-white">
          <p className="text-2xl italic text-white/80 mb-4">"But whoever would be great among you must be your servant."</p>
          <p className="text-[#f5bb00] font-bold mb-8">— Matthew 20:26</p>
          <Link href="/auth/register?redirect=/leadership">
            <Button className="bg-[#f5bb00] text-[#140152] font-black px-10 py-5 rounded-full text-lg hover:bg-[#f5bb00]/90">
              Join Leadership Training <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </SectionWrapper>
    </div>
  )
}

// ─── AUTHENTICATED DASHBOARD ──────────────────────────────────────────────────
function LeadershipDashboard({ user }: { user: string }) {
  const [modules, setModules] = useState<LeadershipModule[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [completedContentIds, setCompletedContentIds] = useState<Set<string>>(new Set())
  const [markingComplete, setMarkingComplete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'modules' | 'mentorship' | 'community' | 'certificates'>('modules')

  useEffect(() => {
    const load = async () => {
      try {
        const [modulesData, progressData] = await Promise.all([
          leadershipApi.getModules(),
          leadershipApi.getProgress()
        ])
        setModules(modulesData.modules)
        setCompletedContentIds(new Set(progressData.completed_content_ids))
        if (modulesData.modules.length > 0) {
          setExpandedModules(new Set([modulesData.modules[0].id]))
        }
      } catch (err) {
        console.error('Failed to load data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedModules(next)
  }

  const extractYoutubeId = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : null
  }

  const handleToggleComplete = async (contentId: string) => {
    setMarkingComplete(contentId)
    try {
      if (completedContentIds.has(contentId)) {
        await leadershipApi.unmarkContentComplete(contentId)
        const s = new Set(completedContentIds); s.delete(contentId); setCompletedContentIds(s)
      } else {
        await leadershipApi.markContentComplete(contentId)
        const s = new Set(completedContentIds); s.add(contentId); setCompletedContentIds(s)
      }
    } catch (err) { console.error(err) } finally { setMarkingComplete(null) }
  }

  const handleDownload = async (content: LeadershipContent) => {
    const url = leadershipApi.getDownloadUrl(content.id)
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.download = content.file_name || 'download'
      document.body.appendChild(a); a.click(); a.remove()
    } catch (err) { console.error(err) }
  }

  const formatFileSize = (b?: number) => {
    if (!b) return ''
    if (b < 1024) return `${b} B`
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1048576).toFixed(1)} MB`
  }

  const totalContent = modules.reduce((a, m) => a + m.contents.length, 0)
  const completedCount = completedContentIds.size
  const progressPercent = totalContent > 0 ? Math.round((completedCount / totalContent) * 100) : 0
  const getModProg = (m: LeadershipModule) => ({
    completed: m.contents.filter(c => completedContentIds.has(c.id)).length,
    total: m.contents.length
  })

  const tabs = [
    { id: 'modules', label: 'Training Modules', icon: Book },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'certificates', label: 'Certificates', icon: Award },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#140152]">Welcome back, {user}!</h2>
            <p className="text-gray-600">Continue your journey to becoming an effective servant leader.</p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-[#140152] text-white px-5 py-3 rounded-2xl">
            <Trophy className="w-5 h-5 text-[#f5bb00]" />
            <span className="font-bold">{progressPercent}% Complete</span>
          </div>
        </div>

        {/* Announcements */}
        <ServiceAnnouncements serviceName="Leadership Training" />

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-5 mb-10">
          <div className="bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl p-6 text-white shadow-lg col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm">Overall Progress</p>
                <p className="text-4xl font-bold">{progressPercent}%</p>
              </div>
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/20" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none"
                    strokeDasharray={`${progressPercent * 1.76} 176`} className="text-[#f5bb00]" strokeLinecap="round" />
                </svg>
                <Trophy className="absolute inset-0 m-auto w-6 h-6 text-[#f5bb00]" />
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#f5bb00] rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <Book className="w-9 h-9 text-[#140152] mb-3" />
            <p className="text-gray-500 text-sm">Modules</p>
            <p className="text-3xl font-bold text-[#140152]">{modules.length}</p>
            <p className="text-[#f5bb00] text-sm font-medium mt-1">
              {modules.filter(m => { const p = getModProg(m); return p.completed === p.total && p.total > 0 }).length} completed
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-green-500 mb-3" />
            <p className="text-gray-500 text-sm">Content Done</p>
            <p className="text-3xl font-bold text-[#140152]">{completedCount}/{totalContent}</p>
            <p className="text-green-600 text-sm font-medium mt-1">Videos & Documents</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <Calendar className="w-9 h-9 text-blue-500 mb-3" />
            <p className="text-gray-500 text-sm">Next Session</p>
            <p className="text-lg font-bold text-[#140152]">Every Sunday</p>
            <p className="text-blue-500 text-sm font-medium mt-1">4:00 PM — Hall B</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#140152] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#140152]'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* ── MODULES TAB ── */}
        {activeTab === 'modules' && (
          <>
            <h3 className="text-xl font-bold text-[#140152] mb-5 flex items-center gap-2">
              <Book className="w-5 h-5" /> Training Modules
            </h3>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
            ) : modules.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Book className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No modules yet — check back soon!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, idx) => {
                  const { completed, total } = getModProg(module)
                  const isComplete = completed === total && total > 0
                  const modPct = total > 0 ? (completed / total) * 100 : 0
                  return (
                    <div key={module.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${isComplete ? 'border-green-300' : 'border-gray-100'}`}>
                      <div className="p-5 cursor-pointer hover:bg-gray-50 flex items-center gap-4" onClick={() => toggleModule(module.id)}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isComplete ? 'bg-green-100 text-green-600' : 'bg-[#140152]/10 text-[#140152]'}`}>
                          {isComplete ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg text-[#140152] truncate">{module.title}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-500">{total} items</span>
                            <div className="flex-1 max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-[#f5bb00]'}`} style={{ width: `${modPct}%` }} />
                            </div>
                            <span className="text-sm text-gray-500">{completed}/{total}</span>
                          </div>
                        </div>
                        {expandedModules.has(module.id) ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                      </div>

                      {expandedModules.has(module.id) && (
                        <div className="border-t border-gray-100 p-5 bg-gray-50">
                          {module.description && <p className="text-gray-600 mb-5 text-sm leading-relaxed">{module.description}</p>}
                          {module.contents.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No content yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {module.contents.map(content => {
                                const isDone = completedContentIds.has(content.id)
                                return (
                                  <div key={content.id} className={`flex items-start gap-4 p-4 rounded-xl bg-white border transition-all ${isDone ? 'border-green-200 bg-green-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <button onClick={() => handleToggleComplete(content.id)} disabled={markingComplete === content.id} className="mt-1 flex-shrink-0">
                                      {markingComplete === content.id ? <Loader2 className="w-5 h-5 animate-spin text-[#140152]" />
                                        : isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                          : <Circle className="w-5 h-5 text-gray-300 hover:text-[#140152] transition-colors" />}
                                    </button>
                                    {content.content_type === 'video' ? (
                                      <>
                                        {content.youtube_thumbnail && (
                                          <div className="relative w-32 h-20 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 group" onClick={() => setPlayingVideo(content.youtube_url || null)}>
                                            <img src={content.youtube_thumbnail} alt={content.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60">
                                              <Play className="w-8 h-8 text-white fill-white" />
                                            </div>
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1"><Youtube className="w-4 h-4 text-red-500" /><span className="text-xs text-red-500 font-medium">Video</span></div>
                                          <h5 className={`font-semibold ${isDone ? 'text-green-700' : 'text-[#140152]'}`}>{content.title}</h5>
                                          {content.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{content.description}</p>}
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setPlayingVideo(content.youtube_url || null)} className="border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white">
                                          <Play className="w-4 h-4 mr-1" /> Watch
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <FileText className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1"><span className="text-xs text-blue-500 font-medium">Document</span></div>
                                          <h5 className={`font-semibold ${isDone ? 'text-green-700' : 'text-[#140152]'}`}>{content.title}</h5>
                                          <p className="text-xs text-gray-400">{content.file_name} {content.file_size && `(${formatFileSize(content.file_size)})`}</p>
                                          {content.description && <p className="text-sm text-gray-500 mt-1">{content.description}</p>}
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleDownload(content)} className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                                          <Download className="w-4 h-4 mr-1" /> Download
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── MENTORSHIP TAB ── */}
        {activeTab === 'mentorship' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#140152] to-[#1a0270] rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-[#f5bb00]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#140152]">Your Mentorship Journey</h3>
                  <p className="text-gray-500">One-on-one guidance from experienced ministry leaders</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Clock, label: 'Sessions Completed', val: '0', color: 'text-blue-500' },
                  { icon: Calendar, label: 'Next Meeting', val: 'Not scheduled', color: 'text-[#f5bb00]' },
                  { icon: Star, label: 'Mentor Rating', val: '—', color: 'text-purple-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-6">
                    <s.icon className={`w-8 h-8 mb-3 ${s.color}`} />
                    <p className="text-gray-500 text-sm">{s.label}</p>
                    <p className="text-xl font-bold text-[#140152]">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#140152] rounded-2xl p-8 text-white text-center">
              <Crown className="w-12 h-12 text-[#f5bb00] mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">Request a Mentor</h3>
              <p className="text-white/70 mb-6 max-w-md mx-auto">Once you complete 30% of a module, you'll be matched with a leadership mentor for personalised guidance sessions.</p>
              <Button className="bg-[#f5bb00] text-[#140152] font-bold px-8 py-3 rounded-xl hover:bg-[#f5bb00]/90">
                {progressPercent >= 30 ? 'Request Mentor Match' : `Complete ${30 - progressPercent}% more to unlock`}
              </Button>
            </div>
          </div>
        )}

        {/* ── COMMUNITY TAB ── */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <MessageSquare className="w-10 h-10 text-[#140152] mb-4" />
                <h3 className="text-xl font-bold text-[#140152] mb-2">Discussion Groups</h3>
                <p className="text-gray-500 mb-6">Engage in leadership discussions with fellow participants from your training track.</p>
                <div className="space-y-3">
                  {['Foundation Track Group', 'Development Track Group', 'All Leaders Forum'].map((g, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#140152]/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#140152]" />
                        </div>
                        <span className="font-medium text-gray-800">{g}</span>
                      </div>
                      <span className="text-xs text-gray-400">Coming soon</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <Calendar className="w-10 h-10 text-[#f5bb00] mb-4" />
                <h3 className="text-xl font-bold text-[#140152] mb-2">Upcoming Events</h3>
                <p className="text-gray-500 mb-6">Leadership workshops, retreats, and special training sessions.</p>
                <div className="space-y-3">
                  {[
                    { title: 'Monthly Leadership Forum', date: 'Every 1st Sunday', time: '4:00 PM' },
                    { title: 'Leadership Retreat 2026', date: 'July 2026', time: 'TBC' },
                    { title: 'Certificate Ceremony', date: 'December 2026', time: 'TBC' },
                  ].map((e, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-[#f5bb00]/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-[#f5bb00]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#140152]">{e.title}</p>
                        <p className="text-sm text-gray-500">{e.date} · {e.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CERTIFICATES TAB ── */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <Award className="w-20 h-20 mx-auto text-gray-200 mb-6" />
              <h3 className="text-xl font-bold text-gray-500 mb-2">No Certificates Yet</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">Complete all content in a training module to earn your leadership certificate.</p>
              <Button onClick={() => setActiveTab('modules')} className="bg-[#140152] text-white px-8 py-3 rounded-xl hover:bg-[#1a0270]">
                Go to Modules
              </Button>
            </div>

            <div className="bg-gradient-to-r from-[#140152] to-[#1a0270] rounded-2xl p-8 text-white">
              <div className="flex items-center gap-6">
                <Trophy className="w-16 h-16 text-[#f5bb00] flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Track Progress: {progressPercent}% Complete</h3>
                  <p className="text-white/70 mb-4">Keep going! Finish your modules to unlock your certificate.</p>
                  <div className="h-3 bg-white/20 rounded-full w-full max-w-sm overflow-hidden">
                    <div className="h-full bg-[#f5bb00] rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scripture footer */}
        <div className="mt-12 bg-[#140152] rounded-2xl p-8 text-center text-white">
          <p className="text-white/80 text-lg italic">"But whoever would be great among you must be your servant"</p>
          <p className="text-[#f5bb00] font-semibold mt-2">— Matthew 20:26</p>
        </div>
      </div>

      {/* Video Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
          <div className="relative w-full max-w-5xl" onClick={e => e.stopPropagation()}>
            <button className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2" onClick={() => setPlayingVideo(null)}>
              <span className="text-sm">Close</span><X className="w-6 h-6" />
            </button>
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <iframe src={`https://www.youtube.com/embed/${extractYoutubeId(playingVideo)}?autoplay=1`}
                className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────
export default function LeadershipPage() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn')
    const name = localStorage.getItem('userName')
    if (loggedIn) setUser(name || 'Leader')
    setChecking(false)
  }, [])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
    </div>
  )

  if (!user) return <LeadershipLanding />

  return (
    <ServicePageLayout serviceName="Leadership Training" brandTitle="Leadership Training" brandColor="#f5bb00">
      <LeadershipDashboard user={user} />
    </ServicePageLayout>
  )
}

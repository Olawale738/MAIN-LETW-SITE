'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Home, Calendar, Users, BookOpen, Bell, Shield, Star, Heart,
  CheckCircle2, Clock, MapPin, ChevronRight, AlertCircle, Send,
  Download, PlusCircle, Phone, UserCheck, Award, TrendingUp,
  Menu, X, Baby, Smile, Gift, Cake, Camera, Video, Quote,
  FileText, Palette, Package, Zap, Crown, Globe, MessageSquare,
  CheckSquare, BarChart2, User, Loader2, RefreshCw, Mail,
  AlertTriangle, Lock, Eye, EyeOff, Search, Filter
} from 'lucide-react'

/* ─── Auth ────────────────────────────────────────────────────────────────── */
const MEMBER_ACCESS_CODE = 'LETWCHILDREN2026'
const ADMIN_CREDENTIALS  = { username: 'admin', password: 'LETW@Admin2026' }

function ChildrenLoginGate({ onLogin }: { onLogin: () => void }) {
  const [tab,      setTab]      = useState<'member' | 'admin'>('member')
  const [code,     setCode]     = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    setTimeout(() => {
      setLoading(false)
      if (tab === 'member') {
        if (code.trim() === MEMBER_ACCESS_CODE) { onLogin() }
        else { setError('Invalid access code. Please get your code from the Children\'s Coordinator.') }
      } else {
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) { onLogin() }
        else { setError('Invalid admin credentials.') }
      }
    }, 700)
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #134e4a 0%, #065f46 50%, #14532d 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 pt-10 pb-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
              <Baby className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">LETW Children</h1>
            <p className="text-sm text-gray-500 mt-1">Ministry Dashboard Access</p>
          </div>

          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
            {(['member', 'admin'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2 text-xs font-semibold transition-all ${tab === t ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                {t === 'member' ? '🔑 Member Access' : '⚙ Admin Login'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'member' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Access Code</label>
                <input value={code} onChange={e => setCode(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your access code" />
                <p className="text-xs text-gray-400 mt-1">Get your code from the Children's Coordinator.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Admin username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                  <div className="relative">
                    <input value={password} onChange={e => setPassword(e.target.value)}
                      type={showPw ? 'text' : 'password'} required
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="Admin password" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Access Dashboard'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            <Link href="/children" className="text-emerald-600 font-semibold hover:underline">← Back to Children's Page</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Types ─────────────────────────────────────────────────── */
interface Child {
  id: string
  name: string
  initials: string
  age: number
  ageGroup: 'Nursery' | 'Toddlers' | 'Primary' | 'Juniors'
  present: boolean
  birthday?: string
  allergies?: string[]
  medicalNotes?: string
  emergencyContact: string
  emergencyPhone: string
  pickupAuth: string[]
  newThisMonth?: boolean
}

interface Volunteer {
  id: string
  name: string
  initials: string
  role: 'Teacher' | 'Helper' | 'Substitute'
  ageGroup: string
  confirmed: boolean
  phone: string
}

interface Event {
  id: string
  title: string
  type: 'class' | 'service' | 'special'
  date: string
  time: string
  venue: string
  teacher: string
  daysLeft: number
  color: string
}

interface Announcement {
  id: string
  title: string
  body: string
  author: string
  time: string
  urgent: boolean
  forParents: boolean
}

interface Task {
  id: string
  text: string
  category: 'lesson' | 'admin' | 'care'
  done: boolean
  due?: string
}

/* ─── Mock Data ──────────────────────────────────────────────── */
const TEACHER_INFO = { name: 'Teacher Grace', initials: 'TG', role: 'Children\'s Minister', color: '#10b981' }

const MOCK_CHILDREN: Child[] = [
  { id: '1', name: 'Amaka O.', initials: 'AO', age: 4, ageGroup: 'Toddlers', present: true, birthday: 'June 10', emergencyContact: 'Mrs. O.', emergencyPhone: '0801-234-5678', pickupAuth: ['Mrs. O.', 'Mr. O.'] },
  { id: '2', name: 'David E.', initials: 'DE', age: 7, ageGroup: 'Primary', present: true, birthday: 'May 31', allergies: ['Peanuts'], emergencyContact: 'Mr. E.', emergencyPhone: '0802-345-6789', pickupAuth: ['Mr. E.', 'Mrs. E.'] },
  { id: '3', name: 'Chisom A.', initials: 'CA', age: 10, ageGroup: 'Juniors', present: false, emergencyContact: 'Mrs. A.', emergencyPhone: '0803-456-7890', pickupAuth: ['Mrs. A.'] },
  { id: '4', name: 'Blessing N.', initials: 'BN', age: 2, ageGroup: 'Nursery', present: true, medicalNotes: 'Asthma — has inhaler', emergencyContact: 'Mrs. N.', emergencyPhone: '0804-567-8901', pickupAuth: ['Mrs. N.', 'Mr. N.'], newThisMonth: true },
  { id: '5', name: 'Favour K.', initials: 'FK', age: 5, ageGroup: 'Toddlers', present: true, emergencyContact: 'Mr. K.', emergencyPhone: '0805-678-9012', pickupAuth: ['Mr. K.', 'Mrs. K.'], newThisMonth: true },
  { id: '6', name: 'Emmanuel T.', initials: 'ET', age: 8, ageGroup: 'Primary', present: true, emergencyContact: 'Mrs. T.', emergencyPhone: '0806-789-0123', pickupAuth: ['Mrs. T.'] },
  { id: '7', name: 'Joy B.', initials: 'JB', age: 11, ageGroup: 'Juniors', present: true, allergies: ['Dairy'], emergencyContact: 'Mr. B.', emergencyPhone: '0807-890-1234', pickupAuth: ['Mr. B.', 'Mrs. B.'] },
  { id: '8', name: 'Precious I.', initials: 'PI', age: 1, ageGroup: 'Nursery', present: true, medicalNotes: 'Bottle-fed only', emergencyContact: 'Mrs. I.', emergencyPhone: '0808-901-2345', pickupAuth: ['Mrs. I.', 'Mr. I.'] },
]

const MOCK_VOLUNTEERS: Volunteer[] = [
  { id: '1', name: 'Teacher Grace', initials: 'TG', role: 'Teacher', ageGroup: 'Juniors', confirmed: true, phone: '0801-111-2222' },
  { id: '2', name: 'Sis. Mary', initials: 'SM', role: 'Teacher', ageGroup: 'Primary', confirmed: true, phone: '0802-222-3333' },
  { id: '3', name: 'Bro. Samuel', initials: 'BS', role: 'Teacher', ageGroup: 'Toddlers', confirmed: true, phone: '0803-333-4444' },
  { id: '4', name: 'Sis. Ruth', initials: 'SR', role: 'Helper', ageGroup: 'Nursery', confirmed: true, phone: '0804-444-5555' },
  { id: '5', name: 'Bro. James', initials: 'BJ', role: 'Helper', ageGroup: 'Primary', confirmed: false, phone: '0805-555-6666' },
  { id: '6', name: 'Sis. Hannah', initials: 'SH', role: 'Substitute', ageGroup: 'Any', confirmed: false, phone: '0806-666-7777' },
]

const MOCK_EVENTS: Event[] = [
  { id: '1', title: "Sunday Children's Church", type: 'service', date: 'Sunday, June 1', time: '9:00 AM', venue: 'Children\'s Hall', teacher: 'Teacher Grace', daysLeft: 9, color: '#10b981' },
  { id: '2', title: 'Sunday School Class', type: 'class', date: 'Sunday, June 1', time: '8:00 AM', venue: 'Classroom A', teacher: 'Sis. Mary', daysLeft: 9, color: '#6366f1' },
  { id: '3', title: "Children's Day Celebration", type: 'special', date: 'Saturday, June 14', time: '10:00 AM', venue: 'Main Hall', teacher: 'All Teachers', daysLeft: 22, color: '#f59e0b' },
  { id: '4', title: 'Vacation Bible School (VBS)', type: 'special', date: 'July 7–11', time: '9:00 AM', venue: 'Church Campus', teacher: 'All Teachers', daysLeft: 45, color: '#ef4444' },
]

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: "Children's Day Celebration — All Children Required!", body: "This year's Children's Day is June 14. All children should wear their ministry uniform. Parents are invited. Rehearsals start this Saturday at 10am.", author: 'Children\'s Minister', time: '2 hours ago', urgent: true, forParents: true },
  { id: '2', title: 'New Lesson Material Available', body: 'Q2 lesson booklets are now ready for collection. Teachers please pick up from the ministry office before Sunday.', author: 'Teacher Grace', time: '1 day ago', urgent: false, forParents: false },
  { id: '3', title: 'Parent Notice: VBS Registration Open', body: 'Vacation Bible School registration is now open for children ages 3–12. Register at the welcome desk or through the church portal.', author: 'Children\'s Minister', time: '3 days ago', urgent: false, forParents: true },
]

const MOCK_TASKS: Task[] = [
  { id: '1', text: 'Prepare craft materials for Sunday lesson', category: 'lesson', done: false, due: 'Saturday' },
  { id: '2', text: 'Follow up with Bro. James on confirmation', category: 'admin', done: false, due: 'Today' },
  { id: '3', text: 'Update Blessing N. medical record', category: 'care', done: false, due: 'Today' },
  { id: '4', text: 'Send parent notice for Children\'s Day', category: 'admin', done: true },
  { id: '5', text: 'Print attendance register for Sunday', category: 'admin', done: false, due: 'Saturday' },
]

const THIS_WEEK_LESSON = {
  topic: "God Made Me Special",
  verse: '"For you created my inmost being; you knit me together in my mother\'s womb." — Psalm 139:13',
  ageGroup: 'Primary (Ages 6–9)',
  notes: 'Help children understand that they are uniquely and wonderfully made by God. Focus on identity, self-worth, and God\'s love. Use the mirror activity to show each child their unique features.',
  activity: 'Mirror Craft — Children decorate a small mirror frame with the words "God Made Me Special"',
  materials: ['Small mirror frames (1 per child)', 'Stickers and foam shapes', 'Glue sticks', 'Crayons and markers', 'Pre-printed verse strips'],
  downloadReady: true,
}

const AGE_GROUP_COLORS: Record<string, string> = {
  Nursery: 'bg-pink-100 text-pink-700',
  Toddlers: 'bg-orange-100 text-orange-700',
  Primary: 'bg-blue-100 text-blue-700',
  Juniors: 'bg-purple-100 text-purple-700',
}

const AGE_GROUP_BG: Record<string, string> = {
  Nursery: '#fce7f3',
  Toddlers: '#ffedd5',
  Primary: '#dbeafe',
  Juniors: '#ede9fe',
}

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'lesson', label: "This Week's Lesson", icon: BookOpen },
  { id: 'children', label: 'Children Records', icon: Users },
  { id: 'volunteers', label: 'Volunteers', icon: UserCheck },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'safety', label: 'Safety & Care', icon: Shield },
  { id: 'highlights', label: 'Highlights', icon: Star },
]

/* ═══════════════════════════════════════════════════════════════ */
export default function ChildrenDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  if (!authenticated) return <ChildrenLoginGate onLogin={() => setAuthenticated(true)} />
  return <ChildrenDashboardContent />
}

function ChildrenDashboardContent() {
  const [activeNav, setActiveNav] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN)
  const [ageFilter, setAgeFilter] = useState('All')
  const [childSearch, setChildSearch] = useState('')
  const [safetyUnlocked, setSafetyUnlocked] = useState(false)
  const [safetyPin, setSafetyPin] = useState('')
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  const [msgInput, setMsgInput] = useState('')
  const [showBirthdays, setShowBirthdays] = useState(false)

  /* Countdown to Children's Day */
  useEffect(() => {
    const target = new Date('2026-06-14T10:00:00')
    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) return
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const toggleAttendance = (id: string) =>
    setChildren(prev => prev.map(c => c.id === id ? { ...c, present: !c.present } : c))

  const navigate = (id: string) => { setActiveNav(id); setSidebarOpen(false) }

  const filteredChildren = children.filter(c => {
    const matchAge = ageFilter === 'All' || c.ageGroup === ageFilter
    const matchSearch = c.name.toLowerCase().includes(childSearch.toLowerCase())
    return matchAge && matchSearch
  })

  const presentCount = children.filter(c => c.present).length
  const volunteersConfirmed = MOCK_VOLUNTEERS.filter(v => v.confirmed).length
  const pendingTasks = tasks.filter(t => !t.done).length
  const newChildren = children.filter(c => c.newThisMonth).length
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const birthdaysThisMonth = children.filter(c => c.birthday?.includes('June') || c.birthday?.includes('May'))

  return (
    <div className="flex h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ════ SIDEBAR ════ */}
      <aside className={`fixed md:sticky top-0 left-0 h-full w-64 bg-white flex flex-col z-50 shadow-xl transition-transform duration-300 border-r border-gray-100 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Brand */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 bg-gradient-to-r from-pink-500 to-orange-400 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Baby className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-black text-sm">LITTLE LIGHTS</div>
            <div className="text-white/80 text-xs">Children's Ministry</div>
          </div>
          <button className="md:hidden ml-auto" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-white/80" /></button>
        </div>

        {/* Teacher chip */}
        <div className="mx-4 my-4 p-3 bg-green-50 rounded-2xl flex items-center gap-3 border border-green-100">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
            {TEACHER_INFO.initials}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-gray-900 truncate">{TEACHER_INFO.name}</div>
            <div className="text-green-600 text-xs">{TEACHER_INFO.role}</div>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === id ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {id === 'safety' && <Lock className="w-3 h-3 ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-gray-100">
          <Link href="/children" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-all">
            <Globe className="w-4 h-4" /> Back to Children's Ministry
          </Link>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-gray-900 text-lg">{NAV_ITEMS.find(n => n.id === activeNav)?.label}</h1>
            <p className="text-gray-400 text-xs hidden sm:block">{today}</p>
          </div>
          <button onClick={() => navigate('announcements')} className="relative p-2 rounded-xl hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
            {TEACHER_INFO.initials}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">

            {/* ══════════ HOME ══════════ */}
            {activeNav === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Welcome banner */}
                <div className="relative bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400 rounded-3xl p-6 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 opacity-10"><Smile className="w-full h-full" /></div>
                  <div className="relative z-10">
                    <p className="text-white/80 text-sm mb-1">🌟 {today}</p>
                    <h2 className="text-2xl font-black mb-1">Welcome back, {TEACHER_INFO.name}! 🎉</h2>
                    <p className="text-white/80 text-sm mb-5">"Let the little children come to me." — Matthew 19:14</p>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => navigate('children')} className="flex items-center gap-2 bg-white text-pink-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-sm">
                        <Users className="w-4 h-4" /> Mark Attendance
                      </button>
                      <button onClick={() => navigate('lesson')} className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/30 transition-all border border-white/30">
                        <BookOpen className="w-4 h-4" /> Today's Lesson
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Children Present', value: `${presentCount}/${children.length}`, icon: Users, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                    { label: 'Volunteers Ready', value: `${volunteersConfirmed}/${MOCK_VOLUNTEERS.length}`, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                    { label: 'Lesson Prepared', value: 'Ready ✓', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                    { label: 'New This Month', value: `+${newChildren}`, icon: Baby, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-2xl p-4 border ${s.border}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <s.icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Next event reminder */}
                <div className="bg-white rounded-2xl border border-green-200 p-5 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-green-800">Next: {MOCK_EVENTS[0].title}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">In {MOCK_EVENTS[0].daysLeft} days</span>
                    </div>
                    <p className="text-green-700 font-semibold text-sm">{MOCK_EVENTS[0].date} · {MOCK_EVENTS[0].time}</p>
                    <p className="text-green-500 text-xs flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {MOCK_EVENTS[0].venue} · Teacher: {MOCK_EVENTS[0].teacher}</p>
                  </div>
                  <button onClick={() => navigate('events')}><ChevronRight className="w-5 h-5 text-green-500" /></button>
                </div>

                {/* Birthday reminders */}
                {birthdaysThisMonth.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Cake className="w-6 h-6 text-yellow-600" />
                      <h3 className="font-bold text-yellow-800">🎂 Upcoming Birthdays</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {birthdaysThisMonth.map(c => (
                        <div key={c.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-yellow-200 text-sm">
                          <span className="font-semibold text-yellow-800">{c.name}</span>
                          <span className="text-yellow-600">· {c.birthday}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Mark Attendance', icon: CheckCircle2, color: 'bg-green-500', action: () => navigate('children') },
                      { label: 'View Lesson Plan', icon: BookOpen, color: 'bg-purple-600', action: () => navigate('lesson') },
                      { label: 'Add Child Record', icon: PlusCircle, color: 'bg-blue-600', action: () => navigate('children') },
                      { label: 'Contact Parent', icon: Phone, color: 'bg-orange-500', action: () => navigate('children') },
                      { label: 'Assign Volunteer', icon: UserCheck, color: 'bg-pink-600', action: () => navigate('volunteers') },
                      { label: 'Class Schedule', icon: Calendar, color: 'bg-indigo-600', action: () => navigate('events') },
                    ].map((a, i) => (
                      <button key={i} onClick={a.action}
                        className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group text-center">
                        <div className={`w-12 h-12 ${a.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                          <a.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 leading-tight">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Countdown to Children's Day */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5" />
                    <span className="font-black text-sm uppercase tracking-wider">Children's Day Celebration</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { val: countdown.days, label: 'Days' },
                      { val: countdown.hours, label: 'Hours' },
                      { val: countdown.mins, label: 'Mins' },
                      { val: countdown.secs, label: 'Secs' },
                    ].map((c, i) => (
                      <div key={i} className="bg-white/20 rounded-2xl p-3 text-center">
                        <div className="text-3xl font-black tabular-nums">{String(c.val).padStart(2, '0')}</div>
                        <div className="text-xs font-semibold opacity-70 mt-1">{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm mt-4 opacity-80">📍 Main Hall · Saturday, June 14 · 10:00 AM</p>
                </div>

                {/* My Tasks preview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">My Tasks ({pendingTasks} pending)</h3>
                    <button onClick={() => navigate('children')} className="text-sm text-pink-600 font-semibold hover:underline">View all</button>
                  </div>
                  <div className="space-y-3">
                    {tasks.filter(t => !t.done).slice(0, 3).map(task => (
                      <div key={task.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                        <button onClick={() => toggleTask(task.id)} className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-pink-500 transition-colors flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{task.text}</p>
                          {task.due && <p className="text-xs text-red-500 mt-0.5">Due: {task.due}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${task.category === 'lesson' ? 'bg-purple-100 text-purple-700' : task.category === 'care' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                          {task.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* ══════════ EVENTS ══════════ */}
            {activeNav === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Countdown */}
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-6 text-white text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Gift className="w-5 h-5" />
                    <span className="font-black tracking-widest text-sm uppercase">Children's Day Celebration</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                    {[{ val: countdown.days, label: 'Days' }, { val: countdown.hours, label: 'Hours' }, { val: countdown.mins, label: 'Mins' }, { val: countdown.secs, label: 'Secs' }].map((c, i) => (
                      <div key={i} className="bg-white/20 rounded-2xl p-3">
                        <div className="text-3xl font-black tabular-nums">{String(c.val).padStart(2, '0')}</div>
                        <div className="text-white/70 text-xs mt-1">{c.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-4">
                  {MOCK_EVENTS.map(event => (
                    <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: event.color }} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white mb-2 inline-block capitalize" style={{ backgroundColor: event.color }}>{event.type}</span>
                            <h3 className="font-black text-gray-900 text-lg">{event.title}</h3>
                          </div>
                          <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: event.color }}>
                            <span className="text-2xl font-black leading-none">{event.daysLeft}</span>
                            <span className="text-xs">days</span>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <p className="text-gray-600 text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{event.date}</p>
                          <p className="text-gray-600 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{event.time}</p>
                          <p className="text-gray-600 text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{event.venue}</p>
                          <p className="text-gray-600 text-sm flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />{event.teacher}</p>
                        </div>
                        <div className="flex gap-3">
                          <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ backgroundColor: event.color }}>
                            Confirm Attendance
                          </button>
                          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                            Remind Parents
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════ THIS WEEK'S LESSON ══════════ */}
            {activeNav === 'lesson' && (
              <motion.div key="lesson" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Lesson header */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white">
                  <span className="text-purple-300 text-xs font-bold uppercase tracking-wider">This Week's Lesson</span>
                  <h2 className="text-3xl font-black mt-2 mb-2">{THIS_WEEK_LESSON.topic}</h2>
                  <p className="text-purple-200 text-sm">{THIS_WEEK_LESSON.ageGroup}</p>
                </div>

                {/* Memory verse */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                      <Quote className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-black text-yellow-800">Memory Verse</h3>
                  </div>
                  <p className="text-yellow-900 font-semibold text-lg leading-relaxed italic">{THIS_WEEK_LESSON.verse}</p>
                </div>

                {/* Teaching notes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-purple-600" />
                    <h3 className="font-bold text-gray-900 text-lg">Teaching Notes</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{THIS_WEEK_LESSON.notes}</p>
                </div>

                {/* Activity */}
                <div className="bg-pink-50 border border-pink-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Palette className="w-6 h-6 text-pink-600" />
                    <h3 className="font-bold text-pink-800">Activity / Craft Idea</h3>
                  </div>
                  <p className="text-pink-700 font-medium">{THIS_WEEK_LESSON.activity}</p>
                </div>

                {/* Materials */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-6 h-6 text-blue-600" />
                    <h3 className="font-bold text-gray-900 text-lg">Required Materials</h3>
                  </div>
                  <div className="space-y-2">
                    {THIS_WEEK_LESSON.materials.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">{i + 1}</div>
                        <span className="text-blue-800 font-medium text-sm">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download */}
                {THIS_WEEK_LESSON.downloadReady && (
                  <button className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-700 transition-all shadow-sm">
                    <Download className="w-5 h-5" /> Download Full Lesson Plan (PDF)
                  </button>
                )}

                {/* Tasks for lesson */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Lesson Prep Tasks</h3>
                  <div className="space-y-3">
                    {tasks.filter(t => t.category === 'lesson').map(task => (
                      <div key={task.id} className="flex items-center gap-4">
                        <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-purple-500'}`}>
                          {task.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                        <span className={`text-sm font-medium flex-1 ${task.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.text}</span>
                        {task.due && !task.done && <span className="text-xs text-orange-500 font-semibold">{task.due}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ CHILDREN RECORDS ══════════ */}
            {activeNav === 'children' && (
              <motion.div key="children" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Attendance summary */}
                <div className="grid grid-cols-4 gap-3">
                  {(['Nursery', 'Toddlers', 'Primary', 'Juniors'] as const).map(group => {
                    const groupChildren = children.filter(c => c.ageGroup === group)
                    const presentInGroup = groupChildren.filter(c => c.present).length
                    return (
                      <div key={group} className="rounded-2xl p-4 text-center border" style={{ backgroundColor: AGE_GROUP_BG[group] }}>
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${AGE_GROUP_COLORS[group]}`}>{group}</div>
                        <div className="text-2xl font-black text-gray-900">{presentInGroup}/{groupChildren.length}</div>
                        <div className="text-gray-500 text-xs">present</div>
                      </div>
                    )
                  })}
                </div>

                {/* Search & filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={childSearch} onChange={e => setChildSearch(e.target.value)}
                      placeholder="Search children…" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['All', 'Nursery', 'Toddlers', 'Primary', 'Juniors'].map(f => (
                      <button key={f} onClick={() => setAgeFilter(f)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${ageFilter === f ? 'bg-pink-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Children list */}
                <div className="space-y-3">
                  {filteredChildren.map(child => (
                    <div key={child.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${child.present ? 'border-green-200' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-4">
                        {/* Attendance toggle */}
                        <button onClick={() => toggleAttendance(child.id)}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all font-bold text-sm ${child.present ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-300 hover:border-green-400'}`}>
                          {child.present ? <CheckCircle2 className="w-5 h-5" /> : child.initials}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900">{child.name}</p>
                            {child.newThisMonth && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">New</span>}
                            {child.birthday && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">🎂 {child.birthday}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${AGE_GROUP_COLORS[child.ageGroup]}`}>{child.ageGroup}</span>
                            <span className="text-xs text-gray-400">Age {child.age}</span>
                            {child.allergies && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">⚠️ {child.allergies.join(', ')}</span>}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <a href={`tel:${child.emergencyPhone}`} className="w-8 h-8 bg-green-50 hover:bg-green-100 rounded-lg flex items-center justify-center transition-all">
                            <Phone className="w-4 h-4 text-green-600" />
                          </a>
                          <button onClick={() => navigate('safety')} className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-all">
                            <Shield className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>

                      <div className={`text-xs mt-3 flex items-center gap-2 font-semibold ${child.present ? 'text-green-600' : 'text-gray-400'}`}>
                        {child.present ? '✓ Present today' : 'Not marked present'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add child button */}
                <button className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-pink-300 text-pink-500 py-4 rounded-2xl font-bold hover:bg-pink-50 transition-all">
                  <PlusCircle className="w-5 h-5" /> Add New Child Record
                </button>
              </motion.div>
            )}

            {/* ══════════ VOLUNTEERS ══════════ */}
            {activeNav === 'volunteers' && (
              <motion.div key="volunteers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Confirmed', val: MOCK_VOLUNTEERS.filter(v => v.confirmed).length, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Pending', val: MOCK_VOLUNTEERS.filter(v => !v.confirmed).length, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Total', val: MOCK_VOLUNTEERS.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                      <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                      <div className="text-gray-500 text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Alert for unconfirmed */}
                {MOCK_VOLUNTEERS.filter(v => !v.confirmed).length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-orange-800 text-sm">Pending Confirmations</p>
                      <p className="text-orange-700 text-xs mt-1">{MOCK_VOLUNTEERS.filter(v => !v.confirmed).length} volunteers have not confirmed for Sunday. Please follow up.</p>
                    </div>
                  </div>
                )}

                {/* Volunteer list */}
                <div className="space-y-3">
                  {(['Teacher', 'Helper', 'Substitute'] as const).map(role => {
                    const roleVols = MOCK_VOLUNTEERS.filter(v => v.role === role)
                    if (roleVols.length === 0) return null
                    return (
                      <div key={role}>
                        <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase tracking-wide">{role}s</h3>
                        <div className="space-y-3">
                          {roleVols.map(vol => (
                            <div key={vol.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${!vol.confirmed ? 'border-orange-200' : 'border-gray-100'}`}>
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${vol.confirmed ? 'bg-green-500' : 'bg-gray-400'}`}>
                                {vol.initials}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-gray-900">{vol.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{vol.role}</span>
                                  <span className="text-xs text-gray-400">{vol.ageGroup} class</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {vol.confirmed ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">✓ Confirmed</span>
                                ) : (
                                  <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold">Pending</span>
                                )}
                                <a href={`tel:${vol.phone}`} className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all">
                                  <Phone className="w-4 h-4 text-gray-600" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-purple-300 text-purple-500 py-4 rounded-2xl font-bold hover:bg-purple-50 transition-all">
                  <PlusCircle className="w-5 h-5" /> Add Volunteer
                </button>
              </motion.div>
            )}

            {/* ══════════ ANNOUNCEMENTS ══════════ */}
            {activeNav === 'announcements' && (
              <motion.div key="announcements" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">

                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl font-semibold text-sm">
                    <Users className="w-4 h-4" /> All Notices
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:border-pink-300">
                    <User className="w-4 h-4" /> Parent Notices
                  </button>
                </div>

                {MOCK_ANNOUNCEMENTS.map(a => (
                  <div key={a.id} className={`rounded-2xl border shadow-sm overflow-hidden ${a.urgent ? 'border-red-300' : 'border-gray-100 bg-white'}`}>
                    {a.urgent && <div className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> URGENT NOTICE</div>}
                    {a.forParents && !a.urgent && <div className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> PARENT NOTICE</div>}
                    <div className={`p-5 ${a.urgent ? 'bg-red-50' : ''}`}>
                      <h3 className={`font-bold text-lg mb-2 ${a.urgent ? 'text-red-800' : 'text-gray-900'}`}>{a.title}</h3>
                      <p className={`text-sm leading-relaxed mb-4 ${a.urgent ? 'text-red-700' : 'text-gray-600'}`}>{a.body}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{a.author}</p>
                            <p className="text-xs text-gray-400">{a.time}</p>
                          </div>
                        </div>
                        {a.forParents && <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"><Send className="w-3.5 h-3.5" /> Send to Parents</button>}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Send message */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-pink-500" /> Send Update to Parents</h3>
                  <textarea value={msgInput} onChange={e => setMsgInput(e.target.value)}
                    placeholder="Type a message for all parents…" rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm resize-none mb-3" />
                  <button disabled={!msgInput.trim()} className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-pink-600 transition-all">
                    Send to All Parents
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════ SAFETY & CARE ══════════ */}
            {activeNav === 'safety' && (
              <motion.div key="safety" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {!safetyUnlocked ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                      <Lock className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="font-black text-gray-900 text-2xl mb-2">Secure Section</h3>
                    <p className="text-gray-500 text-center mb-8 max-w-xs">This section contains sensitive child safety and medical information. Authorised staff only.</p>
                    <div className="w-full max-w-xs space-y-3">
                      <input type="password" value={safetyPin} onChange={e => setSafetyPin(e.target.value)}
                        placeholder="Enter staff PIN to unlock" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm text-center tracking-widest" />
                      <button onClick={() => { if (safetyPin === '1234' || safetyPin.length >= 4) setSafetyUnlocked(true) }}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                        Unlock Safety Records
                      </button>
                      <p className="text-xs text-gray-400 text-center">Use PIN: 1234 (demo)</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Safety Records — Unlocked</p>
                          <p className="text-green-600 text-xs">Authorised access granted</p>
                        </div>
                      </div>
                      <button onClick={() => { setSafetyUnlocked(false); setSafetyPin('') }} className="text-xs text-red-500 font-semibold hover:underline flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Lock
                      </button>
                    </div>

                    <div className="space-y-4">
                      {children.filter(c => c.allergies?.length || c.medicalNotes).map(child => (
                        <div key={child.id} className="bg-red-50 border border-red-200 rounded-2xl p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center font-bold text-white text-sm">{child.initials}</div>
                            <div>
                              <p className="font-bold text-red-900">{child.name}</p>
                              <p className="text-red-600 text-xs">{child.ageGroup} · Age {child.age}</p>
                            </div>
                            <AlertTriangle className="w-5 h-5 text-red-500 ml-auto" />
                          </div>
                          {child.allergies && (
                            <div className="mb-3">
                              <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2">⚠️ Allergies</p>
                              <div className="flex gap-2 flex-wrap">
                                {child.allergies.map(a => <span key={a} className="bg-red-200 text-red-800 text-xs font-bold px-3 py-1 rounded-full">{a}</span>)}
                              </div>
                            </div>
                          )}
                          {child.medicalNotes && (
                            <div>
                              <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2">📋 Medical Notes</p>
                              <p className="text-red-700 text-sm">{child.medicalNotes}</p>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* All children safety cards */}
                      <h3 className="font-bold text-gray-900 text-lg mt-6">Emergency Contacts & Pickup Authorization</h3>
                      {children.map(child => (
                        <div key={child.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-xs">{child.initials}</div>
                            <p className="font-bold text-gray-900">{child.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${AGE_GROUP_COLORS[child.ageGroup]}`}>{child.ageGroup}</span>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Emergency Contact</p>
                              <p className="font-semibold text-gray-900 text-sm">{child.emergencyContact}</p>
                              <a href={`tel:${child.emergencyPhone}`} className="text-blue-600 text-sm flex items-center gap-1 mt-1 hover:underline">
                                <Phone className="w-3.5 h-3.5" /> {child.emergencyPhone}
                              </a>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Authorized Pickup</p>
                              <div className="flex flex-wrap gap-1">
                                {child.pickupAuth.map(p => <span key={p} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">{p}</span>)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ══════════ HIGHLIGHTS ══════════ */}
            {activeNav === 'highlights' && (
              <motion.div key="highlights" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Bible verse */}
                <div className="bg-gradient-to-br from-pink-500 to-orange-400 rounded-3xl p-8 text-white text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Quote className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-4 block">Bible Verse of the Week</span>
                  <p className="text-xl md:text-2xl font-bold leading-relaxed mb-4 italic">
                    "Start children off on the way they should go, and even when they are old they will not turn from it."
                  </p>
                  <p className="text-yellow-200 font-bold">— Proverbs 22:6</p>
                </div>

                {/* Growth stats */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Ministry Growth</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { val: '+15', label: 'New Children This Year', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' },
                      { val: '6', label: 'Special Programs Run', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                      { val: '92%', label: 'Avg Monthly Attendance', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                      { val: '8', label: 'Volunteers Serving', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-2xl p-5 text-center`}>
                        <s.icon className={`w-7 h-7 mx-auto mb-3 ${s.color}`} />
                        <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                        <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonies */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Recent Highlights</h3>
                  <div className="space-y-4">
                    {[
                      { icon: Heart, title: 'Easter Program Success', body: '32 children performed the Easter play to a packed congregation. Three families gave their lives to Christ after the program!', color: 'bg-red-50 border-red-200', iconColor: 'text-red-500' },
                      { icon: Award, title: 'Bible Quiz Champions', body: 'Our Juniors team won the intrachurch Bible quiz competition for the second year running. All glory to God!', color: 'bg-yellow-50 border-yellow-200', iconColor: 'text-yellow-600' },
                      { icon: Baby, title: '15 New Children Joined', body: 'We welcomed 15 new children into the Little Lights family this year. Our nursery has grown by 60%!', color: 'bg-green-50 border-green-200', iconColor: 'text-green-600' },
                    ].map((h, i) => (
                      <div key={i} className={`rounded-2xl border p-5 ${h.color}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                            <h.icon className={`w-5 h-5 ${h.iconColor}`} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">{h.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{h.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Encouragement */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 text-white text-center">
                  <Smile className="w-14 h-14 mx-auto mb-4 text-yellow-300" />
                  <h3 className="text-2xl font-black mb-3">You Are Shaping Eternity</h3>
                  <p className="font-medium opacity-80 max-w-md mx-auto">
                    Every lesson you teach, every child you love, every moment you invest — you are planting seeds that will bear fruit for generations. Keep going. What you do matters eternally.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

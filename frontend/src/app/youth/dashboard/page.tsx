'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Home, Calendar, Zap, BookOpen, CheckSquare, Bell, BarChart2,
  Users, Heart, Star, Menu, X, ChevronRight, ChevronDown,
  Download, MessageSquare, Play, Mic2, Shield, Clock, Target,
  TrendingUp, Award, Gift, Phone, Mail, ArrowRight, Flame,
  Music, Camera, Megaphone, Globe, UserCheck, AlertCircle,
  CheckCircle2, Circle, Lock, Unlock, Video, FileText, Bookmark,
  Coffee, Sunset, Lightbulb, Crown, Send, Plus, Minus,
  Radio, Map, Activity, Flag, PenTool, Eye, Volume2, EyeOff, Loader2
} from 'lucide-react'

// ─── Auth ─────────────────────────────────────────────────────────────────────

const ADMIN_CREDENTIALS = { username: 'admin', password: 'LETW@Admin2026' }

export interface YouthMember {
  id: string; name: string; email: string; phone: string
  ageGroup: string; gender: string; password: string
  joinedAt: string; active: boolean
}

function getYouthMembers(): YouthMember[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('letw_youth_members') || '[]') } catch { return [] }
}
function saveYouthMembers(members: YouthMember[]) {
  localStorage.setItem('letw_youth_members', JSON.stringify(members))
}

function YouthLoginGate({ onLogin }: { onLogin: (name: string) => void }) {
  const [tab, setTab] = useState<'login' | 'register' | 'admin'>('login')

  // Login state
  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register state
  const [regName,     setRegName]     = useState('')
  const [regEmail,    setRegEmail]    = useState('')
  const [regPhone,    setRegPhone]    = useState('')
  const [regAgeGroup, setRegAgeGroup] = useState('16–19')
  const [regGender,   setRegGender]   = useState('Male')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm,  setRegConfirm]  = useState('')

  // Admin state
  const [adminUser, setAdminUser] = useState('')
  const [adminPw,   setAdminPw]   = useState('')

  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none'

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    setTimeout(() => {
      setLoading(false)
      const members = getYouthMembers()
      const found = members.find(m => m.email.toLowerCase() === loginEmail.toLowerCase() && m.password === loginPassword)
      if (found) { onLogin(found.name) }
      else { setError('Email or password is incorrect.') }
    }, 600)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    setTimeout(() => {
      setLoading(false)
      if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
      if (regPassword !== regConfirm) { setError('Passwords do not match.'); return }
      const members = getYouthMembers()
      if (members.find(m => m.email.toLowerCase() === regEmail.toLowerCase())) {
        setError('An account with this email already exists. Please log in.'); return
      }
      const newMember: YouthMember = {
        id: Date.now().toString(), name: regName.trim(), email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(), ageGroup: regAgeGroup, gender: regGender,
        password: regPassword, joinedAt: new Date().toISOString(), active: true,
      }
      saveYouthMembers([...members, newMember])
      setSuccess('Account created! You can now log in.')
      setTab('login'); setLoginEmail(regEmail.trim().toLowerCase())
    }, 700)
  }

  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    setTimeout(() => {
      setLoading(false)
      if (adminUser === ADMIN_CREDENTIALS.username && adminPw === ADMIN_CREDENTIALS.password) { onLogin('Admin') }
      else { setError('Invalid admin credentials.') }
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-7 pt-8 pb-7">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900">LETW Youth</h1>
            <p className="text-xs text-gray-500 mt-0.5">Member Dashboard</p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
            {([['login','Login'],['register','Register'],['admin','Admin']] as const).map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className={`flex-1 py-2 text-xs font-semibold transition-all ${tab === t ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                {label}
              </button>
            ))}
          </div>

          {success && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {success}
            </div>
          )}

          {/* LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className={inputCls} placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={inputCls + ' pr-10'} placeholder="Your password" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</motion.div>}
              </AnimatePresence>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70 mt-1" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In'}
              </button>
              <p className="text-center text-xs text-gray-400">No account? <button type="button" onClick={() => setTab('register')} className="text-purple-600 font-semibold hover:underline">Register here</button></p>
            </form>
          )}

          {/* REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input required value={regName} onChange={e => setRegName(e.target.value)} className={inputCls} placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className={inputCls} placeholder="your@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input value={regPhone} onChange={e => setRegPhone(e.target.value)} className={inputCls} placeholder="+234…" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gender *</label>
                  <select required value={regGender} onChange={e => setRegGender(e.target.value)} className={inputCls}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Age Group *</label>
                <select required value={regAgeGroup} onChange={e => setRegAgeGroup(e.target.value)} className={inputCls}>
                  <option>13–15</option><option>16–19</option><option>20–24</option><option>25–35</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
                  <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} className={inputCls} placeholder="Min 6 chars" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm *</label>
                  <input type="password" required value={regConfirm} onChange={e => setRegConfirm(e.target.value)} className={inputCls} placeholder="Repeat" />
                </div>
              </div>
              <AnimatePresence>
                {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</motion.div>}
              </AnimatePresence>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
              </button>
              <p className="text-center text-xs text-gray-400">Already have an account? <button type="button" onClick={() => setTab('login')} className="text-purple-600 font-semibold hover:underline">Log in</button></p>
            </form>
          )}

          {/* ADMIN */}
          {tab === 'admin' && (
            <form onSubmit={handleAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                <input required value={adminUser} onChange={e => setAdminUser(e.target.value)} className={inputCls} placeholder="Admin username" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required value={adminPw} onChange={e => setAdminPw(e.target.value)} className={inputCls + ' pr-10'} placeholder="Admin password" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</motion.div>}
              </AnimatePresence>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Admin Login'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            <Link href="/youth" className="text-purple-600 font-semibold hover:underline">← Back to Youth Page</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Task {
  id: number
  text: string
  category: 'worship' | 'outreach' | 'admin' | 'service'
  due: string
  done: boolean
}

interface PrayerRequest {
  id: number
  name: string
  request: string
  date: string
  answered: boolean
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'home',          icon: Home,        label: 'Home' },
  { id: 'events',        icon: Calendar,    label: 'Events' },
  { id: 'focus',         icon: BookOpen,    label: "This Week's Focus" },
  { id: 'tasks',         icon: CheckSquare, label: 'My Tasks' },
  { id: 'announcements', icon: Bell,        label: 'Announcements' },
  { id: 'attendance',    icon: BarChart2,   label: 'Attendance' },
  { id: 'groups',        icon: Users,       label: 'Youth Groups' },
  { id: 'prayer',        icon: Heart,       label: 'Prayer & Mentorship' },
  { id: 'highlights',    icon: Star,        label: 'Highlights' },
]

const EVENTS = [
  {
    title: 'Youth Friday Fellowship',
    date: 'Fri, 30 May 2026',
    time: '6:00 PM',
    venue: 'Main Hall, LETW',
    leader: 'Bro. Samuel Akin',
    type: 'Fellowship',
    color: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
    confirmed: true,
  },
  {
    title: 'Youth Worship Night',
    date: 'Sat, 7 Jun 2026',
    time: '5:00 PM',
    venue: 'Sanctuary',
    leader: 'Sis. Grace Obi',
    type: 'Worship',
    color: 'bg-pink-100 text-pink-700',
    dot: 'bg-pink-500',
    confirmed: false,
  },
  {
    title: 'Evangelism Outreach',
    date: 'Sat, 14 Jun 2026',
    time: '9:00 AM',
    venue: 'City Centre Park',
    leader: 'Bro. Femi Adeyemi',
    type: 'Outreach',
    color: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
    confirmed: false,
  },
  {
    title: 'Annual Youth Conference',
    date: 'Fri–Sun, 27–29 Jun 2026',
    time: 'All Day',
    venue: 'LETW Conference Centre',
    leader: 'Youth Pastor Kelechi',
    type: 'Conference',
    color: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-500',
    confirmed: false,
  },
]

const ANNOUNCEMENTS = [
  {
    from: 'Youth Pastor Kelechi',
    role: 'Youth Pastor',
    time: '2 hours ago',
    msg: 'Reminder: All youth leaders must submit their June programme plans by this Wednesday. Please use the template shared in the leadership WhatsApp group.',
    urgent: true,
    pinned: true,
  },
  {
    from: 'Sis. Grace Obi',
    role: 'Worship Team Lead',
    time: 'Yesterday',
    msg: 'Worship team rehearsal has been moved from Thursday to Wednesday 7 PM. Please ensure all members are informed. God bless you.',
    urgent: false,
    pinned: false,
  },
  {
    from: 'Bro. Femi Adeyemi',
    role: 'Outreach Coordinator',
    time: '2 days ago',
    msg: 'We need 20 volunteers for the June outreach. Sign up using the Quick Action button or contact me directly. Bring your Bible, tracts, and a willing heart!',
    urgent: false,
    pinned: false,
  },
  {
    from: 'Admin',
    role: 'Church Admin',
    time: '3 days ago',
    msg: 'Youth registration for the Annual Conference is now open. Early bird registration closes on June 10. Spaces are limited — register now!',
    urgent: false,
    pinned: false,
  },
]

const GROUPS = [
  { name: 'Worship Team',    leader: 'Sis. Grace Obi',      members: 18, icon: Music,     color: 'bg-pink-100 text-pink-700',   border: 'border-pink-200' },
  { name: 'Media & Tech',    leader: 'Bro. Daniel Ojo',     members: 12, icon: Camera,    color: 'bg-blue-100 text-blue-700',   border: 'border-blue-200' },
  { name: 'Drama Ministry',  leader: 'Sis. Tola Adebayo',   members: 15, icon: Play,      color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { name: 'Ushering',        leader: 'Bro. Yusuf Bello',    members: 10, icon: UserCheck, color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  { name: 'Evangelism',      leader: 'Bro. Femi Adeyemi',   members: 22, icon: Globe,     color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { name: 'Prayer Team',     leader: 'Sis. Ngozi Eze',      members: 20, icon: Heart,     color: 'bg-red-100 text-red-700',     border: 'border-red-200' },
  { name: 'Welfare',         leader: 'Sis. Amaka Peters',   members: 8,  icon: Gift,      color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  { name: 'Follow-up Team',  leader: 'Bro. Emeka Chukwu',   members: 14, icon: Activity,  color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
]

const TESTIMONIES = [
  { name: 'Sis. Chiamaka', text: 'I got a scholarship to study abroad! I know it was God and the prayers of this youth group. Thank you all!', tag: 'Scholarship' },
  { name: 'Bro. Tobi', text: 'After the career seminar last month, I finally got my dream job offer. God is faithful!', tag: 'Career' },
  { name: 'Sis. Funke', text: 'I was struggling with my faith but the mentorship sessions helped me rediscover my purpose in Christ.', tag: 'Spiritual Growth' },
]

const WEEKLY_DISCUSSION = [
  'What does it mean to seek God\'s kingdom first in a practical, daily way?',
  'How do you handle peer pressure from friends who don\'t share your faith?',
  'What is one area in your life where you need God\'s guidance right now?',
  'How can we as a youth group better support each other in our daily walk with God?',
]

const MENTORS = [
  { name: 'Pastor Kelechi Eze', area: 'Spiritual Growth & Leadership', available: true },
  { name: 'Sis. Ngozi Eze', area: 'Women\'s Mentorship & Career', available: true },
  { name: 'Bro. Samuel Akin', area: 'Men\'s Mentorship & Purpose', available: false },
  { name: 'Sis. Tola Adebayo', area: 'Creative Arts & Ministry Calling', available: true },
]

const ATTENDANCE_WEEKS = [
  { week: 'Week 1', present: true },
  { week: 'Week 2', present: true },
  { week: 'Week 3', present: false },
  { week: 'Week 4', present: true },
  { week: 'Week 5', present: true },
]

// ─── Countdown Hook ────────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    const tick = () => setDiff(Math.max(0, target.getTime() - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CountBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-white/20 rounded-2xl px-4 py-3 min-w-[64px]">
      <span className="text-2xl font-black text-white tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-white/70 text-xs font-semibold uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  )
}

// ─── Auth Wrapper ──────────────────────────────────────────────────────────────

export default function YouthDashboardPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [memberName, setMemberName] = useState('')
  if (!authenticated) return <YouthLoginGate onLogin={(name) => { setAuthenticated(true); setMemberName(name) }} />
  return <YouthDashboardContent memberName={memberName} />
}

// ─── Main Component ────────────────────────────────────────────────────────────

function YouthDashboardContent({ memberName }: { memberName: string }) {
  const [activeSection, setActiveSection] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Lead opening prayer at Friday fellowship', category: 'worship', due: 'Fri 30 May', done: false },
    { id: 2, text: 'Confirm attendance for Worship Night with team', category: 'worship', due: 'Mon 26 May', done: false },
    { id: 3, text: 'Share outreach flyers on social media', category: 'outreach', due: 'Wed 28 May', done: true },
    { id: 4, text: 'Submit June programme plan to youth pastor', category: 'admin', due: 'Wed 28 May', done: false },
    { id: 5, text: 'Follow up with 3 new youth members', category: 'service', due: 'Thu 29 May', done: false },
    { id: 6, text: 'Collect drama costumes for next performance', category: 'service', due: 'Sat 31 May', done: true },
  ])
  const [prayerInput, setPrayerInput] = useState('')
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([
    { id: 1, name: 'Me', request: 'For divine direction in my career choice', date: '20 May', answered: false },
    { id: 2, name: 'Me', request: 'Healing for my mother who is unwell', date: '15 May', answered: true },
  ])
  const [announcementFilter, setAnnouncementFilter] = useState<'all' | 'urgent'>('all')
  const [confirmedEvents, setConfirmedEvents] = useState<Set<number>>(new Set([0]))
  const [openDiscussion, setOpenDiscussion] = useState<number | null>(null)
  const [newTask, setNewTask] = useState('')
  const [messageInput, setMessageInput] = useState('')

  const conferenceDate = new Date('2026-06-27T08:00:00')
  const countdown = useCountdown(conferenceDate)

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const submitPrayer = () => {
    if (!prayerInput.trim()) return
    setPrayerRequests(prev => [
      { id: Date.now(), name: 'Me', request: prayerInput, date: 'Today', answered: false },
      ...prev,
    ])
    setPrayerInput('')
  }

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(prev => [...prev, {
      id: Date.now(), text: newTask, category: 'admin', due: 'Soon', done: false,
    }])
    setNewTask('')
  }

  const CAT_COLORS: Record<string, string> = {
    worship: 'bg-pink-100 text-pink-700',
    outreach: 'bg-orange-100 text-orange-700',
    admin: 'bg-blue-100 text-blue-700',
    service: 'bg-green-100 text-green-700',
  }

  const filteredAnnouncements = announcementFilter === 'urgent'
    ? ANNOUNCEMENTS.filter(a => a.urgent)
    : ANNOUNCEMENTS

  const pendingTasks = tasks.filter(t => !t.done).length
  const attendancePercent = Math.round((ATTENDANCE_WEEKS.filter(w => w.present).length / ATTENDANCE_WEEKS.length) * 100)

  // ─── SECTION RENDERS ──────────────────────────────────────────────────────

  function renderHome() {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 rounded-3xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Crown className="w-7 h-7 text-yellow-300" />
            </div>
            <div className="flex-1">
              <p className="text-purple-200 text-sm font-semibold">Welcome back 🔥</p>
              <h2 className="text-2xl font-black text-white mt-0.5">Brother David!</h2>
              <p className="text-purple-200 text-sm mt-1">Friday, 23 May 2026</p>
              <div className="mt-3 bg-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-yellow-300 shrink-0" />
                <span className="text-white text-sm font-semibold">Next: Youth Friday Fellowship — Fri 30 May, 6 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Attendance', value: `${attendancePercent}%`, sub: 'This month', icon: BarChart2, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Upcoming', value: '4', sub: 'Events', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Tasks Due', value: String(pendingTasks), sub: 'Pending', icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Prayer Req.', value: String(prayerRequests.filter(p => !p.answered).length), sub: 'Open', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Countdown */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-white" />
            <span className="text-white font-black text-sm uppercase tracking-wider">Annual Youth Conference 2026</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CountBox value={countdown.d} label="Days" />
            <CountBox value={countdown.h} label="Hours" />
            <CountBox value={countdown.m} label="Mins" />
            <CountBox value={countdown.s} label="Secs" />
          </div>
          <p className="text-white/80 text-xs mt-3">27–29 June 2026 · LETW Conference Centre · Registration Open</p>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-gray-800 font-black text-base mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Mark Attendance', icon: UserCheck, color: 'bg-violet-600', action: () => setActiveSection('attendance') },
              { label: 'Join Group Chat', icon: MessageSquare, color: 'bg-blue-600', action: () => setActiveSection('groups') },
              { label: 'Event Schedule', icon: Calendar, color: 'bg-indigo-600', action: () => setActiveSection('events') },
              { label: 'Prayer Request', icon: Heart, color: 'bg-pink-600', action: () => setActiveSection('prayer') },
              { label: 'Volunteer', icon: Flag, color: 'bg-orange-600', action: () => setActiveSection('tasks') },
              { label: 'Study Material', icon: Download, color: 'bg-green-600', action: () => setActiveSection('focus') },
            ].map(a => (
              <button
                key={a.label}
                onClick={a.action}
                className={`${a.color} text-white rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md`}
              >
                <a.icon className="w-6 h-6" />
                <span className="text-xs font-bold text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Latest Announcements Preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-600" />
              <span className="font-black text-gray-800 text-sm">Latest Announcements</span>
            </div>
            <button onClick={() => setActiveSection('announcements')} className="text-violet-600 text-xs font-bold flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {ANNOUNCEMENTS.slice(0, 2).map((a, i) => (
            <div key={i} className={`px-5 py-4 ${i < 1 ? 'border-b border-gray-50' : ''}`}>
              {a.urgent && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                  <AlertCircle className="w-3 h-3" /> Urgent
                </span>
              )}
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">{a.msg}</p>
              <p className="text-gray-400 text-xs mt-1.5">{a.from} · {a.time}</p>
            </div>
          ))}
        </div>

        {/* Tasks Preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-orange-500" />
              <span className="font-black text-gray-800 text-sm">My Tasks</span>
              {pendingTasks > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingTasks}</span>
              )}
            </div>
            <button onClick={() => setActiveSection('tasks')} className="text-orange-500 text-xs font-bold flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {tasks.filter(t => !t.done).slice(0, 3).map(t => (
            <div key={t.id} className="px-5 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3">
              <button onClick={() => toggleTask(t.id)}>
                <Circle className="w-5 h-5 text-gray-300" />
              </button>
              <span className="flex-1 text-sm text-gray-700">{t.text}</span>
              <span className="text-xs text-gray-400">{t.due}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderEvents() {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-white" />
            <span className="text-white font-black text-sm uppercase tracking-wider">Annual Conference Countdown</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CountBox value={countdown.d} label="Days" />
            <CountBox value={countdown.h} label="Hours" />
            <CountBox value={countdown.m} label="Mins" />
            <CountBox value={countdown.s} label="Secs" />
          </div>
          <p className="text-white/80 text-xs mt-2">27–29 June 2026 · LETW Conference Centre</p>
        </div>

        <div className="space-y-4">
          {EVENTS.map((evt, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                <div className={`w-3 h-3 rounded-full ${evt.dot} shrink-0`} />
                <h3 className="font-black text-gray-800 flex-1">{evt.title}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${evt.color}`}>{evt.type}</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{evt.date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{evt.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Map className="w-4 h-4 text-gray-400" />
                  <span>{evt.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Crown className="w-4 h-4 text-gray-400" />
                  <span>{evt.leader}</span>
                </div>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => setConfirmedEvents(prev => {
                    const next = new Set(prev)
                    next.has(i) ? next.delete(i) : next.add(i)
                    return next
                  })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    confirmedEvents.has(i)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}
                >
                  {confirmedEvents.has(i) ? <><CheckCircle2 className="w-4 h-4" /> Confirmed</> : <><UserCheck className="w-4 h-4" /> Confirm Attendance</>}
                </button>
                <button className="px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Remind Me
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderFocus() {
    return (
      <div className="space-y-6">
        {/* Topic card */}
        <div className="bg-gradient-to-br from-violet-700 to-indigo-800 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-yellow-300" />
            <span className="text-yellow-300 font-bold text-sm uppercase tracking-wider">This Week's Focus</span>
          </div>
          <h2 className="text-2xl font-black leading-tight mb-2">Seek First His Kingdom</h2>
          <div className="bg-white/15 rounded-xl px-4 py-3 mb-4">
            <p className="text-yellow-200 text-sm font-bold mb-1">Main Scripture</p>
            <p className="text-white text-sm leading-relaxed italic">
              "But seek first his kingdom and his righteousness, and all these things will be given to you as well."
            </p>
            <p className="text-white/70 text-xs mt-1">— Matthew 6:33 (NIV)</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-3 mb-4">
            <p className="text-yellow-200 text-sm font-bold mb-1">Prayer Focus</p>
            <p className="text-white/90 text-sm leading-relaxed">
              Pray for the grace to put God above career ambitions, relationships, and social pressures this week. Ask for a renewed hunger for His presence.
            </p>
          </div>
          <div className="bg-orange-400/30 border border-orange-400/40 rounded-xl px-4 py-3">
            <p className="text-orange-200 text-sm font-bold mb-1">Weekly Challenge</p>
            <p className="text-white text-sm leading-relaxed">
              Invite one friend to Friday Fellowship. Be the reason someone encounters God this week!
            </p>
          </div>
        </div>

        {/* Discussion Questions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-600" /> Discussion Questions
            </h3>
          </div>
          {WEEKLY_DISCUSSION.map((q, i) => (
            <div key={i} className="border-b border-gray-50 last:border-0">
              <button
                onClick={() => setOpenDiscussion(openDiscussion === i ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700 font-semibold">{q}</span>
                {openDiscussion === i ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
              {openDiscussion === i && (
                <div className="px-5 pb-4">
                  <textarea
                    rows={3}
                    placeholder="Share your thoughts here..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  <button className="mt-2 bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
                    Share with Group
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Study Guide Download */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-green-800 text-sm">Seek First — Study Guide</p>
            <p className="text-green-700 text-xs mt-0.5">Week 3 of 4 · Matthew 6 Series · PDF, 8 pages</p>
          </div>
          <button className="bg-green-600 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    )
  }

  function renderTasks() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-orange-500" /> My Assignments
            </h3>
            <span className="text-sm text-gray-500">{tasks.filter(t => t.done).length}/{tasks.length} done</span>
          </div>

          {/* Add task */}
          <div className="px-5 py-3 border-b border-gray-50 flex gap-2">
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add a new task..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button onClick={addTask} className="bg-orange-500 text-white px-3 py-2 rounded-xl hover:bg-orange-600 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Task list */}
          <div className="divide-y divide-gray-50">
            {tasks.map(t => (
              <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 ${t.done ? 'opacity-50' : ''}`}>
                <button onClick={() => toggleTask(t.id)} className="shrink-0">
                  {t.done
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <Circle className="w-5 h-5 text-gray-300" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-gray-700 ${t.done ? 'line-through' : ''}`}>{t.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${CAT_COLORS[t.category]}`}>{t.category}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t.due}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending confirmations */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span className="font-black text-orange-800 text-sm">Pending Confirmations</span>
          </div>
          <div className="space-y-2">
            {[
              'Confirm: Are you available to usher at Worship Night on 7 June?',
              'Confirm: Will you join the outreach team on 14 June?',
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3">
                <p className="flex-1 text-sm text-gray-700">{c}</p>
                <div className="flex gap-2 shrink-0">
                  <button className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors">Yes</button>
                  <button className="text-xs font-bold bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">No</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderAnnouncements() {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {(['all', 'urgent'] as const).map(f => (
            <button
              key={f}
              onClick={() => setAnnouncementFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                announcementFilter === f ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'urgent' ? '🔴 Urgent Only' : 'All Messages'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredAnnouncements.map((a, i) => (
            <div key={i} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
              a.pinned ? 'border-red-200' : 'border-gray-100'
            }`}>
              {a.pinned && (
                <div className="bg-red-50 px-5 py-2 flex items-center gap-2 border-b border-red-100">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-red-600 text-xs font-bold">PINNED · URGENT</span>
                </div>
              )}
              <div className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0 font-black text-violet-700 text-sm">
                    {a.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-gray-800 text-sm">{a.from}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{a.role}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mt-2">{a.msg}</p>
                    <p className="text-gray-400 text-xs mt-2">{a.time}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-violet-600" /> Send Message to Youth Pastor
          </h3>
          <textarea
            rows={3}
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            placeholder="Type your message here..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <button
            onClick={() => setMessageInput('')}
            className="mt-2 bg-violet-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-violet-700 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Send Message
          </button>
        </div>
      </div>
    )
  }

  function renderAttendance() {
    return (
      <div className="space-y-6">
        {/* Personal attendance */}
        <div className="bg-gradient-to-br from-violet-700 to-indigo-800 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-yellow-300" />
            <span className="text-yellow-300 font-bold text-sm uppercase">My Attendance</span>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <span className="text-6xl font-black">{attendancePercent}%</span>
            <div>
              <p className="text-white/80 text-sm">Consistency</p>
              <p className="text-white/60 text-xs">{ATTENDANCE_WEEKS.filter(w => w.present).length} of {ATTENDANCE_WEEKS.length} meetings</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {ATTENDANCE_WEEKS.map((w, i) => (
              <div key={i} className={`flex flex-col items-center gap-1.5 bg-white/10 rounded-xl px-3 py-2`}>
                <div className={`w-4 h-4 rounded-full ${w.present ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-white/70 text-xs">{w.week}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mark attendance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" /> Mark Today's Attendance
          </h3>
          <p className="text-sm text-gray-500 mb-4">Friday Fellowship · 23 May 2026</p>
          <button className="w-full bg-green-600 text-white font-black py-3.5 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Mark Present Today
          </button>
        </div>

        {/* Streak & rank */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-orange-600">4</div>
            <p className="text-xs text-gray-500 mt-1">Streak (weeks)</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-center">
            <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-yellow-600">#7</div>
            <p className="text-xs text-gray-500 mt-1">Attendance Rank</p>
          </div>
        </div>

        {/* New members */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-600" /> New Members This Month
          </h3>
          <div className="flex gap-3 flex-wrap">
            {['Taiwo A.', 'Sola B.', 'Chidi O.', 'Amina K.', 'Blessing N.'].map(name => (
              <div key={name} className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-3 py-1.5">
                <div className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-xs font-black">{name[0]}</div>
                <span className="text-sm text-violet-700 font-semibold">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">5 new members joined the youth ministry this month</p>
        </div>
      </div>
    )
  }

  function renderGroups() {
    return (
      <div className="space-y-6">
        <p className="text-gray-500 text-sm">Connect with your team, contact leaders, and coordinate ministry assignments.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GROUPS.map((g, i) => (
            <div key={i} className={`bg-white rounded-2xl border-2 ${g.border} p-5 hover:shadow-md transition-all`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${g.color.split(' ')[0].replace('text', 'bg').replace('-700', '-100')} flex items-center justify-center shrink-0`}>
                  <g.icon className={`w-5 h-5 ${g.color.split(' ')[1]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-800 text-sm leading-tight">{g.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Leader: {g.leader}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${g.color}`}>{g.members}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Call
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg transition-colors">
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderPrayer() {
    return (
      <div className="space-y-6">
        {/* Bible verse */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4 text-pink-200" />
            <span className="text-pink-200 text-sm font-bold uppercase tracking-wider">Verse of the Week</span>
          </div>
          <p className="text-white text-lg font-bold leading-relaxed italic">
            "Cast all your anxiety on him because he cares for you."
          </p>
          <p className="text-pink-200 text-sm mt-2">— 1 Peter 5:7 (NIV)</p>
        </div>

        {/* Submit prayer request */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" /> Submit a Prayer Request
          </h3>
          <textarea
            rows={3}
            value={prayerInput}
            onChange={e => setPrayerInput(e.target.value)}
            placeholder="Share what you'd like prayer for..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <button
            onClick={submitPrayer}
            className="mt-2 bg-pink-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-pink-700 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Submit Request
          </button>
        </div>

        {/* My prayer requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-800 text-sm">My Prayer Requests</h3>
          </div>
          {prayerRequests.map(req => (
            <div key={req.id} className="px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="flex items-start gap-3">
                {req.answered
                  ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  : <Heart className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                }
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{req.request}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-400">{req.date}</span>
                    {req.answered && (
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Answered!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mentorship */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Crown className="w-4 h-4 text-violet-600" /> Book a Mentorship Session
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {MENTORS.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center font-black text-violet-700 text-sm shrink-0">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{m.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.area}</p>
                </div>
                <button
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                    m.available
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!m.available}
                >
                  {m.available ? 'Book' : 'Busy'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Counselling */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-violet-800 text-sm">Need to Talk?</h3>
              <p className="text-violet-700 text-xs mt-0.5">Book a one-on-one counselling or guidance session with a trained youth counsellor.</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-violet-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-violet-700 transition-colors">
            Book Counselling Session
          </button>
        </div>
      </div>
    )
  }

  function renderHighlights() {
    return (
      <div className="space-y-6">
        {/* Growth stats */}
        <div className="bg-gradient-to-br from-violet-700 to-indigo-800 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-300" />
            <span className="text-yellow-300 font-bold text-sm uppercase tracking-wider">Ministry Growth</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Youth Members', value: '247' },
              { label: 'New This Year', value: '+38' },
              { label: 'Active Volunteers', value: '89' },
              { label: 'Events This Year', value: '24' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
                <div className="text-2xl font-black text-yellow-300">{s.value}</div>
                <div className="text-white/70 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonies */}
        <div className="space-y-4">
          <h3 className="font-black text-gray-800 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-current" /> Testimonies
          </h3>
          {TESTIMONIES.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center font-black text-yellow-700 text-sm">
                  {t.name.split(' ')[1]?.[0] || t.name[0]}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">{t.name}</p>
                  <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{t.tag}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed italic">"{t.text}"</p>
            </div>
          ))}
        </div>

        {/* Birthdays & Celebrations */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-yellow-600" />
            <h3 className="font-black text-yellow-800 text-sm">Birthdays & Celebrations</h3>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Sis. Chinwe Okafor', event: '🎂 Birthday — 25 May' },
              { name: 'Bro. Adebayo Lawal', event: '🎓 Graduation — 28 May' },
              { name: 'Sis. Joy Emmanuel', event: '🎂 Birthday — 31 May' },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5">
                <span className="font-semibold text-sm text-gray-700">{b.name}</span>
                <span className="text-sm">{b.event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent highlights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-violet-600" /> Recent Event Highlights
            </h3>
          </div>
          {[
            { event: 'Easter Vigil Service', date: 'April 2026', type: 'Worship', desc: '180 youth members participated in a powerful all-night prayer and worship experience.' },
            { event: 'Quarterly Outreach', date: 'March 2026', type: 'Outreach', desc: '45 youth members reached 300+ homes in the community. 12 new members joined the church.' },
            { event: 'Leadership Summit', date: 'February 2026', type: 'Training', desc: 'Youth leaders completed 2-day intensive training on servant leadership and ministry management.' },
          ].map((h, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-black text-gray-800 text-sm">{h.event}</span>
                <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">{h.type}</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{h.date}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* Encouragement */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 text-white text-center">
          <Flame className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
          <p className="font-black text-lg mb-1">Keep Rising, Keep Shining!</p>
          <p className="text-white/80 text-sm leading-relaxed">
            You are the light of the world. Let your good works shine before others that they may see and glorify God. — Matthew 5:16
          </p>
        </div>
      </div>
    )
  }

  function renderSection() {
    switch (activeSection) {
      case 'home':          return renderHome()
      case 'events':        return renderEvents()
      case 'focus':         return renderFocus()
      case 'tasks':         return renderTasks()
      case 'announcements': return renderAnnouncements()
      case 'attendance':    return renderAttendance()
      case 'groups':        return renderGroups()
      case 'prayer':        return renderPrayer()
      case 'highlights':    return renderHighlights()
      default:              return renderHome()
    }
  }

  const currentNav = NAV_ITEMS.find(n => n.id === activeSection)

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-violet-900 via-purple-900 to-indigo-900 flex flex-col shadow-2xl
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">LETW Youth</p>
              <p className="text-purple-300 text-xs">Ministry Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-black text-white text-base shrink-0">
              BD
            </div>
            <div>
              <p className="text-white font-black text-sm">Brother David</p>
              <p className="text-purple-300 text-xs">Worship Team · Member</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-yellow-300' : ''}`} />
                {item.label}
                {item.id === 'tasks' && pendingTasks > 0 && (
                  <span className="ml-auto bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{pendingTasks}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-purple-400 text-xs text-center">LETW Youth Ministry · 2026</p>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm flex items-center gap-4 px-4 py-3.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            {currentNav && <currentNav.icon className="w-4 h-4 text-violet-600" />}
            <h1 className="font-black text-gray-800 text-base">{currentNav?.label || 'Dashboard'}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-black text-white text-xs">BD</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}

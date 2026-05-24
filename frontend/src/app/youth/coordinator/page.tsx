'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Home, Users, Bell, BarChart2, Calendar, MessageSquare,
  Crown, Menu, X, ChevronRight, Send, CheckCircle2, AlertCircle,
  Plus, Search, Phone, Mail, UserCheck, UserX, TrendingUp,
  Star, Shield, ArrowRight, Megaphone, Pin, Clock, MapPin,
  Heart, BookOpen, Award, Zap, Flag, Target, Eye, EyeOff,
  Download, RefreshCw, Filter
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────

interface Member {
  id: string; name: string; initials: string; age: number
  email: string; phone: string; group: string; active: boolean
  attendance: number; joinedDate: string; gender: 'M' | 'F'
}

interface Announcement {
  id: string; title: string; body: string; time: string; urgent: boolean; pinned: boolean; replies: number
}

interface Event {
  id: string; title: string; type: string; date: string; time: string
  venue: string; daysLeft: number; color: string; confirmed: number; total: number
}

// ─── Registered Youth Members ─────────────────────────────────────
// Only real registered members appear here — no fake data
const REGISTERED_MEMBERS: Member[] = []

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: '⚠️ Youth Friday Fellowship — This Week', body: 'Attendance is compulsory. Topic: Walking in Purpose. Come with your Bible and a heart to receive.', time: '2 hours ago', urgent: true, pinned: true, replies: 0 },
  { id: '2', title: 'Annual Youth Conference Registration Open', body: 'Register now for the Annual Youth Conference — June 27-28. Early bird slots are limited. Theme: Generation Arise.', time: '1 day ago', urgent: false, pinned: false, replies: 0 },
  { id: '3', title: 'Skill Development Workshop — Saturday', body: 'This Saturday, 10am - 2pm. Topics: Digital Skills, Career Planning & Financial Literacy. Venue: Conference Room B.', time: '2 days ago', urgent: false, pinned: false, replies: 0 },
]

const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Youth Friday Fellowship',    type: 'fellowship', date: 'Fri, 30 May', time: '6:00 PM', venue: 'Main Hall, LETW',  daysLeft: 6,  color: '#7c3aed', confirmed: 0, total: 0 },
  { id: '2', title: 'Youth Worship Night',        type: 'worship',    date: 'Sat, 7 Jun',  time: '5:00 PM', venue: 'Sanctuary',         daysLeft: 14, color: '#2563eb', confirmed: 0, total: 0 },
  { id: '3', title: 'Annual Youth Conference',    type: 'conference', date: 'Sat, 27 Jun', time: '9:00 AM', venue: 'Main Auditorium', daysLeft: 34, color: '#f5bb00', confirmed: 0, total: 0 },
]

const GROUPS = ['Leadership Track', 'Worship Team', 'Drama & Arts', 'Evangelism Team', 'Intercessors', 'Ushering', 'Media & Tech', 'Skilled Hands']

const NAV_ITEMS = [
  { id: 'home',      label: 'Overview',      icon: Home },
  { id: 'members',   label: 'Youth Members', icon: Users },
  { id: 'announce',  label: 'Announcements', icon: Megaphone },
  { id: 'events',    label: 'Events',        icon: Calendar },
  { id: 'attendance',label: 'Attendance',    icon: BarChart2 },
  { id: 'groups',    label: 'Groups',        icon: Shield },
  { id: 'inbox',     label: 'Member Inbox',  icon: MessageSquare },
]

// ─── Auth Gate ────────────────────────────────────────────────────

const COORDINATOR_CREDENTIALS = { username: 'youthcoord', password: 'LETW@Youth2026' }
const ADMIN_CREDENTIALS        = { username: 'admin',      password: 'LETW@Admin2026'  }

function LoginGate({ onLogin }: { onLogin: (role: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = () => {
    if ((username === COORDINATOR_CREDENTIALS.username && password === COORDINATOR_CREDENTIALS.password)) {
      onLogin('coordinator')
    } else if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      onLogin('admin')
    } else {
      setError('Invalid credentials. Contact the Admin for access.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#f5bb00] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-[#140152]" />
          </div>
          <h1 className="text-2xl font-black text-white">Youth Coordinator Portal</h1>
          <p className="text-white/60 mt-1">Light Encounter Tabernacle Worldwide</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
          <button onClick={handleLogin}
            className="w-full bg-[#140152] text-white py-3.5 rounded-xl font-black text-sm hover:bg-[#1a0270] transition-all">
            Access Coordinator Portal
          </button>
          <p className="text-center text-xs text-gray-400">Authorised personnel only · Contact Admin for credentials</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────

export default function YouthCoordinatorDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [role, setRole] = useState('')
  const [activeNav, setActiveNav] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>(REGISTERED_MEMBERS)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState('All')
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS)
  const [showNewAnnounce, setShowNewAnnounce] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newUrgent, setNewUrgent] = useState(false)
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 })

  // New member form
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', age: '', email: '', phone: '', group: '', gender: 'M' as 'M' | 'F' })

  useEffect(() => {
    const target = new Date('2026-06-27T09:00:00')
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now())
      setCountdown({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const activeCount = members.filter(m => m.active).length
  const avgAttendance = activeCount > 0 ? Math.round(members.filter(m => m.active).reduce((s, m) => s + m.attendance, 0) / activeCount) : 0

  const navigate = (id: string) => { setActiveNav(id); setSidebarOpen(false) }

  const addMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) return
    const initials = newMember.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    setMembers(prev => [...prev, {
      id: Date.now().toString(), name: newMember.name, initials, age: Number(newMember.age) || 0,
      email: newMember.email, phone: newMember.phone, group: newMember.group || 'Unassigned',
      active: true, attendance: 0, joinedDate: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      gender: newMember.gender,
    }])
    setNewMember({ name: '', age: '', email: '', phone: '', group: '', gender: 'M' })
    setShowAddMember(false)
  }

  const toggleActive = (id: string) => setMembers(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m))

  const postAnnouncement = () => {
    if (!newTitle.trim() || !newBody.trim()) return
    setAnnouncements(prev => [{ id: Date.now().toString(), title: newTitle, body: newBody, time: 'Just now', urgent: newUrgent, pinned: false, replies: 0 }, ...prev])
    setNewTitle(''); setNewBody(''); setNewUrgent(false); setShowNewAnnounce(false)
  }

  const filteredMembers = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase())
    const matchFilter = memberFilter === 'All' || m.group === memberFilter || (memberFilter === 'Active' && m.active) || (memberFilter === 'Inactive' && !m.active)
    return matchSearch && matchFilter
  })

  function CountBox({ v, l }: { v: number; l: string }) {
    return (
      <div className="flex flex-col items-center bg-white/15 rounded-xl px-3 py-2 min-w-[52px]">
        <span className="text-lg font-black text-white tabular-nums">{String(v).padStart(2, '0')}</span>
        <span className="text-[10px] text-white/60 uppercase tracking-wide">{l}</span>
      </div>
    )
  }

  if (!authenticated) return <LoginGate onLogin={(r) => { setAuthenticated(true); setRole(r) }} />

  const currentNav = NAV_ITEMS.find(n => n.id === activeNav)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:sticky top-0 left-0 h-full w-64 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #1e003d 0%, #3b0764 50%, #4c1d95 100%)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-9 h-9 bg-[#f5bb00] rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-[#140152]" />
          </div>
          <div>
            <div className="font-black text-sm tracking-widest text-white">YOUTH MINISTRY</div>
            <div className="text-[10px] text-[#f5bb00] font-bold uppercase tracking-widest">Coordinator Portal</div>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-white/60" /></button>
        </div>

        <div className="mx-4 my-4 p-3 bg-[#f5bb00]/10 border border-[#f5bb00]/30 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f5bb00] flex items-center justify-center font-black text-[#140152] text-sm flex-shrink-0">YC</div>
          <div className="min-w-0">
            <div className="font-black text-white text-sm truncate">Youth Coordinator</div>
            <div className="text-[#f5bb00]/70 text-xs capitalize">{role} · Full Access</div>
          </div>
          <div className="w-2 h-2 bg-[#f5bb00] rounded-full flex-shrink-0" />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === id ? 'bg-[#f5bb00] text-[#140152] font-black' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <Link href="/youth/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/10 hover:text-white transition-all">
            <Users className="w-4 h-4" /> Member View
          </Link>
          <Link href="/youth" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/10 hover:text-white transition-all">
            <ArrowRight className="w-4 h-4" /> Back to Youth
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            {currentNav && <currentNav.icon className="w-4 h-4 text-violet-700" />}
            <h1 className="font-black text-violet-900 text-base">{currentNav?.label}</h1>
            <span className="hidden sm:inline text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full ml-1 capitalize">{role} Access</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#f5bb00] flex items-center justify-center font-black text-[#140152] text-sm">YC</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* ── OVERVIEW ── */}
            {activeNav === 'home' && (
              <div className="space-y-6">
                <div className="relative bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-800 rounded-3xl p-6 overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-[#f5bb00]" />
                      <span className="text-[#f5bb00] text-xs font-bold uppercase tracking-widest">Youth Coordinator — Command View</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-1">Welcome, Coordinator!</h2>
                    <p className="text-white/60 text-sm mb-5">{today}</p>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => navigate('members')} className="flex items-center gap-2 bg-[#f5bb00] text-[#140152] px-4 py-2 rounded-xl font-black text-sm hover:opacity-90 transition-all">
                        <Users className="w-4 h-4" /> Youth Members ({activeCount})
                      </button>
                      <button onClick={() => { setShowNewAnnounce(true); navigate('announce') }} className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/20">
                        <Megaphone className="w-4 h-4" /> New Announcement
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Registered Youth', value: members.length, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Active Members', value: activeCount, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Avg Attendance', value: avgAttendance > 0 ? `${avgAttendance}%` : 'N/A', icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Ministry Groups', value: GROUPS.length, icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                      <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {members.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <Users className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h3 className="font-black text-amber-800 mb-2">No Youth Members Registered Yet</h3>
                    <p className="text-amber-700 text-sm mb-4">Start by adding youth members to this portal. Only registered members can access the youth dashboard.</p>
                    <button onClick={() => { setShowAddMember(true); navigate('members') }}
                      className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all">
                      Add First Member
                    </button>
                  </div>
                )}

                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-[#f5bb00]" />
                    <span className="text-white font-black text-sm uppercase tracking-wider">Annual Youth Conference</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <CountBox v={countdown.d} l="Days" />
                    <CountBox v={countdown.h} l="Hrs" />
                    <CountBox v={countdown.m} l="Mins" />
                    <CountBox v={countdown.s} l="Secs" />
                  </div>
                  <p className="text-white/60 text-xs mt-3">Sat 27 June · Main Auditorium · 9:00 AM</p>
                </div>
              </div>
            )}

            {/* ── MEMBERS ── */}
            {activeNav === 'members' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{activeCount} active · {members.filter(m => !m.active).length} inactive · {members.length} total</p>
                  <button onClick={() => setShowAddMember(!showAddMember)}
                    className="flex items-center gap-2 bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-violet-800 transition-all">
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                </div>

                {showAddMember && (
                  <div className="bg-white border border-violet-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-black text-violet-900 text-sm">Register New Youth Member</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                      <input value={newMember.age} onChange={e => setNewMember(p => ({ ...p, age: e.target.value }))} placeholder="Age" type="number" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                      <select value={newMember.gender} onChange={e => setNewMember(p => ({ ...p, gender: e.target.value as 'M' | 'F' }))} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                        <option value="M">Male</option><option value="F">Female</option>
                      </select>
                      <input value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} placeholder="Email *" type="email" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                      <input value={newMember.phone} onChange={e => setNewMember(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                      <select value={newMember.group} onChange={e => setNewMember(p => ({ ...p, group: e.target.value }))} className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                        <option value="">Select Group</option>
                        {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowAddMember(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                      <button onClick={addMember} disabled={!newMember.name.trim() || !newMember.email.trim()}
                        className="px-5 py-2 bg-violet-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-violet-800 transition-all">Register Member</button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap items-center">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members…" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                  </div>
                  {['All', 'Active', 'Inactive'].map(f => (
                    <button key={f} onClick={() => setMemberFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${memberFilter === f ? 'bg-violet-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-400'}`}>{f}</button>
                  ))}
                </div>

                {filteredMembers.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No members found</p>
                    <p className="text-sm mt-1">Use "Add Member" to register youth into the system</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMembers.map(m => (
                      <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${!m.active ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:shadow-md'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">{m.initials}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-gray-800 text-sm">{m.name}</span>
                              <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{m.group}</span>
                              {!m.active && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-400">Age {m.age} · {m.gender === 'M' ? 'Male' : 'Female'} · Since {m.joinedDate}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {m.phone && <a href={`tel:${m.phone}`} className="w-8 h-8 bg-gray-100 hover:bg-green-100 rounded-lg flex items-center justify-center transition-colors"><Phone className="w-3.5 h-3.5 text-gray-600" /></a>}
                            {m.email && <a href={`mailto:${m.email}`} className="w-8 h-8 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors"><Mail className="w-3.5 h-3.5 text-gray-600" /></a>}
                            <button onClick={() => toggleActive(m.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${m.active ? 'bg-gray-100 hover:bg-red-100' : 'bg-green-100 hover:bg-green-200'}`} title={m.active ? 'Deactivate' : 'Reactivate'}>
                              {m.active ? <UserX className="w-3.5 h-3.5 text-gray-600" /> : <UserCheck className="w-3.5 h-3.5 text-green-700" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ANNOUNCEMENTS ── */}
            {activeNav === 'announce' && (
              <div className="space-y-5">
                <button onClick={() => setShowNewAnnounce(!showNewAnnounce)}
                  className="w-full flex items-center gap-3 bg-violet-700 text-white rounded-2xl px-5 py-3.5 font-bold hover:bg-violet-800 transition-all">
                  <Plus className="w-5 h-5" /> New Announcement to All Youth
                </button>
                {showNewAnnounce && (
                  <div className="bg-white border border-violet-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="font-black text-violet-900 text-sm">Compose Announcement</h3>
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Announcement title…" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    <textarea rows={4} value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="Message to all youth members…" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div onClick={() => setNewUrgent(!newUrgent)} className={`w-10 h-5 rounded-full transition-colors relative ${newUrgent ? 'bg-red-500' : 'bg-gray-200'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${newUrgent ? 'left-5' : 'left-0.5'}`} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Mark as Urgent</span>
                      </label>
                      <div className="flex gap-2 ml-auto">
                        <button onClick={() => setShowNewAnnounce(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                        <button onClick={postAnnouncement} disabled={!newTitle.trim() || !newBody.trim()}
                          className="px-5 py-2 bg-violet-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-violet-800 transition-all flex items-center gap-2">
                          <Send className="w-4 h-4" /> Send to All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {announcements.map(a => (
                  <div key={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${a.urgent ? 'border-red-200' : 'border-gray-100'}`}>
                    {a.pinned && <div className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2"><Pin className="w-3 h-3" /> PINNED · URGENT</div>}
                    <div className="p-5">
                      <h3 className={`font-black text-base mb-2 ${a.urgent ? 'text-red-700' : 'text-violet-900'}`}>{a.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{a.body}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Youth Coordinator · {a.time}</span>
                        {a.replies > 0 && <span className="text-violet-600 font-bold">{a.replies} replies</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── EVENTS ── */}
            {activeNav === 'events' && (
              <div className="space-y-5">
                {MOCK_EVENTS.map(e => (
                  <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: e.color }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: e.color }}>{e.type}</span>
                          <h3 className="font-black text-violet-900 text-lg mt-2">{e.title}</h3>
                        </div>
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl text-white flex-shrink-0" style={{ backgroundColor: e.color }}>
                          <span className="text-2xl font-black leading-none">{e.daysLeft}</span>
                          <span className="text-[10px]">days</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{e.date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" />{e.time}</span>
                        <span className="flex items-center gap-1.5 col-span-2"><MapPin className="w-3.5 h-3.5 text-gray-400" />{e.venue}</span>
                      </div>
                      <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-600">Member confirmations</span>
                          <span className="text-xs font-black" style={{ color: e.color }}>{e.confirmed}/{activeCount || 0}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: activeCount > 0 ? `${(e.confirmed / activeCount) * 100}%` : '0%', backgroundColor: e.color }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ATTENDANCE ── */}
            {activeNav === 'attendance' && (
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-violet-800 to-indigo-800 rounded-3xl p-6 text-white">
                  <p className="text-white/60 text-sm mb-1">Overall Youth Attendance</p>
                  <div className="text-5xl font-black text-[#f5bb00] mb-2">{avgAttendance > 0 ? `${avgAttendance}%` : '—'}</div>
                  <p className="text-white/70 text-sm">Across {activeCount} active members</p>
                  <div className="mt-4 h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#f5bb00] rounded-full" style={{ width: `${avgAttendance}%` }} />
                  </div>
                </div>
                {members.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No members registered yet</p>
                    <p className="text-sm mt-1">Add youth members to start tracking attendance</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50"><h3 className="font-black text-gray-800 text-sm">Individual Attendance</h3></div>
                    {[...members].filter(m => m.active).sort((a, b) => b.attendance - a.attendance).map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{m.initials}</div>
                        <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{m.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${m.attendance}%`, backgroundColor: m.attendance >= 80 ? '#16a34a' : m.attendance >= 60 ? '#f5bb00' : '#ef4444' }} />
                          </div>
                          <span className={`text-xs font-black w-8 text-right ${m.attendance >= 80 ? 'text-green-600' : m.attendance >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{m.attendance}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── GROUPS ── */}
            {activeNav === 'groups' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Youth ministry groups — members are assigned during registration.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {GROUPS.map(g => {
                    const groupMembers = members.filter(m => m.group === g && m.active)
                    return (
                      <div key={g} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-black text-violet-900">{g}</h3>
                          <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">{groupMembers.length} members</span>
                        </div>
                        {groupMembers.length === 0 ? (
                          <p className="text-xs text-gray-400">No members assigned to this group yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {groupMembers.map(m => (
                              <div key={m.id} className="flex items-center gap-1.5 bg-violet-50 rounded-lg px-2.5 py-1">
                                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white text-[8px] font-black">{m.initials}</div>
                                <span className="text-xs font-semibold text-violet-800">{m.name.split(' ')[0]}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── INBOX ── */}
            {activeNav === 'inbox' && (
              <div className="space-y-4">
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 text-center">
                  <MessageSquare className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                  <h3 className="font-black text-violet-800 mb-1">Member Replies</h3>
                  <p className="text-violet-600 text-sm">When youth members reply to announcements, their messages will appear here. Start by sending an announcement to all youth.</p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}

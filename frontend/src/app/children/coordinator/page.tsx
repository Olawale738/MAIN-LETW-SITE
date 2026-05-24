'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Home, Users, Bell, Calendar, BarChart2, MessageSquare, Heart,
  Shield, Baby, Star, Award, TrendingUp, Phone, Mail, Eye, EyeOff,
  PlusCircle, Search, Filter, CheckCircle2, X, Menu, Send,
  UserCheck, Lock, AlertCircle, ChevronRight, Loader2, RefreshCw,
  Crown, Gift, Cake, Camera, Package, Globe, BookOpen, Clock,
  MapPin, AlertTriangle, CheckSquare, Zap, FileText, Palette
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────────── */
interface Child {
  id: string
  name: string
  initials: string
  age: number
  ageGroup: 'Nursery' | 'Toddlers' | 'Primary' | 'Juniors'
  gender: 'Male' | 'Female'
  email: string
  phone: string           // guardian's phone
  guardian: string
  allergies: string
  medicalNotes: string
  active: boolean
  joinedDate: string
  attendance: number      // percentage
}

interface Announcement {
  id: string
  title: string
  body: string
  time: string
  forParents: boolean
  urgent: boolean
}

interface Message {
  id: string
  from: string
  subject: string
  body: string
  time: string
  read: boolean
}

/* ─── Auth Constants ─────────────────────────────────────────────── */
const COORDINATOR_CREDENTIALS = { username: 'childcoord', password: 'LETW@Children2026' }
const ADMIN_CREDENTIALS       = { username: 'admin',      password: 'LETW@Admin2026'    }

/* ─── Empty member list (no fake data) ──────────────────────────── */
const REGISTERED_CHILDREN: Child[] = []

/* ─── Nav Items ─────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',       label: 'Overview',        icon: Home        },
  { id: 'children',       label: 'Children',         icon: Baby        },
  { id: 'volunteers',     label: 'Volunteers',       icon: UserCheck   },
  { id: 'announcements',  label: 'Announcements',    icon: Bell        },
  { id: 'events',         label: 'Events',           icon: Calendar    },
  { id: 'attendance',     label: 'Attendance',       icon: BarChart2   },
  { id: 'groups',         label: 'Age Groups',       icon: Users       },
  { id: 'inbox',          label: 'Inbox',            icon: MessageSquare },
]

const AGE_GROUP_COLORS: Record<string, string> = {
  Nursery:  'bg-pink-100   text-pink-700',
  Toddlers: 'bg-orange-100 text-orange-700',
  Primary:  'bg-blue-100   text-blue-700',
  Juniors:  'bg-purple-100 text-purple-700',
}

const AGE_GROUP_BG: Record<string, string> = {
  Nursery:  '#fce7f3',
  Toddlers: '#ffedd5',
  Primary:  '#dbeafe',
  Juniors:  '#ede9fe',
}

const AGE_GROUPS = [
  { name: 'Nursery',  range: 'Ages 0–2',   color: '#ec4899', description: 'Infant & nursery care during service', icon: '👶' },
  { name: 'Toddlers', range: 'Ages 3–5',   color: '#f97316', description: 'Play-based learning, songs & crafts',    icon: '🌟' },
  { name: 'Primary',  range: 'Ages 6–9',   color: '#3b82f6', description: 'Bible stories, memorisation & crafts',   icon: '📖' },
  { name: 'Juniors',  range: 'Ages 10–12', color: '#8b5cf6', description: 'In-depth lessons & leadership skills',   icon: '🏆' },
]

/* ─── Login Gate ─────────────────────────────────────────────────── */
function LoginGate({ onLogin }: { onLogin: (role: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      setLoading(false)
      if (username === COORDINATOR_CREDENTIALS.username && password === COORDINATOR_CREDENTIALS.password) {
        onLogin('coordinator')
      } else if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        onLogin('admin')
      } else {
        setError('Invalid credentials. Access restricted.')
      }
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #134e4a 0%, #065f46 50%, #14532d 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 pt-10 pb-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center">Children's Ministry</h1>
            <p className="text-sm text-gray-500 mt-1 text-center">Coordinator Portal</p>
            <span className="mt-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Authorised Access Only
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your username" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'} required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
              style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Children's member?{' '}
            <Link href="/children/dashboard" className="text-emerald-600 font-semibold hover:underline">Go to Member Dashboard</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function ChildrenCoordinatorDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [role, setRole] = useState('')
  const [activeNav, setActiveNav] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* Members state */
  const [children, setChildren] = useState<Child[]>(REGISTERED_CHILDREN)
  const [childSearch, setChildSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('All')
  const [showAddForm, setShowAddForm] = useState(false)

  /* Add-child form */
  const [newChild, setNewChild] = useState({
    name: '', age: '', ageGroup: 'Primary' as Child['ageGroup'],
    gender: 'Male' as Child['gender'],
    guardian: '', phone: '', email: '',
    allergies: '', medicalNotes: '',
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  /* Announcements */
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [annTitle,  setAnnTitle]  = useState('')
  const [annBody,   setAnnBody]   = useState('')
  const [annParent, setAnnParent] = useState(false)
  const [annUrgent, setAnnUrgent] = useState(false)

  /* Inbox */
  const [messages, setMessages] = useState<Message[]>([])
  const [replyTo,  setReplyTo]  = useState<string | null>(null)
  const [replyTxt, setReplyTxt] = useState('')

  /* Countdown to Children's Day */
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  useEffect(() => {
    const target = new Date('2026-06-14T10:00:00')
    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) return
      setCountdown({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000)  / 60000),
        secs:  Math.floor((diff % 60000)    / 1000),
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  /* ── Derived stats ── */
  const totalChildren   = children.length
  const activeChildren  = children.filter(c => c.active).length
  const nurseryCt  = children.filter(c => c.ageGroup === 'Nursery').length
  const toddlerCt  = children.filter(c => c.ageGroup === 'Toddlers').length
  const primaryCt  = children.filter(c => c.ageGroup === 'Primary').length
  const juniorsCt  = children.filter(c => c.ageGroup === 'Juniors').length

  const filteredChildren = children.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(childSearch.toLowerCase()) ||
                        c.guardian.toLowerCase().includes(childSearch.toLowerCase())
    const matchAge = ageFilter === 'All' || c.ageGroup === ageFilter
    return matchSearch && matchAge
  })

  /* ── Add Child ── */
  function handleAddChild(e: React.FormEvent) {
    e.preventDefault()
    if (!newChild.name.trim() || !newChild.age.trim() || !newChild.guardian.trim()) return
    setAddLoading(true)
    setTimeout(() => {
      const initials = newChild.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      const child: Child = {
        id:          Date.now().toString(),
        name:        newChild.name.trim(),
        initials,
        age:         parseInt(newChild.age),
        ageGroup:    newChild.ageGroup,
        gender:      newChild.gender,
        guardian:    newChild.guardian.trim(),
        phone:       newChild.phone.trim(),
        email:       newChild.email.trim(),
        allergies:   newChild.allergies.trim(),
        medicalNotes: newChild.medicalNotes.trim(),
        active:      true,
        joinedDate:  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        attendance:  0,
      }
      setChildren(prev => [child, ...prev])
      setNewChild({ name: '', age: '', ageGroup: 'Primary', gender: 'Male', guardian: '', phone: '', email: '', allergies: '', medicalNotes: '' })
      setAddLoading(false)
      setAddSuccess(true)
      setTimeout(() => { setAddSuccess(false); setShowAddForm(false) }, 2000)
    }, 800)
  }

  /* ── Toggle active ── */
  function toggleActive(id: string) {
    setChildren(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c))
  }

  /* ── Post announcement ── */
  function postAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!annTitle.trim() || !annBody.trim()) return
    const ann: Announcement = {
      id: Date.now().toString(), title: annTitle.trim(), body: annBody.trim(),
      time: 'Just now', forParents: annParent, urgent: annUrgent,
    }
    setAnnouncements(prev => [ann, ...prev])
    setAnnTitle(''); setAnnBody(''); setAnnParent(false); setAnnUrgent(false)
  }

  /* ── Send reply ── */
  function sendReply(msgId: string) {
    if (!replyTxt.trim()) return
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, read: true } : m))
    setReplyTo(null); setReplyTxt('')
  }

  if (!authenticated) {
    return <LoginGate onLogin={(r) => { setAuthenticated(true); setRole(r) }} />
  }

  /* ════════════════ DASHBOARD ════════════════ */
  return (
    <div className="min-h-screen flex" style={{ background: '#f0fdf4' }}>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {(sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed lg:relative z-40 h-full w-64 flex flex-col shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #134e4a 0%, #065f46 60%, #14532d 100%)' }}>

            {/* Logo */}
            <div className="px-6 pt-8 pb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Children's Ministry</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#a7f3d0' }}>
                  {role === 'admin' ? '★ Admin' : 'Coordinator'}
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon
                const active = activeNav === item.id
                return (
                  <button key={item.id} onClick={() => { setActiveNav(item.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? 'text-white shadow-lg' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                    style={active ? { background: 'rgba(255,255,255,0.2)' } : {}}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                    {item.id === 'inbox' && messages.filter(m => !m.read).length > 0 && (
                      <span className="ml-auto text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        {messages.filter(m => !m.read).length}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Footer links */}
            <div className="px-4 py-6 space-y-2 border-t border-white/10 mt-4">
              <Link href="/children/dashboard"
                className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
                <Globe className="w-3.5 h-3.5" /> Member View
              </Link>
              <Link href="/children"
                className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
                <ChevronRight className="w-3.5 h-3.5" /> Back to Children's Page
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-sm">
              {NAV_ITEMS.find(n => n.id === activeNav)?.label}
            </h2>
            <p className="text-xs text-gray-400">Children's Ministry Coordinator Portal · LETW</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
              {role === 'admin' ? 'A' : 'C'}
            </div>
            <span className="text-xs font-semibold text-gray-700 hidden sm:block capitalize">{role}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">

          {/* ────── OVERVIEW ────── */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Children',  value: totalChildren,  color: '#10b981', icon: Baby    },
                  { label: 'Active',           value: activeChildren, color: '#3b82f6', icon: CheckCircle2 },
                  { label: 'Announcements',    value: announcements.length, color: '#f59e0b', icon: Bell },
                  { label: 'Age Groups',       value: 4,             color: '#8b5cf6', icon: Users   },
                ].map(stat => {
                  const Icon = stat.icon
                  return (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: stat.color + '18' }}>
                          <Icon className="w-5 h-5" style={{ color: stat.color }} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Countdown + Age breakdown */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Countdown */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-pink-500" /> Countdown to Children's Day (June 14)
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Days',  value: countdown.days  },
                      { label: 'Hours', value: countdown.hours },
                      { label: 'Mins',  value: countdown.mins  },
                      { label: 'Secs',  value: countdown.secs  },
                    ].map(u => (
                      <div key={u.label} className="text-center bg-emerald-50 rounded-xl py-3">
                        <p className="text-2xl font-bold text-emerald-700">{String(u.value).padStart(2, '0')}</p>
                        <p className="text-xs text-emerald-500 font-medium">{u.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Age group breakdown */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-600" /> Children by Age Group
                  </p>
                  {AGE_GROUPS.map(grp => {
                    const ct = children.filter(c => c.ageGroup === grp.name).length
                    const pct = totalChildren > 0 ? Math.round((ct / totalChildren) * 100) : 0
                    return (
                      <div key={grp.name} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                          <span>{grp.icon} {grp.name} <span className="text-gray-400">({grp.range})</span></span>
                          <span>{ct}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: grp.color }} />
                        </div>
                      </div>
                    )
                  })}
                  {totalChildren === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No children registered yet. Add children in the Children tab.</p>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Add Child',       onClick: () => { setActiveNav('children'); setShowAddForm(true) },  color: '#10b981', icon: PlusCircle },
                    { label: 'Post Notice',      onClick: () => setActiveNav('announcements'), color: '#3b82f6', icon: Bell       },
                    { label: 'View Attendance',  onClick: () => setActiveNav('attendance'),    color: '#f59e0b', icon: BarChart2  },
                    { label: 'Age Groups',       onClick: () => setActiveNav('groups'),        color: '#8b5cf6', icon: Users     },
                  ].map(a => {
                    const Icon = a.icon
                    return (
                      <button key={a.label} onClick={a.onClick}
                        className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-current transition-all text-sm font-medium"
                        style={{ color: a.color }}>
                        <Icon className="w-5 h-5" />
                        {a.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ────── CHILDREN ────── */}
          {activeNav === 'children' && (
            <div className="space-y-5">
              {/* Add child button */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{filteredChildren.length} child{filteredChildren.length !== 1 ? 'ren' : ''} shown</p>
                <button onClick={() => setShowAddForm(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
                  <PlusCircle className="w-4 h-4" />
                  {showAddForm ? 'Cancel' : 'Add Child'}
                </button>
              </div>

              {/* Add form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form onSubmit={handleAddChild}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Baby className="w-4 h-4 text-emerald-600" /> Register a Child
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Child's Full Name *</label>
                        <input required value={newChild.name} onChange={e => setNewChild(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
                          placeholder="e.g. Amaka Okonkwo" />
                      </div>
                      {/* Age */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Age *</label>
                        <input required type="number" min="0" max="12" value={newChild.age}
                          onChange={e => setNewChild(p => ({ ...p, age: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
                          placeholder="0–12" />
                      </div>
                      {/* Age Group */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Age Group *</label>
                        <select value={newChild.ageGroup} onChange={e => setNewChild(p => ({ ...p, ageGroup: e.target.value as Child['ageGroup'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400">
                          <option>Nursery</option>
                          <option>Toddlers</option>
                          <option>Primary</option>
                          <option>Juniors</option>
                        </select>
                      </div>
                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                        <select value={newChild.gender} onChange={e => setNewChild(p => ({ ...p, gender: e.target.value as Child['gender'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400">
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>
                      {/* Guardian */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Guardian Name *</label>
                        <input required value={newChild.guardian} onChange={e => setNewChild(p => ({ ...p, guardian: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
                          placeholder="e.g. Mrs. Okonkwo" />
                      </div>
                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Guardian Phone</label>
                        <input value={newChild.phone} onChange={e => setNewChild(p => ({ ...p, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
                          placeholder="08XX-XXX-XXXX" />
                      </div>
                      {/* Email */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Guardian Email</label>
                        <input type="email" value={newChild.email} onChange={e => setNewChild(p => ({ ...p, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
                          placeholder="guardian@email.com" />
                      </div>
                      {/* Allergies */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Allergies</label>
                        <input value={newChild.allergies} onChange={e => setNewChild(p => ({ ...p, allergies: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
                          placeholder="e.g. Peanuts, Dairy" />
                      </div>
                      {/* Medical Notes */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Medical Notes</label>
                        <input value={newChild.medicalNotes} onChange={e => setNewChild(p => ({ ...p, medicalNotes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
                          placeholder="e.g. Asthma — has inhaler" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={addLoading}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
                        style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
                        {addLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : <><PlusCircle className="w-4 h-4" /> Register Child</>}
                      </button>
                      {addSuccess && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Child registered successfully!
                        </span>
                      )}
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Search + filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input value={childSearch} onChange={e => setChildSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400"
                    placeholder="Search by child name or guardian…" />
                </div>
                <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400">
                  <option value="All">All Groups</option>
                  <option>Nursery</option>
                  <option>Toddlers</option>
                  <option>Primary</option>
                  <option>Juniors</option>
                </select>
              </div>

              {/* Children list */}
              {filteredChildren.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-1">No children registered yet</p>
                  <p className="text-sm text-gray-400">Use the "Add Child" button to register children in the ministry.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredChildren.map(child => (
                    <motion.div key={child.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: AGE_GROUP_BG[child.ageGroup] ? undefined : '#10b981',
                            backgroundColor: AGE_GROUP_BG[child.ageGroup] }}>
                          <span style={{ color: child.ageGroup === 'Nursery' ? '#be185d' : child.ageGroup === 'Toddlers' ? '#c2410c' : child.ageGroup === 'Primary' ? '#1d4ed8' : '#6d28d9' }}>
                            {child.initials}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{child.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AGE_GROUP_COLORS[child.ageGroup]}`}>
                              {child.ageGroup}
                            </span>
                            <span className="text-xs text-gray-400">Age {child.age}</span>
                            {!child.active && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                            <span>👤 {child.guardian}</span>
                            {child.phone && <span>📞 {child.phone}</span>}
                            {child.allergies && <span className="text-orange-600">⚠ {child.allergies}</span>}
                            {child.medicalNotes && <span className="text-red-600">🏥 {child.medicalNotes}</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Joined: {child.joinedDate}</p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {child.phone && (
                            <a href={`tel:${child.phone}`}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                              <Phone className="w-3 h-3" /> Call
                            </a>
                          )}
                          {child.email && (
                            <a href={`mailto:${child.email}`}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                              <Mail className="w-3 h-3" /> Email
                            </a>
                          )}
                          <button onClick={() => toggleActive(child.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              child.active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}>
                            {child.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ────── VOLUNTEERS ────── */}
          {activeNav === 'volunteers' && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">Volunteer Management</p>
              <p className="text-sm text-gray-400">Register teachers, helpers, and substitutes here. This feature is ready to populate once volunteers are on-boarded.</p>
            </div>
          )}

          {/* ────── ANNOUNCEMENTS ────── */}
          {activeNav === 'announcements' && (
            <div className="space-y-5">
              {/* Compose form */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" /> Post an Announcement
                </h3>
                <form onSubmit={postAnnouncement} className="space-y-3">
                  <input required value={annTitle} onChange={e => setAnnTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400"
                    placeholder="Announcement title…" />
                  <textarea required value={annBody} onChange={e => setAnnBody(e.target.value)} rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 resize-none"
                    placeholder="Write your announcement here…" />
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={annParent} onChange={e => setAnnParent(e.target.checked)} className="rounded" />
                      For Parents
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={annUrgent} onChange={e => setAnnUrgent(e.target.checked)} className="rounded" />
                      Mark Urgent
                    </label>
                    <button type="submit"
                      className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
                      <Send className="w-4 h-4" /> Post
                    </button>
                  </div>
                </form>
              </div>

              {/* List */}
              {announcements.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No announcements yet. Post one above.</p>
                </div>
              ) : (
                announcements.map(ann => (
                  <motion.div key={ann.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl p-5 shadow-sm border ${ann.urgent ? 'border-red-200' : 'border-gray-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${ann.urgent ? 'bg-red-500' : 'bg-emerald-400'}`} />
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{ann.title}</p>
                          {ann.urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Urgent</span>}
                          {ann.forParents && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">For Parents</span>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ann.body}</p>
                        <p className="text-xs text-gray-400">{ann.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ────── EVENTS ────── */}
          {activeNav === 'events' && (
            <div className="space-y-4">
              {[
                { title: "Children's Day Celebration", date: 'Saturday, June 14, 2026', time: '10:00 AM', venue: 'Main Hall', color: '#ec4899', days: 21 },
                { title: "Sunday Children's Church",   date: 'Every Sunday',            time: '9:00 AM',  venue: "Children's Hall", color: '#10b981', days: 7  },
                { title: 'Vacation Bible School (VBS)', date: 'July 7–11, 2026',         time: '9:00 AM',  venue: 'Church Campus',   color: '#f59e0b', days: 44 },
              ].map(ev => (
                <div key={ev.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                    style={{ background: ev.color }}>
                    {ev.days}d
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{ev.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ev.date} · {ev.time}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {ev.venue}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: ev.color + '18', color: ev.color }}>
                    {ev.days} days
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ────── ATTENDANCE ────── */}
          {activeNav === 'attendance' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" /> Attendance Overview
                </h3>
                {children.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No children registered yet. Attendance will appear here once children are added.</p>
                  </div>
                ) : (
                  children.map(child => (
                    <div key={child.id} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: AGE_GROUP_BG[child.ageGroup], color: '#065f46' }}>
                            {child.initials}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{child.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${AGE_GROUP_COLORS[child.ageGroup]}`}>{child.ageGroup}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{child.attendance}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all"
                          style={{ width: `${child.attendance}%`, background: child.attendance >= 80 ? '#10b981' : child.attendance >= 60 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ────── AGE GROUPS ────── */}
          {activeNav === 'groups' && (
            <div className="grid sm:grid-cols-2 gap-5">
              {AGE_GROUPS.map(grp => {
                const ct = children.filter(c => c.ageGroup === grp.name).length
                return (
                  <div key={grp.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: grp.color + '18' }}>
                        {grp.icon}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{grp.name}</p>
                        <p className="text-xs text-gray-500">{grp.range}</p>
                      </div>
                      <span className="ml-auto text-2xl font-bold" style={{ color: grp.color }}>{ct}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{grp.description}</p>
                    <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                      {ct === 0
                        ? 'No children registered in this group yet.'
                        : `${ct} child${ct > 1 ? 'ren' : ''} in this group`}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ────── INBOX ────── */}
          {activeNav === 'inbox' && (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-1">No messages yet</p>
                  <p className="text-sm text-gray-400">Messages from parents and guardians will appear here.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`bg-white rounded-2xl p-5 shadow-sm border ${!msg.read ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-gray-900">{msg.from}</p>
                          {!msg.read && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </div>
                        <p className="text-xs font-medium text-gray-600 mb-1">{msg.subject}</p>
                        <p className="text-sm text-gray-600">{msg.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
                      </div>
                      <button onClick={() => setReplyTo(replyTo === msg.id ? null : msg.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex-shrink-0">
                        <Send className="w-3 h-3" /> Reply
                      </button>
                    </div>
                    <AnimatePresence>
                      {replyTo === msg.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-gray-200">
                          <textarea value={replyTxt} onChange={e => setReplyTxt(e.target.value)}
                            rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-emerald-400"
                            placeholder={`Reply to ${msg.from}…`} />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => sendReply(msg.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                              style={{ background: 'linear-gradient(135deg, #10b981, #065f46)' }}>
                              <Send className="w-3 h-3" /> Send Reply
                            </button>
                            <button onClick={() => setReplyTo(null)}
                              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200">
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

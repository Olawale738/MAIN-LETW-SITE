'use client'

/**
 * VolunteerDeptDashboard — Robust shared dashboard for volunteer departments.
 * Drives: Media & Creative · Hospitality · Ushering & Welcome · Security & Safety
 *
 * Features: animated home, notice search/read-tracking, activity RSVP,
 * attendance progress ring + streak, team tab, emoji chat reactions, coordinator panel.
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Bell, Calendar, BarChart2, MessageSquare, Users,
  LogOut, Loader2, AlertCircle, Send, UserPlus, UserMinus,
  Clock, CheckCircle2, X, Crown, Plus, Trash2, Search,
  ChevronRight, Star, Check, Minus, Smile, Filter,
  TrendingUp, Zap, MapPin, CalendarPlus, RefreshCw,
  ChevronDown, ChevronUp, Award, Flame,
} from 'lucide-react'
import {
  getCurrentUser, checkMembership, joinDepartment,
  listAnnouncements, listActivities, myAttendance,
  getDeptMessages, sendDeptMessage,
  listMembers, addMember, removeMember,
  createAnnouncement, deleteAnnouncement,
  createActivity, deleteActivity,
  recordSessionAttendance,
  type DeptUser, type MembershipStatus, type DeptAnnouncement,
  type DeptActivity, type MyAttendanceRow, type DeptMessage, type DeptMember,
} from '@/lib/dept-api'
import type { Department } from '@/lib/dept-api'

// ── Config ────────────────────────────────────────────────────────────────────

export interface DeptConfig {
  dept: Department
  name: string
  nameShort: string
  emoji: string
  tagline: string
  primary: string
  accent: string
  gradientTo: string
  bg: string
  Icon: React.ElementType
  activityTypes: string[]
  loginRedirect: string
  memberLabel: string
  coordinatorLabel: string
  chatPlaceholder: string
  responsibilities: string[]
  quickLinks?: { label: string; href: string }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}
function fmtTime(t?: string | null) { return t ? t.slice(0, 5) : '' }
function daysUntil(iso?: string | null) {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  const d = Math.ceil(diff / 86400000)
  if (d < 0) return null
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  return `${d} days`
}
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const EMOJI_REACTIONS = ['👍', '❤️', '🙏', '🔥', '😂']

type Tab = 'home' | 'notices' | 'activities' | 'attendance' | 'team' | 'chat'
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'home',       label: 'Home',       icon: Home          },
  { id: 'notices',    label: 'Notices',    icon: Bell          },
  { id: 'activities', label: 'Activities', icon: Calendar      },
  { id: 'attendance', label: 'Attendance', icon: BarChart2     },
  { id: 'team',       label: 'Team',       icon: Users         },
  { id: 'chat',       label: 'Chat',       icon: MessageSquare },
]

// Circular SVG progress ring
function RingProgress({ pct, size = 80, stroke = 7, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }} />
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VolunteerDeptDashboard({ cfg }: { cfg: DeptConfig }) {
  const { dept, name, nameShort, emoji, tagline, primary, accent, gradientTo, bg,
          Icon, activityTypes, loginRedirect, memberLabel, coordinatorLabel,
          chatPlaceholder, responsibilities, quickLinks } = cfg
  const router = useRouter()

  /* ── Auth ── */
  const [user, setUser]                   = useState<DeptUser | null>(null)
  const [authLoading, setAuthLoading]     = useState(true)
  const [membership, setMembership]       = useState<MembershipStatus | null>(null)
  const [isCoordinator, setIsCoordinator] = useState(false)
  const [joining, setJoining]             = useState(false)

  /* ── Navigation ── */
  const [tab, setTab] = useState<Tab>('home')

  /* ── Data ── */
  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities, setActivities]       = useState<DeptActivity[]>([])
  const [attendance, setAttendance]       = useState<MyAttendanceRow[]>([])
  const [messages, setMessages]           = useState<DeptMessage[]>([])
  const [members, setMembers]             = useState<DeptMember[]>([])
  const [loadingData, setLoadingData]     = useState(false)

  /* ── Notice state ── */
  const [noticeSearch, setNoticeSearch]   = useState('')
  const [noticeFilter, setNoticeFilter]   = useState<'all' | 'urgent' | 'pinned'>('all')
  const [readIds, setReadIds]             = useState<Set<string>>(new Set())

  /* ── Activity state ── */
  const [actFilter, setActFilter]         = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [rsvpIds, setRsvpIds]             = useState<Set<string>>(new Set())

  /* ── Chat state ── */
  const [chatInput, setChatInput]         = useState('')
  const [sending, setSending]             = useState(false)
  const [unreadChat, setUnreadChat]       = useState(0)
  const [reactions, setReactions]         = useState<Record<string, Record<string, number>>>({}) // msgId → emoji → count
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const lastMsgId     = useRef<string>('')

  /* ── UI state ── */
  const [showSignOut, setShowSignOut]     = useState(false)
  const [refreshing, setRefreshing]       = useState(false)

  /* ── Coordinator forms ── */
  const [showAnnForm, setShowAnnForm]     = useState(false)
  const [annTitle, setAnnTitle]           = useState('')
  const [annBody, setAnnBody]             = useState('')
  const [annUrgent, setAnnUrgent]         = useState(false)
  const [annPinned, setAnnPinned]         = useState(false)
  const [annPosting, setAnnPosting]       = useState(false)

  const [showActForm, setShowActForm]     = useState(false)
  const [actTitle, setActTitle]           = useState('')
  const [actDesc, setActDesc]             = useState('')
  const [actType, setActType]             = useState(activityTypes[0] ?? 'meeting')
  const [actDate, setActDate]             = useState('')
  const [actTime, setActTime]             = useState('')
  const [actVenue, setActVenue]           = useState('')
  const [actAdding, setActAdding]         = useState(false)

  const [showAddMember, setShowAddMember] = useState(false)
  const [addEmail, setAddEmail]           = useState('')
  const [addLabel, setAddLabel]           = useState('')
  const [addingMember, setAddingMember]   = useState(false)

  const [showSessionForm, setShowSessionForm] = useState(false)
  const [sessLabel, setSessLabel]             = useState('')
  const [sessDate, setSessDate]               = useState('')
  const [sessMarks, setSessMarks]             = useState<Record<string, boolean>>({})
  const [sessRecording, setSessRecording]     = useState(false)

  /* ── Persist RSVP / read / reactions in localStorage ── */
  const LS_KEY = `dept_${dept}`
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
      if (stored.readIds)  setReadIds(new Set(stored.readIds))
      if (stored.rsvpIds)  setRsvpIds(new Set(stored.rsvpIds))
      if (stored.reactions) setReactions(stored.reactions)
    } catch { /* ignore */ }
  }, [LS_KEY])

  const persist = useCallback((updates: { readIds?: Set<string>; rsvpIds?: Set<string>; reactions?: Record<string, Record<string, number>> }) => {
    try {
      const current = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
      const merged = {
        ...current,
        ...(updates.readIds   ? { readIds:   [...updates.readIds]  } : {}),
        ...(updates.rsvpIds   ? { rsvpIds:   [...updates.rsvpIds]  } : {}),
        ...(updates.reactions ? { reactions: updates.reactions      } : {}),
      }
      localStorage.setItem(LS_KEY, JSON.stringify(merged))
    } catch { /* ignore */ }
  }, [LS_KEY])

  /* ─── Auth ─── */
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) { router.replace(`/auth/login?next=${loginRedirect}`); return }
    getCurrentUser()
      .then(async u => {
        setUser(u)
        setIsCoordinator(u.role === 'admin')
        const mem = await checkMembership(dept)
        setMembership(mem)
      })
      .catch(() => router.replace(`/auth/login?next=${loginRedirect}`))
      .finally(() => setAuthLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Load data ─── */
  const loadData = useCallback(async () => {
    setLoadingData(true)
    await Promise.allSettled([
      listAnnouncements(dept).then(setAnnouncements),
      listActivities(dept).then(setActivities),
      myAttendance(dept).then(setAttendance),
      listMembers(dept).then(setMembers).catch(() => {}),
      getDeptMessages(dept).then(msgs => {
        setMessages(msgs)
        if (msgs.length) lastMsgId.current = msgs[msgs.length - 1].id
      }),
    ])
    setLoadingData(false)
  }, [dept])

  useEffect(() => {
    if (!membership?.is_member || !membership?.is_active) return
    loadData()
  }, [membership?.is_active, loadData])

  /* ─── Chat polling ─── */
  const pollChat = useCallback(async () => {
    try {
      const msgs = await getDeptMessages(dept)
      if (!msgs.length) return
      const newest = msgs[msgs.length - 1].id
      if (newest === lastMsgId.current) return
      const newCount = msgs.filter(m => m.id > lastMsgId.current).length
      setMessages(msgs)
      if (tab !== 'chat') setUnreadChat(p => p + newCount)
      lastMsgId.current = newest
      if (tab === 'chat') setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    } catch { /* silent */ }
  }, [dept, tab])

  useEffect(() => {
    if (!membership?.is_active) return
    const id = setInterval(pollChat, 4000)
    return () => clearInterval(id)
  }, [membership?.is_active, pollChat])

  useEffect(() => {
    if (tab === 'chat') { setUnreadChat(0); setTimeout(() => chatBottomRef.current?.scrollIntoView(), 100) }
  }, [tab])

  /* ─── Derived ─── */
  const today        = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const firstName    = user?.name.split(' ')[0] || ''
  const userInitials = user ? getInitials(user.name) : '?'
  const upcoming     = useMemo(() => activities.filter(a => a.activity_date && new Date(a.activity_date) >= new Date()), [activities])
  const past         = useMemo(() => activities.filter(a => !a.activity_date || new Date(a.activity_date) < new Date()), [activities])
  const attended     = attendance.filter(r => r.present).length
  const sessTotal    = attendance.length
  const attPct       = sessTotal ? Math.round((attended / sessTotal) * 100) : 0
  const nextEvent    = upcoming[0]
  const unreadCount  = announcements.filter(a => !readIds.has(a.id)).length

  // Streak: consecutive present from most recent
  const streak = useMemo(() => {
    const sorted = [...attendance].sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
    let s = 0
    for (const r of sorted) { if (r.present) s++; else break }
    return s
  }, [attendance])

  const filteredNotices = useMemo(() => {
    let list = announcements
    if (noticeFilter === 'urgent') list = list.filter(a => a.is_urgent)
    if (noticeFilter === 'pinned') list = list.filter(a => a.is_pinned)
    if (noticeSearch.trim()) list = list.filter(a => a.title.toLowerCase().includes(noticeSearch.toLowerCase()) || a.body.toLowerCase().includes(noticeSearch.toLowerCase()))
    return list
  }, [announcements, noticeFilter, noticeSearch])

  const filteredActivities = useMemo(() => {
    if (actFilter === 'upcoming') return upcoming
    if (actFilter === 'past')     return past
    return activities
  }, [actFilter, activities, upcoming, past])

  /* ─── Actions ─── */
  const handleJoin = async () => {
    setJoining(true)
    try { await joinDepartment(dept); const mem = await checkMembership(dept); setMembership(mem) }
    catch (e: unknown) { alert((e as Error).message) }
    finally { setJoining(false) }
  }

  const signOut = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); router.replace('/auth/login') }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const markRead = (id: string) => {
    const next = new Set([...readIds, id])
    setReadIds(next); persist({ readIds: next })
  }

  const toggleRsvp = (id: string) => {
    const next = new Set(rsvpIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setRsvpIds(next); persist({ rsvpIds: next })
  }

  const addReaction = (msgId: string, emoji: string) => {
    setReactions(prev => {
      const updated = { ...prev, [msgId]: { ...(prev[msgId] ?? {}), [emoji]: ((prev[msgId] ?? {})[emoji] ?? 0) + 1 } }
      persist({ reactions: updated }); return updated
    })
    setShowEmojiPicker(null)
  }

  const postAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim() || annPosting) return
    setAnnPosting(true)
    try {
      await createAnnouncement(dept, { title: annTitle.trim(), body: annBody.trim(), is_urgent: annUrgent, is_pinned: annPinned })
      setAnnouncements(await listAnnouncements(dept))
      setAnnTitle(''); setAnnBody(''); setAnnUrgent(false); setAnnPinned(false); setShowAnnForm(false)
    } catch (e: unknown) { alert((e as Error).message) }
    finally { setAnnPosting(false) }
  }

  const delAnn = async (id: string) => {
    if (!confirm('Delete?')) return
    try { await deleteAnnouncement(dept, id); setAnnouncements(p => p.filter(a => a.id !== id)) }
    catch (e: unknown) { alert((e as Error).message) }
  }

  const addActivity = async () => {
    if (!actTitle.trim() || actAdding) return
    setActAdding(true)
    try {
      await createActivity(dept, { title: actTitle.trim(), description: actDesc.trim() || undefined, activity_type: actType, activity_date: actDate || undefined, activity_time: actTime || undefined, venue: actVenue.trim() || undefined })
      setActivities(await listActivities(dept))
      setActTitle(''); setActDesc(''); setActDate(''); setActTime(''); setActVenue(''); setActType(activityTypes[0] ?? 'meeting'); setShowActForm(false)
    } catch (e: unknown) { alert((e as Error).message) }
    finally { setActAdding(false) }
  }

  const delActivity = async (id: string) => {
    if (!confirm('Delete?')) return
    try { await deleteActivity(dept, id); setActivities(p => p.filter(a => a.id !== id)) }
    catch (e: unknown) { alert((e as Error).message) }
  }

  const doAddMember = async () => {
    if (!addEmail.trim() || addingMember) return
    setAddingMember(true)
    try { await addMember(dept, addEmail.trim(), addLabel.trim() || undefined); setMembers(await listMembers(dept)); setAddEmail(''); setAddLabel(''); setShowAddMember(false) }
    catch (e: unknown) { alert((e as Error).message) }
    finally { setAddingMember(false) }
  }

  const doRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from ${name}?`)) return
    try { await removeMember(dept, memberId); setMembers(p => p.filter(m => m.id !== memberId)) }
    catch (e: unknown) { alert((e as Error).message) }
  }

  const openSessionForm = async () => {
    try {
      const mems = await listMembers(dept); setMembers(mems)
      const marks: Record<string, boolean> = {}; mems.forEach(m => { marks[m.user_id] = false })
      setSessMarks(marks); setSessLabel(''); setSessDate(new Date().toISOString().split('T')[0]); setShowSessionForm(true)
    } catch (e: unknown) { alert('Could not load members: ' + (e as Error).message) }
  }

  const submitSession = async () => {
    if (!sessLabel.trim() || !sessDate || sessRecording) return
    setSessRecording(true)
    try {
      await recordSessionAttendance(dept, sessLabel.trim(), sessDate, Object.entries(sessMarks).map(([user_id, present]) => ({ user_id, present })))
      setShowSessionForm(false); setAttendance(await myAttendance(dept))
    } catch (e: unknown) { alert((e as Error).message) }
    finally { setSessRecording(false) }
  }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text || sending || !user) return
    setSending(true)
    const optimistic: DeptMessage = { id: `tmp-${Date.now()}`, user_id: user.id, sender_name: user.name, content: text, created_at: new Date().toISOString(), is_mine: true }
    setMessages(p => [...p, optimistic]); setChatInput('')
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    try { await sendDeptMessage(dept, text); const msgs = await getDeptMessages(dept); setMessages(msgs); if (msgs.length) lastMsgId.current = msgs[msgs.length - 1].id }
    catch { /* keep optimistic */ }
    finally { setSending(false) }
  }

  const gcalLink = (a: DeptActivity) => {
    if (!a.activity_date) return null
    const start = a.activity_date.replace(/-/g, '') + (a.activity_time ? 'T' + a.activity_time.replace(':', '') + '00' : '')
    return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(a.title)}&dates=${start}/${start}&details=${encodeURIComponent(a.description || '')}&location=${encodeURIComponent(a.venue || '')}`
  }

  /* ─── Loading screens ─── */
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
          style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
          <span className="text-4xl">{emoji}</span>
        </motion.div>
        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: primary }} />
        <p className="text-sm mt-3 font-semibold" style={{ color: primary + '80' }}>Loading {name}…</p>
      </div>
    </div>
  )

  if (!membership && !isCoordinator) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: primary }} />
    </div>
  )

  /* Not a member */
  if (!isCoordinator && !membership?.is_member) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: bg }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm w-full">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
          style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
          <span className="text-4xl">{emoji}</span>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: primary }}>{name}</h2>
        <p className="text-sm font-medium italic mb-2" style={{ color: primary + '90' }}>"{tagline}"</p>
        <p className="text-gray-500 text-sm text-center mb-8">Join the team to access notices, events, attendance records, and the group chat.</p>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 text-left">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your responsibilities</p>
          <ul className="space-y-2">
            {responsibilities.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primary }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <motion.button onClick={handleJoin} disabled={joining} whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base disabled:opacity-60 shadow-lg"
          style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
          {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {joining ? 'Joining…' : `Join ${name}`}
        </motion.button>
      </motion.div>
    </div>
  )

  /* Pending */
  if (!isCoordinator && membership?.is_member && !membership?.is_active) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: bg }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-amber-100">
        <div className="px-8 py-7 text-center" style={{ background: `linear-gradient(135deg,${accent}18,${accent}06)` }}>
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: `${accent}25` }}>
            <Clock className="w-8 h-8" style={{ color: accent }} />
          </div>
          <h2 className="font-black text-xl mb-2 text-amber-800">Application Pending</h2>
          <p className="text-amber-700 text-sm leading-relaxed">Your request to join <strong>{name}</strong> is awaiting admin approval. You&apos;ll gain full access once approved.</p>
        </div>
        <div className="px-8 py-5 text-center bg-amber-50/60">
          <p className="text-xs text-amber-600 font-semibold">Signed in as <strong>{user?.name}</strong></p>
          <button onClick={signOut} className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">Sign out</button>
        </div>
      </motion.div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════
     FULL DASHBOARD
  ═══════════════════════════════════════════════════════ */

  const roleLabel = isCoordinator ? (user?.role === 'admin' ? 'Admin' : coordinatorLabel) : memberLabel

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: bg }}>

      {/* ── Sign-out overlay ── */}
      <AnimatePresence>
        {showSignOut && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowSignOut(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-xs shadow-2xl text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-black text-lg mb-1" style={{ color: primary }}>Sign Out?</h3>
              <p className="text-gray-400 text-sm mb-6">You&apos;ll need to sign in again to access your dashboard.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOut(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-600">Cancel</button>
                <button onClick={signOut} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold">Sign Out</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session attendance bottom sheet ── */}
      <AnimatePresence>
        {showSessionForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-end backdrop-blur-sm"
            onClick={() => setShowSessionForm(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="bg-white w-full rounded-t-3xl max-h-[88vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                <h3 className="font-black text-base" style={{ color: primary }}>Record Attendance</h3>
                <button onClick={() => setShowSessionForm(false)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-wide">Session Label *</label>
                  <input value={sessLabel} onChange={e => setSessLabel(e.target.value)} placeholder="e.g. Sunday Service — 1 Jun"
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-violet-300 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-wide">Date *</label>
                  <input type="date" value={sessDate} onChange={e => setSessDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-violet-300 transition-colors" />
                </div>
                {members.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { const a: Record<string,boolean> = {}; members.forEach(m => { a[m.user_id] = true }); setSessMarks(a) }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200">
                        <Check className="w-3.5 h-3.5" /> All Present
                      </button>
                      <button onClick={() => { const a: Record<string,boolean> = {}; members.forEach(m => { a[m.user_id] = false }); setSessMarks(a) }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">
                        <Minus className="w-3.5 h-3.5" /> All Absent
                      </button>
                      <span className="ml-auto text-xs font-bold" style={{ color: primary }}>
                        {Object.values(sessMarks).filter(Boolean).length} / {members.length} present
                      </span>
                    </div>
                    <div className="space-y-2">
                      {members.map(m => (
                        <button key={m.user_id} onClick={() => setSessMarks(p => ({ ...p, [m.user_id]: !p[m.user_id] }))}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${sessMarks[m.user_id] ? 'border-green-300 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: primary }}>
                            {getInitials(m.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-gray-800">{m.name}</span>
                            {m.role_label && <p className="text-[10px] text-gray-400">{m.role_label}</p>}
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${sessMarks[m.user_id] ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                            {sessMarks[m.user_id] && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <button onClick={submitSession} disabled={!sessLabel.trim() || !sessDate || sessRecording}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
                  {sessRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {sessRecording ? 'Saving…' : 'Save Attendance'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ HEADER ════ */}
      <header className="flex-shrink-0 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${primary} 0%,${gradientTo} 100%)` }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10" style={{ background: accent }} />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-10" style={{ background: 'white' }} />

        <div className="relative z-10 flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md text-xl"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm tracking-wide leading-tight">{nameShort}</p>
            <p className="text-white/50 text-[10px] truncate">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <RefreshCw className={`w-3.5 h-3.5 text-white/70 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowSignOut(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white ring-2 ring-white/20 hover:ring-white/50 transition-all flex-shrink-0"
              style={{ background: `${accent}cc` }} title="Sign out">
              {userInitials}
            </button>
          </div>
        </div>

        {/* User status card */}
        <div className="relative z-10 mx-4 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ background: accent }}>
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-sm truncate">{user?.name}</p>
              {isCoordinator && (
                <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: accent, color: '#78350f' }}>
                  <Crown className="w-2.5 h-2.5" /> Coordinator
                </span>
              )}
            </div>
            <p className="text-white/50 text-[10px]">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/50 text-[10px]">Active</span>
          </div>
        </div>
      </header>

      {/* ════ CONTENT ════ */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ─────────────── HOME ─────────────── */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="p-4 space-y-4 pb-28">

              {/* Welcome hero */}
              <div className="relative rounded-3xl overflow-hidden p-6"
                style={{ background: `linear-gradient(135deg,${primary} 0%,${gradientTo} 100%)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none flex items-center justify-center text-7xl">{emoji}</div>
                <p className="text-white/70 text-xs font-medium mb-0.5">{greeting()},</p>
                <h2 className="text-white font-black text-2xl mb-1">{firstName}! 👋</h2>
                <p className="text-white/60 text-xs italic mb-4">"{tagline}"</p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setTab('notices')}
                    className="flex items-center gap-1.5 bg-white/95 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-white transition-all" style={{ color: primary }}>
                    <Bell className="w-3.5 h-3.5" />
                    Notices
                    {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5">{unreadCount}</span>}
                  </button>
                  <button onClick={() => setTab('chat')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs text-white hover:opacity-80 transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                    {unreadChat > 0 && <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5">{unreadChat}</span>}
                  </button>
                </div>
              </div>

              {/* Coordinator panel */}
              {isCoordinator && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="rounded-3xl overflow-hidden shadow-lg"
                  style={{ background: `linear-gradient(135deg,${accent} 0%,#f97316 100%)` }}>
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.28)' }}>
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">Coordinator Panel</p>
                        <p className="text-white/70 text-[10px]">Manage your team</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Post Notice',     icon: Bell,      action: () => { setTab('notices');    setTimeout(() => setShowAnnForm(true), 120) } },
                        { label: 'Add Activity',    icon: Calendar,  action: () => { setTab('activities'); setTimeout(() => setShowActForm(true), 120) } },
                        { label: 'Take Attendance', icon: BarChart2, action: openSessionForm },
                        { label: 'Add Member',      icon: UserPlus,  action: () => { setTab('team');       setTimeout(() => setShowAddMember(true), 120) } },
                      ].map((a, i) => (
                        <motion.button key={i} onClick={a.action} whileTap={{ scale: 0.96 }}
                          className="flex items-center gap-2 p-3 rounded-2xl text-left hover:opacity-90 transition-all"
                          style={{ background: 'rgba(255,255,255,0.25)' }}>
                          <a.icon className="w-4 h-4 text-white flex-shrink-0" />
                          <span className="text-[11px] font-bold text-white leading-tight">{a.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-3 flex gap-4 justify-between" style={{ background: 'rgba(0,0,0,0.10)' }}>
                    {[
                      { val: announcements.length, label: 'Notices'  },
                      { val: activities.length,    label: 'Events'   },
                      { val: sessTotal,            label: 'Sessions' },
                      { val: members.length,       label: 'Members'  },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <p className="font-black text-white text-lg leading-none">{s.val || '—'}</p>
                        <p className="text-white/60 text-[9px] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {/* Attendance ring */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm border border-gray-100">
                  <div className="relative flex items-center justify-center">
                    <RingProgress pct={attPct} size={56} stroke={5} color={primary} />
                    <span className="absolute font-black text-xs" style={{ color: primary }}>{sessTotal ? `${attPct}%` : '—'}</span>
                  </div>
                  <p className="text-gray-400 text-[10px] text-center">Attendance</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }}
                  className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-black text-xl" style={{ color: primary }}>{streak}</span>
                  </div>
                  <p className="text-gray-400 text-[10px] text-center">Streak</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.14 }}
                  className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="font-black text-xl" style={{ color: primary }}>{upcoming.length}</span>
                  </div>
                  <p className="text-gray-400 text-[10px] text-center">Upcoming</p>
                </motion.div>
              </div>

              {/* Next event countdown */}
              {nextEvent && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  onClick={() => setTab('activities')}
                  className="w-full text-left bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-1" style={{ background: `linear-gradient(90deg,${primary},${gradientTo})` }} />
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-black shadow-sm"
                      style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
                      {nextEvent.activity_date ? new Date(nextEvent.activity_date).getDate() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white capitalize" style={{ background: primary }}>{nextEvent.activity_type}</span>
                        {daysUntil(nextEvent.activity_date) && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{daysUntil(nextEvent.activity_date)}</span>
                        )}
                      </div>
                      <p className="font-black text-sm text-gray-800 truncate">{nextEvent.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {fmtDate(nextEvent.activity_date)}
                        {nextEvent.activity_time ? ` · ${fmtTime(nextEvent.activity_time)}` : ''}
                        {nextEvent.venue ? ` · ${nextEvent.venue}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </motion.button>
              )}

              {/* Responsibilities */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-gray-50">
                  <Award className="w-4 h-4" style={{ color: primary }} />
                  <h3 className="font-black text-sm" style={{ color: primary }}>Your Responsibilities</h3>
                </div>
                <div className="px-5 py-4 space-y-2.5">
                  {responsibilities.map((r, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                      className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${primary}18` }}>
                        <span className="text-[9px] font-black" style={{ color: primary }}>{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{r}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Quick links */}
              {quickLinks && quickLinks.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                  {quickLinks.map((l, i) => (
                    <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{l.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-all" style={{ color: primary }} />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─────────────── NOTICES ─────────────── */}
          {tab === 'notices' && (
            <motion.div key="notices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="p-4 space-y-4 pb-28">

              {/* Header + search */}
              <div className="flex items-center justify-between">
                <h2 className="font-black text-xl" style={{ color: primary }}>Notices</h2>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">{unreadCount} unread</span>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={noticeSearch} onChange={e => setNoticeSearch(e.target.value)}
                  placeholder="Search notices…"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-100 rounded-2xl text-sm focus:outline-none transition-colors"
                  style={{ '--tw-ring-color': primary } as React.CSSProperties}
                  onFocus={e => e.currentTarget.style.borderColor = primary}
                  onBlur={e => e.currentTarget.style.borderColor = '#f3f4f6'} />
              </div>

              {/* Filter chips */}
              <div className="flex gap-2">
                {(['all', 'urgent', 'pinned'] as const).map(f => (
                  <button key={f} onClick={() => setNoticeFilter(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${noticeFilter === f ? 'text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'}`}
                    style={noticeFilter === f ? { background: primary } : {}}>
                    {f === 'all' ? `All (${announcements.length})` : f === 'urgent' ? `🔴 Urgent` : '📌 Pinned'}
                  </button>
                ))}
              </div>

              {/* Post form */}
              {isCoordinator && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowAnnForm(p => !p)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}25` }}>
                      <Plus className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left" style={{ color: primary }}>Post New Notice</span>
                    {showAnnForm ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {showAnnForm && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
                          <div className="pt-3"><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Title *</label>
                            <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Notice title"
                              className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none transition-colors" /></div>
                          <div><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Body *</label>
                            <textarea value={annBody} onChange={e => setAnnBody(e.target.value)} rows={3} placeholder="Write your notice…"
                              className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none resize-none" /></div>
                          <div className="flex gap-5">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={annUrgent} onChange={e => setAnnUrgent(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-xs font-bold text-red-600">🔴 Urgent</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={annPinned} onChange={e => setAnnPinned(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-xs font-bold text-amber-600">📌 Pin</span></label>
                          </div>
                          <button onClick={postAnnouncement} disabled={!annTitle.trim() || !annBody.trim() || annPosting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-md"
                            style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
                            {annPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                            {annPosting ? 'Posting…' : 'Post Notice'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {loadingData
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: primary }} /></div>
                : filteredNotices.length === 0
                  ? <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center">
                      <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: primary }} />
                      <p className="font-bold text-gray-400">{noticeSearch ? 'No notices match your search' : 'No notices yet'}</p>
                    </div>
                  : <div className="space-y-3">
                      {filteredNotices.map(a => (
                        <motion.div key={a.id} layout onClick={() => markRead(a.id)}
                          className={`bg-white rounded-3xl border-l-4 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all ${a.is_urgent ? 'border-red-500' : a.is_pinned ? 'border-amber-400' : 'border-gray-200'}`}>
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  {!readIds.has(a.id) && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" title="Unread" />}
                                  {a.is_urgent && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600"><AlertCircle className="w-3 h-3" /> Urgent</span>}
                                  {a.is_pinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📌 Pinned</span>}
                                </div>
                                <h3 className="font-black text-base text-gray-800">{a.title}</h3>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.body}</p>
                                <p className="text-[10px] text-gray-400 mt-2">{a.author_name || name} · {fmtDate(a.created_at)}</p>
                              </div>
                              {isCoordinator && (
                                <button onClick={e => { e.stopPropagation(); delAnn(a.id) }}
                                  className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>}
            </motion.div>
          )}

          {/* ─────────────── ACTIVITIES ─────────────── */}
          {tab === 'activities' && (
            <motion.div key="activities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="p-4 space-y-4 pb-28">

              <div className="flex items-center justify-between">
                <h2 className="font-black text-xl" style={{ color: primary }}>Activities</h2>
                <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-0.5 shadow-sm">
                  {(['upcoming', 'all', 'past'] as const).map(f => (
                    <button key={f} onClick={() => setActFilter(f)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${actFilter === f ? 'text-white shadow-sm' : 'text-gray-400'}`}
                      style={actFilter === f ? { background: primary } : {}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {isCoordinator && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowActForm(p => !p)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}25` }}>
                      <Plus className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left" style={{ color: primary }}>Add Activity</span>
                    {showActForm ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {showActForm && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
                          <div className="pt-3"><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Title *</label>
                            <input value={actTitle} onChange={e => setActTitle(e.target.value)} placeholder="Activity title" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          <div><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Description</label>
                            <textarea value={actDesc} onChange={e => setActDesc(e.target.value)} rows={2} placeholder="Brief description…" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none resize-none" /></div>
                          <div><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Type</label>
                            <select value={actType} onChange={e => setActType(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none bg-white">
                              {activityTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ')}</option>)}
                            </select></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Date</label><input type="date" value={actDate} onChange={e => setActDate(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                            <div><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Time</label><input type="time" value={actTime} onChange={e => setActTime(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          </div>
                          <div><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Venue</label>
                            <input value={actVenue} onChange={e => setActVenue(e.target.value)} placeholder="e.g. Main Sanctuary" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          <button onClick={addActivity} disabled={!actTitle.trim() || actAdding}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-md"
                            style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
                            {actAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                            {actAdding ? 'Adding…' : 'Add Activity'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {loadingData
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: primary }} /></div>
                : filteredActivities.length === 0
                  ? <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: primary }} />
                      <p className="font-bold text-gray-400">No {actFilter === 'all' ? '' : actFilter} activities</p>
                    </div>
                  : <div className="space-y-3">
                      {filteredActivities.map(a => {
                        const rsvped = rsvpIds.has(a.id)
                        const cal = gcalLink(a)
                        return (
                          <motion.div key={a.id} layout className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                            <div className="h-1" style={{ background: `linear-gradient(90deg,${primary},${gradientTo})` }} />
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white capitalize" style={{ background: primary }}>
                                      {a.activity_type.replace(/-/g, ' ')}
                                    </span>
                                    {daysUntil(a.activity_date) && (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{daysUntil(a.activity_date)}</span>
                                    )}
                                  </div>
                                  <h3 className="font-black text-base text-gray-800">{a.title}</h3>
                                  {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {a.activity_date && <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl"><Calendar className="w-3 h-3" />{fmtDate(a.activity_date)}</span>}
                                    {a.activity_time && <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl"><Clock className="w-3 h-3" />{fmtTime(a.activity_time)}</span>}
                                    {a.venue && <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl"><MapPin className="w-3 h-3" />{a.venue}</span>}
                                  </div>
                                  {/* RSVP + Calendar actions */}
                                  <div className="flex gap-2 mt-3">
                                    <button onClick={() => toggleRsvp(a.id)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${rsvped ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                      style={rsvped ? { background: primary } : {}}>
                                      <Check className="w-3.5 h-3.5" /> {rsvped ? "I'm going ✓" : 'RSVP'}
                                    </button>
                                    {cal && (
                                      <a href={cal} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                                        <CalendarPlus className="w-3.5 h-3.5" /> Add to Calendar
                                      </a>
                                    )}
                                  </div>
                                </div>
                                {isCoordinator && (
                                  <button onClick={() => delActivity(a.id)} className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>}
            </motion.div>
          )}

          {/* ─────────────── ATTENDANCE ─────────────── */}
          {tab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="p-4 space-y-4 pb-28">

              <div className="flex items-center justify-between">
                <h2 className="font-black text-xl" style={{ color: primary }}>{isCoordinator ? 'Attendance' : 'My Attendance'}</h2>
                {isCoordinator && (
                  <button onClick={openSessionForm} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90"
                    style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
                    <Plus className="w-3.5 h-3.5" /> Record Session
                  </button>
                )}
              </div>

              {/* Big ring + stats */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <RingProgress pct={attPct} size={100} stroke={8} color={primary} />
                  <div className="absolute text-center">
                    <p className="font-black text-2xl leading-none" style={{ color: primary }}>{sessTotal ? `${attPct}%` : '—'}</p>
                    <p className="text-[9px] text-gray-400">Rate</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {[
                    { label: 'Sessions', val: sessTotal, icon: Calendar,    color: primary },
                    { label: 'Present',  val: attended,  icon: CheckCircle2, color: '#059669' },
                    { label: 'Streak 🔥', val: streak,   icon: Flame,       color: '#f97316' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <s.icon className="w-4 h-4 flex-shrink-0" style={{ color: s.color }} />
                        <span className="text-sm text-gray-600">{s.label}</span>
                      </div>
                      <span className="font-black text-base" style={{ color: s.color }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak motivation */}
              {streak >= 3 && (
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
                  <span className="text-2xl">🔥</span>
                  <p className="text-sm font-bold text-orange-700">
                    {streak >= 10 ? `Incredible! ${streak}-session streak. You're unstoppable!` :
                     streak >= 5  ? `${streak}-session streak! Keep the fire going!` :
                                    `Nice! ${streak} sessions in a row. You're building momentum!`}
                  </p>
                </div>
              )}
              {attPct === 100 && sessTotal >= 3 && (
                <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
                  <Award className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-yellow-700">Perfect attendance! You haven't missed a single session. Amazing.</p>
                </div>
              )}

              {loadingData
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: primary }} /></div>
                : attendance.length === 0
                  ? <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center">
                      <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: primary }} />
                      <p className="font-bold text-gray-400">No attendance records yet</p>
                    </div>
                  : <div className="space-y-2">
                      {[...attendance].sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()).map((row, i) => (
                        <motion.div key={i} layout className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: row.present ? `${primary}15` : '#f9fafb' }}>
                            {row.present ? <CheckCircle2 className="w-4 h-4" style={{ color: primary }} /> : <X className="w-4 h-4 text-gray-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 truncate">{row.session_label || 'Session'}</p>
                            <p className="text-[10px] text-gray-400">{fmtDate(row.session_date)}</p>
                          </div>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${row.present ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {row.present ? '✓ Present' : '✗ Absent'}
                          </span>
                        </motion.div>
                      ))}
                    </div>}
            </motion.div>
          )}

          {/* ─────────────── TEAM ─────────────── */}
          {tab === 'team' && (
            <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="p-4 space-y-4 pb-28">

              <div className="flex items-center justify-between">
                <h2 className="font-black text-xl" style={{ color: primary }}>Team</h2>
                <div className="text-right">
                  <p className="text-xl font-black" style={{ color: primary }}>{members.length}</p>
                  <p className="text-[10px] text-gray-400">members</p>
                </div>
              </div>

              {isCoordinator && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowAddMember(p => !p)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}25` }}>
                      <UserPlus className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left" style={{ color: primary }}>Add Member</span>
                    {showAddMember ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {showAddMember && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
                          <div className="pt-3"><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Member Email *</label>
                            <input value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="member@example.com" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          <div><label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wide">Role Label</label>
                            <input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="e.g. Team Lead, Sub-lead…" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          <button onClick={doAddMember} disabled={!addEmail.trim() || addingMember}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-md"
                            style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
                            {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {addingMember ? 'Adding…' : `Add to ${name}`}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {loadingData
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: primary }} /></div>
                : members.length === 0
                  ? <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: primary }} />
                      <p className="font-bold text-gray-400">No team members yet</p>
                      {isCoordinator && <p className="text-xs text-gray-400 mt-1">Add members using the form above</p>}
                    </div>
                  : <div className="space-y-2">
                      {members.map((m, i) => (
                        <motion.div key={m.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0 shadow-sm"
                            style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
                            {getInitials(m.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 truncate">{m.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {m.role_label && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: primary }}>{m.role_label}</span>}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {m.is_active ? '✓ Active' : '⌛ Pending'}
                              </span>
                            </div>
                          </div>
                          {isCoordinator && (
                            <button onClick={() => doRemoveMember(m.id, m.name)}
                              className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0">
                              <UserMinus className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>}
            </motion.div>
          )}

          {/* ─────────────── CHAT ─────────────── */}
          {tab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="flex flex-col pb-[68px]" style={{ height: 'calc(100vh - 148px)' }}>

              <div className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: primary }}>
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm" style={{ color: primary }}>{name} Chat</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-400">{members.length || messages.length} members · Live</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] text-gray-400 bg-white rounded-full px-3 py-1 border border-gray-100 font-semibold">Today</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-10" style={{ color: primary }} />
                    <p className="text-gray-400 text-sm font-semibold">No messages yet</p>
                    <p className="text-gray-300 text-xs mt-1">Be the first to say hi! 👋</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMine = msg.is_mine
                  const prev = messages[i - 1]
                  const showSender = !prev || prev.user_id !== msg.user_id
                  const msgTime = new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                  const msgReactions = reactions[msg.id] ?? {}
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mb-1"
                        style={{ background: showSender ? primary : 'transparent', opacity: showSender ? 1 : 0 }}>
                        {showSender ? getInitials(msg.sender_name) : ''}
                      </div>
                      <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {showSender && !isMine && <p className="text-xs font-bold text-gray-600 mb-1 ml-1">{msg.sender_name}</p>}
                        <div className="relative">
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMine ? 'rounded-br-sm text-white' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}
                            style={isMine ? { background: `linear-gradient(135deg,${primary},${gradientTo})` } : undefined}>
                            {msg.content}
                          </div>
                          {/* Emoji reactions display */}
                          {Object.keys(msgReactions).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              {Object.entries(msgReactions).map(([e, c]) => (
                                <span key={e} className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs shadow-sm">
                                  {e} {c > 1 && <span className="text-gray-500 text-[10px] font-bold">{c}</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[9px] text-gray-400 px-1">{msgTime}</span>
                          {/* React button - shows on hover */}
                          <div className="relative">
                            <button onClick={() => setShowEmojiPicker(p => p === msg.id ? null : msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full">
                              <Smile className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            {showEmojiPicker === msg.id && (
                              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                className={`absolute bottom-6 ${isMine ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-2xl shadow-xl px-2 py-2 flex gap-1 z-10`}
                                onClick={e => e.stopPropagation()}>
                                {EMOJI_REACTIONS.map(e => (
                                  <button key={e} onClick={() => addReaction(msg.id, e)}
                                    className="text-lg hover:scale-125 transition-transform p-1 rounded-xl hover:bg-gray-50">{e}</button>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatBottomRef} />
              </div>

              <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2.5 transition-all focus-within:bg-white focus-within:border-opacity-100"
                  style={{ '--focus-color': primary } as React.CSSProperties}
                  onFocusCapture={e => (e.currentTarget.style.borderColor = primary)}
                  onBlurCapture={e => (e.currentTarget.style.borderColor = '#f3f4f6')}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                    placeholder={chatPlaceholder}
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent" />
                  <motion.button onClick={sendChat} disabled={!chatInput.trim() || sending} whileTap={{ scale: 0.92 }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-30 flex-shrink-0 shadow-md transition-all"
                    style={{ background: chatInput.trim() ? `linear-gradient(135deg,${primary},${gradientTo})` : '#d1d5db' }}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ════ BOTTOM TAB BAR ════ */}
      <nav className="flex-shrink-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex">
          {TABS.map(t => {
            const active = tab === t.id
            const badge = t.id === 'chat' ? unreadChat : t.id === 'notices' ? unreadCount : 0
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-all">
                {active && (
                  <motion.div layoutId={`tab-${dept}`}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: primary }} />
                )}
                <div className="relative">
                  <t.icon className="w-5 h-5 transition-colors" style={{ color: active ? primary : '#9ca3af' }} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-black leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold transition-colors" style={{ color: active ? primary : '#9ca3af' }}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

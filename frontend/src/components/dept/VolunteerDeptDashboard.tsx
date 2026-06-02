'use client'

/**
 * Shared dashboard shell for volunteer departments:
 * Media & Creative, Hospitality, Ushering & Welcome, Security & Safety.
 *
 * Pass a DeptConfig object — the component handles all logic/UI.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Bell, Calendar, BarChart2, MessageSquare,
  LogOut, Loader2, AlertCircle, Send, UserPlus,
  Clock, CheckCircle2, X, Crown, Plus, Trash2,
  ChevronRight, Star, Check, Minus,
} from 'lucide-react'
import {
  getCurrentUser, checkMembership, joinDepartment,
  listAnnouncements, listActivities, myAttendance,
  getDeptMessages, sendDeptMessage,
  listMembers, addMember,
  createAnnouncement, deleteAnnouncement,
  createActivity, deleteActivity,
  recordSessionAttendance,
  type DeptUser, type MembershipStatus, type DeptAnnouncement,
  type DeptActivity, type MyAttendanceRow, type DeptMessage, type DeptMember,
} from '@/lib/dept-api'
import type { Department } from '@/lib/dept-api'

// ── Config interface ──────────────────────────────────────────────────────────

export interface DeptConfig {
  dept: Department
  name: string           // "Media & Creative"
  nameShort: string      // "MEDIA & CREATIVE"
  primary: string        // hex, e.g. '#7c3aed'
  accent: string         // hex, e.g. '#f59e0b'
  gradientTo: string     // hex for right side of gradient
  bg: string             // light page bg hex
  Icon: React.ElementType
  activityTypes: string[]
  loginRedirect: string  // e.g. '/services/media'
  memberLabel: string    // e.g. 'Media Volunteer'
  coordinatorLabel: string // e.g. 'Media Coordinator'
  chatPlaceholder: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}
function fmtTime(t?: string) { return t ? t.slice(0, 5) : '' }

type Tab = 'home' | 'notices' | 'activities' | 'attendance' | 'chat'
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'home',       label: 'Home',       icon: Home          },
  { id: 'notices',    label: 'Notices',    icon: Bell          },
  { id: 'activities', label: 'Activities', icon: Calendar      },
  { id: 'attendance', label: 'Attendance', icon: BarChart2     },
  { id: 'chat',       label: 'Chat',       icon: MessageSquare },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function VolunteerDeptDashboard({ cfg }: { cfg: DeptConfig }) {
  const { dept, name, nameShort, primary, accent, gradientTo, bg, Icon,
          activityTypes, loginRedirect, memberLabel, coordinatorLabel, chatPlaceholder } = cfg
  const router = useRouter()

  /* ── Auth / membership ── */
  const [user, setUser]               = useState<DeptUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [membership, setMembership]   = useState<MembershipStatus | null>(null)
  const [isCoordinator, setIsCoordinator] = useState(false)
  const [joining, setJoining]         = useState(false)

  /* ── Navigation ── */
  const [tab, setTab] = useState<Tab>('home')

  /* ── Data ── */
  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities, setActivities]       = useState<DeptActivity[]>([])
  const [attendance, setAttendance]       = useState<MyAttendanceRow[]>([])
  const [messages, setMessages]           = useState<DeptMessage[]>([])
  const [allMembers, setAllMembers]       = useState<DeptMember[]>([])
  const [loadingData, setLoadingData]     = useState(false)

  /* ── Chat ── */
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending]     = useState(false)
  const [unreadChat, setUnreadChat] = useState(0)
  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const lastMsgId     = useRef<string>('')

  /* ── UI ── */
  const [showSignOut, setShowSignOut] = useState(false)

  /* ── Coordinator: Announcement form ── */
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annTitle, setAnnTitle]       = useState('')
  const [annBody, setAnnBody]         = useState('')
  const [annUrgent, setAnnUrgent]     = useState(false)
  const [annPinned, setAnnPinned]     = useState(false)
  const [annPosting, setAnnPosting]   = useState(false)

  /* ── Coordinator: Activity form ── */
  const [showActForm, setShowActForm] = useState(false)
  const [actTitle, setActTitle]       = useState('')
  const [actDesc, setActDesc]         = useState('')
  const [actType, setActType]         = useState(activityTypes[0] ?? 'meeting')
  const [actDate, setActDate]         = useState('')
  const [actTime, setActTime]         = useState('')
  const [actVenue, setActVenue]       = useState('')
  const [actAdding, setActAdding]     = useState(false)

  /* ── Coordinator: Add Member ── */
  const [showAddMember, setShowAddMember] = useState(false)
  const [addEmail, setAddEmail]           = useState('')
  const [addLabel, setAddLabel]           = useState('')
  const [addingMember, setAddingMember]   = useState(false)

  /* ── Coordinator: Attendance session ── */
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [sessLabel, setSessLabel]             = useState('')
  const [sessDate, setSessDate]               = useState('')
  const [sessMarks, setSessMarks]             = useState<Record<string, boolean>>({})
  const [sessRecording, setSessRecording]     = useState(false)

  /* ─── 1. Auth ─── */
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) { router.replace(`/auth/login?next=${loginRedirect}`); return }
    getCurrentUser()
      .then(async u => {
        setUser(u)
        setIsCoordinator(u.role === 'admin')   // new depts: admin-only management
        const mem = await checkMembership(dept)
        setMembership(mem)
      })
      .catch(() => router.replace(`/auth/login?next=${loginRedirect}`))
      .finally(() => setAuthLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── 2. Load data once active ─── */
  useEffect(() => {
    if (!membership?.is_member || !membership?.is_active) return
    setLoadingData(true)
    Promise.allSettled([
      listAnnouncements(dept).then(setAnnouncements),
      listActivities(dept).then(setActivities),
      myAttendance(dept).then(setAttendance),
      getDeptMessages(dept).then(msgs => {
        setMessages(msgs)
        if (msgs.length) lastMsgId.current = msgs[msgs.length - 1].id
      }),
    ]).finally(() => setLoadingData(false))
  }, [membership?.is_active]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── 3. Chat polling ─── */
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
    if (tab === 'chat') {
      setUnreadChat(0)
      setTimeout(() => chatBottomRef.current?.scrollIntoView(), 100)
    }
  }, [tab])

  /* ─── Actions ─── */
  const handleJoin = async () => {
    setJoining(true)
    try {
      await joinDepartment(dept)
      const mem = await checkMembership(dept)
      setMembership(mem)
    } catch (e: unknown) { alert((e as Error).message || 'Failed to join') }
    finally { setJoining(false) }
  }

  const signOut = () => {
    localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token')
    setShowSignOut(false); router.replace('/auth/login')
  }

  const postAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim() || annPosting) return
    setAnnPosting(true)
    try {
      await createAnnouncement(dept, { title: annTitle.trim(), body: annBody.trim(), is_urgent: annUrgent, is_pinned: annPinned })
      setAnnouncements(await listAnnouncements(dept))
      setAnnTitle(''); setAnnBody(''); setAnnUrgent(false); setAnnPinned(false); setShowAnnForm(false)
    } catch (e: unknown) { alert((e as Error).message || 'Failed') }
    finally { setAnnPosting(false) }
  }

  const delAnn = async (id: string) => {
    if (!confirm('Delete this notice?')) return
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
    try { await addMember(dept, addEmail.trim(), addLabel.trim() || undefined); setAddEmail(''); setAddLabel(''); setShowAddMember(false) }
    catch (e: unknown) { alert((e as Error).message) }
    finally { setAddingMember(false) }
  }

  const openSessionForm = async () => {
    try {
      const mems = await listMembers(dept)
      setAllMembers(mems)
      const marks: Record<string, boolean> = {}
      mems.forEach(m => { marks[m.user_id] = false })
      setSessMarks(marks); setSessLabel(''); setSessDate(new Date().toISOString().split('T')[0]); setShowSessionForm(true)
    } catch (e: unknown) { alert('Failed to load members: ' + (e as Error).message) }
  }

  const submitSession = async () => {
    if (!sessLabel.trim() || !sessDate || sessRecording) return
    setSessRecording(true)
    try {
      const entries = Object.entries(sessMarks).map(([user_id, present]) => ({ user_id, present }))
      await recordSessionAttendance(dept, sessLabel.trim(), sessDate, entries)
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

  /* ─── Derived ─── */
  const today        = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const firstName    = user?.name.split(' ')[0] || ''
  const userInitials = user ? getInitials(user.name) : '?'
  const upcoming     = activities.filter(a => a.activity_date && new Date(a.activity_date) >= new Date())
  const attended     = attendance.filter(r => r.present).length
  const sessTotal    = attendance.length
  const attPct       = sessTotal ? Math.round((attended / sessTotal) * 100) : 0
  const latestNotice = announcements[0]
  const nextEvent    = upcoming[0]
  const roleLabel    = isCoordinator ? (user?.role === 'admin' ? 'Admin' : coordinatorLabel) : memberLabel

  /* ── Loading states ── */
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: primary }} />
        <p className="text-sm mt-3" style={{ color: primary + '80' }}>Loading {name}…</p>
      </div>
    </div>
  )

  if (!membership && !isCoordinator) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: primary }} />
    </div>
  )

  /* Not a member */
  if (!isCoordinator && !membership?.is_member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: bg }}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
          style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: primary }}>{name}</h2>
        <p className="text-gray-500 text-sm text-center mb-8 max-w-xs">You're not a member yet. Join to access announcements, events, attendance, and the team chat.</p>
        <button onClick={handleJoin} disabled={joining}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white disabled:opacity-60 transition-all"
          style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
          {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {joining ? 'Joining…' : `Join ${name}`}
        </button>
      </div>
    )
  }

  /* Pending */
  if (!isCoordinator && membership?.is_member && !membership?.is_active) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: bg }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-8 py-6 text-center" style={{ background: `${accent}15` }}>
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: `${accent}25` }}>
            <Clock className="w-8 h-8" style={{ color: accent }} />
          </div>
          <h2 className="font-black text-xl mb-2" style={{ color: '#92400e' }}>Pending Approval</h2>
          <p className="text-amber-700 text-sm leading-relaxed">
            Your membership request for {name} is awaiting admin approval. You&apos;ll gain full access once approved.
          </p>
        </div>
        <div className="px-8 py-5 text-center bg-amber-50/50">
          <p className="text-xs text-amber-600 font-semibold">Registered as <span className="font-black">{user?.name}</span></p>
          <button onClick={() => { localStorage.removeItem('access_token'); router.replace('/auth/login') }}
            className="mt-4 block mx-auto text-xs text-gray-400 hover:text-gray-600 transition-all">Sign out</button>
        </div>
      </motion.div>
    </div>
  )

  /* ═══════════════════════════════════════════════════════════════
     FULL DASHBOARD
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: bg }}>

      {/* Sign-out overlay */}
      <AnimatePresence>
        {showSignOut && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
            onClick={() => setShowSignOut(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-black text-lg text-center mb-2" style={{ color: primary }}>Sign Out?</h3>
              <p className="text-gray-500 text-sm text-center mb-6">You&apos;ll need to sign in again when you return.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOut(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={signOut} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600">Sign Out</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance session bottom sheet */}
      <AnimatePresence>
        {showSessionForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-end" onClick={() => setShowSessionForm(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
                <h3 className="font-black text-base" style={{ color: primary }}>Record Attendance</h3>
                <button onClick={() => setShowSessionForm(false)} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">Session Label *</label>
                  <input value={sessLabel} onChange={e => setSessLabel(e.target.value)} placeholder="e.g. Sunday Service"
                    className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-violet-300" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">Date *</label>
                  <input type="date" value={sessDate} onChange={e => setSessDate(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-violet-300" />
                </div>
                {allMembers.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { const a: Record<string,boolean> = {}; allMembers.forEach(m => { a[m.user_id] = true }); setSessMarks(a) }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-green-100 text-green-700">
                        <Check className="w-3.5 h-3.5" /> All Present
                      </button>
                      <button onClick={() => { const a: Record<string,boolean> = {}; allMembers.forEach(m => { a[m.user_id] = false }); setSessMarks(a) }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                        <Minus className="w-3.5 h-3.5" /> All Absent
                      </button>
                      <span className="ml-auto text-xs font-bold text-gray-500">
                        {Object.values(sessMarks).filter(Boolean).length} / {allMembers.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {allMembers.map(m => (
                        <button key={m.user_id} onClick={() => setSessMarks(p => ({ ...p, [m.user_id]: !p[m.user_id] }))}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${sessMarks[m.user_id] ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: primary }}>
                            {getInitials(m.name)}
                          </div>
                          <span className="flex-1 text-sm font-semibold text-gray-800">{m.name}</span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${sessMarks[m.user_id] ? 'border-violet-500 bg-violet-500' : 'border-gray-300'}`}>
                            {sessMarks[m.user_id] && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <button onClick={submitSession} disabled={!sessLabel.trim() || !sessDate || sessRecording}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
      <header className="flex-shrink-0" style={{ background: `linear-gradient(135deg,${primary} 0%,${gradientTo} 100%)` }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent }}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm tracking-wide">{nameShort}</p>
            <p className="text-white/40 text-[10px] truncate">{today}</p>
          </div>
          <button onClick={() => setShowSignOut(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0 ring-2 ring-white/20 hover:ring-white/50"
            style={{ background: `${accent}cc` }} title="Sign out">
            {userInitials}
          </button>
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ background: accent }}>
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-sm truncate">{user?.name}</p>
                {isCoordinator && (
                  <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: accent, color: '#78350f' }}>
                    <Crown className="w-2.5 h-2.5" /> Coordinator
                  </span>
                )}
              </div>
              <p className="text-white/50 text-[10px] mt-0.5">{roleLabel}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/40 text-[10px]">Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* ════ CONTENT ════ */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ─── HOME ─── */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="p-4 space-y-4 pb-24">

              {/* Welcome card */}
              <div className="relative rounded-3xl overflow-hidden p-5"
                style={{ background: `linear-gradient(135deg,${primary} 0%,${gradientTo} 100%)` }}>
                <div className="absolute -top-6 -right-6 w-28 h-28 opacity-10 pointer-events-none">
                  <Star className="w-full h-full text-white" />
                </div>
                <p className="text-white/70 text-xs mb-0.5">Welcome back!</p>
                <h2 className="text-white font-black text-2xl mb-1">{firstName}</h2>
                <p className="text-white/70 text-xs mb-4">{roleLabel} · {name}</p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setTab('notices')} className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-white/90 shadow" style={{ color: primary }}>
                    <Bell className="w-3.5 h-3.5" /> Notices
                  </button>
                  <button onClick={() => setTab('chat')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs text-white hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Group Chat
                  </button>
                </div>
              </div>

              {/* Coordinator panel */}
              {isCoordinator && (
                <div className="rounded-3xl overflow-hidden shadow-lg"
                  style={{ background: `linear-gradient(135deg,${accent} 0%,#f97316 100%)` }}>
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.28)' }}>
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">Coordinator Panel</p>
                        <p className="text-white/70 text-[10px]">Quick administrative actions</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Post Notice',     icon: Bell,      action: () => { setTab('notices');    setTimeout(() => setShowAnnForm(true), 120) } },
                        { label: 'Add Activity',    icon: Calendar,  action: () => { setTab('activities'); setTimeout(() => setShowActForm(true), 120) } },
                        { label: 'Take Attendance', icon: BarChart2, action: openSessionForm },
                        { label: 'Add Member',      icon: UserPlus,  action: () => { setTab('attendance'); setTimeout(() => setShowAddMember(true), 120) } },
                      ].map((a, i) => (
                        <button key={i} onClick={a.action} className="flex items-center gap-2 p-3 rounded-2xl text-left active:scale-95 hover:opacity-90" style={{ background: 'rgba(255,255,255,0.28)' }}>
                          <a.icon className="w-4 h-4 text-white flex-shrink-0" />
                          <span className="text-[11px] font-bold text-white leading-tight">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-3 flex gap-4" style={{ background: 'rgba(0,0,0,0.08)' }}>
                    {[
                      { val: announcements.length || '—', label: 'Notices'  },
                      { val: activities.length || '—',    label: 'Events'   },
                      { val: sessTotal || '—',            label: 'Sessions' },
                      { val: allMembers.length || '—',    label: 'Members'  },
                    ].map((s, i, arr) => (
                      <React.Fragment key={s.label}>
                        <div className="text-center">
                          <p className="font-black text-white text-lg leading-none">{s.val}</p>
                          <p className="text-white/60 text-[9px] mt-0.5">{s.label}</p>
                        </div>
                        {i < arr.length - 1 && <div className="w-px bg-white/20" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Attendance', val: sessTotal ? `${attPct}%` : '—', icon: BarChart2,    color: primary,   bg: `${primary}15` },
                  { label: 'Upcoming',   val: upcoming.length || '0',          icon: Calendar,    color: '#059669', bg: '#ecfdf5'      },
                  { label: 'Attended',   val: attended || '0',                 icon: CheckCircle2, color: accent,   bg: `${accent}20`  },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-gray-100">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <p className="font-black text-xl leading-none" style={{ color: primary }}>{s.val}</p>
                    <p className="text-gray-400 text-[10px] text-center leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Latest notice */}
              {latestNotice && (
                <button onClick={() => setTab('notices')} className="w-full text-left bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="font-black text-sm" style={{ color: primary }}>Latest Notice</h3>
                    <ChevronRight className="w-4 h-4" style={{ color: primary }} />
                  </div>
                  <div className={`mx-3 mb-3 p-4 rounded-2xl border-l-4 ${latestNotice.is_urgent ? 'border-red-500 bg-red-50' : latestNotice.is_pinned ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                    <p className="font-bold text-sm text-gray-800 mb-1">{latestNotice.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{latestNotice.body}</p>
                  </div>
                </button>
              )}

              {/* Next event */}
              {nextEvent && (
                <button onClick={() => setTab('activities')} className="w-full text-left bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="font-black text-sm" style={{ color: primary }}>Next Event</h3>
                    <ChevronRight className="w-4 h-4" style={{ color: primary }} />
                  </div>
                  <div className="mx-3 mb-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white capitalize mb-2 inline-block" style={{ background: primary }}>{nextEvent.activity_type}</span>
                    <p className="font-bold text-sm text-gray-800">{nextEvent.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDate(nextEvent.activity_date ?? undefined)}
                      {nextEvent.activity_time ? ` · ${fmtTime(nextEvent.activity_time)}` : ''}
                      {nextEvent.venue ? ` · ${nextEvent.venue}` : ''}
                    </p>
                  </div>
                </button>
              )}

              {/* Chat preview */}
              {messages.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="font-black text-sm flex items-center gap-2" style={{ color: primary }}>
                      Group Chat
                      {unreadChat > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{unreadChat} new</span>}
                    </h3>
                    <button onClick={() => setTab('chat')} className="text-xs font-bold flex items-center gap-0.5 hover:underline" style={{ color: primary }}>
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-3 pb-3 space-y-1">
                    {messages.slice(-3).map(m => (
                      <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-gray-50">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0" style={{ background: primary }}>
                          {getInitials(m.sender_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-gray-700 mr-1.5">{m.sender_name.split(' ')[0]}</span>
                          <span className="text-xs text-gray-500 truncate">{m.content}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── NOTICES ─── */}
          {tab === 'notices' && (
            <motion.div key="notices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="p-4 space-y-4 pb-24">
              <h2 className="font-black text-xl" style={{ color: primary }}>All Notices</h2>
              {isCoordinator && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowAnnForm(p => !p)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}25` }}>
                      <Plus className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left" style={{ color: primary }}>Post Notice</span>
                    <span className="text-[10px] text-gray-400">{showAnnForm ? 'Collapse' : 'Expand'}</span>
                  </button>
                  <AnimatePresence>
                    {showAnnForm && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
                          <div className="pt-3">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">Title *</label>
                            <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Notice title"
                              className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" style={{ outlineColor: primary }} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">Body *</label>
                            <textarea value={annBody} onChange={e => setAnnBody(e.target.value)} rows={3} placeholder="Write your notice…"
                              className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none resize-none" />
                          </div>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={annUrgent} onChange={e => setAnnUrgent(e.target.checked)} />
                              <span className="text-xs font-semibold text-red-600">Urgent</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={annPinned} onChange={e => setAnnPinned(e.target.checked)} />
                              <span className="text-xs font-semibold text-amber-600">Pin</span>
                            </label>
                          </div>
                          <button onClick={postAnnouncement} disabled={!annTitle.trim() || !annBody.trim() || annPosting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
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
              {loadingData ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: primary }} /></div>
                : announcements.length === 0
                  ? <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center"><Bell className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: primary }} /><p className="font-bold text-gray-400">No notices yet</p></div>
                  : <div className="space-y-3">{announcements.map(a => (
                    <motion.div key={a.id} layout className={`bg-white rounded-3xl border-l-4 shadow-sm overflow-hidden ${a.is_urgent ? 'border-red-500' : a.is_pinned ? 'border-amber-400' : 'border-gray-200'}`}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {a.is_urgent && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600"><AlertCircle className="w-3 h-3" /> Urgent</span>}
                              {a.is_pinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pinned</span>}
                            </div>
                            <h3 className="font-black text-base text-gray-800">{a.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.body}</p>
                            <p className="text-[10px] text-gray-400 mt-2">{a.author_name || name} · {fmtDate(a.created_at)}</p>
                          </div>
                          {isCoordinator && <button onClick={() => delAnn(a.id)} className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>}
                        </div>
                      </div>
                    </motion.div>
                  ))}</div>}
            </motion.div>
          )}

          {/* ─── ACTIVITIES ─── */}
          {tab === 'activities' && (
            <motion.div key="activities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="p-4 space-y-4 pb-24">
              <h2 className="font-black text-xl" style={{ color: primary }}>Events & Activities</h2>
              {isCoordinator && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowActForm(p => !p)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}25` }}>
                      <Plus className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left" style={{ color: primary }}>Add Activity</span>
                    <span className="text-[10px] text-gray-400">{showActForm ? 'Collapse' : 'Expand'}</span>
                  </button>
                  <AnimatePresence>
                    {showActForm && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
                          <div className="pt-3"><label className="text-[10px] font-bold text-gray-500 mb-1 block">Title *</label><input value={actTitle} onChange={e => setActTitle(e.target.value)} placeholder="Activity title" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Description</label><textarea value={actDesc} onChange={e => setActDesc(e.target.value)} rows={2} placeholder="Brief description…" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none resize-none" /></div>
                          <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Type</label>
                            <select value={actType} onChange={e => setActType(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none bg-white">
                              {activityTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Date</label><input type="date" value={actDate} onChange={e => setActDate(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                            <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Time</label><input type="time" value={actTime} onChange={e => setActTime(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          </div>
                          <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Venue</label><input value={actVenue} onChange={e => setActVenue(e.target.value)} placeholder="e.g. Church Hall" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          <button onClick={addActivity} disabled={!actTitle.trim() || actAdding}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
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
              {loadingData ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: primary }} /></div>
                : activities.length === 0
                  ? <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center"><Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: primary }} /><p className="font-bold text-gray-400">No activities yet</p></div>
                  : <div className="space-y-3">{activities.map(a => (
                    <motion.div key={a.id} layout className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="h-1 rounded-t-3xl" style={{ background: `linear-gradient(90deg,${primary},${gradientTo})` }} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full text-white mb-2 capitalize" style={{ background: primary }}>{a.activity_type}</span>
                            <h3 className="font-black text-base text-gray-800">{a.title}</h3>
                            {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {a.activity_date && <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl"><Calendar className="w-3 h-3" />{fmtDate(a.activity_date)}</span>}
                              {a.activity_time && <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl"><Clock className="w-3 h-3" />{fmtTime(a.activity_time)}</span>}
                              {a.venue && <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl">{a.venue}</span>}
                            </div>
                          </div>
                          {isCoordinator && <button onClick={() => delActivity(a.id)} className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>}
                        </div>
                      </div>
                    </motion.div>
                  ))}</div>}
            </motion.div>
          )}

          {/* ─── ATTENDANCE ─── */}
          {tab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="p-4 space-y-4 pb-24">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-xl" style={{ color: primary }}>{isCoordinator ? 'Attendance' : 'My Attendance'}</h2>
                {isCoordinator && (
                  <button onClick={openSessionForm} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90"
                    style={{ background: `linear-gradient(135deg,${primary},${gradientTo})` }}>
                    <Plus className="w-3.5 h-3.5" /> Record Session
                  </button>
                )}
              </div>
              {isCoordinator && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowAddMember(p => !p)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}25` }}>
                      <UserPlus className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left" style={{ color: primary }}>Add New Member</span>
                    <span className="text-[10px] text-gray-400">{showAddMember ? 'Collapse' : 'Expand'}</span>
                  </button>
                  <AnimatePresence>
                    {showAddMember && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
                          <div className="pt-3"><label className="text-[10px] font-bold text-gray-500 mb-1 block">Member Email *</label><input value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="member@example.com" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Role Label (optional)</label><input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="e.g. Team Lead" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none" /></div>
                          <button onClick={doAddMember} disabled={!addEmail.trim() || addingMember}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
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
              <div className="grid grid-cols-3 gap-3">
                {[{ label: 'Sessions', val: sessTotal }, { label: 'Present', val: attended }, { label: 'Rate', val: sessTotal ? `${attPct}%` : '—' }].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <p className="font-black text-2xl leading-none" style={{ color: primary }}>{s.val}</p>
                    <p className="text-gray-400 text-[10px] mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {loadingData ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: primary }} /></div>
                : attendance.length === 0
                  ? <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center"><BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: primary }} /><p className="font-bold text-gray-400">No attendance records yet</p></div>
                  : <div className="space-y-2">{attendance.map((row, i) => (
                    <motion.div key={i} layout className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: row.present ? `${primary}15` : '#f3f4f6' }}>
                        {row.present ? <CheckCircle2 className="w-4 h-4" style={{ color: primary }} /> : <X className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{row.session_label || 'Session'}</p>
                        <p className="text-[10px] text-gray-400">{fmtDate(row.session_date)}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${row.present ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {row.present ? 'Present' : 'Absent'}
                      </span>
                    </motion.div>
                  ))}</div>}
            </motion.div>
          )}

          {/* ─── CHAT ─── */}
          {tab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="flex flex-col pb-[68px]" style={{ height: 'calc(100vh - 148px)' }}>
              <div className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: primary }}>
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm" style={{ color: primary }}>{name} Chat</p>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /><span className="text-[10px] text-gray-400">{messages.length ? 'Live' : 'No messages yet'}</span></div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex items-center gap-2 mb-2"><div className="flex-1 h-px bg-gray-100" /><span className="text-[10px] text-gray-400 bg-gray-50 rounded-full px-3 py-1 font-semibold">Today</span><div className="flex-1 h-px bg-gray-100" /></div>
                {messages.length === 0 && <div className="text-center py-12 text-gray-400"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" /><p className="text-sm">No messages yet. Say hi!</p></div>}
                {messages.map((msg, i) => {
                  const isMine = msg.is_mine
                  const prev = messages[i - 1]
                  const showSender = !prev || prev.user_id !== msg.user_id
                  const msgTime = new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mb-1"
                        style={{ background: showSender ? primary : 'transparent', opacity: showSender ? 1 : 0 }}>
                        {showSender ? getInitials(msg.sender_name) : ''}
                      </div>
                      <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {showSender && !isMine && <p className="text-xs font-bold text-gray-700 mb-1 ml-1">{msg.sender_name}</p>}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'rounded-br-sm text-white' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'}`}
                          style={isMine ? { background: `linear-gradient(135deg,${primary},${gradientTo})` } : undefined}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msgTime}</span>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatBottomRef} />
              </div>
              <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2 focus-within:bg-white transition-all">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                    placeholder={chatPlaceholder} className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent" />
                  <button onClick={sendChat} disabled={!chatInput.trim() || sending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-30 flex-shrink-0"
                    style={{ background: chatInput.trim() ? primary : '#d1d5db' }}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ════ BOTTOM TAB BAR ════ */}
      <nav className="flex-shrink-0 bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex">
          {TABS.map(t => {
            const active = tab === t.id
            const showBadge = t.id === 'chat' && unreadChat > 0
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex flex-col items-center gap-1 py-2.5 relative">
                {active && <motion.div layoutId={`tab-${dept}`} className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: primary }} />}
                <div className="relative">
                  <t.icon className="w-5 h-5" style={{ color: active ? primary : '#9ca3af' }} />
                  {showBadge && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-black">{unreadChat > 9 ? '9+' : unreadChat}</span>}
                </div>
                <span className="text-[10px] font-bold" style={{ color: active ? primary : '#9ca3af' }}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

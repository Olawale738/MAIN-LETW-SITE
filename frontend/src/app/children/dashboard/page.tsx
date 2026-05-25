'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Bell, BookOpen, BarChart2, MessageSquare,
  LogOut, Loader2, AlertCircle, Pin, Send, UserPlus,
  Clock, MapPin, CheckCircle2, XCircle, Users, Crown,
  Plus, Trash2, X, ChevronRight, Baby,
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
  type DeptActivity, type MyAttendanceRow, type DeptMessage,
  type DeptMember,
} from '@/lib/dept-api'

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const DEPT = 'children' as const

const PROGRAM_TYPES = [
  'sunday-school', 'vbs', 'midweek', 'outreach', 'special-event', 'workshop',
] as const
type ProgramType = typeof PROGRAM_TYPES[number]

const PROG_BADGE: Record<ProgramType, { label: string; bg: string; text: string }> = {
  'sunday-school':  { label: 'Sunday School',  bg: '#eff6ff', text: '#1e40af' },
  'vbs':            { label: 'VBS',             bg: '#fef9c3', text: '#854d0e' },
  'midweek':        { label: 'Midweek',         bg: '#f0fdf4', text: '#166534' },
  'outreach':       { label: 'Outreach',        bg: '#fff7ed', text: '#9a3412' },
  'special-event':  { label: 'Special Event',   bg: '#fdf4ff', text: '#7e22ce' },
  'workshop':       { label: 'Workshop',        bg: '#fff1f2', text: '#9f1239' },
}

type Tab = 'home' | 'notices' | 'programs' | 'attendance' | 'chat'

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function ChildrenDashboard() {
  const router = useRouter()

  /* ── Auth & user ── */
  const [user, setUser]               = useState<DeptUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [membership, setMembership]   = useState<MembershipStatus | null>(null)
  const [joining, setJoining]         = useState(false)
  const [joinMsg, setJoinMsg]         = useState('')

  /* ── Navigation ── */
  const [tab, setTab] = useState<Tab>('home')

  /* ── Data ── */
  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities, setActivities]       = useState<DeptActivity[]>([])
  const [attendance, setAttendance]       = useState<MyAttendanceRow[]>([])
  const [messages, setMessages]           = useState<DeptMessage[]>([])
  const [allMembers, setAllMembers]       = useState<DeptMember[]>([])
  const [loadingData, setLoadingData]     = useState(false)
  const [unreadChat, setUnreadChat]       = useState(0)

  /* ── Chat ── */
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  /* ── Sign-out confirm ── */
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  /* ── Coordinator: Notice form ── */
  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [noticeTitle, setNoticeTitle]       = useState('')
  const [noticeBody, setNoticeBody]         = useState('')
  const [noticeUrgent, setNoticeUrgent]     = useState(false)
  const [noticePinned, setNoticePinned]     = useState(false)
  const [noticePosting, setNoticePosting]   = useState(false)

  /* ── Coordinator: Programme form ── */
  const [showProgForm, setShowProgForm]     = useState(false)
  const [progTitle, setProgTitle]           = useState('')
  const [progType, setProgType]             = useState<ProgramType>('sunday-school')
  const [progDate, setProgDate]             = useState('')
  const [progTime, setProgTime]             = useState('')
  const [progVenue, setProgVenue]           = useState('')
  const [progDesc, setProgDesc]             = useState('')
  const [progAdding, setProgAdding]         = useState(false)

  /* ── Coordinator: Enrolment form ── */
  const [showEnrolForm, setShowEnrolForm]   = useState(false)
  const [enrolEmail, setEnrolEmail]         = useState('')
  const [enrolLabel, setEnrolLabel]         = useState('')
  const [enrolAdding, setEnrolAdding]       = useState(false)

  /* ── Coordinator: Attendance session ── */
  const [showSessionSheet, setShowSessionSheet] = useState(false)
  const [sessLabel, setSessLabel]               = useState('')
  const [sessDate, setSessDate]                 = useState('')
  const [sessMarks, setSessMarks]               = useState<Record<string, boolean>>({})
  const [sessRecording, setSessRecording]       = useState(false)

  /* ─── Auth ─── */
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) { router.replace('/auth/login?next=/children/dashboard'); return }
    getCurrentUser()
      .then(u => { setUser(u); setAuthLoading(false) })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        router.replace('/auth/login?next=/children/dashboard')
      })
  }, [router])

  /* ─── Load dept data ─── */
  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [ann, act, att, mem] = await Promise.all([
        listAnnouncements(DEPT),
        listActivities(DEPT),
        myAttendance(DEPT),
        checkMembership(DEPT),
      ])
      setAnnouncements(ann)
      setActivities(act)
      setAttendance(att)
      setMembership(mem)
    } catch { /* silent */ }
    finally { setLoadingData(false) }
  }, [])

  useEffect(() => {
    if (!authLoading && user) loadData()
  }, [authLoading, user, loadData])

  /* ─── Chat polling ─── */
  const loadMessages = useCallback(async () => {
    try {
      const msgs = await getDeptMessages(DEPT)
      setMessages(msgs)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (tab !== 'chat') return
    setUnreadChat(0)
    loadMessages()
    const t = setInterval(loadMessages, 4000)
    return () => clearInterval(t)
  }, [tab, loadMessages])

  useEffect(() => {
    if (tab !== 'chat') {
      setUnreadChat(p => p) // keep count until viewed
    }
  }, [messages.length, tab])

  useEffect(() => {
    if (tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

  /* ─── Derived ─── */
  const isCoordinator = user?.role === 'children_coordinator' || user?.role === 'admin'
  const isMember      = !!(membership?.is_member && membership?.is_active)
  const isPending     = !!(membership?.is_member && !membership?.is_active)
  const total         = attendance.length
  const present       = attendance.filter(r => r.present).length
  const pct           = total > 0 ? Math.round((present / total) * 100) : null
  const parentFirst   = user?.name?.split(' ')[0] ?? 'Parent'

  const sortedNotices = [
    ...announcements.filter(a => a.is_pinned),
    ...announcements.filter(a => a.is_urgent && !a.is_pinned),
    ...announcements.filter(a => !a.is_pinned && !a.is_urgent),
  ]

  const upcomingProgs = activities
    .filter(a => !a.activity_date || new Date(a.activity_date) >= new Date(new Date().toDateString()))
    .slice(0, 5)

  /* ─── Actions ─── */
  async function handleJoin() {
    setJoining(true)
    setJoinMsg('')
    try {
      const res = await joinDepartment(DEPT)
      setJoinMsg(res.message || 'Enrolment submitted! Awaiting coordinator approval.')
      await loadData()
    } catch (e: unknown) {
      setJoinMsg((e as Error).message || 'Failed to enrol. Please try again.')
    } finally { setJoining(false) }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatSending(true)
    try {
      const msg = await sendDeptMessage(DEPT, chatInput.trim())
      setMessages(prev => [...prev, msg])
      setChatInput('')
    } catch { /* silent */ }
    finally { setChatSending(false) }
  }

  async function postNotice() {
    if (!noticeTitle.trim() || !noticeBody.trim() || noticePosting) return
    setNoticePosting(true)
    try {
      await createAnnouncement(DEPT, {
        title: noticeTitle.trim(), body: noticeBody.trim(),
        is_urgent: noticeUrgent, is_pinned: noticePinned,
      })
      setAnnouncements(await listAnnouncements(DEPT))
      setNoticeTitle(''); setNoticeBody(''); setNoticeUrgent(false); setNoticePinned(false)
      setShowNoticeForm(false)
    } catch (err: unknown) { alert((err as Error).message || 'Failed to post notice') }
    finally { setNoticePosting(false) }
  }

  async function delNotice(id: string) {
    if (!confirm('Delete this notice?')) return
    try {
      await deleteAnnouncement(DEPT, id)
      setAnnouncements(p => p.filter(a => a.id !== id))
    } catch (err: unknown) { alert((err as Error).message || 'Failed to delete') }
  }

  async function addProg() {
    if (!progTitle.trim() || progAdding) return
    setProgAdding(true)
    try {
      await createActivity(DEPT, {
        title: progTitle.trim(), description: progDesc.trim() || undefined,
        activity_type: progType,
        activity_date: progDate || undefined, activity_time: progTime || undefined,
        venue: progVenue.trim() || undefined,
      })
      setActivities(await listActivities(DEPT))
      setProgTitle(''); setProgDesc(''); setProgDate(''); setProgTime('')
      setProgVenue(''); setProgType('sunday-school'); setShowProgForm(false)
    } catch (err: unknown) { alert((err as Error).message || 'Failed to add programme') }
    finally { setProgAdding(false) }
  }

  async function delProg(id: string) {
    if (!confirm('Delete this programme?')) return
    try {
      await deleteActivity(DEPT, id)
      setActivities(p => p.filter(a => a.id !== id))
    } catch (err: unknown) { alert((err as Error).message || 'Failed to delete') }
  }

  async function doEnrol() {
    if (!enrolEmail.trim() || enrolAdding) return
    setEnrolAdding(true)
    try {
      await addMember(DEPT, enrolEmail.trim(), enrolLabel.trim() || undefined)
      setEnrolEmail(''); setEnrolLabel(''); setShowEnrolForm(false)
    } catch (err: unknown) { alert((err as Error).message || 'Failed to enrol member') }
    finally { setEnrolAdding(false) }
  }

  async function doRemoveMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from Children Ministry?`)) return
    try {
      await removeMember(DEPT, userId)
      setAllMembers(p => p.filter(m => m.user_id !== userId))
    } catch (err: unknown) { alert((err as Error).message || 'Failed to remove') }
  }

  async function openSessionSheet() {
    try {
      const mems = await listMembers(DEPT)
      setAllMembers(mems)
      const marks: Record<string, boolean> = {}
      mems.forEach(m => { marks[m.user_id] = false })
      setSessMarks(marks)
      setSessLabel(''); setSessDate(new Date().toISOString().split('T')[0])
      setShowSessionSheet(true)
    } catch (err: unknown) { alert('Failed to load members: ' + (err as Error).message) }
  }

  async function submitSession() {
    if (!sessLabel.trim() || !sessDate || sessRecording) return
    setSessRecording(true)
    try {
      const entries = Object.entries(sessMarks).map(([user_id, present]) => ({ user_id, present }))
      await recordSessionAttendance(DEPT, sessLabel.trim(), sessDate, entries)
      setShowSessionSheet(false)
      setAttendance(await myAttendance(DEPT))
    } catch (err: unknown) { alert((err as Error).message || 'Failed to record attendance') }
    finally { setSessRecording(false) }
  }

  function signOut() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setShowSignOutConfirm(false)
    router.replace('/auth/login')
  }

  /* ─── Loading gate ─── */
  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Baby className="w-10 h-10 text-orange-400" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-blue-700 mx-auto" />
        <p className="text-blue-400 text-sm mt-3">Loading your Parent Portal…</p>
      </div>
    </div>
  )

  /* ─── Not enrolled card ─── */
  if (!authLoading && membership && !membership.is_member) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Baby className="w-10 h-10 text-blue-700" />
        </div>
        <h2 className="text-2xl font-black text-blue-900 mb-2">Not Yet Enrolled</h2>
        <p className="text-gray-500 text-sm mb-2">Welcome, {parentFirst}!</p>
        <p className="text-gray-400 text-sm mb-6">
          Enrol your child in the Children Ministry to access programmes, notices, attendance records, and the parent chat.
        </p>
        {joinMsg && (
          <p className={`text-sm mb-4 font-medium ${joinMsg.toLowerCase().includes('fail') ? 'text-red-500' : 'text-green-600'}`}>
            {joinMsg}
          </p>
        )}
        <button onClick={handleJoin} disabled={joining}
          className="w-full bg-blue-800 text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-900 disabled:opacity-50 transition-all">
          {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {joining ? 'Submitting…' : 'Enrol My Child'}
        </button>
        <button onClick={() => { localStorage.removeItem('access_token'); router.replace('/auth/login') }}
          className="mt-4 text-gray-400 text-sm hover:text-gray-600">
          Sign out
        </button>
      </motion.div>
    </div>
  )

  /* ─── Render helpers ─── */
  function ProgBadge({ type }: { type: string }) {
    const cfg = PROG_BADGE[type as ProgramType] || { label: type, bg: '#f3f4f6', text: '#374151' }
    return (
      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
        style={{ background: cfg.bg, color: cfg.text }}>
        {cfg.label}
      </span>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#eff6ff] overflow-hidden">

      {/* ══ Sign Out Confirm ══ */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-black text-blue-900 text-lg text-center mb-2">Sign Out?</h3>
              <p className="text-gray-500 text-sm text-center mb-6">You will need to sign in again to access the Parent Portal.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={signOut}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all">
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Attendance Session Bottom Sheet ══ */}
      <AnimatePresence>
        {showSessionSheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="font-black text-blue-900">Record Attendance Session</h3>
                <button onClick={() => setShowSessionSheet(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">Session Label *</label>
                    <input value={sessLabel} onChange={e => setSessLabel(e.target.value)}
                      placeholder="e.g. Sunday 25 May"
                      className="w-full px-3 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">Date *</label>
                    <input type="date" value={sessDate} onChange={e => setSessDate(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                  </div>
                </div>
                {/* Mark all */}
                <div className="flex gap-2">
                  <button onClick={() => setSessMarks(p => Object.fromEntries(Object.keys(p).map(k => [k, true])))}
                    className="flex-1 py-2 bg-green-50 text-green-700 font-bold text-xs rounded-xl border border-green-200 hover:bg-green-100 transition-all">
                    Mark All Present
                  </button>
                  <button onClick={() => setSessMarks(p => Object.fromEntries(Object.keys(p).map(k => [k, false])))}
                    className="flex-1 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-200 hover:bg-red-100 transition-all">
                    Mark All Absent
                  </button>
                </div>
                {allMembers.length === 0
                  ? <p className="text-gray-400 text-sm text-center py-4">No enrolled members found.</p>
                  : allMembers.map(m => (
                    <div key={m.user_id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{m.name || m.user_id}</p>
                        {m.role_label && <p className="text-[10px] text-gray-400">{m.role_label}</p>}
                      </div>
                      <button onClick={() => setSessMarks(p => ({ ...p, [m.user_id]: !p[m.user_id] }))}
                        className={`w-10 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${sessMarks[m.user_id] ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 mx-0.5 ${sessMarks[m.user_id] ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))
                }
              </div>
              <div className="px-5 pb-6 flex-shrink-0 border-t border-gray-50">
                <button onClick={submitSession}
                  disabled={!sessLabel.trim() || !sessDate || sessRecording}
                  className="w-full mt-4 bg-blue-800 text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-900 transition-all">
                  {sessRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {sessRecording ? 'Saving…' : 'Save Attendance'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ HEADER ══ */}
      <header className="flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)' }}>
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <div className="w-10 h-10 bg-orange-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm tracking-wide">CHILDREN MINISTRY</p>
            <p className="text-white/50 text-[10px]">Parent Portal</p>
          </div>
          <button onClick={() => setTab('notices')}
            className="relative w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center hover:bg-white/25 transition-all">
            <Bell className="w-4 h-4 text-white" />
            {announcements.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center text-[9px] font-black text-white">
                {announcements.length > 9 ? '9+' : announcements.length}
              </span>
            )}
          </button>
          <button onClick={() => setShowSignOutConfirm(true)}
            className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center hover:bg-white/25 transition-all">
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Parent strip */}
        <div className="px-4 pb-4">
          <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center bg-orange-400 text-white font-black text-sm flex-shrink-0">
              {user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-sm truncate">{user.name}</p>
                {isCoordinator && (
                  <span className="flex items-center gap-1 bg-orange-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                    <Crown className="w-2.5 h-2.5" /> Coordinator
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {isPending && (
                  <span className="text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending Approval
                  </span>
                )}
                {isMember && !isCoordinator && (
                  <span className="text-white/50 text-[10px]">Parent · Active</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/40 text-[10px]">Online</span>
            </div>
          </div>
        </div>

        {/* Pending Approval Banner */}
        {isPending && (
          <div className="mx-4 mb-3 bg-amber-400/20 border border-amber-400/40 rounded-2xl px-4 py-3 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200 text-xs leading-relaxed">
              <span className="font-bold">Enrolment Under Review.</span> Your child&apos;s enrolment is pending. The Children&apos;s Coordinator or Admin will approve your registration shortly.
            </p>
          </div>
        )}
      </header>

      {loadingData && (
        <div className="h-0.5 bg-blue-200">
          <div className="h-full bg-blue-600 animate-pulse w-1/2 rounded-full" />
        </div>
      )}

      {/* ══ CONTENT ══ */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ────────── HOME ────────── */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="p-4 space-y-4 pb-28">

              {/* Welcome card */}
              <div className="relative rounded-3xl overflow-hidden p-5"
                style={{ background: 'linear-gradient(135deg, #1e40af 0%, #312e81 100%)' }}>
                <div className="absolute -top-6 -right-6 w-28 h-28 opacity-10">
                  <Baby className="w-full h-full text-white" />
                </div>
                <p className="text-white/70 text-xs mb-0.5">Welcome back</p>
                <h2 className="text-white font-black text-2xl mb-0.5">{parentFirst}</h2>
                <p className="text-white/70 text-xs mb-4">Children Ministry · Parent Portal</p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setTab('programs')}
                    className="flex items-center gap-1.5 bg-white text-blue-800 px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-white/90 transition-all shadow">
                    <BookOpen className="w-3.5 h-3.5" /> Programmes
                  </button>
                  <button onClick={() => setTab('chat')}
                    className="flex items-center gap-1.5 bg-white/20 text-white px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-white/30 transition-all border border-white/30">
                    <MessageSquare className="w-3.5 h-3.5" /> Parent Chat
                  </button>
                </div>
              </div>

              {/* Coordinator quick-action panel */}
              {isCoordinator && (
                <div className="rounded-3xl overflow-hidden shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">Coordinator Panel</p>
                        <p className="text-white/70 text-[10px]">Quick administrative actions</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: 'Post Notice', icon: Bell,
                          action: () => { setTab('notices'); setTimeout(() => setShowNoticeForm(true), 120) },
                        },
                        {
                          label: 'Add Programme', icon: BookOpen,
                          action: () => { setTab('programs'); setTimeout(() => setShowProgForm(true), 120) },
                        },
                        {
                          label: 'Take Attendance', icon: BarChart2,
                          action: () => { setTab('attendance'); setTimeout(() => openSessionSheet(), 200) },
                        },
                        {
                          label: 'Add Enrolment', icon: UserPlus,
                          action: () => { setTab('attendance'); setTimeout(() => setShowEnrolForm(true), 120) },
                        },
                      ].map((a, i) => (
                        <button key={i} onClick={a.action}
                          className="flex items-center gap-2 p-3 bg-white/25 hover:bg-white/40 rounded-2xl transition-all text-left active:scale-95">
                          <a.icon className="w-4 h-4 text-white flex-shrink-0" />
                          <span className="text-[11px] font-bold text-white leading-tight">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-black/10 px-5 py-3 flex gap-5">
                    {[
                      { label: 'Notices', val: announcements.length },
                      { label: 'Programmes', val: activities.length },
                      { label: 'Sessions', val: total },
                    ].map((s, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <div className="w-px bg-white/20" />}
                        <div className="text-center">
                          <p className="font-black text-white text-lg leading-none">{s.val || '—'}</p>
                          <p className="text-white/60 text-[9px] mt-0.5">{s.label}</p>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              {isMember && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-800 text-white rounded-2xl p-4 text-center shadow">
                    <p className="text-2xl font-black">{pct !== null ? `${pct}%` : '—'}</p>
                    <p className="text-[10px] text-white/70 mt-0.5">Attendance</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-blue-900">{upcomingProgs.length}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Upcoming</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-blue-900">{present}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Sessions</p>
                  </div>
                </div>
              )}

              {/* Latest Notice */}
              {announcements.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="font-black text-blue-900 text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500" /> Latest Notice
                    </h3>
                    <button onClick={() => setTab('notices')}
                      className="text-[11px] font-bold text-blue-700 flex items-center gap-0.5 hover:underline">
                      All <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className={`mx-5 mb-4 pl-3 border-l-4 ${sortedNotices[0]?.is_urgent ? 'border-red-400' : sortedNotices[0]?.is_pinned ? 'border-orange-400' : 'border-blue-300'}`}>
                    <p className="font-semibold text-sm text-gray-800">{sortedNotices[0]?.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sortedNotices[0]?.body}</p>
                  </div>
                </div>
              )}

              {/* Next Programme */}
              {upcomingProgs.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-black text-blue-900 text-sm flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-orange-500" /> Next Programme
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <ProgBadge type={upcomingProgs[0].activity_type} />
                      </div>
                      <p className="font-bold text-gray-800 text-sm">{upcomingProgs[0].title}</p>
                      {upcomingProgs[0].description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{upcomingProgs[0].description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-gray-400">
                        {upcomingProgs[0].activity_date && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{upcomingProgs[0].activity_date}{upcomingProgs[0].activity_time ? ` · ${upcomingProgs[0].activity_time}` : ''}</span>
                        )}
                        {upcomingProgs[0].venue && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{upcomingProgs[0].venue}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {announcements.length === 0 && activities.length === 0 && !loadingData && isMember && (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-dashed border-gray-200">
                  <Baby className="w-10 h-10 mx-auto mb-3 text-blue-200" />
                  <p className="font-bold text-gray-400">Nothing posted yet</p>
                  <p className="text-xs text-gray-300 mt-1">Your coordinator will post updates here soon.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ────────── NOTICES ────────── */}
          {tab === 'notices' && (
            <motion.div key="notices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="p-4 space-y-4 pb-28">

              <div className="flex items-center justify-between">
                <h2 className="font-black text-blue-900">Notices</h2>
                {isCoordinator && (
                  <button onClick={() => setShowNoticeForm(p => !p)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Post Notice
                  </button>
                )}
              </div>

              {/* Coordinator: post-notice form */}
              <AnimatePresence>
                {isCoordinator && showNoticeForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="p-5 space-y-3">
                      <h3 className="font-black text-blue-900 text-sm">Post a New Notice</h3>
                      <input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)}
                        placeholder="Notice title *"
                        className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                      <textarea value={noticeBody} onChange={e => setNoticeBody(e.target.value)}
                        placeholder="Notice body *" rows={3}
                        className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300 resize-none" />
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={noticeUrgent} onChange={e => setNoticeUrgent(e.target.checked)}
                            className="w-4 h-4 accent-red-500 rounded" />
                          Urgent
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={noticePinned} onChange={e => setNoticePinned(e.target.checked)}
                            className="w-4 h-4 accent-orange-500 rounded" />
                          Pin notice
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowNoticeForm(false)}
                          className="px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">
                          Cancel
                        </button>
                        <button onClick={postNotice}
                          disabled={!noticeTitle.trim() || !noticeBody.trim() || noticePosting}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-800 text-white rounded-2xl text-sm font-bold disabled:opacity-50 hover:bg-blue-900 transition-all">
                          {noticePosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                          {noticePosting ? 'Posting…' : 'Post Notice'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notice list */}
              {sortedNotices.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-dashed border-gray-200">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 text-sm">No notices yet</p>
                </div>
              ) : (
                sortedNotices.map(a => (
                  <div key={a.id}
                    className={`bg-white rounded-3xl shadow-sm border-l-4 overflow-hidden ${a.is_urgent ? 'border-red-400' : a.is_pinned ? 'border-orange-400' : 'border-blue-200'}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-sm text-gray-800">{a.title}</span>
                            {a.is_urgent && (
                              <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                <AlertCircle className="w-3 h-3" /> Urgent
                              </span>
                            )}
                            {a.is_pinned && <Pin className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{a.body}</p>
                          <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
                            {a.author_name && <span>By {a.author_name}</span>}
                            <span>{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        {isCoordinator && (
                          <button onClick={() => delNotice(a.id)}
                            className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-all">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ────────── PROGRAMMES ────────── */}
          {tab === 'programs' && (
            <motion.div key="programs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="p-4 space-y-4 pb-28">

              <div className="flex items-center justify-between">
                <h2 className="font-black text-blue-900">Programmes</h2>
                {isCoordinator && (
                  <button onClick={() => setShowProgForm(p => !p)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Programme
                  </button>
                )}
              </div>

              {/* Coordinator: add programme form */}
              <AnimatePresence>
                {isCoordinator && showProgForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="p-5 space-y-3">
                      <h3 className="font-black text-blue-900 text-sm">Add New Programme</h3>
                      <input value={progTitle} onChange={e => setProgTitle(e.target.value)}
                        placeholder="Programme title *"
                        className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                      <select value={progType} onChange={e => setProgType(e.target.value as ProgramType)}
                        className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300 bg-white">
                        {PROGRAM_TYPES.map(t => (
                          <option key={t} value={t}>{PROG_BADGE[t].label}</option>
                        ))}
                      </select>
                      <textarea value={progDesc} onChange={e => setProgDesc(e.target.value)}
                        placeholder="Description (optional)" rows={2}
                        className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300 resize-none" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={progDate} onChange={e => setProgDate(e.target.value)}
                          className="px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                        <input type="time" value={progTime} onChange={e => setProgTime(e.target.value)}
                          className="px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                      </div>
                      <input value={progVenue} onChange={e => setProgVenue(e.target.value)}
                        placeholder="Venue (optional)"
                        className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                      <div className="flex gap-2">
                        <button onClick={() => setShowProgForm(false)}
                          className="px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">
                          Cancel
                        </button>
                        <button onClick={addProg}
                          disabled={!progTitle.trim() || progAdding}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-800 text-white rounded-2xl text-sm font-bold disabled:opacity-50 hover:bg-blue-900 transition-all">
                          {progAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          {progAdding ? 'Adding…' : 'Add Programme'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Programme list */}
              {activities.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-dashed border-gray-200">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 text-sm">No programmes scheduled</p>
                </div>
              ) : (
                activities.map(a => (
                  <div key={a.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 bg-blue-800" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <ProgBadge type={a.activity_type} />
                          </div>
                          <p className="font-bold text-gray-800">{a.title}</p>
                          {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                          <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-gray-400">
                            {a.activity_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />{a.activity_date}{a.activity_time ? ` · ${a.activity_time}` : ''}
                              </span>
                            )}
                            {a.venue && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{a.venue}
                              </span>
                            )}
                          </div>
                        </div>
                        {isCoordinator && (
                          <button onClick={() => delProg(a.id)}
                            className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-all">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ────────── ATTENDANCE ────────── */}
          {tab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }} className="p-4 space-y-4 pb-28">

              <div className="flex items-center justify-between">
                <h2 className="font-black text-blue-900">My Child&apos;s Attendance</h2>
                {isCoordinator && (
                  <button onClick={openSessionSheet}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Record Session
                  </button>
                )}
              </div>

              {/* Coordinator: enrolment form */}
              <AnimatePresence>
                {isCoordinator && showEnrolForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-blue-900 text-sm">Add Enrolment</h3>
                        <button onClick={() => setShowEnrolForm(false)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                      <input value={enrolEmail} onChange={e => setEnrolEmail(e.target.value)}
                        placeholder="Parent email *"
                        className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                      <input value={enrolLabel} onChange={e => setEnrolLabel(e.target.value)}
                        placeholder="Role label (e.g. Parent, Helper)"
                        className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-300" />
                      <button onClick={doEnrol}
                        disabled={!enrolEmail.trim() || enrolAdding}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-800 text-white rounded-2xl text-sm font-bold disabled:opacity-50 hover:bg-blue-900 transition-all">
                        {enrolAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {enrolAdding ? 'Enrolling…' : 'Enrol Member'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isMember && !isCoordinator ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-dashed border-gray-200">
                  <Baby className="w-10 h-10 mx-auto mb-3 text-blue-200" />
                  <p className="font-bold text-gray-400">Enrolment Required</p>
                  <p className="text-xs text-gray-300 mt-1">Enrol your child to track attendance</p>
                  <button onClick={() => setTab('home')} className="mt-3 text-blue-700 text-sm font-bold hover:underline">
                    Go to Home →
                  </button>
                </div>
              ) : attendance.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-dashed border-gray-200">
                  <BarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 text-sm">No attendance records yet</p>
                </div>
              ) : (
                <>
                  {/* Summary stats */}
                  <div className="bg-blue-800 text-white rounded-3xl p-5 flex items-center justify-between shadow">
                    <div>
                      <p className="text-xs text-white/60 uppercase tracking-widest mb-0.5">Attendance Rate</p>
                      <p className="text-4xl font-black">{pct !== null ? `${pct}%` : '—'}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-bold text-white/80">{present} / {total}</p>
                      <p className="text-[10px] text-white/50 mt-0.5">sessions attended</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <p className="text-2xl font-black text-green-600">{present}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Present</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <p className="text-2xl font-black text-red-400">{total - present}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Absent</p>
                    </div>
                  </div>

                  {/* Attendance rows */}
                  <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-[10px] text-gray-400 uppercase tracking-wide">
                            <th className="text-left px-4 py-3 font-bold">Session</th>
                            <th className="text-left px-4 py-3 font-bold">Date</th>
                            <th className="text-center px-4 py-3 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map((r, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="px-4 py-3 text-gray-700 font-medium">{r.session_label}</td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{r.session_date}</td>
                              <td className="px-4 py-3 text-center">
                                {r.present
                                  ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                  : <XCircle className="w-4 h-4 text-red-300 mx-auto" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Coordinator: member list */}
              {isCoordinator && allMembers.length > 0 && (
                <div>
                  <h3 className="font-black text-blue-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" /> Enrolled Members
                  </h3>
                  <div className="space-y-2">
                    {allMembers.map(m => (
                      <div key={m.user_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs flex-shrink-0">
                          {(m.name || 'M').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{m.name || m.user_id}</p>
                          {m.role_label && <p className="text-[10px] text-gray-400">{m.role_label}</p>}
                        </div>
                        <button onClick={() => doRemoveMember(m.user_id, m.name || m.user_id)}
                          className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ────────── CHAT ────────── */}
          {tab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col pb-[68px]" style={{ height: 'calc(100vh - 148px)' }}>

              {/* Chat header */}
              <div className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
                <div className="w-9 h-9 bg-blue-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Baby className="w-5 h-5 text-orange-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-blue-900 text-sm">Parent &amp; Leader Chat</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-400">Children Ministry · Live</span>
                  </div>
                </div>
              </div>

              {!isMember && !isCoordinator ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                  <div>
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 text-blue-200" />
                    <p className="font-bold text-gray-400">Members Only</p>
                    <p className="text-xs text-gray-300 mt-1">Enrol your child to access parent chat</p>
                    <button onClick={() => setTab('home')} className="mt-3 text-blue-700 text-sm font-bold hover:underline">
                      Go to Home →
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#bfdbfe transparent' }}>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px bg-blue-100" />
                      <span className="text-[10px] text-gray-400 bg-blue-50 rounded-full px-3 py-1 font-semibold">Today</span>
                      <div className="flex-1 h-px bg-blue-100" />
                    </div>

                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map((m, i) => {
                        const prev = messages[i - 1]
                        const showSender = !prev || prev.sender_name !== m.sender_name
                        return (
                          <div key={m.id} className={`flex items-end gap-2 ${m.is_mine ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-blue-700 text-white text-[9px] font-bold flex-shrink-0 mb-1 ${!showSender ? 'opacity-0' : 'opacity-100'}`}>
                              {(m.sender_name || '?').slice(0, 2).toUpperCase()}
                            </div>
                            <div className={`flex flex-col max-w-[75%] ${m.is_mine ? 'items-end' : 'items-start'}`}>
                              {showSender && !m.is_mine && (
                                <span className="text-xs font-bold text-gray-600 mb-1 ml-1">{m.sender_name}</span>
                              )}
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.is_mine
                                ? 'bg-blue-800 text-white rounded-br-sm'
                                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                                {m.content}
                              </div>
                              <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
                    <form onSubmit={handleSendMessage}
                      className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2 focus-within:border-blue-300 focus-within:bg-white transition-all">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        placeholder="Message parents &amp; leaders…"
                        className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent" />
                      <button type="submit" disabled={!chatInput.trim() || chatSending}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-30 transition-all flex-shrink-0 bg-blue-800 hover:bg-blue-900">
                        {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ══ BOTTOM NAVIGATION ══ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg flex z-10">
        {(
          [
            { id: 'home' as Tab,       label: 'Home',       Icon: Home,          badge: 0 },
            { id: 'notices' as Tab,    label: 'Notices',    Icon: Bell,          badge: announcements.length },
            { id: 'programs' as Tab,   label: 'Programmes', Icon: BookOpen,      badge: 0 },
            { id: 'attendance' as Tab, label: 'Attendance', Icon: BarChart2,     badge: 0 },
            { id: 'chat' as Tab,       label: 'Chat',       Icon: MessageSquare, badge: unreadChat },
          ] as { id: Tab; label: string; Icon: React.ElementType; badge: number }[]
        ).map(({ id, label, Icon, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors relative ${tab === id ? 'text-blue-800' : 'text-gray-400 hover:text-blue-600'}`}>
            {tab === id && (
              <motion.div layoutId="tab-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-800 rounded-full" />
            )}
            <div className="relative">
              <Icon size={18} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[9px] font-black text-white leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

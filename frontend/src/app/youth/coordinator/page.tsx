'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Bell, BarChart2, Calendar, LogOut,
  Plus, Search, Trash2, CheckCircle2, XCircle,
  Pin, AlertCircle, Clock, MapPin, UserCheck, UserX,
  Loader2, RefreshCw, Home, ShieldCheck, ChevronDown,
  ChevronUp, AlarmCheck, Activity,
} from 'lucide-react'
import { useDeptAuth } from '@/hooks/useDeptAuth'
import {
  getDeptStats, listMembers, addMember, removeMember, updateMember,
  listAnnouncements, createAnnouncement, deleteAnnouncement,
  listActivities, createActivity, deleteActivity,
  listAttendance, recordSessionAttendance,
  type DeptMember, type DeptAnnouncement, type DeptActivity, type AttendanceRow, type DeptStats,
} from '@/lib/dept-api'

const DEPT = 'youth' as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-medium ${ok ? 'bg-green-600' : 'bg-red-600'}`}
    >
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {msg}
    </motion.div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-violet-50`}>
      {initials(name)}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'approvals' | 'members' | 'notices' | 'activities' | 'attendance'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Overview',    icon: <Home size={15} /> },
  { id: 'approvals',  label: 'Approvals',   icon: <ShieldCheck size={15} /> },
  { id: 'members',    label: 'Members',     icon: <Users size={15} /> },
  { id: 'notices',    label: 'Notices',     icon: <Bell size={15} /> },
  { id: 'activities', label: 'Activities',  icon: <Activity size={15} /> },
  { id: 'attendance', label: 'Attendance',  icon: <BarChart2 size={15} /> },
]

const ACTIVITY_TYPES = ['meeting', 'retreat', 'outreach', 'workshop', 'service', 'conference', 'other'] as const

const ACTIVITY_COLORS: Record<string, string> = {
  meeting:    'bg-violet-100 text-violet-700',
  retreat:    'bg-sky-100 text-sky-700',
  outreach:   'bg-emerald-100 text-emerald-700',
  workshop:   'bg-amber-100 text-amber-700',
  service:    'bg-indigo-100 text-indigo-700',
  conference: 'bg-rose-100 text-rose-700',
  other:      'bg-gray-100 text-gray-600',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${color} rounded-2xl p-4 text-white shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-1.5 bg-white/20 rounded-xl">{icon}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-80 font-medium">{label}</div>
    </motion.div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

// ─── Expandable Form ──────────────────────────────────────────────────────────
function ExpandableForm({
  title, icon, children, defaultOpen = false,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <SectionCard>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2.5 font-semibold text-gray-800">
          <span className="text-violet-600">{icon}</span>
          {title}
        </div>
        <span className="text-gray-400">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-gray-50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
  )
}

// ─── Input / Textarea helpers ─────────────────────────────────────────────────
const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-gray-50 transition'
const selectCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-gray-50 transition'

// ─── Pill Button ──────────────────────────────────────────────────────────────
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
        active ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Primary / Danger / Success Buttons ───────────────────────────────────────
const btnPrimary = 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed'
const btnDanger  = 'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 active:scale-95 transition'
const btnSuccess = 'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 active:scale-95 transition'
const btnGhost   = 'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-gray-500 hover:bg-gray-100 active:scale-95 transition'

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function YouthLeaderDashboard() {
  const { user, loading: authLoading } = useDeptAuth(['youth_leader', 'admin'])

  const [tab, setTab] = useState<Tab>('overview')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // ── Data state ────────────────────────────────────────────────────────────
  const [stats,         setStats]         = useState<DeptStats | null>(null)
  const [members,       setMembers]       = useState<DeptMember[]>([])
  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities,    setActivities]    = useState<DeptActivity[]>([])
  const [attendance,    setAttendance]    = useState<AttendanceRow[]>([])
  const [loadingData,   setLoadingData]   = useState(false)

  // ── Members state ─────────────────────────────────────────────────────────
  const [memberEmail,  setMemberEmail]  = useState('')
  const [memberRole,   setMemberRole]   = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [addingMember, setAddingMember] = useState(false)

  // ── Announcements state ───────────────────────────────────────────────────
  const [annTitle,   setAnnTitle]   = useState('')
  const [annBody,    setAnnBody]    = useState('')
  const [annUrgent,  setAnnUrgent]  = useState(false)
  const [annPinned,  setAnnPinned]  = useState(false)
  const [postingAnn, setPostingAnn] = useState(false)

  // ── Activities state ──────────────────────────────────────────────────────
  const [actTitle,   setActTitle]   = useState('')
  const [actDesc,    setActDesc]    = useState('')
  const [actType,    setActType]    = useState<string>('meeting')
  const [actDate,    setActDate]    = useState('')
  const [actTime,    setActTime]    = useState('')
  const [actVenue,   setActVenue]   = useState('')
  const [postingAct, setPostingAct] = useState(false)

  // ── Attendance state ──────────────────────────────────────────────────────
  const [sessionLabel,   setSessionLabel]   = useState('')
  const [sessionDate,    setSessionDate]    = useState('')
  const [sessionEntries, setSessionEntries] = useState<Record<string, boolean>>({})
  const [savingAtt,      setSavingAtt]      = useState(false)
  const [attFilter,      setAttFilter]      = useState('')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  const toast$ = useCallback((msg: string, ok = true) => setToast({ msg, ok }), [])

  // ── Load all ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoadingData(true)
    try {
      const [s, m, a, ac, att] = await Promise.all([
        getDeptStats(DEPT),
        listMembers(DEPT),
        listAnnouncements(DEPT),
        listActivities(DEPT),
        listAttendance(DEPT),
      ])
      setStats(s)
      setMembers(m)
      setAnnouncements(a)
      setActivities(ac)
      setAttendance(att)
    } catch (e: unknown) {
      toast$((e as Error).message || 'Failed to load data', false)
    } finally {
      setLoadingData(false)
    }
  }, [toast$])

  useEffect(() => {
    if (!authLoading && user) loadAll()
  }, [authLoading, user, loadAll])

  // Initialise attendance entries from active members
  useEffect(() => {
    const init: Record<string, boolean> = {}
    members.filter(m => m.is_active).forEach(m => { init[m.user_id] = false })
    setSessionEntries(init)
  }, [members])

  // ── Derived data ──────────────────────────────────────────────────────────
  const pendingMembers = members.filter(m => !m.is_active)
  const activeMembers  = members.filter(m => m.is_active)

  const filteredMembers = members.filter(m => {
    const matchSearch = !memberSearch ||
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
    const matchFilter =
      memberFilter === 'all' ? true :
      memberFilter === 'active' ? m.is_active :
      !m.is_active
    return matchSearch && matchFilter
  })

  const filteredAtt = attendance.filter(r =>
    !attFilter ||
    r.session_label.toLowerCase().includes(attFilter.toLowerCase()) ||
    r.member_name.toLowerCase().includes(attFilter.toLowerCase())
  )

  // Group attendance by session
  const groupedAtt = filteredAtt.reduce<Record<string, AttendanceRow[]>>((acc, row) => {
    const key = `${row.session_label} — ${row.session_date}`
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  const presentCount = Object.values(sessionEntries).filter(Boolean).length

  // ── Member handlers ───────────────────────────────────────────────────────
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!memberEmail.trim()) return
    setAddingMember(true)
    try {
      await addMember(DEPT, memberEmail.trim(), memberRole.trim() || undefined)
      toast$('Member added successfully')
      setMemberEmail('')
      setMemberRole('')
      setMembers(await listMembers(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to add member', false)
    } finally { setAddingMember(false) }
  }

  async function handleToggleActive(m: DeptMember) {
    try {
      await updateMember(DEPT, m.user_id, { is_active: !m.is_active })
      toast$(m.is_active ? 'Member deactivated' : 'Member activated')
      setMembers(prev => prev.map(x => x.user_id === m.user_id ? { ...x, is_active: !m.is_active } : x))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to update', false)
    }
  }

  async function handleRemoveMember(m: DeptMember) {
    if (!confirm(`Remove ${m.name} from Youth Ministry?`)) return
    try {
      await removeMember(DEPT, m.user_id)
      toast$('Member removed')
      setMembers(prev => prev.filter(x => x.user_id !== m.user_id))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to remove', false)
    }
  }

  async function handleApprove(m: DeptMember) {
    if (!confirm(`Approve ${m.name} and grant access to the Youth Ministry dashboard?`)) return
    try {
      await updateMember(DEPT, m.user_id, { is_active: true })
      toast$(`${m.name} approved`)
      setMembers(prev => prev.map(x => x.user_id === m.user_id ? { ...x, is_active: true } : x))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to approve', false)
    }
  }

  async function handleDecline(m: DeptMember) {
    if (!confirm(`Decline and remove ${m.name}?`)) return
    try {
      await removeMember(DEPT, m.user_id)
      toast$(`${m.name} declined and removed`)
      setMembers(prev => prev.filter(x => x.user_id !== m.user_id))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to decline', false)
    }
  }

  // ── Announcement handlers ─────────────────────────────────────────────────
  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!annTitle.trim() || !annBody.trim()) return
    setPostingAnn(true)
    try {
      await createAnnouncement(DEPT, { title: annTitle, body: annBody, is_urgent: annUrgent, is_pinned: annPinned })
      toast$('Announcement posted')
      setAnnTitle(''); setAnnBody(''); setAnnUrgent(false); setAnnPinned(false)
      setAnnouncements(await listAnnouncements(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to post', false)
    } finally { setPostingAnn(false) }
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return
    try {
      await deleteAnnouncement(DEPT, id)
      toast$('Announcement deleted')
      setAnnouncements(await listAnnouncements(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to delete', false)
    }
  }

  // ── Activity handlers ─────────────────────────────────────────────────────
  async function handlePostActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!actTitle.trim()) return
    setPostingAct(true)
    try {
      await createActivity(DEPT, {
        title: actTitle, description: actDesc, activity_type: actType,
        activity_date: actDate || undefined, activity_time: actTime || undefined,
        venue: actVenue || undefined,
      })
      toast$('Activity scheduled')
      setActTitle(''); setActDesc(''); setActType('meeting')
      setActDate(''); setActTime(''); setActVenue('')
      setActivities(await listActivities(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to schedule', false)
    } finally { setPostingAct(false) }
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm('Delete this activity?')) return
    try {
      await deleteActivity(DEPT, id)
      toast$('Activity deleted')
      setActivities(await listActivities(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to delete', false)
    }
  }

  // ── Attendance handlers ───────────────────────────────────────────────────
  async function handleSaveAttendance(e: React.FormEvent) {
    e.preventDefault()
    if (!sessionLabel.trim() || !sessionDate) {
      toast$('Session label and date are required', false)
      return
    }
    setSavingAtt(true)
    try {
      const entries = Object.entries(sessionEntries).map(([user_id, present]) => ({ user_id, present }))
      await recordSessionAttendance(DEPT, sessionLabel, sessionDate, entries)
      toast$('Attendance recorded')
      setSessionLabel('')
      setSessionDate('')
      setAttendance(await listAttendance(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to save attendance', false)
    } finally { setSavingAtt(false) }
  }

  // ── Loading gate ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-violet-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-violet-600" size={40} />
          <p className="text-violet-600 text-sm font-medium">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── HEADER ── */}
      <header className="bg-gradient-to-r from-violet-800 via-violet-700 to-violet-800 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-0.5">
              Youth Ministry
            </div>
            <h1 className="text-xl font-bold leading-tight">Leader Dashboard</h1>
            {user && (
              <div className="text-xs text-violet-300 mt-0.5">
                Signed in as <span className="text-violet-100 font-medium">{user.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              disabled={loadingData}
              title="Refresh"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition active:scale-95"
            >
              <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                window.location.href = '/auth/login'
              }}
              title="Sign out"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition active:scale-95"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── TAB BAR ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto">
          <nav className="flex overflow-x-auto scrollbar-none">
            {TABS.map(t => {
              const badge = t.id === 'approvals' && pendingMembers.length > 0 ? pendingMembers.length : null
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    tab === t.id
                      ? 'text-violet-700 border-b-2 border-violet-600'
                      : 'text-gray-500 border-b-2 border-transparent hover:text-violet-600'
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {badge !== null && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1 bg-amber-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-5xl mx-auto px-4 py-5 pb-16 space-y-5">

        {/* ════ OVERVIEW ════ */}
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total Members"  value={stats?.total_members ?? '—'}       color="bg-violet-600" icon={<Users size={16} />} />
                <StatCard label="Total Notices"  value={stats?.total_announcements ?? '—'} color="bg-amber-500"  icon={<Bell size={16} />} />
                <StatCard label="Total Activities" value={stats?.total_activities ?? '—'}  color="bg-indigo-500" icon={<Activity size={16} />} />
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <SectionCard className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{activeMembers.length}</div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">Active Members</div>
                </SectionCard>
                <SectionCard className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-400">{pendingMembers.length}</div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">Inactive / Pending</div>
                </SectionCard>
              </div>

              {/* Pending approvals alert */}
              {pendingMembers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <AlarmCheck size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-amber-800 text-sm">
                        {pendingMembers.length} member{pendingMembers.length > 1 ? 's' : ''} pending approval
                      </div>
                      <div className="text-xs text-amber-600 mt-0.5">
                        New members awaiting activation
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setTab('approvals')}
                    className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition whitespace-nowrap"
                  >
                    Review Now →
                  </button>
                </motion.div>
              )}

              {/* Recent notices */}
              <SectionCard className="p-5">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Bell size={16} className="text-violet-500" /> Recent Notices
                </h2>
                {announcements.length === 0 ? (
                  <div className="py-6 text-center">
                    <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No announcements yet</p>
                  </div>
                ) : announcements.slice(0, 3).map((a, i) => (
                  <div
                    key={a.id}
                    className={`pl-3 py-2.5 border-l-4 ${a.is_urgent ? 'border-red-400' : a.is_pinned ? 'border-amber-400' : 'border-violet-200'} ${i < 2 ? 'mb-3' : ''}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-800">{a.title}</span>
                      {a.is_urgent && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">URGENT</span>}
                      {a.is_pinned && <Pin size={11} className="text-amber-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.body}</p>
                  </div>
                ))}
                {announcements.length > 3 && (
                  <button onClick={() => setTab('notices')} className="text-violet-600 text-xs mt-3 hover:underline font-medium">
                    View all {announcements.length} notices →
                  </button>
                )}
              </SectionCard>

              {/* Upcoming activities */}
              <SectionCard className="p-5">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-violet-500" /> Upcoming Activities
                </h2>
                {activities.length === 0 ? (
                  <div className="py-6 text-center">
                    <Calendar size={28} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No activities scheduled</p>
                  </div>
                ) : activities.slice(0, 3).map(a => (
                  <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${ACTIVITY_COLORS[a.activity_type] || ACTIVITY_COLORS.other}`}>
                      <Calendar size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-gray-800 truncate">{a.title}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-3 mt-0.5 flex-wrap">
                        {a.activity_date && <span className="flex items-center gap-1"><Clock size={10} />{fmtDate(a.activity_date)}</span>}
                        {a.venue && <span className="flex items-center gap-1"><MapPin size={10} />{a.venue}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length > 3 && (
                  <button onClick={() => setTab('activities')} className="text-violet-600 text-xs mt-3 hover:underline font-medium">
                    View all {activities.length} activities →
                  </button>
                )}
              </SectionCard>
            </motion.div>
          )}

          {/* ════ APPROVALS ════ */}
          {tab === 'approvals' && (
            <motion.div
              key="approvals"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800 text-lg">Pending Member Approvals</h2>
                {pendingMembers.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {pendingMembers.length} pending
                  </span>
                )}
              </div>

              {pendingMembers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
                >
                  <CheckCircle2 size={36} className="mx-auto text-green-500 mb-3" />
                  <div className="font-semibold text-green-800 text-base">All approvals up to date</div>
                  <div className="text-sm text-green-600 mt-1">No members are waiting for approval.</div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {pendingMembers.map(m => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      layout
                    >
                      <SectionCard className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name} size="lg" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 truncate">{m.name}</div>
                            <div className="text-xs text-gray-500 truncate">{m.email}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Joined {fmtDate(m.joined_at)}
                              {m.role_label && <span className="ml-2 text-violet-600 font-medium">{m.role_label}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                          <button
                            onClick={() => handleApprove(m)}
                            className={`${btnSuccess} flex-1`}
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleDecline(m)}
                            className={`${btnDanger} flex-1`}
                          >
                            <XCircle size={14} /> Decline
                          </button>
                        </div>
                      </SectionCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════ MEMBERS ════ */}
          {tab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Add member */}
              <ExpandableForm title="Add Member" icon={<Plus size={16} />}>
                <form onSubmit={handleAddMember} className="space-y-3 pt-2">
                  <input
                    type="email" required
                    placeholder="member@email.com"
                    value={memberEmail}
                    onChange={e => setMemberEmail(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="Role / Group (optional)"
                    value={memberRole}
                    onChange={e => setMemberRole(e.target.value)}
                    className={inputCls}
                  />
                  <button type="submit" disabled={addingMember} className={`${btnPrimary} w-full`}>
                    {addingMember ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Add Member
                  </button>
                </form>
              </ExpandableForm>

              {/* Search + filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members…"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Pill active={memberFilter === 'all'}      onClick={() => setMemberFilter('all')}>All ({members.length})</Pill>
                <Pill active={memberFilter === 'active'}   onClick={() => setMemberFilter('active')}>Active ({activeMembers.length})</Pill>
                <Pill active={memberFilter === 'inactive'} onClick={() => setMemberFilter('inactive')}>Inactive ({pendingMembers.length})</Pill>
              </div>

              {/* Member list */}
              <SectionCard>
                {filteredMembers.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users size={30} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">
                      {members.length === 0 ? 'No members yet. Add one above.' : 'No members match your search.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredMembers.map(m => (
                      <motion.div
                        key={m.id}
                        layout
                        className="flex items-center gap-3 p-4"
                      >
                        <Avatar name={m.name} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-800 truncate">{m.name}</div>
                          <div className="text-xs text-gray-400 truncate">{m.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {m.is_active ? 'Active' : 'Pending'}
                            </span>
                            {m.role_label && (
                              <span className="text-[10px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full font-medium">
                                {m.role_label}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">{fmtDate(m.joined_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(m)}
                            title={m.is_active ? 'Deactivate' : 'Activate'}
                            className={`${btnGhost} ${m.is_active ? 'text-amber-500' : 'text-green-500'}`}
                          >
                            {m.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m)}
                            title="Remove member"
                            className={btnGhost + ' text-red-400'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}

          {/* ════ NOTICES ════ */}
          {tab === 'notices' && (
            <motion.div
              key="notices"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <ExpandableForm title="Post Notice" icon={<Bell size={16} />} defaultOpen>
                <form onSubmit={handlePostAnnouncement} className="space-y-3 pt-2">
                  <input
                    type="text" required
                    placeholder="Notice title"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    className={inputCls}
                  />
                  <textarea
                    required rows={4}
                    placeholder="Write your message here…"
                    value={annBody}
                    onChange={e => setAnnBody(e.target.value)}
                    className={inputCls + ' resize-none'}
                  />
                  <div className="flex items-center gap-5 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={annUrgent}
                        onChange={e => setAnnUrgent(e.target.checked)}
                        className="accent-red-500 w-4 h-4"
                      />
                      <AlertCircle size={14} className="text-red-500" />
                      <span className="text-gray-700">Urgent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={annPinned}
                        onChange={e => setAnnPinned(e.target.checked)}
                        className="accent-amber-500 w-4 h-4"
                      />
                      <Pin size={14} className="text-amber-500" />
                      <span className="text-gray-700">Pin to top</span>
                    </label>
                  </div>
                  <button type="submit" disabled={postingAnn} className={`${btnPrimary} w-full`}>
                    {postingAnn ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Post Notice
                  </button>
                </form>
              </ExpandableForm>

              {/* Announcement list */}
              {announcements.length === 0 ? (
                <SectionCard className="py-12 text-center">
                  <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">No announcements yet</p>
                </SectionCard>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {announcements.map(a => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        layout
                        className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 overflow-hidden ${
                          a.is_urgent ? 'border-l-red-500' : a.is_pinned ? 'border-l-amber-400' : 'border-l-violet-300'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {a.is_urgent && (
                                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    🔴 Urgent
                                  </span>
                                )}
                                {a.is_pinned && (
                                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    📌 Pinned
                                  </span>
                                )}
                              </div>
                              <div className="font-semibold text-gray-800">{a.title}</div>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.body}</p>
                              <div className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                                {a.author_name && <span>By {a.author_name}</span>}
                                <span>{fmtDate(a.created_at)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteAnnouncement(a.id)}
                              className="p-2 rounded-xl hover:bg-red-50 text-red-300 hover:text-red-500 flex-shrink-0 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ════ ACTIVITIES ════ */}
          {tab === 'activities' && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <ExpandableForm title="Add Activity" icon={<Calendar size={16} />} defaultOpen>
                <form onSubmit={handlePostActivity} className="space-y-3 pt-2">
                  <input
                    type="text" required
                    placeholder="Activity title"
                    value={actTitle}
                    onChange={e => setActTitle(e.target.value)}
                    className={inputCls}
                  />
                  <textarea
                    rows={2}
                    placeholder="Description (optional)"
                    value={actDesc}
                    onChange={e => setActDesc(e.target.value)}
                    className={inputCls + ' resize-none'}
                  />
                  <select
                    value={actType}
                    onChange={e => setActType(e.target.value)}
                    className={selectCls}
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={actDate}
                      onChange={e => setActDate(e.target.value)}
                      className={inputCls}
                    />
                    <input
                      type="time"
                      value={actTime}
                      onChange={e => setActTime(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Venue (optional)"
                    value={actVenue}
                    onChange={e => setActVenue(e.target.value)}
                    className={inputCls}
                  />
                  <button type="submit" disabled={postingAct} className={`${btnPrimary} w-full`}>
                    {postingAct ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Schedule Activity
                  </button>
                </form>
              </ExpandableForm>

              {activities.length === 0 ? (
                <SectionCard className="py-12 text-center">
                  <Calendar size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">No activities scheduled yet</p>
                </SectionCard>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {activities.map(a => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        layout
                      >
                        <SectionCard className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${ACTIVITY_COLORS[a.activity_type] || ACTIVITY_COLORS.other}`}>
                                  {a.activity_type}
                                </span>
                                {a.creator_name && (
                                  <span className="text-[10px] text-gray-400">by {a.creator_name}</span>
                                )}
                              </div>
                              <div className="font-semibold text-gray-800">{a.title}</div>
                              {a.description && (
                                <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                                {a.activity_date && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                                    📅 {fmtDate(a.activity_date)}
                                  </span>
                                )}
                                {a.activity_time && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                                    🕐 {a.activity_time}
                                  </span>
                                )}
                                {a.venue && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                                    📍 {a.venue}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteActivity(a.id)}
                              className="p-2 rounded-xl hover:bg-red-50 text-red-300 hover:text-red-500 flex-shrink-0 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </SectionCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ════ ATTENDANCE ════ */}
          {tab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* ── Section A: Record session ── */}
              <SectionCard className="p-5">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlarmCheck size={16} className="text-violet-500" /> Record Session Attendance
                </h2>
                <form onSubmit={handleSaveAttendance} className="space-y-4">
                  <input
                    type="text" required
                    placeholder="Session label (e.g. Sunday Service – May 2026)"
                    value={sessionLabel}
                    onChange={e => setSessionLabel(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="date" required
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className={inputCls}
                  />

                  {activeMembers.length === 0 ? (
                    <div className="py-4 text-center text-gray-400 text-sm">
                      Add active members first to record attendance.
                    </div>
                  ) : (
                    <>
                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Members — {presentCount} / {activeMembers.length} present
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSessionEntries(
                              Object.fromEntries(activeMembers.map(m => [m.user_id, true]))
                            )}
                            className="text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition font-medium"
                          >
                            All Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionEntries(
                              Object.fromEntries(activeMembers.map(m => [m.user_id, false]))
                            )}
                            className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition font-medium"
                          >
                            All Absent
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-violet-500 rounded-full"
                          animate={{ width: `${activeMembers.length ? (presentCount / activeMembers.length) * 100 : 0}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        />
                      </div>

                      {/* Member toggle list */}
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        {activeMembers.map((m, i) => (
                          <label
                            key={m.user_id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-violet-50 transition ${i < activeMembers.length - 1 ? 'border-b border-gray-50' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={!!sessionEntries[m.user_id]}
                              onChange={e => setSessionEntries(prev => ({ ...prev, [m.user_id]: e.target.checked }))}
                              className="accent-violet-600 w-4 h-4"
                            />
                            <Avatar name={m.name} size="sm" />
                            <span className="text-sm text-gray-700 flex-1">{m.name}</span>
                            {m.role_label && <span className="text-xs text-gray-400">{m.role_label}</span>}
                            <span className={`text-xs font-semibold ${sessionEntries[m.user_id] ? 'text-green-600' : 'text-gray-300'}`}>
                              {sessionEntries[m.user_id] ? 'Present' : 'Absent'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={savingAtt || activeMembers.length === 0}
                    className={`${btnPrimary} w-full`}
                  >
                    {savingAtt ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    Save Attendance
                  </button>
                </form>
              </SectionCard>

              {/* ── Section B: Session History ── */}
              <SectionCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart2 size={16} className="text-violet-500" /> Session History
                  </h2>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter…"
                      value={attFilter}
                      onChange={e => setAttFilter(e.target.value)}
                      className="border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 w-36"
                    />
                  </div>
                </div>

                {Object.keys(groupedAtt).length === 0 ? (
                  <div className="py-8 text-center">
                    <BarChart2 size={28} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No attendance records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(groupedAtt).map(([sessionKey, rows]) => {
                      const isExpanded = expandedSession === sessionKey || expandedSession === null
                      const presentInSession = rows.filter(r => r.present).length
                      return (
                        <div key={sessionKey} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedSession(expandedSession === sessionKey ? null : sessionKey)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-800">{sessionKey}</span>
                              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                                {presentInSession}/{rows.length} present
                              </span>
                            </div>
                            {expandedSession === sessionKey ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          </button>
                          <AnimatePresence initial={false}>
                            {expandedSession === sessionKey && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.18 }}
                                className="overflow-hidden"
                              >
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-xs text-gray-400 border-b border-gray-100 bg-white">
                                      <th className="text-left px-4 py-2 font-medium">Member</th>
                                      <th className="text-center px-4 py-2 font-medium">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map(r => (
                                      <tr key={r.id} className="border-b border-gray-50 last:border-0">
                                        <td className="px-4 py-2.5 text-gray-700 text-sm">{r.member_name}</td>
                                        <td className="px-4 py-2.5 text-center">
                                          {r.present ? (
                                            <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                                          ) : (
                                            <XCircle size={16} className="text-red-300 mx-auto" />
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

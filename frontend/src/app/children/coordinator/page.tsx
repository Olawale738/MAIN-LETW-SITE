'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Bell, BarChart2, Calendar, Home, LogOut,
  Plus, Search, Trash2, CheckCircle2, XCircle,
  Pin, AlertCircle, Clock, MapPin, UserCheck, UserX,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Baby,
  BookOpen, Star, Zap, Filter, X, Check,
} from 'lucide-react'
import { useDeptAuth } from '@/hooks/useDeptAuth'
import {
  getDeptStats, listMembers, addMember, removeMember, updateMember,
  listAnnouncements, createAnnouncement, deleteAnnouncement,
  listActivities, createActivity, deleteActivity,
  listAttendance, recordSessionAttendance,
  type DeptMember, type DeptAnnouncement, type DeptActivity, type AttendanceRow, type DeptStats,
} from '@/lib/dept-api'

const DEPT = 'children' as const

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'enrollments' | 'members' | 'notices' | 'programs' | 'attendance'

// ─── Constants ────────────────────────────────────────────────────────────────
const AGE_GROUPS = [
  { key: 'toddler', label: 'Toddlers (0–3)', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-400', icon: '🍼' },
  { key: 'kids',    label: 'Kids (4–7)',     color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', icon: '⭐' },
  { key: 'preteen', label: 'Preteens (8–12)',color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-400', icon: '📚' },
  { key: 'teen',    label: 'Teens (13+)',    color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', icon: '🎯' },
]

const PROGRAM_TYPES = [
  { key: 'sunday-school',  label: 'Sunday School',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'vbs',            label: 'VBS',             color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'midweek',        label: 'Midweek',         color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'outreach',       label: 'Outreach',        color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'special-event',  label: 'Special Event',   color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { key: 'camp',           label: 'Camp',            color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'workshop',       label: 'Workshop',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
]

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Overview',    icon: <Home size={15} /> },
  { id: 'enrollments', label: 'Enrolments',  icon: <UserCheck size={15} /> },
  { id: 'members',     label: 'Children',    icon: <Users size={15} /> },
  { id: 'notices',     label: 'Notices',     icon: <Bell size={15} /> },
  { id: 'programs',    label: 'Programmes',  icon: <Calendar size={15} /> },
  { id: 'attendance',  label: 'Attendance',  icon: <BarChart2 size={15} /> },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAgeGroup(m: DeptMember) {
  const label = (m.role_label ?? m.notes ?? '').toLowerCase()
  if (label.includes('toddler')) return AGE_GROUPS[0]
  if (label.includes('preteen')) return AGE_GROUPS[2]
  if (label.includes('teen'))    return AGE_GROUPS[3]
  if (label.includes('kids') || label.includes('kid')) return AGE_GROUPS[1]
  return null
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function programTypeMeta(type: string) {
  return PROGRAM_TYPES.find(p => p.key === type) ?? { label: type, color: 'bg-gray-100 text-gray-700 border-gray-200' }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold ${ok ? 'bg-green-600' : 'bg-red-600'}`}
    >
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {msg}
    </motion.div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: React.ReactNode; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Section Heading ──────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">{children}</h3>
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-3">
      <div className="opacity-40 text-4xl">{icon}</div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

// ─── Age Group Badge ──────────────────────────────────────────────────────────
function AgeGroupBadge({ member }: { member: DeptMember }) {
  const group = getAgeGroup(member)
  if (!group) return <span className="text-xs text-gray-400">Unclassified</span>
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${group.color}`}>
      {group.icon} {group.label}
    </span>
  )
}

// ─── Program Type Badge ───────────────────────────────────────────────────────
function ProgramBadge({ type }: { type: string }) {
  const meta = programTypeMeta(type)
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
      {meta.label}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChildrenCoordinatorPage() {
  const { user, loading: authLoading } = useDeptAuth(['children_coordinator', 'admin'])
  const router = useRouter()
  const handleSignOut = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.replace('/auth/login')
  }

  const [tab, setTab]     = useState<Tab>('overview')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [busy, setBusy]   = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [stats, setStats]               = useState<DeptStats | null>(null)
  const [members, setMembers]           = useState<DeptMember[]>([])
  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities, setActivities]     = useState<DeptActivity[]>([])
  const [attendance, setAttendance]     = useState<AttendanceRow[]>([])

  const notify = useCallback((msg: string, ok = true) => setToast({ msg, ok }), [])

  const loadAll = useCallback(async () => {
    if (!user) return
    setRefreshing(true)
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
    } catch {
      notify('Failed to load data', false)
    } finally {
      setRefreshing(false)
    }
  }, [user, notify])

  useEffect(() => { if (user) loadAll() }, [user, loadAll])

  const pendingMembers  = members.filter(m => !m.is_active)
  const activeMembers   = members.filter(m => m.is_active)

  // ─── Handlers ───────────────────────────────────────────────────────────────
  async function handleApproveEnrolment(m: DeptMember) {
    setBusy(true)
    try {
      await updateMember(DEPT, m.user_id, { is_active: true })
      notify(`${m.name} approved ✓`)
      setMembers(prev => prev.map(x => x.user_id === m.user_id ? { ...x, is_active: true } : x))
    } catch { notify('Approval failed', false) }
    finally { setBusy(false) }
  }

  async function handleDeclineEnrolment(m: DeptMember) {
    if (!confirm(`Decline and remove enrolment for ${m.name}?`)) return
    setBusy(true)
    try {
      await removeMember(DEPT, m.user_id)
      notify(`Enrolment declined`)
      setMembers(prev => prev.filter(x => x.user_id !== m.user_id))
    } catch { notify('Failed to decline', false) }
    finally { setBusy(false) }
  }

  async function handleToggleActive(m: DeptMember) {
    setBusy(true)
    try {
      await updateMember(DEPT, m.user_id, { is_active: !m.is_active })
      notify(m.is_active ? 'Deactivated' : 'Activated')
      await loadAll()
    } catch { notify('Update failed', false) }
    finally { setBusy(false) }
  }

  async function handleAddMember(data: { email: string; role_label: string; notes: string }) {
    setBusy(true)
    try {
      await addMember(DEPT, data.email, data.role_label, data.notes)
      notify('Enrolment submitted')
      await loadAll()
    } catch { notify('Failed to add', false) }
    finally { setBusy(false) }
  }

  async function handleRemoveMember(m: DeptMember) {
    if (!confirm(`Remove ${m.name} from children ministry?`)) return
    setBusy(true)
    try {
      await removeMember(DEPT, m.user_id)
      notify('Child removed')
      await loadAll()
    } catch { notify('Failed to remove', false) }
    finally { setBusy(false) }
  }

  async function handlePostAnnouncement(data: { title: string; body: string; urgent: boolean; pinned: boolean }) {
    setBusy(true)
    try {
      await createAnnouncement(DEPT, { title: data.title, body: data.body, is_urgent: data.urgent, is_pinned: data.pinned })
      notify('Notice posted')
      await loadAll()
    } catch { notify('Failed to post', false) }
    finally { setBusy(false) }
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm('Delete this notice?')) return
    setBusy(true)
    try {
      await deleteAnnouncement(DEPT, id)
      notify('Notice deleted')
      await loadAll()
    } catch { notify('Failed to delete', false) }
    finally { setBusy(false) }
  }

  async function handlePostActivity(data: {
    title: string; description: string; activity_type: string; scheduled_at: string; venue: string
  }) {
    setBusy(true)
    try {
      const [activity_date, activity_time] = (data.scheduled_at || '').split('T')
      await createActivity(DEPT, {
        title: data.title,
        description: data.description || undefined,
        activity_type: data.activity_type,
        activity_date: activity_date || undefined,
        activity_time: activity_time || undefined,
        venue: data.venue || undefined,
      })
      notify('Programme added')
      await loadAll()
    } catch { notify('Failed to add programme', false) }
    finally { setBusy(false) }
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm('Delete this programme?')) return
    setBusy(true)
    try {
      await deleteActivity(DEPT, id)
      notify('Programme deleted')
      await loadAll()
    } catch { notify('Failed to delete', false) }
    finally { setBusy(false) }
  }

  async function handleSaveAttendance(sessionLabel: string, date: string, records: { user_id: string; present: boolean }[]) {
    setBusy(true)
    try {
      await recordSessionAttendance(DEPT, sessionLabel, date, records)
      notify('Attendance saved')
      await loadAll()
    } catch { notify('Failed to save attendance', false) }
    finally { setBusy(false) }
  }

  // ─── Auth Guard ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800">
        <Loader2 className="animate-spin text-white" size={36} />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Children Ministry</p>
            <h1 className="text-lg font-extrabold leading-tight">Coordinator Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-blue-200 font-medium">{user.email}</span>
            <button
              onClick={loadAll}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              title="Refresh"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* ── Pending alert strip ──────────────────────────────────────────── */}
        <AnimatePresence>
          {pendingMembers.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500 overflow-hidden"
            >
              <button
                onClick={() => setTab('enrollments')}
                className="w-full text-center py-2 text-xs font-bold text-white flex items-center justify-center gap-2"
              >
                <AlertCircle size={14} />
                {pendingMembers.length} enrolment{pendingMembers.length > 1 ? 's' : ''} pending review — Approve Now →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex min-w-max px-4 pb-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                  tab === t.id ? 'text-white' : 'text-blue-300 hover:text-blue-100'
                }`}
              >
                {t.icon}
                {t.label}
                {t.id === 'enrollments' && pendingMembers.length > 0 && (
                  <span className="ml-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingMembers.length}
                  </span>
                )}
                {tab === t.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'overview' && (
              <OverviewTab
                stats={stats}
                members={members}
                announcements={announcements}
                activities={activities}
                pendingCount={pendingMembers.length}
                onGoEnrolments={() => setTab('enrollments')}
              />
            )}
            {tab === 'enrollments' && (
              <EnrolmentsTab
                pending={pendingMembers}
                busy={busy}
                onApprove={handleApproveEnrolment}
                onDecline={handleDeclineEnrolment}
              />
            )}
            {tab === 'members' && (
              <MembersTab
                members={members}
                busy={busy}
                onAdd={handleAddMember}
                onRemove={handleRemoveMember}
                onToggleActive={handleToggleActive}
                onApprove={handleApproveEnrolment}
              />
            )}
            {tab === 'notices' && (
              <NoticesTab
                announcements={announcements}
                busy={busy}
                onPost={handlePostAnnouncement}
                onDelete={handleDeleteAnnouncement}
              />
            )}
            {tab === 'programs' && (
              <ProgramsTab
                activities={activities}
                busy={busy}
                onPost={handlePostActivity}
                onDelete={handleDeleteActivity}
              />
            )}
            {tab === 'attendance' && (
              <AttendanceTab
                members={activeMembers}
                attendance={attendance}
                busy={busy}
                onSave={handleSaveAttendance}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({
  stats, members, announcements, activities, pendingCount, onGoEnrolments,
}: {
  stats: DeptStats | null
  members: DeptMember[]
  announcements: DeptAnnouncement[]
  activities: DeptActivity[]
  pendingCount: number
  onGoEnrolments: () => void
}) {
  const activeCount = members.filter(m => m.is_active).length
  const totalCount  = members.length

  const ageGroupCounts = AGE_GROUPS.map(g => ({
    ...g,
    count: members.filter(m => {
      const label = (m.role_label ?? m.notes ?? '').toLowerCase()
      return label.includes(g.key)
    }).length,
  }))

  const recentNotices   = [...announcements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3)
  const upcomingPrograms = [...activities].sort((a, b) => new Date(a.activity_date ?? '').getTime() - new Date(b.activity_date ?? '').getTime()).slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Enrolled" value={totalCount} icon={<Users size={20} />} accent="bg-blue-600" />
        <StatCard label="Active Children" value={activeCount} icon={<UserCheck size={20} />} accent="bg-green-600" />
        <StatCard label="Total Programmes" value={activities.length} icon={<Calendar size={20} />} accent="bg-orange-500" />
        <StatCard label="Total Notices" value={announcements.length} icon={<Bell size={20} />} accent="bg-violet-600" />
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <motion.button
          onClick={onGoEnrolments}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4 text-left hover:bg-amber-100 transition"
        >
          <AlertCircle className="text-amber-500 shrink-0" size={22} />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {pendingCount} enrolment{pendingCount > 1 ? 's' : ''} pending review
            </p>
            <p className="text-xs text-amber-600">Tap to review and approve →</p>
          </div>
        </motion.button>
      )}

      {/* Age Group Breakdown */}
      <div>
        <SectionHeading>Age Group Breakdown</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          {ageGroupCounts.map(g => (
            <div key={g.key} className={`rounded-2xl border p-4 ${g.color}`}>
              <p className="text-2xl mb-1">{g.icon}</p>
              <p className="text-2xl font-extrabold">{g.count}</p>
              <p className="text-xs font-semibold mt-0.5">{g.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notices */}
      <div>
        <SectionHeading>Recent Notices</SectionHeading>
        {recentNotices.length === 0
          ? <EmptyState icon={<Bell />} message="No notices yet" />
          : (
            <div className="space-y-2">
              {recentNotices.map(a => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-start gap-3">
                  {a.is_urgent && <Zap size={15} className="text-red-500 mt-0.5 shrink-0" />}
                  {a.is_pinned && !a.is_urgent && <Pin size={15} className="text-blue-500 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500">{fmtDate(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Upcoming Programs */}
      <div>
        <SectionHeading>Upcoming Programmes</SectionHeading>
        {upcomingPrograms.length === 0
          ? <EmptyState icon={<Calendar />} message="No programmes yet" />
          : (
            <div className="space-y-2">
              {upcomingPrograms.map(a => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <ProgramBadge type={a.activity_type} />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} /> {fmtDate(a.activity_date ?? '')}
                      {a.venue && <><MapPin size={11} className="ml-2" /> {a.venue}</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ENROLMENTS (Pending Approvals)
// ═══════════════════════════════════════════════════════════════════════════════
function EnrolmentsTab({
  pending, busy, onApprove, onDecline,
}: {
  pending: DeptMember[]
  busy: boolean
  onApprove: (m: DeptMember) => Promise<void>
  onDecline: (m: DeptMember) => Promise<void>
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Pending Enrolments</h2>
        <span className="text-xs text-gray-500">{pending.length} awaiting</span>
      </div>

      {pending.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center gap-2"
        >
          <CheckCircle2 className="text-green-500" size={32} />
          <p className="text-sm font-bold text-green-700">All enrolments approved ✓</p>
          <p className="text-xs text-green-500">No pending applications</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {pending.map(m => (
            <motion.div
              key={m.user_id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initials(m.name ?? m.email ?? '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{m.name || '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <AgeGroupBadge member={m} />
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> Submitted {fmtDate(m.joined_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  disabled={busy}
                  onClick={() => onApprove(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => onDecline(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  <X size={14} /> Decline
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════
function MembersTab({
  members, busy, onAdd, onRemove, onToggleActive, onApprove,
}: {
  members: DeptMember[]
  busy: boolean
  onAdd: (d: { email: string; role_label: string; notes: string }) => Promise<void>
  onRemove: (m: DeptMember) => Promise<void>
  onToggleActive: (m: DeptMember) => Promise<void>
  onApprove: (m: DeptMember) => Promise<void>
}) {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all' | 'active' | 'toddler' | 'kids' | 'preteen' | 'teen'>('all')
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ email: '', role_label: 'Kids (4-7)', notes: '' })

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || (m.name ?? '').toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q)
    if (!matchSearch) return false
    if (filter === 'all') return true
    if (filter === 'active') return m.is_active
    const label = (m.role_label ?? m.notes ?? '').toLowerCase()
    return label.includes(filter)
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await onAdd(form)
    setForm({ email: '', role_label: 'Kids (4-7)', notes: '' })
    setShowAdd(false)
  }

  const filterOptions = [
    { key: 'all',     label: 'All' },
    { key: 'active',  label: 'Active' },
    { key: 'toddler', label: 'Toddlers' },
    { key: 'kids',    label: 'Kids' },
    { key: 'preteen', label: 'Preteens' },
    { key: 'teen',    label: 'Teens' },
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Children</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition"
        >
          <Plus size={14} /> Add Enrolment
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <p className="text-sm font-bold text-blue-800">New Enrolment</p>
            <input
              required
              type="email"
              placeholder="Parent / guardian email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
            <select
              value={form.role_label}
              onChange={e => setForm(f => ({ ...f, role_label: e.target.value }))}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option>Toddler (0-3)</option>
              <option>Kids (4-7)</option>
              <option>Preteen (8-12)</option>
              <option>Teen (13+)</option>
            </select>
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {busy ? 'Submitting…' : 'Submit Enrolment'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search children or parents…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {filterOptions.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              filter === f.key
                ? 'bg-blue-800 text-white border-blue-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Member cards */}
      {filtered.length === 0
        ? <EmptyState icon={<Users />} message="No children found" />
        : (
          <div className="space-y-2">
            {filtered.map(m => (
              <motion.div
                key={m.user_id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${m.is_active ? 'bg-gradient-to-br from-blue-700 to-blue-500' : 'bg-gray-300'}`}>
                    {initials(m.name ?? m.email ?? '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 truncate">{m.name || m.email}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.is_active ? 'Active' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <AgeGroupBadge member={m} />
                      <span className="text-xs text-gray-400">Enrolled {fmtDate(m.joined_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {!m.is_active && (
                    <button
                      disabled={busy}
                      onClick={() => onApprove(m)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition disabled:opacity-50"
                    >
                      <Check size={12} /> Approve
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => onToggleActive(m)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 ${
                      m.is_active
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                  >
                    {m.is_active ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => onRemove(m)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: NOTICES
// ═══════════════════════════════════════════════════════════════════════════════
function NoticesTab({
  announcements, busy, onPost, onDelete,
}: {
  announcements: DeptAnnouncement[]
  busy: boolean
  onPost: (d: { title: string; body: string; urgent: boolean; pinned: boolean }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ title: '', body: '', urgent: false, pinned: false })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await onPost(form)
    setForm({ title: '', body: '', urgent: false, pinned: false })
    setShowForm(false)
  }

  const sorted = [...announcements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    if (a.is_urgent && !b.is_urgent) return -1
    if (!a.is_urgent && b.is_urgent) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Notices</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition"
        >
          <Plus size={14} /> Post Notice
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <p className="text-sm font-bold text-blue-800">New Notice</p>
            <input
              required
              placeholder="Title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
            <textarea
              required
              placeholder="Body…"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none"
            />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.urgent} onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))} className="accent-red-500" />
                <Zap size={13} className="text-red-500" /> Urgent
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} className="accent-blue-600" />
                <Pin size={13} className="text-blue-600" /> Pin
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="flex-1 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-sm font-bold transition disabled:opacity-50">
                {busy ? 'Posting…' : 'Post Notice'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {sorted.length === 0
        ? <EmptyState icon={<Bell />} message="No notices yet" />
        : (
          <div className="space-y-3">
            {sorted.map(a => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${a.is_urgent ? 'border-red-300' : a.is_pinned ? 'border-blue-300' : 'border-gray-100'}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {a.is_urgent && <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><Zap size={10} /> Urgent</span>}
                      {a.is_pinned && <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5"><Pin size={10} /> Pinned</span>}
                    </div>
                    <p className="font-bold text-gray-800">{a.title}</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.body}</p>
                    <p className="text-xs text-gray-400 mt-2">{fmtDate(a.created_at)}{a.author_name ? ` · ${a.author_name}` : ''}</p>
                  </div>
                  <button
                    onClick={() => onDelete(a.id)}
                    disabled={busy}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PROGRAMS
// ═══════════════════════════════════════════════════════════════════════════════
function ProgramsTab({
  activities, busy, onPost, onDelete,
}: {
  activities: DeptActivity[]
  busy: boolean
  onPost: (d: { title: string; description: string; activity_type: string; scheduled_at: string; venue: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', activity_type: 'sunday-school',
    date: '', time: '', venue: '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const scheduled_at = form.date && form.time ? `${form.date}T${form.time}` : form.date
    await onPost({ title: form.title, description: form.description, activity_type: form.activity_type, scheduled_at, venue: form.venue })
    setForm({ title: '', description: '', activity_type: 'sunday-school', date: '', time: '', venue: '' })
    setShowForm(false)
  }

  const sorted = [...activities].sort((a, b) => new Date(b.activity_date ?? '').getTime() - new Date(a.activity_date ?? '').getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Programmes</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition"
        >
          <Plus size={14} /> Add Programme
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <p className="text-sm font-bold text-orange-800">New Programme</p>
            <input
              required
              placeholder="Programme title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white resize-none"
            />
            <select
              value={form.activity_type}
              onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}
              className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              {PROGRAM_TYPES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>
            <input
              placeholder="Venue (optional)"
              value={form.venue}
              onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition disabled:opacity-50">
                {busy ? 'Adding…' : 'Add Programme'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {sorted.length === 0
        ? <EmptyState icon={<Calendar />} message="No programmes yet" />
        : (
          <div className="space-y-3">
            {sorted.map(a => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5">
                      <ProgramBadge type={a.activity_type} />
                    </div>
                    <p className="font-bold text-gray-800">{a.title}</p>
                    {a.description && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{a.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {fmtDate(a.activity_date ?? '')}</span>
                      {a.venue && <span className="flex items-center gap-1"><MapPin size={11} /> {a.venue}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(a.id)}
                    disabled={busy}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════
function AttendanceTab({
  members, attendance, busy, onSave,
}: {
  members: DeptMember[]
  attendance: AttendanceRow[]
  busy: boolean
  onSave: (sessionLabel: string, date: string, records: { user_id: string; present: boolean }[]) => Promise<void>
}) {
  const [sessionLabel, setSessionLabel] = useState('')
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0])
  const [ageFilter, setAgeFilter]       = useState<'all' | 'toddler' | 'kids' | 'preteen' | 'teen'>('all')
  const [present, setPresent]           = useState<Record<string, boolean>>({})
  const [histSearch, setHistSearch]     = useState('')

  const filteredMembers = members.filter(m => {
    if (ageFilter === 'all') return true
    const label = (m.role_label ?? m.notes ?? '').toLowerCase()
    return label.includes(ageFilter)
  })

  const presentCount = filteredMembers.filter(m => present[m.user_id]).length
  const absentCount  = filteredMembers.length - presentCount

  function toggleAll(val: boolean) {
    const next: Record<string, boolean> = { ...present }
    filteredMembers.forEach(m => { next[m.user_id] = val })
    setPresent(next)
  }

  async function handleSave() {
    if (!sessionLabel || !date) return
    const records = members.map(m => ({ user_id: m.user_id, present: !!present[m.user_id] }))
    await onSave(sessionLabel, date, records)
    setPresent({})
    setSessionLabel('')
  }

  // History grouping by session
  const histFiltered = attendance.filter(r => {
    const q = histSearch.toLowerCase()
    return !q || (r.member_name ?? '').toLowerCase().includes(q) || (r.session_label ?? '').toLowerCase().includes(q)
  })
  const sessions = Array.from(new Set(histFiltered.map(r => r.session_label))).slice(0, 20)

  const ageOptions = [
    { key: 'all',     label: 'All' },
    { key: 'toddler', label: 'Toddlers' },
    { key: 'kids',    label: 'Kids' },
    { key: 'preteen', label: 'Preteens' },
    { key: 'teen',    label: 'Teens' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Section A: Record */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <BookOpen size={16} className="text-blue-700" /> Record Session Attendance
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Session label (e.g. Sunday School)"
            value={sessionLabel}
            onChange={e => setSessionLabel(e.target.value)}
            className="col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={ageFilter}
            onChange={e => setAgeFilter(e.target.value as typeof ageFilter)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {ageOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-semibold">
            {presentCount} present / {absentCount} absent
          </p>
          <div className="flex gap-2">
            <button onClick={() => toggleAll(true)} className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-700 font-bold hover:bg-green-100 transition">Mark All Present</button>
            <button onClick={() => toggleAll(false)} className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition">Clear All</button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filteredMembers.length === 0
            ? <EmptyState icon={<Users />} message="No active children in this group" />
            : filteredMembers.map(m => (
              <label
                key={m.user_id}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${present[m.user_id] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}
              >
                <input
                  type="checkbox"
                  checked={!!present[m.user_id]}
                  onChange={e => setPresent(p => ({ ...p, [m.user_id]: e.target.checked }))}
                  className="accent-green-600 w-4 h-4"
                />
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {initials(m.name ?? m.email ?? '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{m.name || m.email}</p>
                  <AgeGroupBadge member={m} />
                </div>
                {present[m.user_id]
                  ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  : <XCircle size={16} className="text-gray-300 shrink-0" />
                }
              </label>
            ))
          }
        </div>

        <button
          disabled={busy || !sessionLabel || !date}
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm transition disabled:opacity-40"
        >
          {busy ? 'Saving…' : 'Save Attendance'}
        </button>
      </div>

      {/* Section B: History */}
      <div>
        <SectionHeading>Attendance History</SectionHeading>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by child or session…"
            value={histSearch}
            onChange={e => setHistSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>

        {sessions.length === 0
          ? <EmptyState icon={<BarChart2 />} message="No attendance records yet" />
          : sessions.map(session => {
            const rows = histFiltered.filter(r => r.session_label === session)
            const pct  = rows.length > 0 ? Math.round(rows.filter(r => r.present).length / rows.length * 100) : 0
            return (
              <SessionGroup key={session} session={session} rows={rows} pct={pct} />
            )
          })
        }
      </div>
    </div>
  )
}

function SessionGroup({ session, rows, pct }: { session: string; rows: AttendanceRow[]; pct: number }) {
  const [open, setOpen] = useState(false)
  const date = rows[0]?.session_date ?? ''

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-2 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <p className="text-sm font-bold text-gray-800">{session}</p>
          <p className="text-xs text-gray-400">{fmtDate(date)} · {rows.length} children · {pct}% present</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full border-4 border-green-200 flex items-center justify-center">
            <span className="text-[10px] font-bold text-green-600">{pct}%</span>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="px-4 pb-3 pt-2 space-y-1">
              {rows.map((r, i) => (
                <div key={i} className={`flex items-center justify-between py-1.5 text-sm ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <span className="text-gray-700 font-medium">{r.member_name || r.user_id}</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${r.present ? 'text-green-600' : 'text-red-500'}`}>
                    {r.present ? <><CheckCircle2 size={13} /> Present</> : <><XCircle size={13} /> Absent</>}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

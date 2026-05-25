'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Bell, BarChart2, Calendar, Home, LogOut,
  Plus, Search, Trash2, CheckCircle2, XCircle,
  Pin, AlertCircle, Clock, MapPin, UserCheck, UserX, Loader2, RefreshCw,
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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-medium ${ok ? 'bg-green-600' : 'bg-red-600'}`}>
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {msg}
    </div>
  )
}

type Tab = 'overview' | 'members' | 'notices' | 'activities' | 'attendance'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Overview',    icon: <Home size={16} /> },
  { id: 'members',    label: 'Members',     icon: <Users size={16} /> },
  { id: 'notices',    label: 'Notices',     icon: <Bell size={16} /> },
  { id: 'activities', label: 'Activities',  icon: <Calendar size={16} /> },
  { id: 'attendance', label: 'Attendance',  icon: <BarChart2 size={16} /> },
]

export default function ChildrenCoordinatorDashboard() {
  const { user, loading: authLoading } = useDeptAuth(['children_coordinator', 'admin'])

  const [tab, setTab]   = useState<Tab>('overview')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const [stats, setStats]               = useState<DeptStats | null>(null)
  const [members, setMembers]           = useState<DeptMember[]>([])
  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities, setActivities]     = useState<DeptActivity[]>([])
  const [attendance, setAttendance]     = useState<AttendanceRow[]>([])
  const [loadingData, setLoadingData]   = useState(false)

  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole]   = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const [annTitle, setAnnTitle]   = useState('')
  const [annBody, setAnnBody]     = useState('')
  const [annUrgent, setAnnUrgent] = useState(false)
  const [annPinned, setAnnPinned] = useState(false)
  const [postingAnn, setPostingAnn] = useState(false)

  const [actTitle, setActTitle]   = useState('')
  const [actDesc, setActDesc]     = useState('')
  const [actType, setActType]     = useState('meeting')
  const [actDate, setActDate]     = useState('')
  const [actTime, setActTime]     = useState('')
  const [actVenue, setActVenue]   = useState('')
  const [postingAct, setPostingAct] = useState(false)

  const [sessionLabel, setSessionLabel]     = useState('')
  const [sessionDate, setSessionDate]       = useState('')
  const [sessionEntries, setSessionEntries] = useState<Record<string, boolean>>({})
  const [savingAtt, setSavingAtt]           = useState(false)
  const [attFilter, setAttFilter]           = useState('')

  const toast$ = (msg: string, ok = true) => setToast({ msg, ok })

  const loadAll = useCallback(async () => {
    setLoadingData(true)
    try {
      const [s, m, a, ac, att] = await Promise.all([
        getDeptStats(DEPT), listMembers(DEPT), listAnnouncements(DEPT),
        listActivities(DEPT), listAttendance(DEPT),
      ])
      setStats(s); setMembers(m); setAnnouncements(a); setActivities(ac); setAttendance(att)
    } catch (e: unknown) {
      toast$((e as Error).message || 'Failed to load data', false)
    } finally { setLoadingData(false) }
  }, [])

  useEffect(() => { if (!authLoading && user) loadAll() }, [authLoading, user, loadAll])

  useEffect(() => {
    const init: Record<string, boolean> = {}
    members.filter(m => m.is_active).forEach(m => { init[m.user_id] = false })
    setSessionEntries(init)
  }, [members])

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!memberEmail.trim()) return
    setAddingMember(true)
    try {
      await addMember(DEPT, memberEmail.trim(), memberRole.trim() || undefined)
      toast$('Member added successfully')
      setMemberEmail(''); setMemberRole('')
      setMembers(await listMembers(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to add member', false)
    } finally { setAddingMember(false) }
  }

  async function handleToggleActive(m: DeptMember) {
    try {
      await updateMember(DEPT, m.user_id, { is_active: !m.is_active })
      toast$(m.is_active ? 'Member deactivated' : 'Member activated')
      setMembers(await listMembers(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to update', false)
    }
  }

  async function handleRemoveMember(m: DeptMember) {
    if (!confirm(`Remove ${m.name} from Children Ministry?`)) return
    try {
      await removeMember(DEPT, m.user_id)
      toast$('Member removed')
      setMembers(await listMembers(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to remove', false)
    }
  }

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
      toast$('Deleted')
      setAnnouncements(await listAnnouncements(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to delete', false)
    }
  }

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
      toast$('Deleted')
      setActivities(await listActivities(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to delete', false)
    }
  }

  async function handleSaveAttendance(e: React.FormEvent) {
    e.preventDefault()
    if (!sessionLabel.trim() || !sessionDate) { toast$('Session label and date required', false); return }
    setSavingAtt(true)
    try {
      const entries = Object.entries(sessionEntries).map(([user_id, present]) => ({ user_id, present }))
      await recordSessionAttendance(DEPT, sessionLabel, sessionDate, entries)
      toast$('Attendance recorded')
      setSessionLabel(''); setSessionDate('')
      setAttendance(await listAttendance(DEPT))
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to save', false)
    } finally { setSavingAtt(false) }
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-violet-50">
      <Loader2 className="animate-spin text-violet-600" size={36} />
    </div>
  )

  const activeMembers = members.filter(m => m.is_active)
  const filteredMembers = members.filter(m =>
    !memberSearch ||
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  )
  const filteredAtt = attendance.filter(r =>
    !attFilter ||
    r.session_label.toLowerCase().includes(attFilter.toLowerCase()) ||
    r.member_name.toLowerCase().includes(attFilter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-violet-50 font-sans">
      {/* Header */}
      <header className="bg-violet-700 text-white px-4 py-4 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Children Ministry</div>
          <h1 className="text-lg font-bold">Coordinator Dashboard</h1>
          {user && <div className="text-xs opacity-70 mt-0.5">{user.name}</div>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAll} disabled={loadingData} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
            <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); window.location.href = '/auth/login' }}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="bg-white border-b border-violet-100 flex overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-violet-600'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      <main className="max-w-4xl mx-auto p-4 space-y-4 pb-10">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Members',  value: stats?.total_members ?? '—',       color: 'bg-violet-600' },
                { label: 'Announcements',  value: stats?.total_announcements ?? '—', color: 'bg-purple-600' },
                { label: 'Activities',     value: stats?.total_activities ?? '—',    color: 'bg-fuchsia-600' },
              ].map(s => (
                <div key={s.label} className={`${s.color} text-white rounded-2xl p-4 text-center shadow`}>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs mt-1 opacity-85">{s.label}</div>
                </div>
              ))}
            </div>

            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Bell size={16} className="text-violet-500" /> Recent Notices
              </h2>
              {announcements.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No announcements yet</p>
              ) : announcements.slice(0, 3).map(a => (
                <div key={a.id} className="border-l-4 border-violet-400 pl-3 py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">{a.title}</span>
                    {a.is_urgent && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Urgent</span>}
                    {a.is_pinned && <Pin size={12} className="text-violet-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.body}</p>
                </div>
              ))}
            </section>

            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-violet-500" /> Upcoming Activities
              </h2>
              {activities.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No activities scheduled</p>
              ) : activities.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="bg-violet-100 rounded-xl p-2"><Calendar size={14} className="text-violet-600" /></div>
                  <div>
                    <div className="font-medium text-sm text-gray-800">{a.title}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      {a.activity_date && <span className="flex items-center gap-1"><Clock size={11} />{a.activity_date}</span>}
                      {a.venue && <span className="flex items-center gap-1"><MapPin size={11} />{a.venue}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users size={16} className="text-violet-500" /> Active Members ({activeMembers.length})
              </h2>
              {activeMembers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No active members yet</p>
              ) : activeMembers.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-800 font-bold text-xs">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{m.name}</div>
                    {m.role_label && <div className="text-xs text-gray-400">{m.role_label}</div>}
                  </div>
                </div>
              ))}
              {activeMembers.length > 5 && (
                <button onClick={() => setTab('members')} className="text-violet-600 text-xs mt-2 hover:underline">
                  View all {activeMembers.length} members →
                </button>
              )}
            </section>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div className="space-y-4">
            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Add Member by Email</h2>
              <form onSubmit={handleAddMember} className="space-y-3">
                <input
                  type="email" required
                  placeholder="member@email.com"
                  value={memberEmail} onChange={e => setMemberEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <input
                  type="text"
                  placeholder="Class / Group (optional)"
                  value={memberRole} onChange={e => setMemberRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button type="submit" disabled={addingMember}
                  className="w-full bg-violet-700 text-white rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-800 disabled:opacity-50">
                  {addingMember ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add Member
                </button>
              </form>
            </section>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search members…"
                value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            <section className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              {filteredMembers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  {members.length === 0 ? 'No members yet. Add one above.' : 'No members match your search.'}
                </p>
              ) : filteredMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">{m.name}</div>
                    <div className="text-xs text-gray-400 truncate">{m.email}</div>
                    {m.role_label && <div className="text-xs text-violet-600 mt-0.5">{m.role_label}</div>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => handleToggleActive(m)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      {m.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button onClick={() => handleRemoveMember(m)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ── NOTICES ── */}
        {tab === 'notices' && (
          <div className="space-y-4">
            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Post Announcement</h2>
              <form onSubmit={handlePostAnnouncement} className="space-y-3">
                <input
                  type="text" required placeholder="Title"
                  value={annTitle} onChange={e => setAnnTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <textarea
                  required rows={3} placeholder="Message…"
                  value={annBody} onChange={e => setAnnBody(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={annUrgent} onChange={e => setAnnUrgent(e.target.checked)} className="accent-red-500" />
                    <AlertCircle size={14} className="text-red-500" /> Urgent
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={annPinned} onChange={e => setAnnPinned(e.target.checked)} className="accent-violet-500" />
                    <Pin size={14} className="text-violet-500" /> Pin
                  </label>
                </div>
                <button type="submit" disabled={postingAnn}
                  className="w-full bg-violet-700 text-white rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-800 disabled:opacity-50">
                  {postingAnn ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Post Announcement
                </button>
              </form>
            </section>

            <section className="space-y-3">
              {announcements.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">No announcements yet</p>
                </div>
              ) : announcements.map(a => (
                <div key={a.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${a.is_urgent ? 'border-red-400' : a.is_pinned ? 'border-violet-400' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-800">{a.title}</span>
                        {a.is_urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Urgent</span>}
                        {a.is_pinned && <Pin size={12} className="text-violet-500" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{a.body}</p>
                      <div className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                        {a.author_name && <span>By {a.author_name}</span>}
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-400 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ── ACTIVITIES ── */}
        {tab === 'activities' && (
          <div className="space-y-4">
            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Schedule Activity</h2>
              <form onSubmit={handlePostActivity} className="space-y-3">
                <input
                  type="text" required placeholder="Activity Title"
                  value={actTitle} onChange={e => setActTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <textarea
                  rows={2} placeholder="Description (optional)"
                  value={actDesc} onChange={e => setActDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
                <select
                  value={actType} onChange={e => setActType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="meeting">Meeting</option>
                  <option value="service">Service</option>
                  <option value="class">Class</option>
                  <option value="outreach">Outreach</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={actDate} onChange={e => setActDate(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <input type="time" value={actTime} onChange={e => setActTime(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <input
                  type="text" placeholder="Venue (optional)"
                  value={actVenue} onChange={e => setActVenue(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button type="submit" disabled={postingAct}
                  className="w-full bg-violet-700 text-white rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-800 disabled:opacity-50">
                  {postingAct ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Schedule
                </button>
              </form>
            </section>

            <section className="space-y-3">
              {activities.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <Calendar size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">No activities scheduled</p>
                </div>
              ) : activities.map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-xs uppercase tracking-wide text-violet-600 font-semibold">{a.activity_type}</span>
                      <div className="font-semibold text-gray-800 mt-0.5">{a.title}</div>
                      {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                      <div className="text-xs text-gray-400 mt-2 flex items-center gap-3 flex-wrap">
                        {a.activity_date && <span className="flex items-center gap-1"><Clock size={11} />{a.activity_date}{a.activity_time ? ` at ${a.activity_time}` : ''}</span>}
                        {a.venue && <span className="flex items-center gap-1"><MapPin size={11} />{a.venue}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteActivity(a.id)}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-400 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {tab === 'attendance' && (
          <div className="space-y-4">
            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Record Session Attendance</h2>
              <form onSubmit={handleSaveAttendance} className="space-y-3">
                <input
                  type="text" required
                  placeholder="Session label (e.g. Sunday Class)"
                  value={sessionLabel} onChange={e => setSessionLabel(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <input
                  type="date" required
                  value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                {activeMembers.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-2">Add active members first</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</div>
                    {activeMembers.map(m => (
                      <label key={m.user_id} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-violet-50">
                        <input
                          type="checkbox"
                          checked={!!sessionEntries[m.user_id]}
                          onChange={e => setSessionEntries(prev => ({ ...prev, [m.user_id]: e.target.checked }))}
                          className="accent-violet-600 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{m.name}</span>
                        {m.role_label && <span className="text-xs text-gray-400 ml-auto">{m.role_label}</span>}
                      </label>
                    ))}
                  </div>
                )}
                <button type="submit" disabled={savingAtt || activeMembers.length === 0}
                  className="w-full bg-violet-700 text-white rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-800 disabled:opacity-50">
                  {savingAtt ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Save Attendance
                </button>
              </form>
            </section>

            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700">Attendance History</h2>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" placeholder="Filter…"
                    value={attFilter} onChange={e => setAttFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 w-36"
                  />
                </div>
              </div>
              {filteredAtt.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2 font-medium">Member</th>
                        <th className="text-left pb-2 font-medium">Session</th>
                        <th className="text-left pb-2 font-medium">Date</th>
                        <th className="text-center pb-2 font-medium">Present</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAtt.map(r => (
                        <tr key={r.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 text-gray-700">{r.member_name}</td>
                          <td className="py-2 text-gray-500 text-xs">{r.session_label}</td>
                          <td className="py-2 text-gray-400 text-xs">{r.session_date}</td>
                          <td className="py-2 text-center">
                            {r.present
                              ? <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                              : <XCircle size={16} className="text-red-300 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  )
}

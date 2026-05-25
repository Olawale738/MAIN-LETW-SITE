'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Users, Bell, Calendar, BarChart2, Music, LogOut,
  Plus, Trash2, Search, CheckCircle2, XCircle, Loader2,
  AlertCircle, ChevronDown, ChevronUp, Send, Home, Music2
} from 'lucide-react'
import Link from 'next/link'
import { useDeptAuth } from '@/hooks/useDeptAuth'
import {
  listMembers, addMember, removeMember, updateMember,
  listAnnouncements, createAnnouncement, deleteAnnouncement,
  listActivities, createActivity, deleteActivity,
  listAttendance, recordSessionAttendance, getDeptStats,
  type DeptMember, type DeptAnnouncement, type DeptActivity,
  type AttendanceRow, type DeptStats,
} from '@/lib/dept-api'

type Tab = 'home' | 'members' | 'announcements' | 'activities' | 'attendance'

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl ${ok ? 'bg-green-600' : 'bg-red-600'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {msg}
    </div>
  )
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="w-12 h-12 text-gray-300 mb-3" />
      <p className="font-bold text-gray-500 mb-1">{title}</p>
      <p className="text-sm text-gray-400">{sub}</p>
    </div>
  )
}

export default function ChoirmasterDashboard() {
  const { user, loading } = useDeptAuth(['choirmaster', 'admin'])
  const [tab, setTab] = useState<Tab>('home')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Data
  const [stats, setStats] = useState<DeptStats | null>(null)
  const [members, setMembers] = useState<DeptMember[]>([])
  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities, setActivities] = useState<DeptActivity[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])

  // UI
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  // Forms
  const [addEmail, setAddEmail] = useState('')
  const [addLabel, setAddLabel] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [annTitle, setAnnTitle] = useState('')
  const [annBody, setAnnBody] = useState('')
  const [annUrgent, setAnnUrgent] = useState(false)
  const [actTitle, setActTitle] = useState('')
  const [actType, setActType] = useState('rehearsal')
  const [actDate, setActDate] = useState('')
  const [actTime, setActTime] = useState('')
  const [actVenue, setActVenue] = useState('')
  const [sessLabel, setSessLabel] = useState('')
  const [sessDate, setSessDate] = useState(new Date().toISOString().slice(0, 10))
  const [sessMarks, setSessMarks] = useState<Record<string, boolean>>({})

  const notify = (msg: string, ok = true) => setToast({ msg, ok })

  const load = useCallback(async () => {
    if (!user) return
    const [s, m, a, ac] = await Promise.all([
      getDeptStats('choir').catch(() => null),
      listMembers('choir').catch(() => []),
      listAnnouncements('choir').catch(() => []),
      listActivities('choir').catch(() => []),
    ])
    setStats(s)
    setMembers(m)
    setAnnouncements(a)
    setActivities(ac)
    const defaultMarks: Record<string, boolean> = {}
    m.filter(x => x.is_active).forEach(x => { defaultMarks[x.user_id] = true })
    setSessMarks(defaultMarks)
  }, [user])

  useEffect(() => { if (user) load() }, [user, load])

  const handleAddMember = async () => {
    if (!addEmail.trim()) return
    setBusy(true)
    try {
      const r = await addMember('choir', addEmail.trim(), addLabel || undefined, addNotes || undefined)
      notify(r.message)
      setAddEmail(''); setAddLabel(''); setAddNotes('')
      load()
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the choir?`)) return
    try {
      const r = await removeMember('choir', userId)
      notify(r.message); load()
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', false) }
  }

  const handlePostAnn = async () => {
    if (!annTitle.trim() || !annBody.trim()) return
    setBusy(true)
    try {
      const r = await createAnnouncement('choir', { title: annTitle, body: annBody, is_urgent: annUrgent })
      notify(r.message)
      setAnnTitle(''); setAnnBody(''); setAnnUrgent(false)
      load()
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  const handleDeleteAnn = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    try { const r = await deleteAnnouncement('choir', id); notify(r.message); load() }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', false) }
  }

  const handlePostActivity = async () => {
    if (!actTitle.trim()) return
    setBusy(true)
    try {
      const r = await createActivity('choir', { title: actTitle, activity_type: actType, activity_date: actDate || undefined, activity_time: actTime || undefined, venue: actVenue || undefined })
      notify(r.message)
      setActTitle(''); setActDate(''); setActTime(''); setActVenue('')
      load()
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Delete this activity?')) return
    try { const r = await deleteActivity('choir', id); notify(r.message); load() }
    catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', false) }
  }

  const handleRecordAttendance = async () => {
    if (!sessLabel.trim() || !sessDate) { notify('Session label and date required', false); return }
    const entries = Object.entries(sessMarks).map(([user_id, present]) => ({ user_id, present }))
    if (!entries.length) { notify('No members to mark', false); return }
    setBusy(true)
    try {
      const r = await recordSessionAttendance('choir', sessLabel, sessDate, entries)
      notify(r.message); setSessLabel('')
      const att = await listAttendance('choir').catch(() => [])
      setAttendance(att)
    } catch (e: unknown) { notify(e instanceof Error ? e.message : 'Failed', false) }
    finally { setBusy(false) }
  }

  const loadAttendance = async () => {
    const att = await listAttendance('choir').catch(() => [])
    setAttendance(att)
  }

  const activeMembers = members.filter(m => m.is_active)
  const filtered = activeMembers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0035]">
      <Loader2 className="w-8 h-8 text-[#f5bb00] animate-spin" />
    </div>
  )

  const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'announcements', label: 'Notices', icon: Bell },
    { id: 'activities', label: 'Activities', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5fa] flex flex-col">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#140152,#2d0a6e)' }} className="px-6 py-4 flex items-center gap-4">
        <div className="w-9 h-9 bg-[#f5bb00] rounded-xl flex items-center justify-center flex-shrink-0">
          <Flame className="w-5 h-5 text-[#140152]" />
        </div>
        <div className="flex-1">
          <p className="font-black text-white text-sm tracking-wide">ALTER SOUND — CHOIRMASTER</p>
          <p className="text-white/50 text-xs">{user?.name}</p>
        </div>
        <Link href="/services/alter-sound" className="text-white/50 hover:text-white text-xs transition-colors">← Back</Link>
        <button onClick={() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); window.location.href = '/auth/login' }}
          className="text-white/50 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex min-w-max">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTab(id); if (id === 'attendance') loadAttendance() }}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${tab === id ? 'border-[#140152] text-[#140152]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <h1 className="text-2xl font-black text-[#140152]">Choirmaster Dashboard</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Active Members', val: stats?.total_members ?? '—', icon: Users, color: '#7c3aed' },
                  { label: 'Announcements', val: stats?.total_announcements ?? '—', icon: Bell, color: '#2563eb' },
                  { label: 'Activities', val: stats?.total_activities ?? '—', icon: Calendar, color: '#16a34a' },
                  { label: 'Songs in Library', val: '—', icon: Music2, color: '#d97706' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <s.icon className="w-6 h-6 mb-3" style={{ color: s.color }} />
                    <p className="text-3xl font-black text-[#140152]">{s.val}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {announcements.slice(0, 3).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h2 className="font-bold text-[#140152] mb-3">Recent Notices</h2>
                  <div className="space-y-3">
                    {announcements.slice(0, 3).map(a => (
                      <div key={a.id} className={`p-3 rounded-xl border text-sm ${a.is_urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="font-semibold text-[#140152]">{a.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{a.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activities.slice(0, 3).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h2 className="font-bold text-[#140152] mb-3">Upcoming Activities</h2>
                  <div className="space-y-2">
                    {activities.slice(0, 3).map(a => (
                      <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <Calendar className="w-4 h-4 text-[#140152] flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#140152]">{a.title}</p>
                          <p className="text-xs text-gray-400">{a.activity_date || 'Date TBD'}{a.venue ? ` · ${a.venue}` : ''}</p>
                        </div>
                        <span className="text-[10px] bg-[#140152]/10 text-[#140152] px-2 py-0.5 rounded-full font-bold capitalize">{a.activity_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── MEMBERS ── */}
          {tab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <h1 className="text-2xl font-black text-[#140152]">Choir Members <span className="text-base font-semibold text-gray-400 ml-2">({activeMembers.length} active)</span></h1>

              {/* Add member */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-[#140152] mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Member</h2>
                <div className="grid sm:grid-cols-3 gap-3 mb-3">
                  <input value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="Member email *" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40" />
                  <input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="Voice part / label (optional)" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40" />
                  <input value={addNotes} onChange={e => setAddNotes(e.target.value)} placeholder="Notes (optional)" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40" />
                </div>
                <button onClick={handleAddMember} disabled={busy || !addEmail.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#140152] text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#1a0270] transition-all">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add to Choir
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#140152]/30 text-sm" />
              </div>

              {/* List */}
              {filtered.length === 0
                ? <EmptyState icon={Users} title="No registered members found" sub="Add a member using their registered email address." />
                : (
                  <div className="space-y-2">
                    {filtered.map(m => (
                      <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#140152] truncate">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.email}{m.role_label ? ` · ${m.role_label}` : ''}</p>
                          {m.notes && <p className="text-xs text-gray-400 italic mt-0.5">{m.notes}</p>}
                        </div>
                        <button onClick={() => handleRemoveMember(m.user_id, m.name)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-all flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </motion.div>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {tab === 'announcements' && (
            <motion.div key="ann" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <h1 className="text-2xl font-black text-[#140152]">Choir Notices</h1>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-[#140152] mb-4 flex items-center gap-2"><Send className="w-4 h-4" /> Post Notice</h2>
                <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Title *"
                  className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm mb-3 focus:outline-none focus:border-[#140152]/40" />
                <textarea value={annBody} onChange={e => setAnnBody(e.target.value)} placeholder="Message *" rows={4}
                  className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm resize-none mb-3 focus:outline-none focus:border-[#140152]/40" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={annUrgent} onChange={e => setAnnUrgent(e.target.checked)} className="rounded" />
                    Mark as urgent
                  </label>
                  <button onClick={handlePostAnn} disabled={busy || !annTitle.trim() || !annBody.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#140152] text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#1a0270] transition-all">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
                  </button>
                </div>
              </div>
              {announcements.length === 0
                ? <EmptyState icon={Bell} title="No announcements yet" sub="Post your first notice to the choir." />
                : (
                  <div className="space-y-3">
                    {announcements.map(a => (
                      <div key={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${a.is_urgent ? 'border-red-200' : 'border-gray-100'}`}>
                        {a.is_urgent && <div className="bg-red-500 text-white text-xs font-bold px-4 py-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> URGENT</div>}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-bold text-[#140152]">{a.title}</p>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.body}</p>
                              <p className="text-xs text-gray-400 mt-2">{a.author_name || 'Choirmaster'} · {new Date(a.created_at).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => handleDeleteAnn(a.id)} className="text-red-400 hover:text-red-600 flex-shrink-0 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </motion.div>
          )}

          {/* ── ACTIVITIES ── */}
          {tab === 'activities' && (
            <motion.div key="act" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <h1 className="text-2xl font-black text-[#140152]">Rehearsals & Activities</h1>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-[#140152] mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> New Activity</h2>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <input value={actTitle} onChange={e => setActTitle(e.target.value)} placeholder="Title *" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40" />
                  <select value={actType} onChange={e => setActType(e.target.value)} className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40 bg-white">
                    {['rehearsal', 'service', 'meeting', 'special'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <input type="date" value={actDate} onChange={e => setActDate(e.target.value)} className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40" />
                  <input type="time" value={actTime} onChange={e => setActTime(e.target.value)} className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40" />
                  <input value={actVenue} onChange={e => setActVenue(e.target.value)} placeholder="Venue (optional)" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40 sm:col-span-2" />
                </div>
                <button onClick={handlePostActivity} disabled={busy || !actTitle.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#140152] text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#1a0270] transition-all">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Activity
                </button>
              </div>
              {activities.length === 0
                ? <EmptyState icon={Calendar} title="No activities scheduled" sub="Add rehearsals, services, or special events." />
                : (
                  <div className="space-y-3">
                    {activities.map(a => (
                      <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                        <div className="w-11 h-11 bg-[#140152]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-[#140152]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#140152]">{a.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 capitalize">{a.activity_type}{a.activity_date ? ` · ${a.activity_date}` : ''}{a.activity_time ? ` at ${a.activity_time}` : ''}{a.venue ? ` · ${a.venue}` : ''}</p>
                        </div>
                        <button onClick={() => handleDeleteActivity(a.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
            </motion.div>
          )}

          {/* ── ATTENDANCE ── */}
          {tab === 'attendance' && (
            <motion.div key="att" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <h1 className="text-2xl font-black text-[#140152]">Attendance</h1>
              {/* Record session */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-[#140152] mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Record Session</h2>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <input value={sessLabel} onChange={e => setSessLabel(e.target.value)} placeholder="Session label e.g. Sunday Rehearsal *" className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40" />
                  <input type="date" value={sessDate} onChange={e => setSessDate(e.target.value)} className="px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152]/40" />
                </div>
                {activeMembers.length === 0
                  ? <p className="text-sm text-gray-400">No active members to mark attendance for.</p>
                  : (
                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                      {activeMembers.map(m => (
                        <label key={m.user_id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={sessMarks[m.user_id] ?? false} onChange={e => setSessMarks(p => ({ ...p, [m.user_id]: e.target.checked }))} className="rounded" />
                          <span className="text-sm font-medium text-gray-800">{m.name}</span>
                          {m.role_label && <span className="text-xs text-gray-400">{m.role_label}</span>}
                        </label>
                      ))}
                    </div>
                  )}
                <button onClick={handleRecordAttendance} disabled={busy || !sessLabel.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#140152] text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#1a0270] transition-all">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Attendance
                </button>
              </div>
              {/* History */}
              {attendance.length === 0
                ? <EmptyState icon={BarChart2} title="No attendance records yet" sub="Record a session above to start tracking attendance." />
                : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="font-bold text-[#140152]">Attendance History</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            {['Member', 'Session', 'Date', 'Status'].map(h => <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {attendance.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 font-medium text-gray-800">{r.member_name}</td>
                              <td className="px-5 py-3 text-gray-600">{r.session_label}</td>
                              <td className="px-5 py-3 text-gray-600">{r.session_date}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${r.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                  {r.present ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {r.present ? 'Present' : 'Absent'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}

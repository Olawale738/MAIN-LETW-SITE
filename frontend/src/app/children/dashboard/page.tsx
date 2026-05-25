'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home, Bell, Calendar, BarChart2, MessageSquare, LogOut,
  CheckCircle2, XCircle, Clock, MapPin, Loader2, Pin, AlertCircle,
  Send, UserPlus, Users,
} from 'lucide-react'
import {
  getCurrentUser, listAnnouncements, listActivities, myAttendance,
  joinDepartment, checkMembership, getDeptMessages, sendDeptMessage,
  type DeptUser, type DeptAnnouncement, type DeptActivity,
  type MyAttendanceRow, type MembershipStatus, type DeptMessage,
} from '@/lib/dept-api'

const DEPT = 'children' as const
type Tab = 'home' | 'notices' | 'activities' | 'attendance' | 'chat'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'home',       label: 'Home',       icon: <Home size={18} /> },
  { id: 'notices',    label: 'Notices',    icon: <Bell size={18} /> },
  { id: 'activities', label: 'Activities', icon: <Calendar size={18} /> },
  { id: 'attendance', label: 'Attendance', icon: <BarChart2 size={18} /> },
  { id: 'chat',       label: 'Chat',       icon: <MessageSquare size={18} /> },
]

export default function ChildrenMemberDashboard() {
  const router = useRouter()
  const [user, setUser]               = useState<DeptUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab]                 = useState<Tab>('home')

  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities, setActivities]       = useState<DeptActivity[]>([])
  const [attendance, setAttendance]       = useState<MyAttendanceRow[]>([])
  const [membership, setMembership]       = useState<MembershipStatus | null>(null)
  const [messages, setMessages]           = useState<DeptMessage[]>([])
  const [loadingData, setLoadingData]     = useState(false)
  const [joining, setJoining]             = useState(false)
  const [joinMsg, setJoinMsg]             = useState('')

  const [chatInput, setChatInput] = useState('')
  const [sending, setSending]     = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.replace('/auth/login'); return }
    getCurrentUser()
      .then(u => { setUser(u); setAuthLoading(false) })
      .catch(() => {
        localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token')
        router.replace('/auth/login')
      })
  }, [router])

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [a, ac, att, mem] = await Promise.all([
        listAnnouncements(DEPT), listActivities(DEPT),
        myAttendance(DEPT), checkMembership(DEPT),
      ])
      setAnnouncements(a); setActivities(ac)
      setAttendance(att); setMembership(mem)
    } catch { /* silent */ }
    finally { setLoadingData(false) }
  }, [])

  useEffect(() => { if (!authLoading && user) loadData() }, [authLoading, user, loadData])

  const loadMessages = useCallback(async () => {
    try { setMessages(await getDeptMessages(DEPT)) } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (tab !== 'chat') return
    loadMessages()
    const t = setInterval(loadMessages, 4000)
    return () => clearInterval(t)
  }, [tab, loadMessages])

  useEffect(() => {
    if (tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

  async function handleJoin() {
    setJoining(true)
    try {
      const res = await joinDepartment(DEPT)
      setJoinMsg(res.message)
      await loadData()
    } catch (e: unknown) {
      setJoinMsg((e as Error).message || 'Failed to join. Try again.')
    } finally { setJoining(false) }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    setSending(true)
    try {
      const msg = await sendDeptMessage(DEPT, chatInput.trim())
      setMessages(prev => [...prev, msg])
      setChatInput('')
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  function signOut() {
    localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token')
    router.replace('/auth/login')
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-violet-50">
      <Loader2 className="animate-spin text-violet-600" size={36} />
    </div>
  )

  const total   = attendance.length
  const present = attendance.filter(r => r.present).length
  const pct     = total > 0 ? Math.round((present / total) * 100) : null
  const isMember = membership?.is_member && membership?.is_active

  const upcomingActivities = activities.filter(a => {
    if (!a.activity_date) return true
    return new Date(a.activity_date) >= new Date(new Date().toDateString())
  }).slice(0, 5)

  const sortedAnn = [
    ...announcements.filter(a => a.is_pinned),
    ...announcements.filter(a => a.is_urgent && !a.is_pinned),
    ...announcements.filter(a => !a.is_pinned && !a.is_urgent),
  ]

  return (
    <div className="min-h-screen bg-violet-50 font-sans flex flex-col">
      <header className="bg-violet-700 text-white px-4 pt-10 pb-6 relative">
        <button onClick={signOut} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30">
          <LogOut size={16} />
        </button>
        <div className="text-xs font-semibold uppercase tracking-widest opacity-75">Children Ministry</div>
        <h1 className="text-2xl font-bold mt-1">Hello, {user?.name?.split(' ')[0] ?? 'Member'} 👋</h1>
        <div className="flex items-center gap-2 mt-1.5">
          {isMember
            ? <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1"><Users size={11} /> Member</span>
            : <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1"><UserPlus size={11} /> Not yet a member</span>
          }
        </div>
      </header>

      {loadingData && <div className="h-1 bg-violet-200"><div className="h-full bg-violet-600 animate-pulse w-1/2 rounded-full" /></div>}

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4 max-w-lg mx-auto w-full">

        {tab === 'home' && (
          <div className="space-y-4">
            {/* Join card */}
            {!isMember && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-violet-400">
                <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><UserPlus size={16} className="text-violet-500" /> Join Children Ministry</h2>
                <p className="text-sm text-gray-500 mb-3">Tap below to officially register as a Children Ministry member and get access to updates, activities, and the group chat.</p>
                {joinMsg && <p className="text-sm text-green-600 mb-2 font-medium">{joinMsg}</p>}
                <button onClick={handleJoin} disabled={joining}
                  className="w-full bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-violet-800 disabled:opacity-50">
                  {joining ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {joining ? 'Joining…' : 'Join Children Ministry'}
                </button>
              </div>
            )}

            {isMember && pct !== null && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-violet-700 text-white rounded-2xl p-3 text-center shadow">
                  <div className="text-xl font-bold">{pct}%</div>
                  <div className="text-xs opacity-80 mt-0.5">Attendance</div>
                </div>
                <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                  <div className="text-xl font-bold text-gray-800">{present}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Present</div>
                </div>
                <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                  <div className="text-xl font-bold text-gray-800">{total - present}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Absent</div>
                </div>
              </div>
            )}

            {announcements.length > 0 && (
              <section className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><Bell size={14} className="text-violet-500" /> Latest Notice</h2>
                <div className={`border-l-4 pl-3 ${announcements[0].is_urgent ? 'border-red-400' : 'border-violet-400'}`}>
                  <div className="font-semibold text-sm text-gray-800">{announcements[0].title}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3">{announcements[0].body}</p>
                </div>
                {announcements.length > 1 && <button onClick={() => setTab('notices')} className="text-violet-600 text-xs mt-2 hover:underline">View all {announcements.length} notices →</button>}
              </section>
            )}

            {upcomingActivities.length > 0 && (
              <section className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><Calendar size={14} className="text-violet-500" /> Next Activity</h2>
                <div className="flex items-start gap-3">
                  <div className="bg-violet-100 rounded-xl p-2 flex-shrink-0"><Calendar size={18} className="text-violet-600" /></div>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{upcomingActivities[0].title}</div>
                    {upcomingActivities[0].description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{upcomingActivities[0].description}</p>}
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                      {upcomingActivities[0].activity_date && <span className="flex items-center gap-1"><Clock size={11} />{upcomingActivities[0].activity_date}</span>}
                      {upcomingActivities[0].venue && <span className="flex items-center gap-1"><MapPin size={11} />{upcomingActivities[0].venue}</span>}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {announcements.length === 0 && activities.length === 0 && !loadingData && isMember && (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-gray-500 text-sm font-medium">Nothing posted yet</p>
                <p className="text-gray-400 text-xs mt-1">Your coordinator will post updates here</p>
              </div>
            )}
          </div>
        )}

        {tab === 'notices' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">All Notices</h2>
            {sortedAnn.length === 0
              ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm"><Bell size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-gray-400 text-sm">No announcements yet</p></div>
              : sortedAnn.map(a => (
                <div key={a.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${a.is_urgent ? 'border-red-400' : a.is_pinned ? 'border-violet-400' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{a.title}</span>
                    {a.is_urgent && <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full"><AlertCircle size={10} /> Urgent</span>}
                    {a.is_pinned && <Pin size={12} className="text-violet-500" />}
                  </div>
                  <p className="text-sm text-gray-600">{a.body}</p>
                  <div className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                    {a.author_name && <span>By {a.author_name}</span>}
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'activities' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">All Activities</h2>
            {activities.length === 0
              ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm"><Calendar size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-gray-400 text-sm">No activities scheduled</p></div>
              : activities.map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <span className="text-xs uppercase tracking-wide text-violet-600 font-semibold">{a.activity_type}</span>
                  <div className="font-semibold text-gray-800 mt-0.5">{a.title}</div>
                  {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                  <div className="text-xs text-gray-400 mt-2 flex items-center gap-3 flex-wrap">
                    {a.activity_date && <span className="flex items-center gap-1"><Clock size={11} />{a.activity_date}{a.activity_time ? ` at ${a.activity_time}` : ''}</span>}
                    {a.venue && <span className="flex items-center gap-1"><MapPin size={11} />{a.venue}</span>}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'attendance' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">My Attendance</h2>
            {!isMember
              ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm"><UserPlus size={32} className="mx-auto text-violet-300 mb-2" /><p className="text-gray-400 text-sm">Join the ministry to track attendance</p><button onClick={() => setTab('home')} className="mt-3 text-violet-600 text-sm font-medium hover:underline">Go to Home to join →</button></div>
              : attendance.length === 0
              ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm"><BarChart2 size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-gray-400 text-sm">No attendance records yet</p></div>
              : <>
                  {pct !== null && (
                    <div className="bg-violet-700 text-white rounded-2xl p-4 flex items-center justify-between shadow">
                      <div><div className="text-xs opacity-75 uppercase tracking-wide">Overall Rate</div><div className="text-3xl font-bold mt-0.5">{pct}%</div></div>
                      <div className="text-right text-sm opacity-85"><div>{present} / {total}</div><div className="text-xs opacity-70">sessions</div></div>
                    </div>
                  )}
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr className="text-xs text-gray-400">
                          <th className="text-left px-4 py-3 font-medium">Session</th>
                          <th className="text-left px-4 py-3 font-medium">Date</th>
                          <th className="text-center px-4 py-3 font-medium">Present</th>
                        </tr></thead>
                        <tbody>
                          {attendance.map((r, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="px-4 py-3 text-gray-700">{r.session_label}</td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{r.session_date}</td>
                              <td className="px-4 py-3 text-center">
                                {r.present ? <CheckCircle2 size={16} className="text-green-500 mx-auto" /> : <XCircle size={16} className="text-red-300 mx-auto" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
            }
          </div>
        )}

        {tab === 'chat' && (
          <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><MessageSquare size={16} className="text-violet-500" /> Children Ministry Chat</h2>
            {!isMember ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm flex-1">
                <MessageSquare size={32} className="mx-auto text-violet-300 mb-2" />
                <p className="text-gray-500 text-sm font-medium">Members only</p>
                <p className="text-gray-400 text-xs mt-1">Join the ministry to access group chat</p>
                <button onClick={() => setTab('home')} className="mt-3 text-violet-600 text-sm font-medium hover:underline">Join from Home tab →</button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                  {messages.length === 0
                    ? <div className="text-center py-8 text-gray-400 text-sm">No messages yet. Start the conversation!</div>
                    : messages.map(m => (
                      <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] flex flex-col gap-0.5 ${m.is_mine ? 'items-end' : 'items-start'}`}>
                          {!m.is_mine && <span className="text-xs text-gray-400 ml-1">{m.sender_name}</span>}
                          <div className={`px-3 py-2 rounded-2xl text-sm ${m.is_mine ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                            {m.content}
                          </div>
                          <span className="text-[10px] text-gray-300 mx-1">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="border-t border-gray-100 p-3 flex items-center gap-2">
                  <input
                    type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <button type="submit" disabled={sending || !chatInput.trim()}
                    className="bg-violet-700 text-white p-2 rounded-xl hover:bg-violet-800 disabled:opacity-40">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${tab === t.id ? 'text-violet-600' : 'text-gray-400 hover:text-violet-500'}`}>
            {t.icon}
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

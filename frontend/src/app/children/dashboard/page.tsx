'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home, Bell, Calendar, BarChart2, LogOut,
  CheckCircle2, XCircle, Clock, MapPin, Loader2, Pin, AlertCircle,
} from 'lucide-react'
import {
  getCurrentUser, listAnnouncements, listActivities, myAttendance,
  type DeptUser, type DeptAnnouncement, type DeptActivity, type MyAttendanceRow,
} from '@/lib/dept-api'

const DEPT = 'children' as const
type Tab = 'home' | 'notices' | 'activities' | 'attendance'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'home',       label: 'Home',       icon: <Home size={18} /> },
  { id: 'notices',    label: 'Notices',    icon: <Bell size={18} /> },
  { id: 'activities', label: 'Activities', icon: <Calendar size={18} /> },
  { id: 'attendance', label: 'Attendance', icon: <BarChart2 size={18} /> },
]

export default function ChildrenMemberDashboard() {
  const router = useRouter()
  const [user, setUser]               = useState<DeptUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab]                 = useState<Tab>('home')

  const [announcements, setAnnouncements] = useState<DeptAnnouncement[]>([])
  const [activities, setActivities]       = useState<DeptActivity[]>([])
  const [attendance, setAttendance]       = useState<MyAttendanceRow[]>([])
  const [loadingData, setLoadingData]     = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.replace('/auth/login'); return }
    getCurrentUser()
      .then(u => { setUser(u); setAuthLoading(false) })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        router.replace('/auth/login')
      })
  }, [router])

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [a, ac, att] = await Promise.all([
        listAnnouncements(DEPT),
        listActivities(DEPT),
        myAttendance(DEPT),
      ])
      setAnnouncements(a); setActivities(ac); setAttendance(att)
    } catch {
      // silent — user may not be a dept member yet
    } finally { setLoadingData(false) }
  }, [])

  useEffect(() => { if (!authLoading && user) loadData() }, [authLoading, user, loadData])

  function signOut() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
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

  const upcomingActivities = activities.filter(a => {
    if (!a.activity_date) return false
    return new Date(a.activity_date) >= new Date(new Date().toDateString())
  }).slice(0, 5)

  const pinnedAnn = announcements.filter(a => a.is_pinned)
  const urgentAnn = announcements.filter(a => a.is_urgent && !a.is_pinned)
  const normalAnn = announcements.filter(a => !a.is_pinned && !a.is_urgent)
  const sortedAnn = [...pinnedAnn, ...urgentAnn, ...normalAnn]

  return (
    <div className="min-h-screen bg-violet-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-violet-700 text-white px-4 pt-10 pb-6 relative">
        <button onClick={signOut} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30">
          <LogOut size={16} />
        </button>
        <div className="text-xs font-semibold uppercase tracking-widest opacity-75">Children Ministry</div>
        <h1 className="text-2xl font-bold mt-1">
          Hello, {user?.name?.split(' ')[0] ?? 'Member'} 👋
        </h1>
        <p className="text-sm opacity-75 mt-0.5">Welcome to the Children Ministry dashboard</p>
      </header>

      {loadingData && (
        <div className="h-1 bg-violet-200">
          <div className="h-full bg-violet-600 animate-pulse w-1/2 rounded-full" />
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4 max-w-lg mx-auto w-full">

        {tab === 'home' && (
          <div className="space-y-4">
            {pct !== null && (
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
                <h2 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <Bell size={14} className="text-violet-500" /> Latest Notice
                </h2>
                <div className={`border-l-4 pl-3 ${announcements[0].is_urgent ? 'border-red-400' : 'border-violet-400'}`}>
                  <div className="font-semibold text-sm text-gray-800">{announcements[0].title}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3">{announcements[0].body}</p>
                </div>
                {announcements.length > 1 && (
                  <button onClick={() => setTab('notices')} className="text-violet-600 text-xs mt-2 hover:underline">
                    View all {announcements.length} notices →
                  </button>
                )}
              </section>
            )}

            {upcomingActivities.length > 0 && (
              <section className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <Calendar size={14} className="text-violet-500" /> Next Activity
                </h2>
                <div className="flex items-start gap-3">
                  <div className="bg-violet-100 rounded-xl p-2 flex-shrink-0">
                    <Calendar size={18} className="text-violet-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{upcomingActivities[0].title}</div>
                    {upcomingActivities[0].description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{upcomingActivities[0].description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                      {upcomingActivities[0].activity_date && (
                        <span className="flex items-center gap-1"><Clock size={11} />{upcomingActivities[0].activity_date}</span>
                      )}
                      {upcomingActivities[0].venue && (
                        <span className="flex items-center gap-1"><MapPin size={11} />{upcomingActivities[0].venue}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {announcements.length === 0 && activities.length === 0 && !loadingData && (
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
            {sortedAnn.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">No announcements yet</p>
              </div>
            ) : sortedAnn.map(a => (
              <div key={a.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${a.is_urgent ? 'border-red-400' : a.is_pinned ? 'border-violet-400' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">{a.title}</span>
                  {a.is_urgent && (
                    <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      <AlertCircle size={10} /> Urgent
                    </span>
                  )}
                  {a.is_pinned && <Pin size={12} className="text-violet-500" />}
                </div>
                <p className="text-sm text-gray-600">{a.body}</p>
                <div className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                  {a.author_name && <span>By {a.author_name}</span>}
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'activities' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">All Activities</h2>
            {activities.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <Calendar size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">No activities scheduled</p>
              </div>
            ) : activities.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <span className="text-xs uppercase tracking-wide text-violet-600 font-semibold">{a.activity_type}</span>
                <div className="font-semibold text-gray-800 mt-0.5">{a.title}</div>
                {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                <div className="text-xs text-gray-400 mt-2 flex items-center gap-3 flex-wrap">
                  {a.activity_date && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />{a.activity_date}{a.activity_time ? ` at ${a.activity_time}` : ''}
                    </span>
                  )}
                  {a.venue && <span className="flex items-center gap-1"><MapPin size={11} />{a.venue}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'attendance' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">My Attendance</h2>
            {attendance.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <BarChart2 size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">No attendance records yet</p>
              </div>
            ) : (
              <>
                {pct !== null && (
                  <div className="bg-violet-700 text-white rounded-2xl p-4 flex items-center justify-between shadow">
                    <div>
                      <div className="text-xs opacity-75 uppercase tracking-wide">Overall Rate</div>
                      <div className="text-3xl font-bold mt-0.5">{pct}%</div>
                    </div>
                    <div className="text-right text-sm opacity-85">
                      <div>{present} / {total}</div>
                      <div className="text-xs opacity-70">sessions</div>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-xs text-gray-400">
                          <th className="text-left px-4 py-3 font-medium">Session</th>
                          <th className="text-left px-4 py-3 font-medium">Date</th>
                          <th className="text-center px-4 py-3 font-medium">Present</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((r, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0">
                            <td className="px-4 py-3 text-gray-700">{r.session_label}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{r.session_date}</td>
                            <td className="px-4 py-3 text-center">
                              {r.present
                                ? <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                                : <XCircle size={16} className="text-red-300 mx-auto" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex safe-bottom shadow-lg">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              tab === t.id ? 'text-violet-600' : 'text-gray-400 hover:text-violet-500'
            }`}
          >
            {t.icon}
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

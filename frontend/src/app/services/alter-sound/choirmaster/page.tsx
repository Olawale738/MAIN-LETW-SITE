'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Home, Users, Bell, BarChart2, Music, Calendar, MessageSquare,
  Star, Menu, X, ChevronRight, Send, CheckCircle2, AlertCircle,
  Plus, Trash2, Edit3, Crown, Shield, Flame, Music2, MapPin,
  Clock, UserCheck, UserX, TrendingUp, Award, Mic2, Download,
  Search, Filter, Pin, Eye, EyeOff, Megaphone, Settings,
  ArrowRight, BookOpen, CheckSquare, Circle, RefreshCw, Mail, Phone, Loader2
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────

interface Member {
  id: string; name: string; initials: string
  voice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass'
  role?: string; active: boolean; attendance: number
  joinedDate: string; phone: string; email: string
}

interface Reply { id: string; from: string; initials: string; voice: string; announcementTitle: string; text: string; time: string; read: boolean }
interface Announcement { id: string; title: string; body: string; time: string; urgent: boolean; pinned: boolean; replies: number }
interface Song { id: string; title: string; key: string; tempo: string; category: string; readyCount: number; totalCount: number }
interface SongFile { name: string; url: string; size: number; uploadedAt: string }
interface SongFiles { lyrics?: SongFile; sheet?: SongFile; track?: SongFile }

interface GroupChatMsg {
  id: string
  sender_name: string
  sender_initials: string
  voice_part: string
  is_director: boolean
  content: string
  created_at: string
}
interface Event { id: string; title: string; type: string; date: string; time: string; venue: string; daysLeft: number; color: string; confirmed: number; total: number }
interface ChoirHighlight { id: string; title: string; body: string; type: 'testimony' | 'update' | 'praise'; postedBy: string; time: string }
interface ChoirStats { membersThisYear: number; servicesMinistered: number; specialPrograms: number }

// ─── Mock Data ─────────────────────────────────────────────────────

const DIRECTOR = { name: 'Choir Director', initials: 'CD', role: 'Director & Section Lead' }

// No fake members — real members are added by the Choir Master
const ALL_MEMBERS: Member[] = []

// Inbox starts empty — real replies come from real members
const INBOX_REPLIES: Reply[] = []

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: '⚠️ Mandatory Rehearsal This Thursday', body: 'All members are required to attend. We will be running through all 5 songs for the anniversary. No absences unless pre-approved.', time: '2 hours ago', urgent: true,  pinned: true,  replies: 4 },
  { id: '2', title: 'New Sheet Music Available',             body: 'Sheet music for the Easter medley has been uploaded to the library. Please download before Friday\'s session.',                      time: '1 day ago',  urgent: false, pinned: false, replies: 1 },
  { id: '3', title: 'Congratulations to the Soprano Section!', body: 'Excellent performance last Sunday. The congregation was truly blessed. Keep up the excellent work!',                              time: '3 days ago', urgent: false, pinned: false, replies: 1 },
]

const MOCK_SONGS: Song[] = [
  { id: '1', title: 'Great Are You Lord',          key: 'G Major', tempo: '72 BPM', category: 'Worship',   readyCount: 10, totalCount: 10 },
  { id: '2', title: 'Way Maker',                   key: 'Ab Major', tempo: '68 BPM', category: 'Praise',   readyCount: 7,  totalCount: 10 },
  { id: '3', title: 'Reckless Love',               key: 'E Major', tempo: '75 BPM', category: 'Worship',   readyCount: 6,  totalCount: 10 },
  { id: '4', title: 'Goodness of God',             key: 'B Major', tempo: '65 BPM', category: 'Praise',    readyCount: 3,  totalCount: 10 },
  { id: '5', title: 'Holy Spirit (You Are Welcome)', key: 'D Major', tempo: '60 BPM', category: 'Prophetic', readyCount: 2, totalCount: 10 },
]

const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Weekly Rehearsal',        type: 'rehearsal', date: 'Thu, 29 May',  time: '7:00 PM', venue: 'Church Hall B',   daysLeft: 6,  color: '#7c3aed', confirmed: 8,  total: 10 },
  { id: '2', title: 'Sunday Morning Service',  type: 'service',   date: 'Sun, 1 Jun',   time: '9:00 AM', venue: 'Main Sanctuary',  daysLeft: 9,  color: '#0284c7', confirmed: 10, total: 10 },
  { id: '3', title: 'LETW Anniversary Concert', type: 'special',  date: 'Sat, 28 Jun',  time: '5:00 PM', venue: 'Main Auditorium', daysLeft: 36, color: '#f5bb00', confirmed: 6,  total: 10 },
]

const VOICE_COLORS: Record<string, string> = {
  Soprano: 'bg-purple-100 text-purple-700',
  Alto:    'bg-pink-100 text-pink-700',
  Tenor:   'bg-blue-100 text-blue-700',
  Bass:    'bg-green-100 text-green-700',
}

const VOICE_BG: Record<string, string> = {
  Soprano: '#7c3aed', Alto: '#db2777', Tenor: '#2563eb', Bass: '#16a34a',
}

const NAV_ITEMS = [
  { id: 'home',       label: 'Overview',      icon: Home },
  { id: 'chat',       label: 'Group Chat',    icon: MessageSquare },
  { id: 'inbox',      label: 'Member Inbox',  icon: MessageSquare },
  { id: 'members',    label: 'Members',       icon: Users },
  { id: 'highlights', label: 'Ministry Feed', icon: Star },
  { id: 'announce',   label: 'Announcements', icon: Megaphone },
  { id: 'songs',      label: 'Song Manager',  icon: Music },
  { id: 'events',     label: 'Schedule',      icon: Calendar },
  { id: 'attendance', label: 'Attendance',    icon: BarChart2 },
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// ─── Auth Gate ────────────────────────────────────────────────────

const DEFAULT_CHOIRMASTER_CREDS = { username: 'choirmaster', password: 'LETW@Choir2026' }
const ADMIN_CREDENTIALS         = { username: 'admin',       password: 'LETW@Admin2026'  }

function getChoirmasterCreds() {
  if (typeof window === 'undefined') return DEFAULT_CHOIRMASTER_CREDS
  try {
    const raw = localStorage.getItem('letw_choirmaster_creds')
    if (raw) { const p = JSON.parse(raw); return { username: p.username || DEFAULT_CHOIRMASTER_CREDS.username, password: p.password || DEFAULT_CHOIRMASTER_CREDS.password } }
  } catch { /* ignore */ }
  return DEFAULT_CHOIRMASTER_CREDS
}

function ChoirmasterLoginGate({ onLogin }: { onLogin: (role: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    setTimeout(() => {
      setLoading(false)
      const creds = getChoirmasterCreds()
      if (username === creds.username && password === creds.password) {
        onLogin('choirmaster')
      } else if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        onLogin('admin')
      } else {
        setError('Invalid credentials. Contact the Admin for access.')
      }
    }, 700)
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1e0050 0%, #2d0075 50%, #3b0099 100%)' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 pt-10 pb-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Crown className="w-8 h-8 text-[#f5bb00]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center">Alter Sound</h1>
            <p className="text-sm text-gray-500 mt-1">Choir Master Portal</p>
            <span className="mt-3 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Director Access Only
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter username" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'} required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter password" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Enter Director Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────

export default function ChoirmasterDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [authRole,      setAuthRole]      = useState('')
  if (!authenticated) return <ChoirmasterLoginGate onLogin={(r) => { setAuthenticated(true); setAuthRole(r) }} />
  return <ChoirmasterContent authRole={authRole} />
}

function ChoirmasterContent({ authRole }: { authRole: string }) {
  const [activeNav, setActiveNav] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>(ALL_MEMBERS)
  const [memberFilter, setMemberFilter] = useState('All')
  const [memberSearch, setMemberSearch] = useState('')
  const [inboxReplies, setInboxReplies] = useState<Reply[]>(INBOX_REPLIES)
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS)
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newUrgent, setNewUrgent] = useState(false)
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [sentReplies, setSentReplies] = useState<Set<string>>(new Set())
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 })

  // ── Member add form state ──────────────────────────────────────────
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName,  setNewMemberName]  = useState('')
  const [newMemberVoice, setNewMemberVoice] = useState<Member['voice']>('Soprano')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole,  setNewMemberRole]  = useState('')

  // ── Group Chat state ──────────────────────────────────────────────
  const [groupMessages, setGroupMessages] = useState<GroupChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const latestTimestampRef = useRef<string>('')

  // ── Song file uploads ─────────────────────────────────────────────
  const [songFiles, setSongFiles] = useState<Record<string, SongFiles>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUpload, setPendingUpload] = useState<{ songId: string; type: 'lyrics' | 'sheet' | 'track' } | null>(null)

  // ── Ministry feed (highlights) state ─────────────────────────────
  const [highlights,    setHighlights]    = useState<ChoirHighlight[]>([])
  const [newHighTitle,  setNewHighTitle]  = useState('')
  const [newHighBody,   setNewHighBody]   = useState('')
  const [newHighType,   setNewHighType]   = useState<ChoirHighlight['type']>('update')

  // ── Stats state ───────────────────────────────────────────────────
  const [choirStats,    setChoirStats]    = useState<ChoirStats>({ membersThisYear: 0, servicesMinistered: 0, specialPrograms: 0 })
  const [editingStats,  setEditingStats]  = useState(false)
  const [statInputs,    setStatInputs]    = useState({ membersThisYear: '', servicesMinistered: '', specialPrograms: '' })

  // Load inbox replies from localStorage (sent by members via member dashboard)
  useEffect(() => {
    const loadInbox = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('letw_choirmaster_inbox') || '[]')
        if (stored.length > 0) setInboxReplies(stored)
      } catch { /* ignore */ }
    }
    loadInbox()
    // Poll every 10 seconds for new replies
    const interval = setInterval(loadInbox, 10000)
    return () => clearInterval(interval)
  }, [])

  // Sync inbox changes back to localStorage
  const updateInbox = (updated: Reply[]) => {
    setInboxReplies(updated)
    localStorage.setItem('letw_choirmaster_inbox', JSON.stringify(updated))
  }

  // Load members from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('letw_choir_members_data') || '[]')
      if (Array.isArray(stored) && stored.length > 0) setMembers(stored)
    } catch { /* ignore */ }
  }, [])

  // Load highlights on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('letw_choir_highlights') || '[]')
      if (Array.isArray(stored)) setHighlights(stored)
    } catch { /* ignore */ }
  }, [])

  // Load stats on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('letw_choir_stats') || 'null')
      if (stored) setChoirStats(stored)
    } catch { /* ignore */ }
  }, [])

  // ── Persistence helpers ───────────────────────────────────────────
  const saveMembers = (updated: Member[]) => {
    setMembers(updated)
    localStorage.setItem('letw_choir_members_data', JSON.stringify(updated))
  }

  const saveHighlights = (updated: ChoirHighlight[]) => {
    setHighlights(updated)
    localStorage.setItem('letw_choir_highlights', JSON.stringify(updated))
  }

  // ── Song file upload handlers ─────────────────────────────────────
  // Load persisted file metadata on mount (blob URLs don't survive refresh,
  // so we store only name/size/date; actual file must be re-uploaded after refresh)
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('letw_choir_song_files_meta') || '{}')
      if (stored) setSongFiles(stored)
    } catch { /* ignore */ }
  }, [])

  const triggerUpload = (songId: string, type: 'lyrics' | 'sheet' | 'track') => {
    setPendingUpload({ songId, type })
    if (fileInputRef.current) {
      fileInputRef.current.accept =
        type === 'track' ? 'audio/*,.mp3,.wav,.m4a' :
        type === 'lyrics' ? '.pdf,.txt,.doc,.docx' :
        '.pdf,.jpg,.jpeg,.png'
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingUpload) return
    const url = URL.createObjectURL(file)
    const fileRecord: SongFile = {
      name: file.name,
      url,
      size: file.size,
      uploadedAt: new Date().toLocaleString(),
    }
    const updated = {
      ...songFiles,
      [pendingUpload.songId]: {
        ...songFiles[pendingUpload.songId],
        [pendingUpload.type]: fileRecord,
      },
    }
    setSongFiles(updated)
    // Save only metadata to localStorage (URL is temporary blob)
    const metaOnly = Object.fromEntries(
      Object.entries(updated).map(([sid, files]) => [
        sid,
        Object.fromEntries(
          Object.entries(files).map(([t, f]) => [t, { name: (f as SongFile).name, size: (f as SongFile).size, uploadedAt: (f as SongFile).uploadedAt }])
        )
      ])
    )
    localStorage.setItem('letw_choir_song_files_meta', JSON.stringify(metaOnly))
    setPendingUpload(null)
    e.target.value = ''
  }

  // ── Group chat helpers ────────────────────────────────────────────
  const fetchChatMessages = async (initial = false) => {
    try {
      const url = initial
        ? `${API_BASE}/choir-chat/messages?limit=80`
        : latestTimestampRef.current
          ? `${API_BASE}/choir-chat/messages?since=${encodeURIComponent(latestTimestampRef.current)}`
          : `${API_BASE}/choir-chat/messages?limit=80`
      const res = await fetch(url)
      if (!res.ok) return
      const data: GroupChatMsg[] = await res.json()
      if (data.length > 0) {
        if (initial) {
          setGroupMessages(data)
        } else {
          setGroupMessages(prev => [...prev, ...data])
        }
        latestTimestampRef.current = data[data.length - 1].created_at
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
      }
      setChatError('')
    } catch {
      if (initial) setChatError('Could not connect to chat. Check your connection.')
    }
  }

  // Initial load + poll every 3 seconds when on chat tab
  useEffect(() => {
    fetchChatMessages(true)
    const interval = setInterval(() => fetchChatMessages(false), 3000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendGroupMessage = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatLoading(true)
    const optimistic: GroupChatMsg = {
      id: `tmp-${Date.now()}`,
      sender_name: 'Choir Director',
      sender_initials: 'CD',
      voice_part: 'Director',
      is_director: true,
      content: text,
      created_at: new Date().toISOString(),
    }
    setGroupMessages(prev => [...prev, optimistic])
    setChatInput('')
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    try {
      const res = await fetch(`${API_BASE}/choir-chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: 'Choir Director',
          sender_initials: 'CD',
          voice_part: 'Director',
          is_director: true,
          content: text,
        }),
      })
      if (res.ok) {
        const saved: GroupChatMsg = await res.json()
        // Replace the optimistic message with the real one
        setGroupMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m))
        latestTimestampRef.current = saved.created_at
      }
    } catch { /* optimistic message stays visible */ }
    finally { setChatLoading(false) }
  }

  const clearGroupChat = async () => {
    if (!confirm('Clear all group chat messages? This cannot be undone.')) return
    await fetch(`${API_BASE}/choir-chat/messages/clear`, { method: 'DELETE' })
    setGroupMessages([])
    latestTimestampRef.current = ''
  }

  const removeFile = (songId: string, type: 'lyrics' | 'sheet' | 'track') => {
    const current = songFiles[songId]?.[type]
    if (current?.url) URL.revokeObjectURL(current.url)
    const updated = {
      ...songFiles,
      [songId]: { ...songFiles[songId], [type]: undefined },
    }
    setSongFiles(updated)
    localStorage.setItem('letw_choir_song_files_meta', JSON.stringify(updated))
  }

  // ── Member actions ────────────────────────────────────────────────
  const addMember = () => {
    if (!newMemberName.trim()) return
    const parts = newMemberName.trim().split(' ')
    const initials = parts.map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const newMember: Member = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      initials,
      voice: newMemberVoice,
      role: newMemberRole.trim() || undefined,
      active: true,
      attendance: 100,
      joinedDate: new Date().getFullYear().toString(),
      phone: newMemberPhone.trim(),
      email: newMemberEmail.trim(),
    }
    saveMembers([...members, newMember])
    setNewMemberName(''); setNewMemberVoice('Soprano')
    setNewMemberPhone(''); setNewMemberEmail(''); setNewMemberRole('')
    setShowAddMember(false)
  }

  const removeMember = (id: string) => saveMembers(members.filter(m => m.id !== id))

  // ── Highlights actions ────────────────────────────────────────────
  const postHighlight = () => {
    if (!newHighTitle.trim() || !newHighBody.trim()) return
    const entry: ChoirHighlight = {
      id: Date.now().toString(),
      title: newHighTitle.trim(),
      body: newHighBody.trim(),
      type: newHighType,
      postedBy: 'Choir Director',
      time: new Date().toLocaleString(),
    }
    saveHighlights([entry, ...highlights])
    setNewHighTitle(''); setNewHighBody('')
  }

  const deleteHighlight = (id: string) => saveHighlights(highlights.filter(h => h.id !== id))

  // ── Stats actions ─────────────────────────────────────────────────
  const openEditStats = () => {
    setStatInputs({
      membersThisYear: choirStats.membersThisYear ? String(choirStats.membersThisYear) : '',
      servicesMinistered: choirStats.servicesMinistered ? String(choirStats.servicesMinistered) : '',
      specialPrograms: choirStats.specialPrograms ? String(choirStats.specialPrograms) : '',
    })
    setEditingStats(true)
  }

  const saveStats = () => {
    const updated: ChoirStats = {
      membersThisYear:    parseInt(statInputs.membersThisYear)    || 0,
      servicesMinistered: parseInt(statInputs.servicesMinistered) || 0,
      specialPrograms:    parseInt(statInputs.specialPrograms)    || 0,
    }
    setChoirStats(updated)
    localStorage.setItem('letw_choir_stats', JSON.stringify(updated))
    setEditingStats(false)
  }

  // Countdown to Anniversary Concert
  useEffect(() => {
    const target = new Date('2026-06-28T17:00:00')
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now())
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  const unreadCount = inboxReplies.filter(r => !r.read).length
  const activeCount = members.filter(m => m.active).length
  const avgAttendance = Math.round(members.filter(m => m.active).reduce((s, m) => s + m.attendance, 0) / activeCount)

  const markRead = (id: string) => updateInbox(inboxReplies.map(r => r.id === id ? { ...r, read: true } : r))
  const markAllRead = () => updateInbox(inboxReplies.map(r => ({ ...r, read: true })))

  const toggleMemberStatus = (id: string) =>
    saveMembers(members.map(m => m.id === id ? { ...m, active: !m.active } : m))

  const sendReplyToMember = (replyId: string) => {
    if (!replyInputs[replyId]?.trim()) return
    setSentReplies(prev => new Set([...prev, replyId]))
    setReplyInputs(prev => ({ ...prev, [replyId]: '' }))
    markRead(replyId)
  }

  const postAnnouncement = () => {
    if (!newTitle.trim() || !newBody.trim()) return
    setAnnouncements(prev => [{
      id: Date.now().toString(), title: newTitle, body: newBody,
      time: 'Just now', urgent: newUrgent, pinned: false, replies: 0,
    }, ...prev])
    setNewTitle(''); setNewBody(''); setNewUrgent(false); setShowNewAnnouncement(false)
  }

  const filteredMembers = members.filter(m => {
    const matchVoice = memberFilter === 'All' || m.voice === memberFilter
    const matchSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase())
    return matchVoice && matchSearch
  })

  const navigate = (id: string) => { setActiveNav(id); setSidebarOpen(false) }
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // ─── Section Renders ─────────────────────────────────────────────

  function CountBox({ v, l }: { v: number; l: string }) {
    return (
      <div className="flex flex-col items-center bg-white/10 rounded-xl px-3 py-2 min-w-[54px]">
        <span className="text-xl font-black text-white tabular-nums">{String(v).padStart(2, '0')}</span>
        <span className="text-[10px] text-white/60 uppercase tracking-wide">{l}</span>
      </div>
    )
  }

  // ─── OVERVIEW ──────────────────────────────────────────────────
  function renderHome() {
    return (
      <div className="space-y-6">
        {/* Welcome */}
        <div className="relative bg-gradient-to-br from-[#1a0040] via-[#2d0a6e] to-[#140152] rounded-3xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-52 h-52 opacity-5"><Music2 className="w-full h-full" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-[#f5bb00]" />
              <span className="text-[#f5bb00] text-xs font-bold uppercase tracking-widest">Choir Director — Master View</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Good day, {DIRECTOR.name}!</h2>
            <p className="text-white/60 text-sm mb-5">{today}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('inbox')} className="flex items-center gap-2 bg-[#f5bb00] text-[#140152] px-4 py-2 rounded-xl font-black text-sm hover:opacity-90 transition-all">
                <MessageSquare className="w-4 h-4" /> Member Inbox
                {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>}
              </button>
              <button onClick={() => { setShowNewAnnouncement(true); navigate('announce') }} className="flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all">
                <Megaphone className="w-4 h-4" /> New Announcement
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Members', value: activeCount, icon: Users,      color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: BarChart2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Unread Replies', value: unreadCount, icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Songs Ready',   value: `${MOCK_SONGS.filter(s => s.readyCount === s.totalCount).length}/${MOCK_SONGS.length}`, icon: Music, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Concert Countdown */}
        <div className="bg-gradient-to-r from-[#f5bb00] to-amber-500 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-[#140152]" />
            <span className="text-[#140152] font-black text-sm uppercase tracking-wider">LETW Anniversary Concert</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CountBox v={countdown.d} l="Days" />
            <CountBox v={countdown.h} l="Hrs" />
            <CountBox v={countdown.m} l="Mins" />
            <CountBox v={countdown.s} l="Secs" />
          </div>
          <p className="text-[#140152]/70 text-xs mt-3">Sat 28 June · Main Auditorium · 5:00 PM — {MOCK_EVENTS[2].confirmed}/{MOCK_EVENTS[2].total} members confirmed</p>
        </div>

        {/* Ministry Stats — editable, written to localStorage for member dashboard */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" /> Ministry Stats
              <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Live · visible to members</span>
            </h3>
            <button onClick={openEditStats} className="text-violet-600 text-xs font-bold flex items-center gap-1 hover:underline">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>
          {editingStats ? (
            <div className="p-5 space-y-3">
              {[
                { key: 'membersThisYear', label: 'New Members This Year' },
                { key: 'servicesMinistered', label: 'Services Ministered' },
                { key: 'specialPrograms', label: 'Special Programs' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-600 w-44 flex-shrink-0">{label}</label>
                  <input
                    type="number" min="0"
                    value={statInputs[key as keyof typeof statInputs]}
                    onChange={e => setStatInputs(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    placeholder="0"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingStats(false)} className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={saveStats} className="px-5 py-2 bg-[#140152] text-white text-xs font-bold rounded-lg hover:bg-[#1a0270] transition-all">Save & Publish</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 divide-x divide-gray-50">
              {[
                { label: 'New Members', value: choirStats.membersThisYear },
                { label: 'Services',    value: choirStats.servicesMinistered },
                { label: 'Special Programs', value: choirStats.specialPrograms },
              ].map(s => (
                <div key={s.label} className="p-4 text-center">
                  <div className="text-2xl font-black text-[#140152]">{s.value || '—'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent replies preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-600" /> Recent Member Replies
              {unreadCount > 0 && <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{unreadCount} new</span>}
            </h3>
            <button onClick={() => navigate('inbox')} className="text-violet-600 text-xs font-bold flex items-center gap-1">View all <ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
          {inboxReplies.slice(0, 3).map(r => (
            <div key={r.id} className={`flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 ${!r.read ? 'bg-violet-50/50' : ''}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ backgroundColor: VOICE_BG[r.voice] }}>{r.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm">{r.from}</span>
                  {!r.read && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{r.text}</p>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{r.time}</span>
            </div>
          ))}
        </div>

        {/* Song readiness */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2"><Music className="w-4 h-4 text-blue-600" /> Song Readiness</h3>
            <button onClick={() => navigate('songs')} className="text-blue-600 text-xs font-bold flex items-center gap-1">Manage <ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
          {MOCK_SONGS.map(s => (
            <div key={s.id} className="px-5 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-700">{s.title}</span>
                <span className="text-xs font-bold text-gray-500">{s.readyCount}/{s.totalCount} ready</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(s.readyCount / s.totalCount) * 100}%`, backgroundColor: s.readyCount === s.totalCount ? '#16a34a' : s.readyCount >= 7 ? '#f5bb00' : '#7c3aed' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── INBOX ─────────────────────────────────────────────────────
  function renderInbox() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{unreadCount} unread · {inboxReplies.length} total replies</p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {inboxReplies.map(r => (
          <div key={r.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${!r.read ? 'border-violet-200' : 'border-gray-100'}`}>
            {!r.read && <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />}
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{ backgroundColor: VOICE_BG[r.voice] }}>
                  {r.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-gray-800 text-sm">{r.from}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${VOICE_COLORS[r.voice]}`}>{r.voice}</span>
                    {!r.read && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">NEW</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Re: {r.announcementTitle}</p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{r.time}</span>
              </div>

              {/* Message */}
              <div className={`rounded-xl px-4 py-3 mb-3 text-sm leading-relaxed ${!r.read ? 'bg-violet-50 text-violet-900' : 'bg-gray-50 text-gray-700'}`}>
                {r.text}
              </div>

              {/* Reply or sent */}
              {sentReplies.has(r.id) ? (
                <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Reply sent to {r.from}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    value={replyInputs[r.id] || ''}
                    onChange={e => setReplyInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && sendReplyToMember(r.id)}
                    onFocus={() => markRead(r.id)}
                    placeholder={`Reply to ${r.from.split(' ')[0]}…`}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  <button
                    onClick={() => sendReplyToMember(r.id)}
                    disabled={!replyInputs[r.id]?.trim()}
                    className="w-9 h-9 bg-[#140152] rounded-xl flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#1a0270] transition-all flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ─── MEMBERS ───────────────────────────────────────────────────
  function renderMembers() {
    const voiceGroups = ['Soprano', 'Alto', 'Tenor', 'Bass'] as const
    return (
      <div className="space-y-6">
        {/* Voice summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {voiceGroups.map(v => {
            const group = members.filter(m => m.voice === v)
            return (
              <div key={v} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${VOICE_COLORS[v]} inline-block mb-2`}>{v}</span>
                <div className="text-2xl font-black text-gray-800">{group.filter(m => m.active).length}</div>
                <div className="text-xs text-gray-400">{group.length} total · {group.filter(m => !m.active).length} inactive</div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
              placeholder="Search members…"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          {['All', 'Soprano', 'Alto', 'Tenor', 'Bass'].map(f => (
            <button key={f} onClick={() => setMemberFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${memberFilter === f ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Add Member button / form */}
        <div>
          <button onClick={() => setShowAddMember(!showAddMember)}
            className="w-full flex items-center gap-3 bg-[#140152] text-white rounded-2xl px-5 py-3.5 font-bold hover:bg-[#1a0270] transition-all mb-4">
            <Plus className="w-5 h-5" /> Add New Member
          </button>

          {showAddMember && (
            <div className="bg-white border border-violet-200 rounded-2xl p-5 shadow-sm space-y-3 mb-4">
              <h3 className="font-black text-[#140152] text-sm">New Choir Member</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                  <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                    placeholder="e.g. Mary Johnson"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Voice Part *</label>
                  <select value={newMemberVoice} onChange={e => setNewMemberVoice(e.target.value as Member['voice'])}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    {['Soprano', 'Alto', 'Tenor', 'Bass'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role / Title</label>
                  <input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}
                    placeholder="e.g. Section Lead"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)}
                    placeholder="+234 …"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)}
                    placeholder="member@example.com" type="email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setShowAddMember(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={addMember} disabled={!newMemberName.trim()}
                  className="px-5 py-2 bg-[#140152] text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-[#1a0270] transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add to Choir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Member cards */}
        <div className="space-y-3">
          {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No members yet</p>
              <p className="text-xs mt-1">Add your first choir member above.</p>
            </div>
          )}
          {filteredMembers.map(m => (
            <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${!m.active ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:shadow-md'}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ backgroundColor: VOICE_BG[m.voice] }}>
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-gray-800 text-sm">{m.name}</span>
                    {m.role && <span className="text-[10px] font-bold bg-[#140152]/10 text-[#140152] px-2 py-0.5 rounded-full">{m.role}</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${VOICE_COLORS[m.voice]}`}>{m.voice}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">Since {m.joinedDate}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.attendance}%`, backgroundColor: m.attendance >= 80 ? '#16a34a' : m.attendance >= 60 ? '#f5bb00' : '#ef4444' }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-500">{m.attendance}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="w-8 h-8 bg-gray-100 hover:bg-green-100 rounded-lg flex items-center justify-center transition-colors" title="Call">
                      <Phone className="w-3.5 h-3.5 text-gray-600" />
                    </a>
                  )}
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="w-8 h-8 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors" title="Email">
                      <Mail className="w-3.5 h-3.5 text-gray-600" />
                    </a>
                  )}
                  <button onClick={() => toggleMemberStatus(m.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${m.active ? 'bg-gray-100 hover:bg-orange-100' : 'bg-green-100 hover:bg-green-200'}`}
                    title={m.active ? 'Deactivate member' : 'Reactivate member'}>
                    {m.active ? <UserX className="w-3.5 h-3.5 text-gray-600" /> : <UserCheck className="w-3.5 h-3.5 text-green-700" />}
                  </button>
                  <button onClick={() => removeMember(m.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-red-100 transition-colors"
                    title="Remove member permanently">
                    <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── ANNOUNCEMENTS ─────────────────────────────────────────────
  function renderAnnouncements() {
    return (
      <div className="space-y-5">
        {/* New announcement composer */}
        <button onClick={() => setShowNewAnnouncement(!showNewAnnouncement)}
          className="w-full flex items-center gap-3 bg-[#140152] text-white rounded-2xl px-5 py-3.5 font-bold hover:bg-[#1a0270] transition-all">
          <Plus className="w-5 h-5" /> New Announcement to All Members
        </button>

        {showNewAnnouncement && (
          <div className="bg-white border border-violet-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-black text-[#140152] text-sm">Compose Announcement</h3>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="Announcement title…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <textarea rows={4} value={newBody} onChange={e => setNewBody(e.target.value)}
              placeholder="Write your message to all members…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setNewUrgent(!newUrgent)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${newUrgent ? 'bg-red-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${newUrgent ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Mark as Urgent</span>
              </label>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setShowNewAnnouncement(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={postAnnouncement} disabled={!newTitle.trim() || !newBody.trim()}
                  className="px-5 py-2 bg-[#140152] text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-[#1a0270] transition-all flex items-center gap-2">
                  <Send className="w-4 h-4" /> Send to All Members
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing announcements */}
        {announcements.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${a.urgent ? 'border-red-200' : 'border-gray-100'}`}>
            {a.pinned && (
              <div className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2">
                <Pin className="w-3 h-3" /> PINNED · URGENT
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className={`font-black text-base ${a.urgent ? 'text-red-700' : 'text-[#140152]'}`}>{a.title}</h3>
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {a.replies} {a.replies === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{a.body}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{DIRECTOR.name} · {a.time}</span>
                {a.replies > 0 && (
                  <button onClick={() => navigate('inbox')} className="text-violet-600 font-bold hover:underline flex items-center gap-1">
                    View replies <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ─── MINISTRY FEED (HIGHLIGHTS) ───────────────────────────────
  function renderHighlights() {
    const typeColors: Record<ChoirHighlight['type'], string> = {
      testimony: 'bg-amber-100 text-amber-700',
      update:    'bg-blue-100 text-blue-700',
      praise:    'bg-green-100 text-green-700',
    }
    const typeIcons: Record<ChoirHighlight['type'], string> = {
      testimony: '🙌',
      update:    '📢',
      praise:    '⭐',
    }
    return (
      <div className="space-y-5">
        <div className="bg-[#140152]/5 border border-[#140152]/10 rounded-xl px-4 py-3 text-sm text-[#140152] font-semibold">
          Posts here appear instantly on the <strong>Member Dashboard</strong> — share testimonies, updates, and praise reports.
        </div>

        {/* Compose */}
        <div className="bg-white border border-violet-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-black text-[#140152] text-sm flex items-center gap-2"><Star className="w-4 h-4 text-[#f5bb00]" /> Post to Member Feed</h3>
          <div className="flex gap-2">
            {(['update', 'testimony', 'praise'] as const).map(t => (
              <button key={t} onClick={() => setNewHighType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${newHighType === t ? 'bg-[#140152] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {typeIcons[t]} {t}
              </button>
            ))}
          </div>
          <input value={newHighTitle} onChange={e => setNewHighTitle(e.target.value)}
            placeholder="Title / headline…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          <textarea rows={3} value={newHighBody} onChange={e => setNewHighBody(e.target.value)}
            placeholder="Share the update, testimony, or praise report…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
          <div className="flex justify-end">
            <button onClick={postHighlight} disabled={!newHighTitle.trim() || !newHighBody.trim()}
              className="px-5 py-2 bg-[#140152] text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:bg-[#1a0270] transition-all flex items-center gap-2">
              <Send className="w-4 h-4" /> Publish to Members
            </button>
          </div>
        </div>

        {/* Posted highlights */}
        {highlights.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-semibold">No posts yet</p>
            <p className="text-xs mt-1">Your first post will appear on the member dashboard immediately.</p>
          </div>
        ) : (
          highlights.map(h => (
            <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${typeColors[h.type]}`}>{typeIcons[h.type]} {h.type}</span>
                  <h3 className="font-black text-[#140152]">{h.title}</h3>
                </div>
                <button onClick={() => deleteHighlight(h.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0" title="Delete">
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{h.body}</p>
              <p className="text-[10px] text-gray-400">{h.postedBy} · {h.time}</p>
            </div>
          ))
        )}
      </div>
    )
  }

  // ─── GROUP CHAT ────────────────────────────────────────────────
  function renderChat() {
    const VOICE_BUBBLE: Record<string, string> = {
      Director: '#f5bb00',
      Soprano:  '#7c3aed',
      Alto:     '#db2777',
      Tenor:    '#2563eb',
      Bass:     '#16a34a',
    }

    const formatTime = (iso: string) => {
      try {
        return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      } catch { return '' }
    }

    return (
      <div className="flex flex-col h-[calc(100vh-130px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-black text-[#140152]">Live Group Chat</span>
            <span className="text-xs text-gray-400">· {groupMessages.length} messages</span>
          </div>
          <button
            onClick={clearGroupChat}
            className="text-xs text-red-400 hover:text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear Chat
          </button>
        </div>

        {/* Error banner */}
        {chatError && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600 font-semibold flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {chatError}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
          {groupMessages.length === 0 && !chatError && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
              <p className="font-semibold text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation — members will see it instantly.</p>
            </div>
          )}

          {groupMessages.map((msg, i) => {
            const isMine = msg.is_director
            const prevMsg = groupMessages[i - 1]
            const showSender = !prevMsg || prevMsg.sender_name !== msg.sender_name
            const bubbleColor = VOICE_BUBBLE[msg.voice_part] || '#7c3aed'

            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar — show once per sender group */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 self-end ${showSender ? 'opacity-100' : 'opacity-0'}`}
                  style={{ backgroundColor: isMine ? '#f5bb00' : bubbleColor, color: isMine ? '#140152' : 'white' }}
                >
                  {msg.sender_initials}
                </div>

                <div className={`flex flex-col max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
                  {showSender && (
                    <div className={`flex items-center gap-2 mb-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold text-gray-700">{msg.sender_name}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: isMine ? '#f5bb00', color: isMine ? '#140152' : 'white' } as React.CSSProperties}
                      >
                        {msg.voice_part}
                      </span>
                    </div>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-[#f5bb00] text-[#140152] rounded-br-sm font-semibold'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            )
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 mt-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm focus-within:border-[#f5bb00] focus-within:ring-2 focus-within:ring-[#f5bb00]/20 transition-all">
            <div className="w-7 h-7 rounded-full bg-[#f5bb00] flex items-center justify-center font-black text-[#140152] text-xs flex-shrink-0">CD</div>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendGroupMessage()}
              placeholder="Message the choir…"
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            />
            <button
              onClick={sendGroupMessage}
              disabled={!chatInput.trim() || chatLoading}
              className="w-9 h-9 bg-[#140152] rounded-xl flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#1a0270] transition-all flex-shrink-0"
            >
              {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-1.5">
            Sending as <strong>Choir Director</strong> · Refreshes every 3 seconds
          </p>
        </div>
      </div>
    )
  }

  // ─── SONGS ─────────────────────────────────────────────────────
  function renderSongs() {
    const uploadDefs: { type: 'lyrics' | 'sheet' | 'track'; label: string; icon: React.ElementType; accept: string }[] = [
      { type: 'lyrics', label: 'Lyrics',      icon: BookOpen, accept: '.pdf,.txt,.doc,.docx' },
      { type: 'sheet',  label: 'Sheet Music', icon: Download, accept: '.pdf,.jpg,.jpeg,.png' },
      { type: 'track',  label: 'Audio Track', icon: Music,    accept: 'audio/*,.mp3,.wav,.m4a' },
    ]

    return (
      <div className="space-y-4">
        <div className="bg-[#140152]/5 border border-[#140152]/10 rounded-xl px-4 py-3 text-sm text-[#140152] font-semibold">
          Showing member readiness across all {MOCK_SONGS.length} songs · {MOCK_SONGS.filter(s => s.readyCount === s.totalCount).length} fully ready
        </div>

        {MOCK_SONGS.map(s => {
          const pct = Math.round((s.readyCount / s.totalCount) * 100)
          const barColor = pct === 100 ? '#16a34a' : pct >= 70 ? '#f5bb00' : '#7c3aed'
          const files = songFiles[s.id] || {}

          return (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-black text-[#140152]">{s.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{s.category} · {s.key} · {s.tempo}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${pct === 100 ? 'bg-green-100 text-green-700' : pct >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-violet-100 text-violet-700'}`}>
                  {pct}% ready
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                </div>
                <span className="text-xs text-gray-500 font-semibold flex-shrink-0">{s.readyCount}/{s.totalCount} members</span>
              </div>

              {/* Upload buttons row */}
              <div className="flex gap-2 flex-wrap">
                {uploadDefs.map(({ type, label, icon: Icon }) => {
                  const uploaded = files[type]
                  return uploaded ? (
                    <div key={type} className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold max-w-[180px]">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <a
                        href={uploaded.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                        title={uploaded.name}
                      >
                        {uploaded.name}
                      </a>
                      <button
                        onClick={() => removeFile(s.id, type)}
                        className="ml-auto flex-shrink-0 text-green-400 hover:text-red-500 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      key={type}
                      onClick={() => triggerUpload(s.id, type)}
                      className="flex items-center gap-1.5 text-xs font-bold bg-[#140152]/8 text-[#140152] px-3 py-1.5 rounded-lg hover:bg-[#140152]/15 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" /> Upload {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Hidden shared file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    )
  }

  // ─── SCHEDULE ──────────────────────────────────────────────────
  function renderEvents() {
    return (
      <div className="space-y-5">
        {MOCK_EVENTS.map(e => (
          <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: e.color }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: e.color }}>{e.type}</span>
                  <h3 className="font-black text-[#140152] text-lg mt-2">{e.title}</h3>
                </div>
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl text-white flex-shrink-0" style={{ backgroundColor: e.color }}>
                  <span className="text-2xl font-black leading-none">{e.daysLeft}</span>
                  <span className="text-[10px]">days</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{e.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" />{e.time}</span>
                <span className="flex items-center gap-1.5 col-span-2"><MapPin className="w-3.5 h-3.5 text-gray-400" />{e.venue}</span>
              </div>
              {/* Attendance bar */}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-600">Member confirmations</span>
                  <span className="text-xs font-black" style={{ color: e.color }}>{e.confirmed}/{e.total}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(e.confirmed / e.total) * 100}%`, backgroundColor: e.color }} />
                </div>
                {e.confirmed < e.total && (
                  <p className="text-[10px] text-orange-600 font-semibold mt-1.5">{e.total - e.confirmed} member{e.total - e.confirmed > 1 ? 's' : ''} yet to confirm</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ─── ATTENDANCE ────────────────────────────────────────────────
  function renderAttendance() {
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-[#140152] to-[#2d0a6e] rounded-3xl p-6 text-white">
          <p className="text-white/60 text-sm mb-1">Overall Ministry Attendance</p>
          <div className="text-5xl font-black text-[#f5bb00] mb-2">{avgAttendance}%</div>
          <p className="text-white/70 text-sm">Average across {activeCount} active members</p>
          <div className="mt-4 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-[#f5bb00] rounded-full" style={{ width: `${avgAttendance}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-800 text-sm">Individual Member Attendance</h3>
          </div>
          {[...members].filter(m => m.active).sort((a, b) => b.attendance - a.attendance).map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ backgroundColor: VOICE_BG[m.voice] }}>{m.initials}</div>
              <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{m.name}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${VOICE_COLORS[m.voice]}`}>{m.voice}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${m.attendance}%`, backgroundColor: m.attendance >= 80 ? '#16a34a' : m.attendance >= 60 ? '#f5bb00' : '#ef4444' }} />
                </div>
                <span className={`text-xs font-black w-8 text-right ${m.attendance >= 80 ? 'text-green-600' : m.attendance >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{m.attendance}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Low attendance alert */}
        {members.filter(m => m.active && m.attendance < 70).length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <h3 className="font-black text-orange-800 text-sm">Low Attendance Alert</h3>
            </div>
            <p className="text-orange-700 text-xs mb-3">The following members have attendance below 70% and may need follow-up:</p>
            <div className="space-y-2">
              {members.filter(m => m.active && m.attendance < 70).map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: VOICE_BG[m.voice] }}>{m.initials}</div>
                  <span className="flex-1 text-sm font-semibold text-gray-700">{m.name}</span>
                  <span className="text-xs font-black text-red-500">{m.attendance}%</span>
                  <a href={`tel:${m.phone}`} className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Call
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderSection() {
    switch (activeNav) {
      case 'home':       return renderHome()
      case 'chat':       return renderChat()
      case 'inbox':      return renderInbox()
      case 'members':    return renderMembers()
      case 'highlights': return renderHighlights()
      case 'announce':   return renderAnnouncements()
      case 'songs':      return renderSongs()
      case 'events':     return renderEvents()
      case 'attendance': return renderAttendance()
      default:           return renderHome()
    }
  }

  const currentNav = NAV_ITEMS.find(n => n.id === activeNav)

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:sticky top-0 left-0 h-full w-64 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #0a0020 0%, #1a0040 50%, #140152 100%)' }}>

        {/* Brand */}
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-9 h-9 bg-[#f5bb00] rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-[#140152]" />
          </div>
          <div>
            <div className="font-black text-sm tracking-widest text-white">ALTER SOUND</div>
            <div className="text-[10px] text-[#f5bb00] font-bold uppercase tracking-widest">Director Portal</div>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-white/60" /></button>
        </div>

        {/* Director chip */}
        <div className="mx-4 my-4 p-3 bg-[#f5bb00]/10 border border-[#f5bb00]/30 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f5bb00] flex items-center justify-center font-black text-[#140152] text-sm flex-shrink-0">CD</div>
          <div className="min-w-0">
            <div className="font-black text-white text-sm truncate">Choir Director</div>
            <div className="text-[#f5bb00]/70 text-xs">Director · Full Access</div>
          </div>
          <div className="w-2 h-2 bg-[#f5bb00] rounded-full flex-shrink-0" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === id ? 'bg-[#f5bb00] text-[#140152] font-black' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {id === 'chat' && (
                <span className="ml-auto bg-green-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5 leading-none">Live</span>
              )}
              {id === 'inbox' && unreadCount > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer links */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link href="/services/alter-sound/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/10 hover:text-white transition-all">
            <Users className="w-4 h-4" /> Member View
          </Link>
          <Link href="/services/alter-sound" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/10 hover:text-white transition-all">
            <ArrowRight className="w-4 h-4" /> Back to Alter Sound
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            {currentNav && <currentNav.icon className="w-4 h-4 text-[#140152]" />}
            <h1 className="font-black text-[#140152] text-base">{currentNav?.label}</h1>
            <span className="hidden sm:inline text-[10px] font-bold bg-[#f5bb00]/20 text-[#140152] px-2 py-0.5 rounded-full ml-1 capitalize">{authRole === 'admin' ? '★ Admin View' : 'Director Access'}</span>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => navigate('inbox')} className="relative p-2 rounded-xl hover:bg-gray-100">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">{unreadCount}</span>
            </button>
          )}
          <div className="w-9 h-9 rounded-full bg-[#f5bb00] flex items-center justify-center font-black text-[#140152] text-sm flex-shrink-0">{authRole === 'admin' ? 'A' : 'CD'}</div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}

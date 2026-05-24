'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Play, Pause, Music, Bell, MessageSquare, Flame, Mic2, Globe,
  Sparkles, Music2, LogOut, User, Settings, BookOpen, Calendar,
  Heart, LayoutDashboard, Library, Volume2, Clock, CheckCircle2,
  AlertCircle, Send, X, ChevronDown, ChevronRight, Download,
  Search, Users, Star, Award, TrendingUp, MapPin, Phone,
  CheckSquare, Square, Zap, Crown, Shield, Target, ArrowRight,
  PlusCircle, BarChart2, Image, Video, Quote, RefreshCw, Home,
  Menu, Filter, Loader2, ThumbsUp, Mail, Smile, Paperclip, Pin
} from 'lucide-react'
import { alterSoundApi, AudioTrack, AudioCategory } from '@/lib/api'

/* ─── Types ─────────────────────────────────────────────────── */
interface Task {
  id: string
  text: string
  category: 'practice' | 'admin' | 'service'
  done: boolean
  due?: string
}

interface Song {
  id: string
  title: string
  key: string
  tempo: string
  voicePart: string
  status: 'not-started' | 'practicing' | 'ready'
  hasLyrics: boolean
  hasSheet: boolean
  hasTrack: boolean
  category: string
}

interface Member {
  id: string
  name: string
  initials: string
  voice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass'
  role?: string
  active: boolean
}

interface Event {
  id: string
  title: string
  type: 'rehearsal' | 'service' | 'special'
  date: string
  time: string
  venue: string
  daysLeft: number
  color: string
}

interface Announcement {
  id: string
  title: string
  body: string
  author: string
  time: string
  urgent: boolean
  pinned?: boolean
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderInitials: string
  senderVoice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass'
  text: string
  time: string
  isMine: boolean
  reactions?: { emoji: string; count: number }[]
}

/* ─── Mock Data ──────────────────────────────────────────────── */
const MEMBER_INFO = { name: 'Sister Jane', initials: 'SJ', voice: 'Soprano', role: 'Section Leader', avatar: '#7c3aed' }

const MOCK_TASKS: Task[] = [
  { id: '1', text: 'Practice Alto harmony for "Great Are You Lord"', category: 'practice', done: false, due: 'Today' },
  { id: '2', text: 'Confirm Sunday availability with choir director', category: 'admin', done: false, due: 'Tomorrow' },
  { id: '3', text: 'Download new lyrics for Easter medley', category: 'practice', done: false, due: 'Fri' },
  { id: '4', text: 'Attend Thursday rehearsal (7pm)', category: 'service', done: true },
  { id: '5', text: 'Submit voice warm-up feedback form', category: 'admin', done: true },
]

const MOCK_SONGS: Song[] = [
  { id: '1', title: 'Great Are You Lord', key: 'G Major', tempo: '72 BPM', voicePart: 'All Parts', status: 'ready', hasLyrics: true, hasSheet: true, hasTrack: true, category: 'Worship' },
  { id: '2', title: 'Way Maker', key: 'Ab Major', tempo: '68 BPM', voicePart: 'Soprano Lead', status: 'practicing', hasLyrics: true, hasSheet: true, hasTrack: false, category: 'Praise' },
  { id: '3', title: 'Reckless Love', key: 'E Major', tempo: '75 BPM', voicePart: 'All Parts', status: 'practicing', hasLyrics: true, hasSheet: false, hasTrack: true, category: 'Worship' },
  { id: '4', title: 'Goodness of God', key: 'B Major', tempo: '65 BPM', voicePart: 'Alto Harmony', status: 'not-started', hasLyrics: false, hasSheet: false, hasTrack: false, category: 'Praise' },
  { id: '5', title: 'Holy Spirit (You Are Welcome)', key: 'D Major', tempo: '60 BPM', voicePart: 'All Parts', status: 'not-started', hasLyrics: true, hasSheet: false, hasTrack: false, category: 'Prophetic' },
]

const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Weekly Rehearsal', type: 'rehearsal', date: 'Thursday, May 29', time: '7:00 PM', venue: 'Church Hall B', daysLeft: 6, color: '#7c3aed' },
  { id: '2', title: 'Sunday Morning Service', type: 'service', date: 'Sunday, June 1', time: '9:00 AM', venue: 'Main Sanctuary', daysLeft: 9, color: '#0284c7' },
  { id: '3', title: 'LETW Anniversary Concert', type: 'special', date: 'Saturday, June 28', time: '5:00 PM', venue: 'Main Auditorium', daysLeft: 36, color: '#f5bb00' },
]

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: '⚠️ Mandatory Rehearsal This Thursday', body: 'All members are required to attend. We will be running through all 5 songs for the anniversary. No absences unless pre-approved.', author: 'Choir Director', time: '2 hours ago', urgent: true, pinned: true },
  { id: '2', title: 'New Sheet Music Available', body: 'Sheet music for the Easter medley has been uploaded to the library. Please download before Friday\'s session.', author: 'Choir Director', time: '1 day ago', urgent: false },
  { id: '3', title: 'Congratulations to the Soprano Section!', body: 'Excellent performance last Sunday. The congregation was truly blessed. Keep up the excellent work!', author: 'Pastor Wale', time: '3 days ago', urgent: false },
]

// No fake members — real members are added by the Choir Master
const MOCK_MEMBERS: Member[] = []

const ATTENDANCE = [
  { week: 'Week 1', attended: true }, { week: 'Week 2', attended: true },
  { week: 'Week 3', attended: false }, { week: 'Week 4', attended: true },
]

// Chat starts empty — real messages come from real members
const MOCK_CHAT: ChatMessage[] = []

const VOICE_AVATAR: Record<string, string> = {
  Soprano: '#7c3aed',
  Alto: '#db2777',
  Tenor: '#2563eb',
  Bass: '#16a34a',
}

const VOICE_COLORS: Record<string, string> = {
  Soprano: 'bg-purple-100 text-purple-700',
  Alto: 'bg-pink-100 text-pink-700',
  Tenor: 'bg-blue-100 text-blue-700',
  Bass: 'bg-green-100 text-green-700',
}

const STATUS_CONFIG = {
  'not-started': { label: 'Not Started', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  'practicing': { label: 'Practicing', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  'ready': { label: 'Ready', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'songs', label: 'Songs', icon: Music },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
  { id: 'chat', label: 'Group Chat', icon: MessageSquare },
  { id: 'announcements', label: 'Notices', icon: Bell },
  { id: 'attendance', label: 'Attendance', icon: BarChart2 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'highlights', label: 'Highlights', icon: Star },
]

/* ═══════════════════════════════════════════════════════════════ */
export default function ChoirDashboard() {
  const [activeNav, setActiveNav] = useState('home')
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS)
  const [songSearch, setSongSearch] = useState('')
  const [songFilter, setSongFilter] = useState('all')
  const [memberFilter, setMemberFilter] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [msgInput, setMsgInput] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sentReplies, setSentReplies] = useState<Record<string, string>>({})
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT)
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /* Countdown to next major event (Anniversary Concert) */
  useEffect(() => {
    const target = new Date('2026-06-28T17:00:00')
    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) return
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* Load audio tracks */
  useEffect(() => {
    alterSoundApi.getPageData().then(d => setTracks(d.all_tracks.filter(t => t.is_active))).catch(() => {})
  }, [])

  const handlePlay = async (trackId: string) => {
    if (currentlyPlaying === trackId) {
      audioRef.current?.pause()
      setCurrentlyPlaying(null)
      return
    }
    audioRef.current?.pause()
    try {
      const audio = new Audio(alterSoundApi.getAudioUrl(trackId))
      audioRef.current = audio
      audio.addEventListener('ended', () => setCurrentlyPlaying(null))
      await audio.play()
      setCurrentlyPlaying(trackId)
      await alterSoundApi.incrementPlayCount(trackId)
    } catch { setCurrentlyPlaying(null) }
  }

  const toggleTask = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const updateSongStatus = (id: string, status: Song['status']) =>
    setSongs(prev => prev.map(s => s.id === id ? { ...s, status } : s))

  const sendChatMessage = () => {
    const text = chatInput.trim()
    if (!text) return
    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: '1',
      senderName: MEMBER_INFO.name,
      senderInitials: MEMBER_INFO.initials,
      senderVoice: MEMBER_INFO.voice as 'Soprano',
      text,
      time,
      isMine: true,
    }])
    setChatInput('')
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
  }

  const addReaction = (msgId: string, emoji: string) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const existing = m.reactions?.find(r => r.emoji === emoji)
      if (existing) {
        return { ...m, reactions: m.reactions!.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) }
      }
      return { ...m, reactions: [...(m.reactions || []), { emoji, count: 1 }] }
    }))
  }

  const submitReply = (announcementId: string) => {
    if (!replyText.trim()) return
    setSentReplies(prev => ({ ...prev, [announcementId]: replyText.trim() }))
    setReplyingTo(null)
    setReplyText('')
  }

  /* Auto-scroll chat to bottom on mount */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView()
  }, [])

  const filteredSongs = songs.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(songSearch.toLowerCase())
    const matchFilter = songFilter === 'all' || s.status === songFilter
    return matchSearch && matchFilter
  })

  const filteredMembers = memberFilter === 'All' ? MOCK_MEMBERS : MOCK_MEMBERS.filter(m => m.voice === memberFilter)

  const attendancePct = Math.round((ATTENDANCE.filter(a => a.attended).length / ATTENDANCE.length) * 100)
  const pendingTasks = tasks.filter(t => !t.done).length
  const readySongs = songs.filter(s => s.status === 'ready').length
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const navigate = (id: string) => { setActiveNav(id); setSidebarOpen(false) }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ════ SIDEBAR ════ */}
      <aside className={`fixed md:sticky top-0 left-0 h-full w-64 bg-[#140152] text-white flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Brand */}
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-9 h-9 bg-[#f5bb00] rounded-xl flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 text-[#140152]" />
          </div>
          <div>
            <div className="font-black text-sm tracking-widest">ALTER SOUND</div>
            <div className="text-white/50 text-xs">Choir Portal</div>
          </div>
          <button className="md:hidden ml-auto" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-white/60" /></button>
        </div>

        {/* Member chip */}
        <div className="mx-4 my-4 p-3 bg-white/5 rounded-2xl flex items-center gap-3 border border-white/10">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: MEMBER_INFO.avatar }}>
            {MEMBER_INFO.initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{MEMBER_INFO.name}</div>
            <div className="text-white/50 text-xs">{MEMBER_INFO.voice} · {MEMBER_INFO.role}</div>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === id ? 'bg-[#f5bb00] text-[#140152] font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {id === 'tasks' && pendingTasks > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingTasks}</span>
              )}
              {id === 'chat' && (
                <span className="ml-auto bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">Live</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <button onClick={() => navigate('home')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <Link href="/services/alter-sound" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all">
            <Globe className="w-4 h-4" /> Back to Alter Sound
          </Link>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-[#140152] text-lg">{NAV_ITEMS.find(n => n.id === activeNav)?.label}</h1>
            <p className="text-gray-400 text-xs hidden sm:block">{today}</p>
          </div>
          <button className="relative p-2 rounded-lg hover:bg-gray-100" onClick={() => navigate('announcements')}>
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: MEMBER_INFO.avatar }}>
            {MEMBER_INFO.initials}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">

            {/* ══════════ HOME ══════════ */}
            {activeNav === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Welcome banner */}
                <div className="relative bg-gradient-to-br from-[#140152] to-[#2d0a6e] rounded-3xl p-6 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 opacity-10"><Music2 className="w-full h-full" /></div>
                  <div className="relative z-10">
                    <p className="text-white/60 text-sm mb-1">{today}</p>
                    <h2 className="text-2xl font-black mb-1">Welcome back, {MEMBER_INFO.name}! 🎶</h2>
                    <p className="text-white/70 text-sm mb-5">You are a consecrated servant releasing heaven's sound.</p>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => navigate('songs')} className="flex items-center gap-2 bg-[#f5bb00] text-[#140152] px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#f5bb00]/90 transition-all">
                        <Music className="w-4 h-4" /> This Week's Songs
                      </button>
                      <button onClick={() => navigate('events')} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all border border-white/20">
                        <Calendar className="w-4 h-4" /> Next Rehearsal
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Attendance', value: `${attendancePct}%`, icon: BarChart2, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Songs to Practice', value: `${songs.filter(s => s.status !== 'ready').length}`, icon: Music, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Pending Tasks', value: `${pendingTasks}`, icon: CheckSquare, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Songs Ready', value: `${readySongs}/${songs.length}`, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                        <s.icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Next rehearsal reminder */}
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-purple-800">Next Rehearsal</span>
                      <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full font-semibold">In {MOCK_EVENTS[0].daysLeft} days</span>
                    </div>
                    <p className="text-purple-700 font-semibold">{MOCK_EVENTS[0].date} · {MOCK_EVENTS[0].time}</p>
                    <p className="text-purple-500 text-sm flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {MOCK_EVENTS[0].venue}</p>
                  </div>
                  <button onClick={() => navigate('events')} className="text-purple-600 hover:text-purple-800 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-bold text-[#140152] mb-4 text-lg">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Mark Attendance', icon: CheckCircle2, color: 'bg-green-500', action: () => navigate('attendance') },
                      { label: 'View Song Library', icon: Music, color: 'bg-purple-600', action: () => navigate('songs') },
                      { label: 'Download Music', icon: Download, color: 'bg-blue-600', action: () => navigate('songs') },
                      { label: 'Confirm Availability', icon: ThumbsUp, color: 'bg-amber-500', action: () => navigate('tasks') },
                      { label: 'Rehearsal Schedule', icon: Calendar, color: 'bg-red-500', action: () => navigate('events') },
                      { label: 'View Announcements', icon: Bell, color: 'bg-indigo-600', action: () => navigate('announcements') },
                    ].map((a, i) => (
                      <button key={i} onClick={a.action}
                        className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#140152]/20 transition-all group text-center">
                        <div className={`w-12 h-12 ${a.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <a.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 leading-tight">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Countdown to anniversary */}
                <div className="bg-gradient-to-r from-[#f5bb00] to-[#f59e0b] rounded-3xl p-6 text-[#140152]">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5" />
                    <span className="font-black text-sm uppercase tracking-wider">LETW Anniversary Concert</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { val: countdown.days, label: 'Days' },
                      { val: countdown.hours, label: 'Hours' },
                      { val: countdown.mins, label: 'Mins' },
                      { val: countdown.secs, label: 'Secs' },
                    ].map((c, i) => (
                      <div key={i} className="bg-[#140152]/10 rounded-2xl p-3 text-center">
                        <div className="text-3xl font-black tabular-nums">{String(c.val).padStart(2, '0')}</div>
                        <div className="text-xs font-semibold opacity-70 mt-1">{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm mt-4 opacity-70">📍 Main Auditorium · Saturday, June 28 · 5:00 PM</p>
                </div>

                {/* Recent announcements preview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#140152] text-lg">Latest Notices</h3>
                    <button onClick={() => navigate('announcements')} className="text-sm text-[#140152] font-semibold hover:underline">View all</button>
                  </div>
                  <div className="space-y-3">
                    {MOCK_ANNOUNCEMENTS.slice(0, 2).map(a => (
                      <div key={a.id} className={`p-4 rounded-2xl border ${a.urgent ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-start gap-3">
                          {a.urgent && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{a.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ SONGS ══════════ */}
            {activeNav === 'songs' && (
              <motion.div key="songs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={songSearch} onChange={e => setSongSearch(e.target.value)}
                      placeholder="Search songs…" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#140152]/20 text-sm" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'not-started', 'practicing', 'ready'].map(f => (
                      <button key={f} onClick={() => setSongFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${songFilter === f ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]'}`}>
                        {f === 'all' ? 'All' : STATUS_CONFIG[f as Song['status']].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredSongs.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No songs found</p>
                    </div>
                  )}
                  {filteredSongs.map(song => {
                    const cfg = STATUS_CONFIG[song.status]
                    return (
                      <div key={song.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                  {cfg.label}
                                </span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{song.category}</span>
                              </div>
                              <h3 className="font-bold text-[#140152] text-lg">{song.title}</h3>
                              <p className="text-gray-500 text-sm">{song.voicePart} · {song.key} · {song.tempo}</p>
                            </div>
                            <div className="w-12 h-12 bg-[#140152]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Music2 className="w-6 h-6 text-[#140152]" />
                            </div>
                          </div>

                          {/* Resources */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${song.hasLyrics ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} disabled={!song.hasLyrics}>
                              <BookOpen className="w-3.5 h-3.5" /> Lyrics
                            </button>
                            <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${song.hasSheet ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} disabled={!song.hasSheet}>
                              <Download className="w-3.5 h-3.5" /> Sheet Music
                            </button>
                            <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${song.hasTrack ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} disabled={!song.hasTrack}>
                              <Play className="w-3.5 h-3.5" /> Practice Track
                            </button>
                          </div>

                          {/* Update status */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Update status:</span>
                            {(['not-started', 'practicing', 'ready'] as Song['status'][]).map(s => (
                              <button key={s} onClick={() => updateSongStatus(song.id, s)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${song.status === s ? STATUS_CONFIG[s].color + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {STATUS_CONFIG[s].label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Audio tracks from API */}
                {tracks.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#140152] mb-4 text-lg">Audio Library</h3>
                    <div className="space-y-3">
                      {tracks.map(track => (
                        <div key={track.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                          <button onClick={() => handlePlay(track.id)}
                            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${currentlyPlaying === track.id ? 'bg-[#f5bb00] text-[#140152]' : 'bg-[#140152] text-white hover:bg-[#1a0270]'}`}>
                            {currentlyPlaying === track.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#140152] truncate">{track.title}</p>
                            <p className="text-gray-400 text-xs">{track.play_count} plays</p>
                          </div>
                          <Volume2 className={`w-4 h-4 flex-shrink-0 ${currentlyPlaying === track.id ? 'text-[#f5bb00] animate-pulse' : 'text-gray-300'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════ GROUP CHAT ══════════ */}
            {activeNav === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="flex flex-col h-[calc(100vh-130px)]">

                {/* Chat header */}
                <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3.5 mb-4 shadow-sm flex-shrink-0">
                  <div className="w-10 h-10 bg-[#140152] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-5 h-5 text-[#f5bb00]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-black text-[#140152] text-sm">Alter Sound — Group Chat</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs text-gray-400">{MOCK_MEMBERS.filter(m => m.active).length} members online · Choir members only</span>
                    </div>
                  </div>
                  {/* Online member avatars */}
                  <div className="flex -space-x-2 flex-shrink-0">
                    {MOCK_MEMBERS.filter(m => m.active).slice(0, 5).map(m => (
                      <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: VOICE_AVATAR[m.voice] }}>
                        {m.initials}
                      </div>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-500 text-[9px] font-bold">
                      +{MOCK_MEMBERS.filter(m => m.active).length - 5}
                    </div>
                  </div>
                </div>

                {/* Voice legend */}
                <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
                  {Object.entries(VOICE_COLORS).map(([v, cls]) => (
                    <span key={v} className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{v}</span>
                  ))}
                  <span className="text-xs text-gray-400 ml-auto self-center">Tap a message to react</span>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>

                  {/* Date divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400 font-semibold px-3 py-1 bg-gray-50 rounded-full">Today</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {chatMessages.map((msg, i) => {
                    const prevMsg = chatMessages[i - 1]
                    const showSender = !prevMsg || prevMsg.senderId !== msg.senderId
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 group ${msg.isMine ? 'flex-row-reverse' : 'flex-row'}`}>

                        {/* Avatar — only show for first message in cluster */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1"
                          style={{ backgroundColor: showSender ? VOICE_AVATAR[msg.senderVoice] : 'transparent', opacity: showSender ? 1 : 0 }}>
                          {showSender ? msg.senderInitials : ''}
                        </div>

                        <div className={`flex flex-col max-w-[72%] ${msg.isMine ? 'items-end' : 'items-start'}`}>
                          {/* Sender name */}
                          {showSender && !msg.isMine && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                              <span className="text-xs font-bold text-gray-700">{msg.senderName}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${VOICE_COLORS[msg.senderVoice]}`}>{msg.senderVoice}</span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed cursor-pointer transition-all hover:opacity-90 ${
                              msg.isMine
                                ? 'bg-[#140152] text-white rounded-br-sm'
                                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                            }`}
                            onClick={() => {
                              const emojis = ['❤️', '🔥', '🙌', '😂', '👍']
                              addReaction(msg.id, emojis[Math.floor(Math.random() * emojis.length)])
                            }}
                          >
                            {msg.text}
                          </div>

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {msg.reactions.map(r => (
                                <button key={r.emoji}
                                  onClick={() => addReaction(msg.id, r.emoji)}
                                  className="flex items-center gap-1 bg-white border border-gray-100 rounded-full px-2 py-0.5 text-xs hover:bg-gray-50 shadow-sm transition-all hover:scale-105">
                                  <span>{r.emoji}</span>
                                  <span className="text-gray-500 font-semibold">{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Time */}
                          <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input bar */}
                <div className="flex-shrink-0 mt-3">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm focus-within:border-[#140152] focus-within:ring-2 focus-within:ring-[#140152]/10 transition-all">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                      placeholder="Message the choir…"
                      className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                    />
                    <button onClick={sendChatMessage} disabled={!chatInput.trim()}
                      className="w-9 h-9 bg-[#140152] rounded-xl flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#1a0270] transition-all disabled:cursor-not-allowed flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 mt-1.5">
                    Only verified Alter Sound members can see this chat · Choir members: {MOCK_MEMBERS.filter(m => m.active).length} active
                  </p>
                </div>
              </motion.div>
            )}

            {/* ══════════ EVENTS ══════════ */}
            {activeNav === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Countdown */}
                <div className="bg-gradient-to-br from-[#140152] to-[#2d0a6e] rounded-3xl p-6 text-white text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-[#f5bb00]" />
                    <span className="font-black tracking-widest text-sm uppercase text-[#f5bb00]">LETW Anniversary Concert</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                    {[
                      { val: countdown.days, label: 'Days' },
                      { val: countdown.hours, label: 'Hours' },
                      { val: countdown.mins, label: 'Mins' },
                      { val: countdown.secs, label: 'Secs' },
                    ].map((c, i) => (
                      <div key={i} className="bg-white/10 rounded-2xl p-3">
                        <div className="text-3xl font-black tabular-nums">{String(c.val).padStart(2, '0')}</div>
                        <div className="text-white/60 text-xs mt-1">{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/60 text-sm mt-4">📍 Main Auditorium · Saturday, June 28 · 5:00 PM</p>
                </div>

                {/* Events list */}
                <div className="space-y-4">
                  {MOCK_EVENTS.map(event => (
                    <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="h-1" style={{ backgroundColor: event.color }} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white capitalize" style={{ backgroundColor: event.color }}>
                                {event.type}
                              </span>
                              <span className="text-xs text-gray-400">In {event.daysLeft} days</span>
                            </div>
                            <h3 className="font-bold text-[#140152] text-xl mb-2">{event.title}</h3>
                            <div className="space-y-1.5">
                              <p className="text-gray-600 text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{event.date}</p>
                              <p className="text-gray-600 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{event.time}</p>
                              <p className="text-gray-600 text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{event.venue}</p>
                            </div>
                          </div>
                          <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: event.color }}>
                            <span className="text-2xl font-black leading-none">{event.daysLeft}</span>
                            <span className="text-xs">days</span>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                          <button className="flex-1 bg-[#140152] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a0270] transition-all">
                            Confirm Attendance
                          </button>
                          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                            Remind Me
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════ TASKS ══════════ */}
            {activeNav === 'tasks' && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Tasks', val: tasks.length, color: 'text-[#140152]', bg: 'bg-[#140152]/5' },
                    { label: 'Pending', val: tasks.filter(t => !t.done).length, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Completed', val: tasks.filter(t => t.done).length, color: 'text-green-600', bg: 'bg-green-50' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                      <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                      <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pending */}
                <div>
                  <h3 className="font-bold text-[#140152] mb-3">Pending Tasks</h3>
                  <div className="space-y-3">
                    {tasks.filter(t => !t.done).map(task => (
                      <div key={task.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
                        <button onClick={() => toggleTask(task.id)} className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#140152] transition-colors flex items-center justify-center" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${task.category === 'practice' ? 'bg-purple-100 text-purple-700' : task.category === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {task.category}
                            </span>
                            {task.due && <span className="text-xs text-red-500 font-semibold">Due: {task.due}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => !t.done).length === 0 && (
                      <div className="text-center py-10 text-gray-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
                        <p className="font-semibold text-green-600">All tasks completed!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed */}
                {tasks.filter(t => t.done).length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-400 mb-3">Completed</h3>
                    <div className="space-y-3">
                      {tasks.filter(t => t.done).map(task => (
                        <div key={task.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-start gap-4 opacity-60">
                          <button onClick={() => toggleTask(task.id)} className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </button>
                          <p className="line-through text-gray-500">{task.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════ ANNOUNCEMENTS ══════════ */}
            {activeNav === 'announcements' && (
              <motion.div key="announcements" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">

                <div className="bg-[#140152]/5 border border-[#140152]/10 rounded-2xl px-5 py-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#140152]" />
                  <p className="text-sm text-[#140152] font-semibold">Tap <strong>Reply</strong> on any notice to send a message directly to the Choir Director or Pastor.</p>
                </div>

                {MOCK_ANNOUNCEMENTS.map(a => (
                  <div key={a.id} className={`rounded-2xl border shadow-sm overflow-hidden ${a.urgent ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-white'}`}>
                    {a.pinned && (
                      <div className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" /> PINNED · URGENT
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className={`font-bold text-lg mb-2 ${a.urgent ? 'text-red-800' : 'text-[#140152]'}`}>{a.title}</h3>
                      <p className={`text-sm leading-relaxed mb-4 ${a.urgent ? 'text-red-700' : 'text-gray-600'}`}>{a.body}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#140152] rounded-full flex items-center justify-center text-white text-xs font-black">
                            {a.author.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-700">{a.author}</p>
                            <p className="text-xs text-gray-400">{a.time}</p>
                          </div>
                        </div>
                        {sentReplies[a.id] ? (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reply sent
                          </span>
                        ) : (
                          <button
                            onClick={() => setReplyingTo(replyingTo === a.id ? null : a.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                              replyingTo === a.id
                                ? 'bg-[#140152] text-white'
                                : 'bg-[#140152]/10 text-[#140152] hover:bg-[#140152]/20'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {replyingTo === a.id ? 'Cancel' : 'Reply'}
                          </button>
                        )}
                      </div>

                      {/* Sent reply preview */}
                      {sentReplies[a.id] && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                          <p className="text-xs font-bold text-green-700 mb-1">Your reply to {a.author}:</p>
                          <p className="text-sm text-green-800 italic">"{sentReplies[a.id]}"</p>
                        </div>
                      )}

                      {/* Inline reply box */}
                      <AnimatePresence>
                        {replyingTo === a.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              {/* Quoted message */}
                              <div className="flex items-start gap-2 mb-3">
                                <div className="w-1 bg-[#140152] rounded-full self-stretch flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] font-bold text-[#140152] mb-0.5">Replying to {a.author}</p>
                                  <p className="text-xs text-gray-500 line-clamp-2">{a.body}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-[#140152] focus-within:bg-white transition-all">
                                <div className="w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                  {MEMBER_INFO.initials}
                                </div>
                                <input
                                  autoFocus
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && submitReply(a.id)}
                                  placeholder={`Reply to ${a.author}…`}
                                  className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                                />
                                <button
                                  onClick={() => submitReply(a.id)}
                                  disabled={!replyText.trim()}
                                  className="w-8 h-8 bg-[#140152] rounded-lg flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#1a0270] transition-all flex-shrink-0"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1.5 pl-1">Press Enter or click send · Your reply goes directly to {a.author}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}

                {/* Direct message box */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-[#140152] mb-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Send a Direct Message
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">Send a general message to the Choir Director at any time.</p>
                  <div className="flex gap-3">
                    <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && msgInput.trim()) setMsgInput('') }}
                      placeholder="Write a message to the Choir Director…"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#140152]/20 text-sm" />
                    <button onClick={() => setMsgInput('')} disabled={!msgInput.trim()}
                      className="px-5 py-3 bg-[#140152] text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-[#1a0270] transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ ATTENDANCE ══════════ */}
            {activeNav === 'attendance' && (
              <motion.div key="attendance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                <div className="bg-gradient-to-br from-[#140152] to-[#2d0a6e] rounded-3xl p-6 text-white text-center">
                  <p className="text-white/60 text-sm mb-2">This Month's Attendance</p>
                  <div className="text-6xl font-black text-[#f5bb00] mb-2">{attendancePct}%</div>
                  <p className="text-white/70">{ATTENDANCE.filter(a => a.attended).length} of {ATTENDANCE.length} sessions attended</p>
                  <div className="mt-6 h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#f5bb00] rounded-full transition-all" style={{ width: `${attendancePct}%` }} />
                  </div>
                </div>

                {/* Weekly breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-[#140152] mb-5">Monthly Breakdown</h3>
                  <div className="space-y-4">
                    {ATTENDANCE.map((a, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 w-16">{a.week}</span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${a.attended ? 'bg-green-500 w-full' : 'bg-red-400 w-full'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${a.attended ? 'text-green-600' : 'text-red-500'}`}>
                          {a.attended ? '✓ Present' : '✗ Absent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mark attendance */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-bold text-green-800 mb-2">Mark Today's Attendance</h3>
                  <p className="text-green-600 text-sm mb-5">Confirm your presence at today's rehearsal or service.</p>
                  <button className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 transition-all">
                    I'm Present Today
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Consistency', val: `${attendancePct}%`, icon: TrendingUp, color: 'text-green-600' },
                    { label: 'Streak', val: '2 weeks', icon: Zap, color: 'text-amber-600' },
                    { label: 'Rank', val: 'Top 10%', icon: Award, color: 'text-purple-600' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                      <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                      <div className={`font-black text-lg ${s.color}`}>{s.val}</div>
                      <div className="text-gray-400 text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════ MEMBERS ══════════ */}
            {activeNav === 'members' && (
              <motion.div key="members" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Filter by voice */}
                <div className="flex gap-2 flex-wrap">
                  {['All', 'Soprano', 'Alto', 'Tenor', 'Bass'].map(v => (
                    <button key={v} onClick={() => setMemberFilter(v)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${memberFilter === v ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]'}`}>
                      {v}
                    </button>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['Soprano', 'Alto', 'Tenor', 'Bass'] as const).map(v => {
                    const count = MOCK_MEMBERS.filter(m => m.voice === v).length
                    return (
                      <div key={v} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${VOICE_COLORS[v]}`}>{v}</div>
                        <div className="text-2xl font-black text-[#140152]">{count}</div>
                        <div className="text-gray-400 text-xs">members</div>
                      </div>
                    )
                  })}
                </div>

                {/* Members grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredMembers.map(member => (
                    <div key={member.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${!member.active ? 'opacity-50' : 'border-gray-100 hover:shadow-md transition-all'}`}>
                      <div className="w-12 h-12 bg-[#140152] rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#140152] truncate">{member.name}</p>
                          {!member.active && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${VOICE_COLORS[member.voice]}`}>{member.voice}</span>
                          {member.role && <span className="text-xs text-gray-400">{member.role}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="w-8 h-8 bg-[#140152]/5 hover:bg-[#140152]/10 rounded-lg flex items-center justify-center transition-all">
                          <MessageSquare className="w-4 h-4 text-[#140152]" />
                        </button>
                        <button className="w-8 h-8 bg-[#140152]/5 hover:bg-[#140152]/10 rounded-lg flex items-center justify-center transition-all">
                          <Mail className="w-4 h-4 text-[#140152]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════ HIGHLIGHTS ══════════ */}
            {activeNav === 'highlights' && (
              <motion.div key="highlights" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

                {/* Bible verse */}
                <div className="bg-gradient-to-br from-[#140152] to-[#2d0a6e] rounded-3xl p-8 text-white text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5"><Quote className="w-full h-full" /></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-[#f5bb00]/20 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Quote className="w-6 h-6 text-[#f5bb00]" />
                    </div>
                    <span className="text-[#f5bb00] text-xs font-bold uppercase tracking-widest mb-4 block">Bible Verse of the Week</span>
                    <p className="text-xl md:text-2xl font-bold leading-relaxed mb-4 italic">
                      "Sing to him a new song; play skillfully, and shout for joy."
                    </p>
                    <p className="text-[#f5bb00] font-bold">— Psalm 33:3</p>
                  </div>
                </div>

                {/* Ministry stats */}
                <div>
                  <h3 className="font-bold text-[#140152] mb-4 text-lg">Ministry Highlights</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { val: '+12', label: 'New Members This Year', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
                      { val: '48', label: 'Services Ministered', icon: Mic2, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { val: '95%', label: 'Member Satisfaction', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
                      { val: '6', label: 'Special Programs', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-2xl p-5 text-center`}>
                        <s.icon className={`w-7 h-7 mx-auto mb-3 ${s.color}`} />
                        <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                        <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Encouragement cards */}
                <div>
                  <h3 className="font-bold text-[#140152] mb-4 text-lg">Testimonies & Encouragement</h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Lives Touched Last Sunday', body: 'Three people gave their lives to Christ after the choir ministered "Reckless Love" during the altar call. Glory to God!', icon: Heart, color: 'bg-red-50 border-red-200', iconColor: 'text-red-500' },
                      { title: 'Choir Grew by 12 Members', body: 'We welcomed 12 new members to the Alter Sound family this year — 5 sopranos, 3 altos, 2 tenors, and 2 bass. The sound is growing!', icon: Users, color: 'bg-green-50 border-green-200', iconColor: 'text-green-500' },
                      { title: 'Anniversary Concert Coming Up!', body: 'Preparations are in full swing for the LETW Anniversary Concert on June 28. Let\'s make it a night of glory!', icon: Star, color: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-500' },
                    ].map((h, i) => (
                      <div key={i} className={`rounded-2xl border p-5 ${h.color}`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <h.icon className={`w-5 h-5 ${h.iconColor}`} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#140152] mb-1">{h.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{h.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spiritual encouragement */}
                <div className="bg-[#f5bb00] rounded-3xl p-8 text-[#140152] text-center">
                  <Crown className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-2xl font-black mb-3">You Are Called</h3>
                  <p className="font-medium opacity-80 max-w-md mx-auto">
                    Your voice is not just music — it is ministry. Every note you sing carries the power to break chains, heal hearts, and usher in God's presence. Keep consecrating yourself.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

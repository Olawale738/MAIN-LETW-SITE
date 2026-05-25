'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Music2, Flame, Bell, MessageSquare, Users, Home, Music,
  ChevronRight, Send, Play, Pause, Volume2, Search, LogOut,
  BookOpen, Download, BarChart2, CheckSquare, Star, Calendar,
  Heart, Mic2, CheckCircle2, AlertCircle,
  Loader2, Globe, Crown, ChevronDown
} from 'lucide-react'
import { alterSoundApi, AudioTrack } from '@/lib/api'
import type { DeptAnnouncement, DeptActivity, MyAttendanceRow } from '@/lib/dept-api'

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
interface Song {
  id: string; title: string; key: string; tempo: string
  voicePart: string; status: 'not-started' | 'practicing' | 'ready'
  hasLyrics: boolean; hasSheet: boolean; hasTrack: boolean
  category: string; lyricsUrl?: string | null
  sheetUrl?: string | null; trackUrl?: string | null
}
interface Member {
  id: string; name: string; initials: string
  voice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass'; role?: string; active: boolean
}
interface ChatMsg {
  id: string; senderId: string; senderName: string; senderInitials: string
  senderVoice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass'
  text: string; time: string; isMine: boolean
  reactions?: { emoji: string; count: number }[]
}
interface Announcement {
  id: string; title: string; body: string
  author: string; time: string; urgent: boolean; pinned?: boolean
}
interface Task {
  id: string; text: string; category: 'practice' | 'admin' | 'service'; done: boolean; due?: string
}
interface Highlight {
  id: string; title: string; body: string
  type: 'testimony' | 'update' | 'praise'; postedBy: string; time: string
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const VOICE_COLOR: Record<string, string> = {
  Soprano: '#7c3aed', Alto: '#db2777', Tenor: '#2563eb', Bass: '#16a34a',
}
const VOICE_BADGE: Record<string, string> = {
  Soprano: 'bg-purple-100 text-purple-700 border-purple-200',
  Alto:    'bg-pink-100   text-pink-700   border-pink-200',
  Tenor:   'bg-blue-100   text-blue-700   border-blue-200',
  Bass:    'bg-green-100  text-green-700  border-green-200',
}
const STATUS_CFG = {
  'not-started': { label: 'Not Started', pill: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400'   },
  'practicing':  { label: 'Practicing',  pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500'  },
  'ready':       { label: 'Ready',       pill: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE (JWT-sourced)
═══════════════════════════════════════════════════════════════ */
interface MemberSession {
  name: string; initials: string
  voice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass'; role: string; avatar: string
}

function getVoicePref(): MemberSession['voice'] {
  try {
    const v = localStorage.getItem('letw_choir_voice')
    if (v && ['Soprano','Alto','Tenor','Bass'].includes(v)) return v as MemberSession['voice']
  } catch { /* ok */ }
  return 'Soprano'
}
function saveVoicePref(v: MemberSession['voice']) {
  try { localStorage.setItem('letw_choir_voice', v) } catch { /* ok */ }
}

/* ═══════════════════════════════════════════════════════════════
   LOCAL-STORAGE HELPERS
═══════════════════════════════════════════════════════════════ */
function loadHighlights(): Highlight[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('letw_choir_highlights') || '[]') } catch { return [] }
}
function saveHighlights(h: Highlight[]) {
  localStorage.setItem('letw_choir_highlights', JSON.stringify(h))
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
type Tab = 'home' | 'songs' | 'chat' | 'members' | 'more'
type MoreSection = 'announcements' | 'events' | 'tasks' | 'attendance' | 'highlights' | null

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'home',    label: 'Home',    icon: Home          },
  { id: 'songs',   label: 'Songs',   icon: Music         },
  { id: 'chat',    label: 'Chat',    icon: MessageSquare },
  { id: 'members', label: 'Members', icon: Users         },
  { id: 'more',    label: 'More',    icon: Crown         },
]

export default function AlterSoundDashboard() {
  const router                    = useRouter()
  const [session, setSession]     = useState<MemberSession | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showVoicePicker, setShowVoicePicker] = useState(false)
  const sessionRef                = useRef<MemberSession | null>(null)
  const API                       = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  const CHAT_API                  = API + '/choir-chat'

  /* ── Nav ── */
  const [tab, setTab]             = useState<Tab>('home')
  const [moreSection, setMoreSection] = useState<MoreSection>(null)

  /* ── Data ── */
  const [songs, setSongs]         = useState<Song[]>([])
  const [members, setMembers]     = useState<Member[]>([])
  const [chat, setChat]           = useState<ChatMsg[]>([])
  const [tracks, setTracks]       = useState<AudioTrack[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [tasks, setTasks]         = useState<Task[]>([])

  /* ── UI state ── */
  const [songSearch, setSongSearch]   = useState('')
  const [songFilter, setSongFilter]   = useState<'all'|Song['status']>('all')
  const [memberFilter, setMemberFilter] = useState('All')
  const [chatInput, setChatInput]     = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [nowPlaying, setNowPlaying]   = useState<string|null>(null)
  const [replyTo, setReplyTo]         = useState<string|null>(null)
  const [replyText, setReplyText]     = useState('')
  const [sentReplies, setSentReplies] = useState<Record<string,string>>({})
  const [testimonyTitle, setTestimonyTitle] = useState('')
  const [testimonyBody, setTestimonyBody]   = useState('')
  const [memberVoiceExpand, setMemberVoiceExpand] = useState<Record<string,boolean>>({
    Soprano:true, Alto:true, Tenor:true, Bass:true
  })
  const [unreadChat, setUnreadChat]   = useState(0)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  /* ── Dept API data (requires JWT) ── */
  const [deptAnnouncements, setDeptAnnouncements] = useState<DeptAnnouncement[]>([])
  const [deptActivities, setDeptActivities]       = useState<DeptActivity[]>([])
  const [myAttendanceRows, setMyAttendanceRows]   = useState<MyAttendanceRow[]>([])
  const [deptDataLoading, setDeptDataLoading]     = useState(false)

  const chatBottomRef     = useRef<HTMLDivElement|null>(null)
  const chatLatestRef     = useRef('')
  const audioRef          = useRef<HTMLAudioElement|null>(null)

  /* ─── Keep ref in sync ─── */
  useEffect(() => { sessionRef.current = session }, [session])

  /* ─── JWT auth — redirect to login if not signed in ─── */
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) { router.replace('/auth/login?next=/services/alter-sound/dashboard'); return }
    import('@/lib/dept-api').then(({ getCurrentUser }) =>
      getCurrentUser()
        .then(user => {
          const voice = getVoicePref()
          const initials = user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
          setSession({ name: user.name, initials, voice, role: 'Choir Member', avatar: VOICE_COLOR[voice] })
        })
        .catch(() => router.replace('/auth/login?next=/services/alter-sound/dashboard'))
        .finally(() => setAuthLoading(false))
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Fetch dept API data whenever session is established ─── */
  useEffect(() => {
    if (!session) return
    setDeptDataLoading(true)
    import('@/lib/dept-api').then(({ listAnnouncements, listActivities, myAttendance }) =>
      Promise.allSettled([
        listAnnouncements('choir').then(setDeptAnnouncements),
        listActivities('choir').then(setDeptActivities),
        myAttendance('choir').then(setMyAttendanceRows),
      ]).finally(() => setDeptDataLoading(false))
    )
  }, [session?.initials]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Load roster ─── */
  useEffect(() => {
    const fetch_ = () =>
      fetch(`${API}/choir-chat/roster`)
        .then(r => r.json())
        .then((d: Member[]) => { if (Array.isArray(d)) setMembers(d) })
        .catch(() => {
          try { setMembers(JSON.parse(localStorage.getItem('letw_choir_members_data')||'[]')) } catch { /* ok */ }
        })
    fetch_()
    const id = setInterval(fetch_, 60000)
    return () => clearInterval(id)
  }, [API])

  /* ─── Load songs ─── */
  useEffect(() => {
    if (!session) return
    fetch(`${API}/choir-chat/songs`)
      .then(r => r.json())
      .then((data: {id:string;title:string;key?:string;tempo?:string;voice_part?:string;category?:string;lyrics_url?:string;sheet_url?:string;track_url?:string}[]) => {
        if (!Array.isArray(data)) return
        const sk = `letw_song_status_${session.initials}`
        let saved: Record<string,Song['status']> = {}
        try { saved = JSON.parse(localStorage.getItem(sk)||'{}') } catch { /* ok */ }
        setSongs(data.map(s => ({
          id: s.id, title: s.title, key: s.key||'—', tempo: s.tempo||'—',
          voicePart: s.voice_part||'All', status: (saved[s.id] as Song['status'])||'not-started',
          hasLyrics: !!s.lyrics_url, hasSheet: !!s.sheet_url, hasTrack: !!s.track_url,
          category: s.category||'General',
          lyricsUrl: s.lyrics_url||null, sheetUrl: s.sheet_url||null, trackUrl: s.track_url||null,
        })))
      })
      .catch(() => { /* no songs yet */ })
  }, [session?.initials, API]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Load audio tracks ─── */
  useEffect(() => {
    alterSoundApi.getPageData().then(d => setTracks(d.all_tracks.filter(t => t.is_active))).catch(()=>{})
  }, [])

  /* ─── Load highlights + stats ─── */
  useEffect(() => {
    setHighlights(loadHighlights())
  }, [])

  /* ─── Chat polling ─── */
  const mapMsg = useCallback((m:{id:string;sender_name:string;sender_initials:string;voice_part:string;is_director:boolean;content:string;created_at:string}): ChatMsg => ({
    id: m.id, senderId: m.sender_initials, senderName: m.sender_name,
    senderInitials: m.sender_initials,
    senderVoice: (m.voice_part === 'Director' ? 'Soprano' : m.voice_part) as ChatMsg['senderVoice'],
    text: m.content,
    time: new Date(m.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
    isMine: false,
  }), [])

  const fetchChat = useCallback(async (initial=false) => {
    try {
      const url = initial
        ? `${CHAT_API}/messages?limit=80`
        : chatLatestRef.current
          ? `${CHAT_API}/messages?since=${encodeURIComponent(chatLatestRef.current)}`
          : `${CHAT_API}/messages?limit=80`
      const res = await fetch(url)
      if (!res.ok) return
      const data: {id:string;sender_name:string;sender_initials:string;voice_part:string;is_director:boolean;content:string;created_at:string}[] = await res.json()
      if (!data.length) return
      const myI = sessionRef.current?.initials || ''
      const mapped = data.map(m => ({ ...mapMsg(m), isMine: !!myI && m.sender_initials === myI }))
      if (initial) { setChat(mapped) }
      else {
        setChat(prev => [...prev, ...mapped])
        // Show unread badge when not on chat tab
        setUnreadChat(prev => tab === 'chat' ? 0 : prev + mapped.length)
      }
      chatLatestRef.current = data[data.length-1].created_at
      if (tab === 'chat') setTimeout(() => chatBottomRef.current?.scrollIntoView({behavior:'smooth'}), 60)
    } catch { /* silent */ }
  }, [CHAT_API, mapMsg, tab])

  useEffect(() => {
    if (!session) return
    fetchChat(true)
    const id = setInterval(() => fetchChat(false), 3000)
    return () => clearInterval(id)
  }, [session?.initials]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Clear unread when switching to chat */
  useEffect(() => {
    if (tab === 'chat') {
      setUnreadChat(0)
      setTimeout(() => chatBottomRef.current?.scrollIntoView(), 100)
    }
  }, [tab])

  /* ─── Actions ─── */
  const setStatus = (id: string, status: Song['status']) => {
    setSongs(prev => {
      const updated = prev.map(s => s.id === id ? {...s, status} : s)
      try {
        const sk = `letw_song_status_${sessionRef.current?.initials||'X'}`
        localStorage.setItem(sk, JSON.stringify(Object.fromEntries(updated.map(s => [s.id, s.status]))))
      } catch { /* ok */ }
      return updated
    })
  }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text || chatSending || !session) return
    setChatSending(true)
    const opt: ChatMsg = {
      id: `tmp-${Date.now()}`, senderId: session.initials, senderName: session.name,
      senderInitials: session.initials, senderVoice: session.voice as 'Soprano',
      text, time: new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}), isMine: true,
    }
    setChat(prev => [...prev, opt])
    setChatInput('')
    setTimeout(() => chatBottomRef.current?.scrollIntoView({behavior:'smooth'}), 60)
    try {
      const res = await fetch(`${CHAT_API}/messages`, {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ sender_name:session.name, sender_initials:session.initials,
          voice_part:session.voice, is_director:false, content:text }),
      })
      if (res.ok) {
        const saved = await res.json()
        setChat(prev => prev.map(m => m.id === opt.id ? {...opt, id:saved.id} : m))
        chatLatestRef.current = saved.created_at
      }
    } catch { /* keep optimistic */ }
    finally { setChatSending(false) }
  }

  const playTrack = async (id: string) => {
    if (nowPlaying === id) { audioRef.current?.pause(); setNowPlaying(null); return }
    audioRef.current?.pause()
    try {
      const audio = new Audio(alterSoundApi.getAudioUrl(id))
      audioRef.current = audio
      audio.addEventListener('ended', () => setNowPlaying(null))
      await audio.play(); setNowPlaying(id)
      await alterSoundApi.incrementPlayCount(id)
    } catch { setNowPlaying(null) }
  }

  const addReaction = (msgId: string, emoji: string) => {
    setChat(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const ex = m.reactions?.find(r => r.emoji === emoji)
      if (ex) return {...m, reactions: m.reactions!.map(r => r.emoji===emoji ? {...r,count:r.count+1} : r)}
      return {...m, reactions: [...(m.reactions||[]), {emoji, count:1}]}
    }))
  }

  const signOut = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setShowSignOutConfirm(false)
    router.replace('/auth/login')
  }

  /* ─── Change voice part preference ─── */
  const changeVoice = (v: MemberSession['voice']) => {
    saveVoicePref(v)
    if (session) setSession({ ...session, voice: v, avatar: VOICE_COLOR[v] })
    setShowVoicePicker(false)
  }

  const submitTestimony = () => {
    if (!testimonyTitle.trim() || !testimonyBody.trim() || !session) return
    const h: Highlight = {
      id: Date.now().toString(), title: testimonyTitle.trim(), body: testimonyBody.trim(),
      type: 'testimony', postedBy: session.name,
      time: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),
    }
    const updated = [h, ...highlights]
    saveHighlights(updated); setHighlights(updated)
    setTestimonyTitle(''); setTestimonyBody('')
  }

  const submitReply = (id: string, author: string, body: string) => {
    if (!replyText.trim() || !session) return
    const inbox = JSON.parse(localStorage.getItem('letw_choirmaster_inbox')||'[]')
    inbox.unshift({ id:Date.now().toString(), from:session.name, initials:session.initials,
      voice:session.voice, announcementTitle:body.slice(0,40), text:replyText.trim(),
      time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), read:false })
    localStorage.setItem('letw_choirmaster_inbox', JSON.stringify(inbox))
    setSentReplies(prev => ({...prev, [id]:replyText.trim()}))
    setReplyTo(null); setReplyText('')
  }

  /* ─── Derived ─── */
  const today        = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
  const readySongs   = songs.filter(s => s.status==='ready').length
  const practiceSongs= songs.filter(s => s.status==='practicing').length
  const pendingTasks = tasks.filter(t => !t.done).length
  const activeMembers= members.filter(m => m.active)

  const filteredSongs = songs.filter(s => {
    const matchQ = s.title.toLowerCase().includes(songSearch.toLowerCase())
    const matchF = songFilter==='all' || s.status===songFilter
    return matchQ && matchF
  })
  const filteredMembers = memberFilter==='All' ? activeMembers : activeMembers.filter(m => m.voice===memberFilter)

  /* ─── Auth loading / redirect gate ─── */
  if (authLoading || !session) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#0d0035 0%,#1e0050 45%,#2a006b 100%)' }}>
      <div className="text-center">
        <div className="w-20 h-20 bg-[#f5bb00] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(245,187,0,0.4)]">
          <Flame className="w-10 h-10 text-[#140152]" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-[#f5bb00] mx-auto" />
        <p className="text-white/50 text-sm mt-3">Loading your portal…</p>
      </div>
    </div>
  )

  /* ─── Render helpers ─── */
  const VoicePill = ({ voice }: { voice: string }) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${VOICE_BADGE[voice]||'bg-gray-100 text-gray-500'}`}>{voice}</span>
  )

  return (
    <div className="flex flex-col h-screen bg-[#f5f5fa] overflow-hidden">

      {/* Voice-part picker overlay */}
      <AnimatePresence>
        {showVoicePicker && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
            onClick={() => setShowVoicePicker(false)}>
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              className="bg-white rounded-3xl p-7 w-full max-w-xs shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h3 className="font-black text-[#140152] text-lg text-center mb-1">Your Voice Part</h3>
              <p className="text-gray-400 text-xs text-center mb-5">This personalises your dashboard colours.</p>
              <div className="grid grid-cols-2 gap-3">
                {(['Soprano','Alto','Tenor','Bass'] as const).map(v => (
                  <button key={v} onClick={() => changeVoice(v)}
                    className={`py-3.5 rounded-2xl font-black text-sm transition-all border-2 ${session.voice===v ? 'text-white border-transparent shadow-lg' : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300'}`}
                    style={session.voice===v ? {background:VOICE_COLOR[v], borderColor:VOICE_COLOR[v]} : undefined}>
                    {v}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign-out confirm overlay */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-black text-[#140152] text-lg text-center mb-2">Sign Out?</h3>
              <p className="text-gray-500 text-sm text-center mb-6">You&apos;ll need to identify yourself again when you return.</p>
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

      {/* ══ HEADER ══ */}
      <header className="flex-shrink-0" style={{ background:'linear-gradient(135deg,#140152 0%,#2d0a6e 100%)' }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          {/* Brand */}
          <div className="w-9 h-9 bg-[#f5bb00] rounded-xl flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 text-[#140152]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm tracking-wide">ALTER SOUND</p>
            <p className="text-white/40 text-[10px] truncate">{today}</p>
          </div>
          {/* Bell */}
          <button onClick={() => { setTab('more'); setMoreSection('announcements') }}
            className="relative w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </button>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0 ring-2 ring-white/20"
            style={{ background: session.avatar }}>
            {session.initials}
          </div>
        </div>

        {/* Member strip */}
        <div className="px-4 pb-4">
          <div className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
              style={{ background: session.avatar }}>
              {session.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{session.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <button onClick={() => setShowVoicePicker(true)} title="Change voice part">
                  <VoicePill voice={session.voice} />
                </button>
                {session.role && session.role !== 'Choir Member' && (
                  <span className="text-white/40 text-[10px] truncate">{session.role}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/40 text-[10px]">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══ CONTENT ══ */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ────────── HOME ────────── */}
          {tab === 'home' && (
            <motion.div key="home" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              transition={{duration:0.18}} className="p-4 space-y-4 pb-24">

              {/* Welcome card */}
              <div className="relative rounded-3xl overflow-hidden p-5"
                style={{ background:`linear-gradient(135deg,${session.avatar} 0%,${session.avatar}cc 100%)` }}>
                <div className="absolute -top-6 -right-6 w-28 h-28 opacity-10">
                  <Music2 className="w-full h-full text-white" />
                </div>
                <p className="text-white/70 text-xs mb-0.5">Welcome back 🎶</p>
                <h2 className="text-white font-black text-2xl mb-1">{session.name.split(' ')[0]}</h2>
                <p className="text-white/80 text-xs mb-4">
                  {session.voice} voice · {session.role}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setTab('songs')}
                    className="flex items-center gap-1.5 bg-white text-[#140152] px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-white/90 transition-all shadow">
                    <Music className="w-3.5 h-3.5" /> Songs
                  </button>
                  <button onClick={() => setTab('chat')}
                    className="flex items-center gap-1.5 bg-white/20 text-white px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-white/30 transition-all border border-white/30">
                    <MessageSquare className="w-3.5 h-3.5" /> Group Chat
                  </button>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Songs in Library', val: songs.length||'—', icon:Music,       color:'#7c3aed', bg:'#f3f0ff' },
                  { label:'Songs Ready',      val: songs.length ? `${readySongs}/${songs.length}` : '—', icon:CheckCircle2, color:'#16a34a', bg:'#f0fdf4' },
                  { label:'Practicing',       val: songs.length ? practiceSongs||'—' : '—', icon:Volume2, color:'#d97706', bg:'#fffbeb' },
                  { label:'Choir Members',    val: activeMembers.length||'—', icon:Users, color:'#2563eb', bg:'#eff6ff' },
                ].map((s,i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background:s.bg }}>
                      <s.icon className="w-5 h-5" style={{color:s.color}} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-lg text-[#140152] leading-none">{s.val}</p>
                      <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Song preview */}
              {songs.length > 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h3 className="font-black text-[#140152]">Your Songs</h3>
                    <button onClick={() => setTab('songs')} className="text-xs font-bold text-[#140152] flex items-center gap-0.5 hover:underline">
                      All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-3 pb-3 space-y-1">
                    {songs.slice(0,4).map(song => {
                      const cfg = STATUS_CFG[song.status]
                      return (
                        <button key={song.id} onClick={() => setTab('songs')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-gray-50 transition-all text-left">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: VOICE_COLOR[session.voice]+'15' }}>
                            <Music2 className="w-4.5 h-4.5" style={{color:VOICE_COLOR[session.voice]}} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#140152] truncate">{song.title}</p>
                            <p className="text-[10px] text-gray-400">{song.category} · {song.key}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.pill}`}>
                            {cfg.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-8 text-center">
                  <Music2 className="w-10 h-10 mx-auto mb-3 text-[#140152] opacity-20" />
                  <p className="font-bold text-[#140152] mb-1">No songs yet</p>
                  <p className="text-xs text-gray-400">Your choir director will add songs here soon.</p>
                </div>
              )}

              {/* Quick actions */}
              <div>
                <h3 className="font-black text-[#140152] mb-3">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:'Song Library',    icon:Music,        color:VOICE_COLOR[session.voice], action:()=>setTab('songs')                              },
                    { label:'Group Chat',      icon:MessageSquare,color:'#140152',                  action:()=>setTab('chat')                               },
                    { label:'Members',         icon:Users,        color:'#2563eb',                  action:()=>setTab('members')                            },
                    { label:'Announcements',   icon:Bell,         color:'#7c3aed',                  action:()=>{setTab('more');setMoreSection('announcements')} },
                    { label:'My Tasks',        icon:CheckSquare,  color:'#d97706',                  action:()=>{setTab('more');setMoreSection('tasks')}      },
                    { label:'Highlights',      icon:Star,         color:'#db2777',                  action:()=>{setTab('more');setMoreSection('highlights')} },
                  ].map((a,i) => (
                    <button key={i} onClick={a.action}
                      className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ background:a.color+'15' }}>
                        <a.icon className="w-5 h-5" style={{color:a.color}} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent chat preview */}
              {chat.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h3 className="font-black text-[#140152] flex items-center gap-2">
                      Group Chat
                      {unreadChat > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {unreadChat} new
                        </span>
                      )}
                    </h3>
                    <button onClick={() => setTab('chat')} className="text-xs font-bold text-[#140152] flex items-center gap-0.5 hover:underline">
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-3 pb-3 space-y-1">
                    {chat.slice(-3).map(m => (
                      <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-gray-50">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                          style={{ background: VOICE_COLOR[m.senderVoice] }}>
                          {m.senderInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-gray-700 mr-1.5">{m.senderName.split(' ')[0]}</span>
                          <span className="text-xs text-gray-500 truncate">{m.text}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{m.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ────────── SONGS ────────── */}
          {tab === 'songs' && (
            <motion.div key="songs" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              transition={{duration:0.18}} className="p-4 space-y-4 pb-24">

              {/* Search + filter */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={songSearch} onChange={e => setSongSearch(e.target.value)}
                  placeholder="Search songs…"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#140152]/30 text-sm" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {(['all','not-started','practicing','ready'] as const).map(f => (
                  <button key={f} onClick={() => setSongFilter(f)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${songFilter===f ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]/30'}`}
                    style={songFilter===f ? {background:f==='all'?'#140152':f==='ready'?'#16a34a':f==='practicing'?'#d97706':'#6b7280'} : undefined}>
                    {f==='all' ? 'All Songs' : STATUS_CFG[f].label}
                    {f!=='all' && songs.filter(s=>s.status===f).length>0 && (
                      <span className="ml-1.5 opacity-70">({songs.filter(s=>s.status===f).length})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Song cards */}
              {filteredSongs.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-16 text-center">
                  <Music className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-gray-400">No songs found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSongs.map(song => {
                    const cfg = STATUS_CFG[song.status]
                    return (
                      <div key={song.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Color bar */}
                        <div className="h-1" style={{
                          background: song.status==='ready' ? '#16a34a' : song.status==='practicing' ? '#d97706' : '#d1d5db'
                        }} />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.pill}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                  {cfg.label}
                                </span>
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{song.category}</span>
                              </div>
                              <h3 className="font-black text-[#140152] text-base leading-tight">{song.title}</h3>
                              <p className="text-gray-400 text-xs mt-0.5">{song.voicePart} · Key {song.key} · {song.tempo}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={{ background: VOICE_COLOR[session.voice]+'15' }}>
                              <Music2 className="w-6 h-6" style={{color:VOICE_COLOR[session.voice]}} />
                            </div>
                          </div>

                          {/* Resources */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {[
                              {label:'Lyrics',      url:song.lyricsUrl, icon:BookOpen, color:'#7c3aed', bg:'#f3f0ff'},
                              {label:'Sheet Music', url:song.sheetUrl,  icon:Download, color:'#2563eb', bg:'#eff6ff'},
                              {label:'Audio Track', url:song.trackUrl,  icon:Play,     color:'#16a34a', bg:'#f0fdf4'},
                            ].map(({label,url,icon:Icon,color,bg}) => (
                              url ? (
                                <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
                                  style={{color, background:bg}}>
                                  <Icon className="w-3.5 h-3.5" /> {label}
                                </a>
                              ) : (
                                <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-gray-100 text-gray-400"
                                  title="No link yet">
                                  <Icon className="w-3.5 h-3.5" /> {label}
                                </span>
                              )
                            ))}
                          </div>

                          {/* Status update */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-gray-400 font-semibold mr-1">My progress:</span>
                            {(['not-started','practicing','ready'] as Song['status'][]).map(s => (
                              <button key={s} onClick={() => setStatus(song.id, s)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${song.status===s ? cfg.pill+' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {STATUS_CFG[s].label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Audio library */}
              {tracks.length > 0 && (
                <div>
                  <h3 className="font-black text-[#140152] mb-3 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" /> Audio Library
                  </h3>
                  <div className="space-y-2">
                    {tracks.map(t => (
                      <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                        <button onClick={() => playTrack(t.id)}
                          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ background: nowPlaying===t.id ? '#f5bb00' : '#140152' }}>
                          {nowPlaying===t.id
                            ? <Pause className="w-5 h-5 text-[#140152]" />
                            : <Play  className="w-5 h-5 text-white ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#140152] text-sm truncate">{t.title}</p>
                          <p className="text-gray-400 text-[10px]">{t.play_count} plays</p>
                        </div>
                        {nowPlaying===t.id && <Volume2 className="w-4 h-4 text-[#f5bb00] animate-pulse flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ────────── CHAT ────────── */}
          {tab === 'chat' && (
            <motion.div key="chat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              transition={{duration:0.18}} className="flex flex-col pb-[68px]" style={{height:'calc(100vh - 148px)'}}>

              {/* Chat header bar */}
              <div className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
                <div className="w-9 h-9 bg-[#140152] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-5 h-5 text-[#f5bb00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[#140152] text-sm">Alter Sound — Group Chat</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[10px] text-gray-400">{activeMembers.length} members · Live</span>
                  </div>
                </div>
                {/* Member avatars */}
                <div className="flex -space-x-1.5 flex-shrink-0">
                  {activeMembers.slice(0,4).map(m => (
                    <div key={m.id} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold"
                      style={{background:VOICE_COLOR[m.voice]}}>
                      {m.initials}
                    </div>
                  ))}
                  {activeMembers.length > 4 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-500 text-[8px] font-bold">
                      +{activeMembers.length-4}
                    </div>
                  )}
                </div>
              </div>

              {/* Voice legend */}
              <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-50 flex-shrink-0 overflow-x-auto no-scrollbar">
                {Object.entries(VOICE_BADGE).map(([v,cls]) => (
                  <span key={v} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${cls}`}>{v}</span>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                style={{scrollbarWidth:'thin',scrollbarColor:'#e5e7eb transparent'}}>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] text-gray-400 bg-gray-50 rounded-full px-3 py-1 font-semibold">Today</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {chat.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                )}

                {chat.map((msg, i) => {
                  const prev = chat[i-1]
                  const showSender = !prev || prev.senderId !== msg.senderId
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mb-1"
                        style={{ background: showSender ? VOICE_COLOR[msg.senderVoice] : 'transparent', opacity: showSender ? 1 : 0 }}>
                        {showSender ? msg.senderInitials : ''}
                      </div>
                      <div className={`flex flex-col max-w-[75%] ${msg.isMine ? 'items-end' : 'items-start'}`}>
                        {showSender && !msg.isMine && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-xs font-bold text-gray-700">{msg.senderName}</span>
                            <VoicePill voice={msg.senderVoice} />
                          </div>
                        )}
                        <div onClick={() => addReaction(msg.id, ['❤️','🔥','🙌','😂','👍'][Math.floor(Math.random()*5)])}
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed cursor-pointer transition-opacity hover:opacity-80 ${
                            msg.isMine
                              ? 'text-white rounded-br-sm'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                          }`}
                          style={msg.isMine ? {background:session.avatar} : undefined}>
                          {msg.text}
                        </div>
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {msg.reactions.map(r => (
                              <button key={r.emoji} onClick={() => addReaction(msg.id, r.emoji)}
                                className="flex items-center gap-0.5 bg-white border border-gray-100 rounded-full px-1.5 py-0.5 text-xs hover:scale-105 transition-transform shadow-sm">
                                {r.emoji} <span className="text-gray-500 text-[10px]">{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.time}</span>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2 focus-within:border-[#140152]/30 focus-within:bg-white transition-all">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendChat()}
                    placeholder="Message the choir…"
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent" />
                  <button onClick={sendChat} disabled={!chatInput.trim()||chatSending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-30 transition-all flex-shrink-0"
                    style={{background:chatInput.trim() ? session.avatar : '#d1d5db'}}>
                    {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────── MEMBERS ────────── */}
          {tab === 'members' && (
            <motion.div key="members" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              transition={{duration:0.18}} className="p-4 space-y-4 pb-24">

              {/* Voice filter */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['All','Soprano','Alto','Tenor','Bass'].map(v => (
                  <button key={v} onClick={() => setMemberFilter(v)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${memberFilter===v ? 'text-white border-transparent' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'}`}
                    style={memberFilter===v ? {background:v==='All'?'#140152':VOICE_COLOR[v], borderColor:v==='All'?'#140152':VOICE_COLOR[v]} : undefined}>
                    {v}
                  </button>
                ))}
              </div>

              {/* Voice section breakdown */}
              <div className="grid grid-cols-4 gap-2">
                {(['Soprano','Alto','Tenor','Bass'] as const).map(v => {
                  const cnt = activeMembers.filter(m => m.voice===v).length
                  return (
                    <button key={v} onClick={() => setMemberFilter(v)}
                      className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm hover:shadow-md transition-all">
                      <p className="font-black text-xl text-[#140152]">{cnt}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${VOICE_BADGE[v]}`}>{v}</span>
                    </button>
                  )
                })}
              </div>

              {/* Member list grouped by voice */}
              {filteredMembers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-14 text-center">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-400">No members yet</p>
                  <p className="text-xs text-gray-400 mt-1">The choir coordinator will add members here.</p>
                </div>
              ) : memberFilter === 'All' ? (
                /* Grouped */
                (['Soprano','Alto','Tenor','Bass'] as const).map(voice => {
                  const group = activeMembers.filter(m => m.voice===voice)
                  if (group.length===0) return null
                  const expanded = memberVoiceExpand[voice] !== false
                  return (
                    <div key={voice} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <button onClick={() => setMemberVoiceExpand(p => ({...p,[voice]:!expanded}))}
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-all">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{background:VOICE_COLOR[voice]+'15'}}>
                          <Mic2 className="w-4 h-4" style={{color:VOICE_COLOR[voice]}} />
                        </div>
                        <span className="font-black text-[#140152] flex-1 text-left">{voice}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${VOICE_BADGE[voice]}`}>{group.length}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180':''}`} />
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                            <div className="px-3 pb-3 space-y-1">
                              {group.map(m => (
                                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-gray-50">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                    style={{background:VOICE_COLOR[m.voice]}}>
                                    {m.initials}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#140152] text-sm truncate">{m.name}</p>
                                    {m.role && <p className="text-[10px] text-gray-400">{m.role}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              ) : (
                /* Flat filtered list */
                <div className="space-y-2">
                  {filteredMembers.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{background:VOICE_COLOR[m.voice]}}>
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#140152] truncate">{m.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <VoicePill voice={m.voice} />
                          {m.role && <span className="text-[10px] text-gray-400">{m.role}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ────────── MORE ────────── */}
          {tab === 'more' && (
            <motion.div key="more" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              transition={{duration:0.18}} className="p-4 space-y-3 pb-24">

              {/* Section tiles */}
              {moreSection === null && (
                <>
                  <h2 className="font-black text-[#140152] text-lg">More</h2>
                  <div className="space-y-2">
                    {[
                      { label:'Announcements & Notices', icon:Bell,       color:'#7c3aed', section:'announcements' as MoreSection, desc:'Messages from the choir director' },
                      { label:'Events & Rehearsals',     icon:Calendar,   color:'#2563eb', section:'events'        as MoreSection, desc:'Upcoming services and rehearsals'  },
                      { label:'My Tasks',                icon:CheckSquare,color:'#d97706', section:'tasks'         as MoreSection, desc:`${pendingTasks} pending`            },
                      { label:'Attendance',              icon:BarChart2,  color:'#16a34a', section:'attendance'    as MoreSection, desc:'Track your session attendance'      },
                      { label:'Highlights & Testimonies',icon:Star,       color:'#db2777', section:'highlights'    as MoreSection, desc:'Share what God is doing'            },
                    ].map(({label,icon:Icon,color,section,desc}) => (
                      <button key={section} onClick={() => setMoreSection(section)}
                        className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{background:color+'15'}}>
                          <Icon className="w-6 h-6" style={{color}} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#140152] text-sm">{label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#140152] transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-200 my-2" />

                  {/* Links */}
                  <Link href="/services/alter-sound"
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-600 text-sm">Back to Alter Sound</p>
                      <p className="text-[10px] text-gray-400">Main ministry page</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>

                  <button onClick={() => setShowSignOutConfirm(true)}
                    className="w-full flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl shadow-sm hover:bg-red-100 transition-all text-left">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-red-600 text-sm">Sign Out</p>
                      <p className="text-[10px] text-red-400">Clear your session</p>
                    </div>
                  </button>
                </>
              )}

              {/* ── Announcements ── */}
              {moreSection === 'announcements' && (
                <>
                  <button onClick={() => setMoreSection(null)} className="flex items-center gap-1.5 text-sm font-bold text-[#140152] mb-1 hover:underline">
                    ← More
                  </button>
                  <h2 className="font-black text-[#140152] text-lg mb-3">Announcements</h2>
                  {deptDataLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
                  ) : deptAnnouncements.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-14 text-center">
                      <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-400 mb-1">No announcements yet</p>
                      <p className="text-xs text-gray-400">The choir director will post notices here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deptAnnouncements.map(ann => (
                        <div key={ann.id} className={`bg-white rounded-3xl border p-5 shadow-sm ${ann.is_urgent ? 'border-red-200' : ann.is_pinned ? 'border-[#f5bb00]/50' : 'border-gray-100'}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-black text-[#140152] text-sm leading-tight">{ann.title}</h4>
                            <div className="flex gap-1 flex-shrink-0">
                              {ann.is_urgent && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Urgent</span>}
                              {ann.is_pinned && <span className="text-[10px] font-bold bg-[#f5bb00]/20 text-[#140152] px-2 py-0.5 rounded-full">Pinned</span>}
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs leading-relaxed mb-3">{ann.body}</p>
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>{ann.author_name || 'Choir Director'}</span>
                            <span>{new Date(ann.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Events ── */}
              {moreSection === 'events' && (
                <>
                  <button onClick={() => setMoreSection(null)} className="flex items-center gap-1.5 text-sm font-bold text-[#140152] mb-1 hover:underline">
                    ← More
                  </button>
                  <h2 className="font-black text-[#140152] text-lg mb-3">Events & Rehearsals</h2>
                  {deptDataLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
                  ) : deptActivities.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-14 text-center">
                      <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-400 mb-1">No events scheduled</p>
                      <p className="text-xs text-gray-400">The choir director will add upcoming rehearsals and services here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deptActivities.map(act => (
                        <div key={act.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-[#140152]/5 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-6 h-6 text-[#140152]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-black text-[#140152] text-sm">{act.title}</h4>
                                <span className="text-[10px] font-bold bg-[#f5bb00]/20 text-[#140152] px-2 py-0.5 rounded-full capitalize">{act.activity_type}</span>
                              </div>
                              {act.description && <p className="text-xs text-gray-500 leading-relaxed mb-2">{act.description}</p>}
                              <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                                {act.activity_date && <span>📅 {new Date(act.activity_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</span>}
                                {act.activity_time && <span>🕐 {act.activity_time}</span>}
                                {act.venue && <span>📍 {act.venue}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Tasks ── */}
              {moreSection === 'tasks' && (
                <>
                  <button onClick={() => setMoreSection(null)} className="flex items-center gap-1.5 text-sm font-bold text-[#140152] mb-1 hover:underline">
                    ← More
                  </button>
                  <h2 className="font-black text-[#140152] text-lg mb-3">My Tasks</h2>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      {label:'Total',    val:tasks.length,                    color:'text-[#140152]', bg:'bg-[#140152]/5' },
                      {label:'Pending',  val:tasks.filter(t=>!t.done).length, color:'text-red-600',   bg:'bg-red-50'     },
                      {label:'Done',     val:tasks.filter(t=>t.done).length,  color:'text-green-600', bg:'bg-green-50'   },
                    ].map((s,i) => (
                      <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {tasks.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-14 text-center">
                      <CheckSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-400 mb-1">No tasks assigned</p>
                      <p className="text-xs text-gray-400">The choir director will assign tasks here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.filter(t=>!t.done).map(t => (
                        <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
                          <button onClick={() => setTasks(p => p.map(x => x.id===t.id?{...x,done:!x.done}:x))}
                            className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#140152] flex-shrink-0 mt-0.5 transition-colors" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{t.text}</p>
                            <div className="flex gap-2 mt-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.category==='practice'?'bg-purple-100 text-purple-700':t.category==='admin'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                                {t.category}
                              </span>
                              {t.due && <span className="text-[10px] text-red-500 font-semibold">Due: {t.due}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {tasks.filter(t=>t.done).length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-2 mt-4">Completed</p>
                          {tasks.filter(t=>t.done).map(t => (
                            <div key={t.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-3 opacity-60 mb-2">
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <p className="text-sm text-gray-500 line-through">{t.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── Attendance ── */}
              {moreSection === 'attendance' && (
                <>
                  <button onClick={() => setMoreSection(null)} className="flex items-center gap-1.5 text-sm font-bold text-[#140152] mb-1 hover:underline">
                    ← More
                  </button>
                  <h2 className="font-black text-[#140152] text-lg mb-3">My Attendance</h2>

                  {/* Summary stats */}
                  {myAttendanceRows.length > 0 && (() => {
                    const present = myAttendanceRows.filter(r => r.present).length
                    const pct = Math.round((present / myAttendanceRows.length) * 100)
                    return (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'Sessions', val: myAttendanceRows.length, color: 'text-[#140152]', bg: 'bg-[#140152]/5' },
                          { label: 'Present',  val: present,                  color: 'text-green-600', bg: 'bg-green-50'    },
                          { label: 'Rate',     val: `${pct}%`,                color: pct>=80?'text-green-600':pct>=60?'text-amber-600':'text-red-600', bg: pct>=80?'bg-green-50':pct>=60?'bg-amber-50':'bg-red-50' },
                        ].map((s, i) => (
                          <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                            <p className="text-gray-400 text-[10px] mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {deptDataLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
                  ) : myAttendanceRows.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-14 text-center">
                      <BarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="font-semibold text-gray-400 mb-1">No attendance records yet</p>
                      <p className="text-xs text-gray-400">Your choir director will log attendance after each session.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myAttendanceRows.map((row, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${row.present ? 'bg-green-100' : 'bg-red-50'}`}>
                            {row.present
                              ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                              : <AlertCircle  className="w-5 h-5 text-red-400"   />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152] text-sm truncate">{row.session_label}</p>
                            <p className="text-[10px] text-gray-400">{new Date(row.session_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</p>
                            {row.notes && <p className="text-[10px] text-gray-500 mt-0.5 italic">{row.notes}</p>}
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${row.present ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                            {row.present ? 'Present' : 'Absent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Highlights ── */}
              {moreSection === 'highlights' && (
                <>
                  <button onClick={() => setMoreSection(null)} className="flex items-center gap-1.5 text-sm font-bold text-[#140152] mb-1 hover:underline">
                    ← More
                  </button>
                  <h2 className="font-black text-[#140152] text-lg mb-3">Highlights & Testimonies</h2>

                  {/* Choir stats — only real member count from roster API */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-2xl p-4 text-center bg-purple-50">
                      <Users className="w-5 h-5 mx-auto mb-1.5 text-purple-600" />
                      <p className="font-black text-xl text-purple-600">{activeMembers.length || '—'}</p>
                      <p className="text-gray-500 text-[10px]">Active Members</p>
                    </div>
                    <div className="rounded-2xl p-4 text-center bg-[#140152]/5">
                      <Star className="w-5 h-5 mx-auto mb-1.5 text-[#140152]" />
                      <p className="font-black text-xl text-[#140152]">{highlights.length || '—'}</p>
                      <p className="text-gray-500 text-[10px]">Testimonies Shared</p>
                    </div>
                  </div>

                  {/* Submit testimony */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-3">
                    <p className="text-xs font-bold text-[#140152] mb-3 flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> Share Your Testimony
                    </p>
                    <input value={testimonyTitle} onChange={e => setTestimonyTitle(e.target.value)}
                      placeholder="Title…"
                      className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm mb-2 focus:outline-none focus:border-[#140152]/30" />
                    <textarea value={testimonyBody} onChange={e => setTestimonyBody(e.target.value)}
                      rows={3} placeholder="Share what God did…"
                      className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-2xl text-sm resize-none focus:outline-none focus:border-[#140152]/30" />
                    <button onClick={submitTestimony} disabled={!testimonyTitle.trim()||!testimonyBody.trim()}
                      className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white disabled:opacity-50 transition-all"
                      style={{background:'linear-gradient(135deg,#7c3aed,#4c1d95)'}}>
                      <Send className="w-3.5 h-3.5" /> Submit Testimony
                    </button>
                  </div>

                  {/* Testimonies list */}
                  {highlights.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-10 text-center">
                      <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-400">No testimonies yet. Be the first to share!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {highlights.map(h => {
                        const typeStyle: Record<string,{bg:string;border:string;icon:React.ElementType;iconColor:string}> = {
                          testimony: {bg:'#fff7ed',border:'#fed7aa',icon:Heart,iconColor:'#ea580c'},
                          update:    {bg:'#eff6ff',border:'#bfdbfe',icon:Bell, iconColor:'#2563eb'},
                          praise:    {bg:'#fffbeb',border:'#fde68a',icon:Star, iconColor:'#d97706'},
                        }
                        const ts = typeStyle[h.type] || typeStyle.testimony
                        const Icon = ts.icon
                        return (
                          <div key={h.id} className="rounded-3xl border p-5"
                            style={{background:ts.bg, borderColor:ts.border}}>
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4.5 h-4.5" style={{color:ts.iconColor}} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-[#140152] text-sm mb-1">{h.title}</h4>
                                <p className="text-gray-600 text-xs leading-relaxed">{h.body}</p>
                                <p className="text-[10px] text-gray-400 mt-2">{h.postedBy} · {h.time}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ══ BOTTOM TAB BAR ══ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-stretch z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {TABS.map(({ id, label, icon:Icon }) => {
          const isActive = tab === id
          const showBadge = id==='chat' && unreadChat>0
          return (
            <button key={id} onClick={() => { setTab(id); if(id!=='more') setMoreSection(null) }}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-all ${isActive ? 'text-[#140152]' : 'text-gray-400 hover:text-gray-600'}`}>
              <div className={`relative transition-transform ${isActive ? 'scale-110' : ''}`}>
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {unreadChat > 9 ? '9+' : unreadChat}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-bold leading-none ${isActive ? 'text-[#140152]' : ''}`}>{label}</span>
              {isActive && (
                <motion.div layoutId="tab-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{background:session.avatar}} />
              )}
            </button>
          )
        })}
      </nav>

    </div>
  )
}

'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Play,
  Pause,
  Music,
  Bell,
  MessageSquare,
  ChevronRight,
  Flame,
  Mic2,
  Globe,
  Sparkles,
  Music2,
  LogOut,
  User,
  Settings,
  BookOpen,
  Calendar,
  Heart,
  LayoutDashboard,
  Library,
  Volume2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  ChevronDown,
} from 'lucide-react'
import { alterSoundApi, AudioTrack, AudioCategory } from '@/lib/api'

/* ─── Types ───────────────────────────────────────────────── */
interface Announcement {
  id: string
  title: string
  description: string
  type: 'event' | 'update' | 'worship' | 'global'
  date: string
  pinned?: boolean
  badge?: string
}

interface FormationStage {
  step: number
  label: string
  completed: boolean
  active: boolean
}

interface Message {
  id: string
  from: 'admin' | 'user'
  text: string
  time: string
}

/* ─── Mock data (replace with real API calls) ──────────────── */
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Worship Retreat 2025 — Save the Date',
    description: 'All Alter Sound members are required to attend. Aug 14–16, Countryside Retreat Centre.',
    type: 'event',
    date: 'Aug 14–16',
    pinned: true,
    badge: 'Pinned',
  },
  {
    id: '2',
    title: 'Prophetic Sound Workshop — This Saturday',
    description: 'Members-only session starting at 10am. Please RSVP via the portal.',
    type: 'worship',
    date: 'Sat 10am',
    badge: '2 days left',
  },
  {
    id: '3',
    title: 'Nations Sound Recording — Call for Participants',
    description: 'Open to all voice types. A missional track project releasing this quarter.',
    type: 'global',
    date: 'Open',
    badge: 'Open',
  },
]

const MOCK_FORMATION: FormationStage[] = [
  { step: 1, label: 'Consecration', completed: true, active: false },
  { step: 2, label: 'Vocal Formation', completed: true, active: false },
  { step: 3, label: 'Spiritual Sensitivity', completed: false, active: true },
  { step: 4, label: 'Corporate Unity', completed: false, active: false },
  { step: 5, label: 'Sound Release', completed: false, active: false },
]

const MOCK_MESSAGES: Message[] = [
  { id: '1', from: 'admin', text: 'Welcome to Alter Sound! Your membership has been approved.', time: '2 days ago' },
  { id: '2', from: 'admin', text: 'Please review the formation guidelines in the library before Saturday\'s session.', time: '1 day ago' },
]

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Worship Sound': Music2,
  'Prophetic Sound': Mic2,
  'Healing Sound': Sparkles,
  'Missional Sound': Globe,
}

const ANNOUNCEMENT_COLORS: Record<string, string> = {
  event: '#f5bb00',
  worship: '#a78bfa',
  update: '#34d399',
  global: '#60a5fa',
}

/* ─── Sidebar nav items ────────────────────────────────────── */
const NAV = [
  { id: 'home', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'library', label: 'Audio Library', icon: Library },
  { id: 'formation', label: 'My Formation', icon: Flame },
  { id: 'announcements', label: 'Announcements', icon: Bell, badge: 3 },
  { id: 'messages', label: 'Messages', icon: MessageSquare, badge: 2 },
  { id: 'profile', label: 'Profile & Settings', icon: Settings },
]

/* ═══════════════════════════════════════════════════════════ */
export default function UserDashboardPage() {
  const [activeNav, setActiveNav] = useState('home')
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [categories, setCategories] = useState<AudioCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [msgInput, setMsgInput] = useState('')
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /* Fetch audio data */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await alterSoundApi.getPageData()
        setTracks(data.all_tracks.filter((t) => t.is_active))
        setCategories(data.categories.filter((c) => c.is_active))
      } catch (err) {
        console.error('Failed to load audio data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  /* Audio playback */
  const handlePlay = async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return

    if (currentlyPlaying === trackId && audioRef.current) {
      audioRef.current.pause()
      setCurrentlyPlaying(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    try {
      const audio = new Audio(alterSoundApi.getAudioUrl(trackId))
      audioRef.current = audio
      audio.addEventListener('ended', () => setCurrentlyPlaying(null))
      audio.addEventListener('error', () => setCurrentlyPlaying(null))
      await audio.play()
      setCurrentlyPlaying(trackId)
      await alterSoundApi.incrementPlayCount(trackId)
    } catch (err) {
      console.error('Playback failed:', err)
      setCurrentlyPlaying(null)
    }
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const toggleLike = (id: string) => {
    setLikedTracks((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const sendMessage = () => {
    if (!msgInput.trim()) return
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), from: 'user', text: msgInput.trim(), time: 'Just now' },
    ])
    setMsgInput('')
  }

  const filteredTracks =
    selectedCategory === 'all'
      ? tracks
      : tracks.filter((t) => t.category_id === selectedCategory)

  /* ── Completed formation steps ── */
  const completedSteps = MOCK_FORMATION.filter((s) => s.completed).length
  const activeStage = MOCK_FORMATION.find((s) => s.active)

  return (
    <div className="as-shell">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="as-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ════ SIDEBAR ════ */}
      <aside className={`as-sidebar ${sidebarOpen ? 'as-sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="as-brand">
          <div className="as-brand__logo">
            <Flame size={16} strokeWidth={2.5} />
          </div>
          <div>
            <div className="as-brand__name">ALTER SOUND</div>
            <div className="as-brand__sub">Ministry Portal</div>
          </div>
        </div>

        {/* User chip */}
        <div className="as-user-chip">
          <div className="as-user-chip__avatar">EM</div>
          <div className="as-user-chip__info">
            <span className="as-user-chip__name">Esther M.</span>
            <span className="as-user-chip__role">Soprano · Vocalist</span>
          </div>
          <div className="as-status-dot" title="Active member" />
        </div>

        {/* Nav */}
        <nav className="as-nav">
          {NAV.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={`as-nav__item ${activeNav === id ? 'as-nav__item--active' : ''}`}
              onClick={() => {
                setActiveNav(id)
                setSidebarOpen(false)
              }}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span>{label}</span>
              {badge && <span className="as-nav__badge">{badge}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="as-sidebar__bottom">
          <Link href="/services/alter-sound" className="as-sidebar-link">
            <Globe size={13} /> Visit Alter Sound
          </Link>
          <Link href="/logout" className="as-sidebar-link as-sidebar-link--danger">
            <LogOut size={13} /> Sign Out
          </Link>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <main className="as-main">
        {/* Topbar */}
        <header className="as-topbar">
          <button className="as-hamburger" onClick={() => setSidebarOpen(true)}>
            <span /><span /><span />
          </button>
          <div className="as-topbar__title">
            {NAV.find((n) => n.id === activeNav)?.label ?? 'Dashboard'}
          </div>
          <div className="as-topbar__actions">
            <button className="as-icon-btn" onClick={() => setActiveNav('announcements')}>
              <Bell size={16} />
              <span className="as-icon-btn__dot" />
            </button>
            <button className="as-icon-btn" onClick={() => setActiveNav('messages')}>
              <MessageSquare size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="as-content">
          <AnimatePresence mode="wait">

            {/* ── HOME ── */}
            {activeNav === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {/* Welcome banner */}
                <div className="as-welcome-banner">
                  <div className="as-welcome-banner__bg" />
                  <div className="as-welcome-banner__content">
                    <div className="as-welcome-banner__eyebrow">
                      <Flame size={12} /> Sound Ministry
                    </div>
                    <h1 className="as-welcome-banner__heading">
                      Welcome back, Esther
                    </h1>
                    <p className="as-welcome-banner__sub">
                      You are a consecrated servant releasing heaven's sound.
                    </p>
                    <div className="as-welcome-banner__actions">
                      <button
                        className="as-btn as-btn--gold"
                        onClick={() => setActiveNav('library')}
                      >
                        <Volume2 size={13} /> Open Library
                      </button>
                      <button
                        className="as-btn as-btn--ghost"
                        onClick={() => setActiveNav('formation')}
                      >
                        My Formation <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="as-welcome-banner__ornament">
                    <Music2 size={100} strokeWidth={0.6} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="as-stats">
                  {[
                    { label: 'Formation Stage', value: `${completedSteps}/5`, icon: Flame, color: '#f5bb00' },
                    { label: 'Tracks Listened', value: '24', icon: Volume2, color: '#a78bfa' },
                    { label: 'Days Active', value: '18', icon: Clock, color: '#34d399' },
                    { label: 'Messages', value: `${messages.length}`, icon: MessageSquare, color: '#60a5fa' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="as-stat">
                      <div className="as-stat__icon" style={{ background: color + '22', color }}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <div className="as-stat__value">{value}</div>
                        <div className="as-stat__label">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="as-home-grid">
                  {/* Formation progress */}
                  <div className="as-card">
                    <div className="as-card__head">
                      <span className="as-card__title">Formation Journey</span>
                      <button className="as-card__link" onClick={() => setActiveNav('formation')}>
                        Details →
                      </button>
                    </div>
                    <div className="as-formation-list">
                      {MOCK_FORMATION.map((stage) => (
                        <div
                          key={stage.step}
                          className={`as-formation-item ${stage.active ? 'as-formation-item--active' : ''} ${stage.completed ? 'as-formation-item--done' : ''}`}
                        >
                          <div className="as-formation-item__num">
                            {stage.completed ? <CheckCircle2 size={14} /> : stage.step}
                          </div>
                          <span>{stage.label}</span>
                          {stage.active && (
                            <span className="as-pill as-pill--gold">Current</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Announcements preview */}
                  <div className="as-card">
                    <div className="as-card__head">
                      <span className="as-card__title">Announcements</span>
                      <button className="as-card__link" onClick={() => setActiveNav('announcements')}>
                        All →
                      </button>
                    </div>
                    <div className="as-ann-list">
                      {MOCK_ANNOUNCEMENTS.slice(0, 3).map((ann) => (
                        <div key={ann.id} className="as-ann-item">
                          <div
                            className="as-ann-item__dot"
                            style={{ background: ANNOUNCEMENT_COLORS[ann.type] }}
                          />
                          <div className="as-ann-item__body">
                            <div className="as-ann-item__title">{ann.title}</div>
                            <div className="as-ann-item__date">{ann.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick message preview */}
                  <div className="as-card">
                    <div className="as-card__head">
                      <span className="as-card__title">Latest Message</span>
                      <button className="as-card__link" onClick={() => setActiveNav('messages')}>
                        Open →
                      </button>
                    </div>
                    <div className="as-latest-msg">
                      <div className="as-msg-bubble as-msg-bubble--admin">
                        {messages[messages.length - 1]?.text}
                      </div>
                      <div className="as-latest-msg__time">
                        {messages[messages.length - 1]?.time} · from Ministry Admin
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── AUDIO LIBRARY ── */}
            {activeNav === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {/* Category filter */}
                <div className="as-filter-row">
                  <button
                    className={`as-filter-btn ${selectedCategory === 'all' ? 'as-filter-btn--active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Sound
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`as-filter-btn ${selectedCategory === cat.id ? 'as-filter-btn--active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="as-empty-state">
                    <Music size={36} className="as-empty-state__icon as-pulse" />
                    <p>Loading the sound library…</p>
                  </div>
                ) : filteredTracks.length === 0 ? (
                  <div className="as-empty-state">
                    <Music size={36} className="as-empty-state__icon" />
                    <p>No tracks found in this category.</p>
                  </div>
                ) : (
                  <div className="as-tracks-grid">
                    <AnimatePresence>
                      {filteredTracks.map((track, i) => {
                        const CatIcon = CATEGORY_ICONS[track.category?.name] ?? Music2
                        const isPlaying = currentlyPlaying === track.id
                        return (
                          <motion.div
                            key={track.id}
                            className={`as-track-card ${isPlaying ? 'as-track-card--playing' : ''}`}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            {/* Cover art */}
                            <div className="as-track-cover">
                              <img
                                src={alterSoundApi.getCoverUrl(track.id)}
                                alt={track.title}
                                className="as-track-cover__img"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  const fb = e.currentTarget.nextElementSibling as HTMLElement
                                  if (fb) fb.style.display = 'flex'
                                }}
                              />
                              <div className="as-track-cover__fallback" style={{ display: 'none' }}>
                                <CatIcon size={28} strokeWidth={1.2} />
                              </div>
                              {isPlaying && (
                                <div className="as-track-cover__eq">
                                  <span /><span /><span /><span />
                                </div>
                              )}
                              <button
                                className="as-track-play-btn"
                                onClick={() => handlePlay(track.id)}
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                              >
                                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                              </button>
                            </div>

                            {/* Info */}
                            <div className="as-track-info">
                              <div className="as-track-info__title">{track.title}</div>
                              <div className="as-track-info__artist">{track.artist ?? 'Alter Sound'}</div>
                              <div className="as-track-info__meta">
                                <span className="as-pill as-pill--dim">{track.category?.name}</span>
                                <button
                                  className={`as-like-btn ${likedTracks.has(track.id) ? 'as-like-btn--liked' : ''}`}
                                  onClick={() => toggleLike(track.id)}
                                  aria-label="Like"
                                >
                                  <Heart size={13} />
                                </button>
                                <span className="as-track-info__plays">{track.play_count} plays</span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── FORMATION ── */}
            {activeNav === 'formation' && (
              <motion.div
                key="formation"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="as-formation-hero">
                  <div className="as-formation-hero__eyebrow"><Flame size={13} /> Your Journey</div>
                  <h2 className="as-formation-hero__heading">Sound Formation Path</h2>
                  <p className="as-formation-hero__sub">
                    {activeStage
                      ? `You are currently in Stage ${activeStage.step}: ${activeStage.label}`
                      : 'All stages complete — ready for Sound Release.'}
                  </p>
                  <div className="as-formation-progress-bar">
                    <div
                      className="as-formation-progress-bar__fill"
                      style={{ width: `${(completedSteps / 5) * 100}%` }}
                    />
                  </div>
                  <div className="as-formation-progress-label">
                    {completedSteps} of 5 stages complete
                  </div>
                </div>

                <div className="as-formation-stages">
                  {MOCK_FORMATION.map((stage, i) => (
                    <div
                      key={stage.step}
                      className={`as-stage-card ${stage.active ? 'as-stage-card--active' : ''} ${stage.completed ? 'as-stage-card--done' : ''}`}
                    >
                      <div className="as-stage-card__num">
                        {stage.completed
                          ? <CheckCircle2 size={20} />
                          : stage.active
                            ? <AlertCircle size={20} />
                            : stage.step}
                      </div>
                      <div className="as-stage-card__body">
                        <div className="as-stage-card__label">{stage.label}</div>
                        <div className="as-stage-card__desc">
                          {stage.completed
                            ? 'Completed — well done, servant.'
                            : stage.active
                              ? 'In progress — keep pressing in.'
                              : 'Upcoming — continue faithfully.'}
                        </div>
                      </div>
                      {stage.active && (
                        <span className="as-pill as-pill--gold">Active</span>
                      )}
                      {stage.completed && (
                        <span className="as-pill as-pill--green">Done</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="as-formation-note">
                  <BookOpen size={14} />
                  <span>
                    Your formation is guided by the ministry leaders. Attend sessions faithfully
                    and engage with the Audio Library to progress.
                  </span>
                </div>
              </motion.div>
            )}

            {/* ── ANNOUNCEMENTS ── */}
            {activeNav === 'announcements' && (
              <motion.div
                key="announcements"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="as-ann-full-list">
                  {MOCK_ANNOUNCEMENTS.map((ann, i) => (
                    <motion.div
                      key={ann.id}
                      className="as-ann-card"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <div
                        className="as-ann-card__stripe"
                        style={{ background: ANNOUNCEMENT_COLORS[ann.type] }}
                      />
                      <div className="as-ann-card__body">
                        <div className="as-ann-card__top">
                          <h3 className="as-ann-card__title">{ann.title}</h3>
                          {ann.badge && (
                            <span
                              className="as-pill"
                              style={{
                                background: ANNOUNCEMENT_COLORS[ann.type] + '22',
                                color: ANNOUNCEMENT_COLORS[ann.type],
                              }}
                            >
                              {ann.badge}
                            </span>
                          )}
                        </div>
                        <p className="as-ann-card__desc">{ann.description}</p>
                        <div className="as-ann-card__meta">
                          <Calendar size={11} />
                          <span>{ann.date}</span>
                          {ann.pinned && (
                            <>
                              <span className="as-dot-sep" />
                              <span>Pinned by admin</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── MESSAGES ── */}
            {activeNav === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="as-messages-shell"
              >
                <div className="as-messages-header">
                  <div className="as-messages-header__avatar">PA</div>
                  <div>
                    <div className="as-messages-header__name">Ministry Admin</div>
                    <div className="as-messages-header__status">
                      <span className="as-status-dot" /> Online
                    </div>
                  </div>
                </div>

                <div className="as-messages-feed">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={`as-msg-row ${msg.from === 'user' ? 'as-msg-row--user' : ''}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {msg.from === 'admin' && (
                        <div className="as-msg-avatar as-msg-avatar--admin">PA</div>
                      )}
                      <div className="as-msg-bubble-wrap">
                        <div className={`as-msg-bubble ${msg.from === 'user' ? 'as-msg-bubble--user' : 'as-msg-bubble--admin'}`}>
                          {msg.text}
                        </div>
                        <div className="as-msg-time">{msg.time}</div>
                      </div>
                      {msg.from === 'user' && (
                        <div className="as-msg-avatar as-msg-avatar--user">EM</div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="as-messages-compose">
                  <input
                    className="as-compose-input"
                    type="text"
                    placeholder="Write a message to admin…"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    className="as-compose-send"
                    onClick={sendMessage}
                    disabled={!msgInput.trim()}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PROFILE ── */}
            {activeNav === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="as-profile-hero">
                  <div className="as-profile-avatar">EM</div>
                  <div>
                    <h2 className="as-profile-name">Esther Mensah</h2>
                    <div className="as-profile-meta">
                      <span className="as-pill as-pill--green">Active Member</span>
                      <span className="as-profile-role">Soprano · Vocalist</span>
                    </div>
                    <div className="as-profile-joined">
                      <Calendar size={11} /> Joined April 10, 2025
                    </div>
                  </div>
                </div>

                <div className="as-profile-grid">
                  <div className="as-card">
                    <div className="as-card__head">
                      <span className="as-card__title">Personal Details</span>
                    </div>
                    <div className="as-profile-fields">
                      {[
                        { label: 'Full Name', value: 'Esther Mensah' },
                        { label: 'Email', value: 'esther@example.com' },
                        { label: 'Voice / Instrument', value: 'Soprano Vocalist' },
                        { label: 'Location', value: 'Accra, Ghana' },
                      ].map(({ label, value }) => (
                        <div key={label} className="as-profile-field">
                          <div className="as-profile-field__label">{label}</div>
                          <div className="as-profile-field__value">{value}</div>
                        </div>
                      ))}
                    </div>
                    <button className="as-btn as-btn--outline" style={{ marginTop: '1rem', width: '100%' }}>
                      <User size={13} /> Edit Profile
                    </button>
                  </div>

                  <div className="as-card">
                    <div className="as-card__head">
                      <span className="as-card__title">Ministry Stats</span>
                    </div>
                    <div className="as-profile-stats">
                      {[
                        { label: 'Formation Stage', value: `${completedSteps}/5` },
                        { label: 'Sessions Attended', value: '7' },
                        { label: 'Tracks Played', value: '24' },
                        { label: 'Days in Ministry', value: '18' },
                      ].map(({ label, value }) => (
                        <div key={label} className="as-profile-stat">
                          <div className="as-profile-stat__val">{value}</div>
                          <div className="as-profile-stat__label">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ══ Global Styles ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #140152;
          --gold: #f5bb00;
          --gold-dim: rgba(245,187,0,0.15);
          --white: #ffffff;
          --dark: #0c0a1a;
          --text: #f0eeff;
          --muted: rgba(240,238,255,0.5);
          --hint: rgba(240,238,255,0.28);
          --card-bg: rgba(255,255,255,0.04);
          --card-border: rgba(255,255,255,0.07);
          --sidebar-bg: #0d0920;
          --r: 14px;
          --rm: 8px;
          font-family: 'Outfit', sans-serif;
        }

        body { background: var(--dark); color: var(--text); }

        .as-shell {
          display: flex;
          min-height: 100vh;
          background: var(--dark);
        }

        /* ── SIDEBAR ── */
        .as-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--sidebar-bg);
          border-right: 0.5px solid var(--card-border);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 40;
        }

        .as-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 1.25rem 1rem 1rem;
          border-bottom: 0.5px solid var(--card-border);
        }
        .as-brand__logo {
          width: 30px; height: 30px;
          background: var(--gold);
          color: var(--ink);
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .as-brand__name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.1em;
          color: var(--white);
        }
        .as-brand__sub {
          font-size: 9px;
          color: var(--hint);
          margin-top: 1px;
        }

        .as-user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.875rem 1rem;
          border-bottom: 0.5px solid var(--card-border);
          position: relative;
        }
        .as-user-chip__avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold) 0%, #e0a800 100%);
          color: var(--ink);
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .as-user-chip__name {
          font-size: 12px; font-weight: 600;
          color: var(--white);
          display: block;
        }
        .as-user-chip__role {
          font-size: 9px;
          color: var(--hint);
          display: block;
          margin-top: 1px;
        }
        .as-status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #34d399;
          flex-shrink: 0;
          margin-left: auto;
          box-shadow: 0 0 0 2px rgba(52,211,153,0.25);
        }

        .as-nav { padding: 0.75rem 0; flex: 1; }
        .as-nav__item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 0.5rem 1rem;
          font-size: 12.5px;
          font-weight: 400;
          color: var(--muted);
          background: none;
          border: none;
          border-left: 2px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .as-nav__item:hover { color: var(--white); background: rgba(255,255,255,0.03); }
        .as-nav__item--active {
          color: var(--white);
          background: rgba(245,187,0,0.08);
          border-left-color: var(--gold);
        }
        .as-nav__badge {
          margin-left: auto;
          background: var(--gold);
          color: var(--ink);
          font-size: 9px; font-weight: 700;
          padding: 1px 5px;
          border-radius: 20px;
        }

        .as-sidebar__bottom {
          padding: 0.875rem 1rem;
          border-top: 0.5px solid var(--card-border);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .as-sidebar-link {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: var(--muted);
          text-decoration: none;
          padding: 4px 0;
          transition: color 0.15s;
        }
        .as-sidebar-link:hover { color: var(--white); }
        .as-sidebar-link--danger:hover { color: #f87171; }

        .as-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 30;
        }

        /* ── MAIN ── */
        .as-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .as-topbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 1.25rem;
          height: 56px;
          border-bottom: 0.5px solid var(--card-border);
          background: rgba(13,9,32,0.8);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .as-topbar__title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--white);
          flex: 1;
        }
        .as-topbar__actions { display: flex; gap: 6px; }
        .as-hamburger {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
        .as-hamburger span {
          display: block;
          width: 18px; height: 1.5px;
          background: var(--muted);
          border-radius: 1px;
        }

        .as-icon-btn {
          width: 34px; height: 34px;
          border-radius: var(--rm);
          background: var(--card-bg);
          border: 0.5px solid var(--card-border);
          color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.15s;
        }
        .as-icon-btn:hover { color: var(--white); background: rgba(255,255,255,0.07); }
        .as-icon-btn__dot {
          position: absolute;
          top: 7px; right: 7px;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
        }

        .as-content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
        }

        /* ── Buttons ── */
        .as-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px;
          border-radius: var(--rm);
          font-size: 12.5px; font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          text-decoration: none;
        }
        .as-btn--gold {
          background: var(--gold);
          color: var(--ink);
        }
        .as-btn--gold:hover { opacity: 0.9; }
        .as-btn--ghost {
          background: rgba(255,255,255,0.07);
          color: var(--muted);
          border: 0.5px solid var(--card-border);
        }
        .as-btn--ghost:hover { color: var(--white); background: rgba(255,255,255,0.1); }
        .as-btn--outline {
          background: transparent;
          color: var(--muted);
          border: 0.5px solid var(--card-border);
        }
        .as-btn--outline:hover { color: var(--white); }

        /* ── Pills ── */
        .as-pill {
          display: inline-flex; align-items: center;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .as-pill--gold { background: var(--gold-dim); color: var(--gold); }
        .as-pill--green { background: rgba(52,211,153,0.15); color: #34d399; }
        .as-pill--dim { background: rgba(255,255,255,0.06); color: var(--muted); }

        /* ── Cards ── */
        .as-card {
          background: var(--card-bg);
          border: 0.5px solid var(--card-border);
          border-radius: var(--r);
          overflow: hidden;
        }
        .as-card__head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 1rem;
          border-bottom: 0.5px solid var(--card-border);
        }
        .as-card__title {
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700;
          color: var(--white);
        }
        .as-card__link {
          font-size: 10px; color: var(--muted);
          background: none; border: none;
          cursor: pointer;
          transition: color 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .as-card__link:hover { color: var(--gold); }

        /* ── WELCOME BANNER ── */
        .as-welcome-banner {
          position: relative;
          background: var(--ink);
          border-radius: var(--r);
          padding: 2rem;
          margin-bottom: 1.25rem;
          overflow: hidden;
          border: 0.5px solid rgba(245,187,0,0.2);
        }
        .as-welcome-banner__bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 50%, rgba(245,187,0,0.08) 0%, transparent 70%);
        }
        .as-welcome-banner__content { position: relative; z-index: 1; max-width: 520px; }
        .as-welcome-banner__eyebrow {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 600;
          color: var(--gold); letter-spacing: 0.12em; text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .as-welcome-banner__heading {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800;
          color: var(--white); line-height: 1.1;
          margin-bottom: 0.5rem;
        }
        .as-welcome-banner__sub {
          font-size: 13px; color: rgba(255,255,255,0.55);
          margin-bottom: 1.25rem; line-height: 1.5;
        }
        .as-welcome-banner__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .as-welcome-banner__ornament {
          position: absolute; right: -10px; top: 50%;
          transform: translateY(-50%);
          color: rgba(245,187,0,0.06);
          pointer-events: none;
        }

        /* ── STATS ── */
        .as-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 1.25rem;
        }
        .as-stat {
          background: var(--card-bg);
          border: 0.5px solid var(--card-border);
          border-radius: var(--r);
          padding: 0.875rem 1rem;
          display: flex; align-items: center; gap: 10px;
        }
        .as-stat__icon {
          width: 34px; height: 34px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .as-stat__value {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800;
          color: var(--white); line-height: 1;
        }
        .as-stat__label {
          font-size: 10px; color: var(--hint); margin-top: 3px;
        }

        /* ── HOME GRID ── */
        .as-home-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        /* ── FORMATION LIST (home card) ── */
        .as-formation-list { padding: 0.5rem 1rem 1rem; }
        .as-formation-item {
          display: flex; align-items: center; gap: 10px;
          padding: 0.5rem 0;
          font-size: 12.5px; color: var(--muted);
          border-bottom: 0.5px solid var(--card-border);
        }
        .as-formation-item:last-child { border-bottom: none; }
        .as-formation-item--active { color: var(--white); }
        .as-formation-item--done { color: rgba(52,211,153,0.7); }
        .as-formation-item__num {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--card-border);
          color: var(--hint);
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .as-formation-item--active .as-formation-item__num {
          background: var(--gold-dim); color: var(--gold);
        }
        .as-formation-item--done .as-formation-item__num {
          background: rgba(52,211,153,0.15); color: #34d399;
        }

        /* ── ANN LIST (home) ── */
        .as-ann-list { padding: 0.5rem 1rem 1rem; }
        .as-ann-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 0.5rem 0;
          border-bottom: 0.5px solid var(--card-border);
        }
        .as-ann-item:last-child { border-bottom: none; }
        .as-ann-item__dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          margin-top: 4px; flex-shrink: 0;
        }
        .as-ann-item__title { font-size: 12px; font-weight: 500; color: var(--white); }
        .as-ann-item__date { font-size: 10px; color: var(--hint); margin-top: 1px; }

        /* ── LATEST MSG ── */
        .as-latest-msg { padding: 1rem; }
        .as-latest-msg__time { font-size: 10px; color: var(--hint); margin-top: 6px; }

        /* ── TRACKS GRID ── */
        .as-filter-row {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .as-filter-btn {
          padding: 5px 13px;
          border-radius: 20px;
          font-size: 11.5px; font-weight: 500;
          background: var(--card-bg);
          border: 0.5px solid var(--card-border);
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .as-filter-btn:hover { color: var(--white); }
        .as-filter-btn--active {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--ink);
          font-weight: 600;
        }

        .as-tracks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .as-track-card {
          background: var(--card-bg);
          border: 0.5px solid var(--card-border);
          border-radius: var(--r);
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .as-track-card:hover { border-color: rgba(245,187,0,0.3); transform: translateY(-2px); }
        .as-track-card--playing { border-color: var(--gold) !important; }

        .as-track-cover {
          position: relative;
          aspect-ratio: 1;
          background: linear-gradient(135deg, var(--ink) 0%, #2d1f6e 100%);
        }
        .as-track-cover__img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .as-track-cover__fallback {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(245,187,0,0.3);
        }
        .as-track-play-btn {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.35);
          opacity: 0;
          color: var(--white);
          border: none; cursor: pointer;
          transition: opacity 0.2s;
          font-size: 0;
        }
        .as-track-card:hover .as-track-play-btn,
        .as-track-card--playing .as-track-play-btn { opacity: 1; }
        .as-track-play-btn svg {
          width: 36px; height: 36px;
          background: var(--gold);
          color: var(--ink);
          border-radius: 50%;
          padding: 8px;
        }

        /* Equaliser bars */
        .as-track-cover__eq {
          position: absolute; bottom: 8px; left: 8px;
          display: flex; align-items: flex-end; gap: 2px;
        }
        .as-track-cover__eq span {
          display: block;
          width: 3px;
          border-radius: 2px;
          background: var(--gold);
          animation: eq 0.8s ease-in-out infinite alternate;
        }
        .as-track-cover__eq span:nth-child(1) { height: 8px; animation-delay: 0s; }
        .as-track-cover__eq span:nth-child(2) { height: 14px; animation-delay: 0.15s; }
        .as-track-cover__eq span:nth-child(3) { height: 10px; animation-delay: 0.3s; }
        .as-track-cover__eq span:nth-child(4) { height: 16px; animation-delay: 0.45s; }
        @keyframes eq {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }

        .as-track-info { padding: 0.75rem; }
        .as-track-info__title {
          font-size: 13px; font-weight: 600; color: var(--white);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .as-track-info__artist { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
        .as-track-info__meta {
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap;
        }
        .as-track-info__plays { font-size: 10px; color: var(--hint); margin-left: auto; }

        .as-like-btn {
          background: none; border: none;
          color: var(--hint); cursor: pointer;
          display: flex; align-items: center;
          transition: color 0.15s, transform 0.15s;
          padding: 0;
        }
        .as-like-btn:hover { color: #f87171; transform: scale(1.2); }
        .as-like-btn--liked { color: #f87171; }

        /* ── FORMATION PAGE ── */
        .as-formation-hero {
          background: linear-gradient(135deg, var(--ink) 0%, #1a0d4a 100%);
          border: 0.5px solid rgba(245,187,0,0.2);
          border-radius: var(--r);
          padding: 2rem;
          margin-bottom: 1.25rem;
        }
        .as-formation-hero__eyebrow {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 600;
          color: var(--gold); letter-spacing: 0.12em;
          text-transform: uppercase; margin-bottom: 0.5rem;
        }
        .as-formation-hero__heading {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: var(--white); margin-bottom: 0.5rem;
        }
        .as-formation-hero__sub {
          font-size: 12.5px; color: var(--muted);
          margin-bottom: 1.25rem;
        }
        .as-formation-progress-bar {
          height: 5px; background: rgba(255,255,255,0.08);
          border-radius: 3px; overflow: hidden;
        }
        .as-formation-progress-bar__fill {
          height: 100%; background: var(--gold);
          border-radius: 3px;
          transition: width 0.8s ease;
        }
        .as-formation-progress-label {
          font-size: 10px; color: var(--muted); margin-top: 6px;
        }

        .as-formation-stages { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1rem; }
        .as-stage-card {
          display: flex; align-items: center; gap: 14px;
          background: var(--card-bg);
          border: 0.5px solid var(--card-border);
          border-radius: var(--r);
          padding: 1rem 1.25rem;
          transition: border-color 0.2s;
        }
        .as-stage-card--active { border-color: rgba(245,187,0,0.35); }
        .as-stage-card--done { border-color: rgba(52,211,153,0.2); }
        .as-stage-card__num {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          color: var(--hint);
          font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .as-stage-card--active .as-stage-card__num { background: var(--gold-dim); color: var(--gold); }
        .as-stage-card--done  .as-stage-card__num { background: rgba(52,211,153,0.1); color: #34d399; }
        .as-stage-card__label {
          font-weight: 600; font-size: 13.5px; color: var(--white);
        }
        .as-stage-card__desc { font-size: 11px; color: var(--hint); margin-top: 2px; }
        .as-stage-card__body { flex: 1; }

        .as-formation-note {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 0.875rem 1rem;
          background: rgba(245,187,0,0.06);
          border: 0.5px solid rgba(245,187,0,0.15);
          border-radius: var(--rm);
          font-size: 12px; color: var(--muted);
          line-height: 1.5;
        }
        .as-formation-note svg { color: var(--gold); flex-shrink: 0; margin-top: 1px; }

        /* ── ANNOUNCEMENTS PAGE ── */
        .as-ann-full-list { display: flex; flex-direction: column; gap: 10px; }
        .as-ann-card {
          display: flex;
          background: var(--card-bg);
          border: 0.5px solid var(--card-border);
          border-radius: var(--r);
          overflow: hidden;
        }
        .as-ann-card__stripe { width: 4px; flex-shrink: 0; }
        .as-ann-card__body { padding: 1rem 1.25rem; flex: 1; }
        .as-ann-card__top {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 6px;
        }
        .as-ann-card__title {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700;
          color: var(--white); flex: 1;
        }
        .as-ann-card__desc { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin-bottom: 10px; }
        .as-ann-card__meta {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; color: var(--hint);
        }
        .as-dot-sep { width: 2px; height: 2px; border-radius: 50%; background: var(--hint); }

        /* ── MESSAGES ── */
        .as-messages-shell {
          display: flex;
          flex-direction: column;
          background: var(--card-bg);
          border: 0.5px solid var(--card-border);
          border-radius: var(--r);
          overflow: hidden;
          height: calc(100vh - 200px);
          min-height: 400px;
        }
        .as-messages-header {
          display: flex; align-items: center; gap: 10px;
          padding: 0.875rem 1rem;
          border-bottom: 0.5px solid var(--card-border);
          background: rgba(255,255,255,0.02);
        }
        .as-messages-header__avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: var(--ink);
          border: 1.5px solid rgba(245,187,0,0.4);
          color: var(--gold);
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .as-messages-header__name { font-size: 13px; font-weight: 600; color: var(--white); }
        .as-messages-header__status {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; color: #34d399;
        }
        .as-messages-feed {
          flex: 1; overflow-y: auto;
          padding: 1rem;
          display: flex; flex-direction: column; gap: 10px;
        }
        .as-msg-row {
          display: flex; align-items: flex-end; gap: 8px;
        }
        .as-msg-row--user { flex-direction: row-reverse; }
        .as-msg-avatar {
          width: 26px; height: 26px;
          border-radius: 50%;
          font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .as-msg-avatar--admin { background: var(--ink); border: 1px solid rgba(245,187,0,0.3); color: var(--gold); }
        .as-msg-avatar--user { background: var(--gold); color: var(--ink); }
        .as-msg-bubble-wrap { display: flex; flex-direction: column; gap: 3px; max-width: 70%; }
        .as-msg-row--user .as-msg-bubble-wrap { align-items: flex-end; }
        .as-msg-bubble {
          padding: 9px 13px;
          border-radius: 12px;
          font-size: 12.5px; line-height: 1.5;
        }
        .as-msg-bubble--admin {
          background: rgba(255,255,255,0.06);
          border: 0.5px solid var(--card-border);
          color: var(--text);
          border-radius: 12px 12px 12px 2px;
        }
        .as-msg-bubble--user {
          background: var(--ink);
          color: var(--white);
          border-radius: 12px 12px 2px 12px;
        }
        .as-msg-time { font-size: 9px; color: var(--hint); }

        .as-messages-compose {
          display: flex; gap: 8px;
          padding: 0.875rem;
          border-top: 0.5px solid var(--card-border);
          background: rgba(255,255,255,0.02);
        }
        .as-compose-input {
          flex: 1;
          padding: 9px 13px;
          border-radius: var(--rm);
          border: 0.5px solid var(--card-border);
          background: rgba(255,255,255,0.04);
          color: var(--text);
          font-size: 12.5px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .as-compose-input:focus { border-color: rgba(245,187,0,0.4); }
        .as-compose-input::placeholder { color: var(--hint); }
        .as-compose-send {
          width: 38px; height: 38px;
          border-radius: var(--rm);
          background: var(--gold);
          color: var(--ink);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .as-compose-send:disabled { opacity: 0.4; cursor: default; }
        .as-compose-send:not(:disabled):hover { opacity: 0.85; }

        /* ── PROFILE ── */
        .as-profile-hero {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 1.25rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, var(--ink) 0%, #1a0d4a 100%);
          border: 0.5px solid rgba(245,187,0,0.2);
          border-radius: var(--r);
        }
        .as-profile-avatar {
          width: 60px; height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold) 0%, #e0a800 100%);
          color: var(--ink);
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          border: 3px solid rgba(245,187,0,0.3);
        }
        .as-profile-name {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          color: var(--white); margin-bottom: 6px;
        }
        .as-profile-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .as-profile-role { font-size: 12px; color: var(--muted); }
        .as-profile-joined {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--hint);
        }

        .as-profile-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .as-profile-fields { padding: 0 1rem; }
        .as-profile-field {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.625rem 0;
          border-bottom: 0.5px solid var(--card-border);
          font-size: 12px;
        }
        .as-profile-field:last-child { border-bottom: none; }
        .as-profile-field__label { color: var(--hint); }
        .as-profile-field__value { color: var(--white); font-weight: 500; }
        .as-profile-stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
          padding: 0 1rem 1rem;
        }
        .as-profile-stat {
          padding: 1rem 0.5rem;
          text-align: center;
        }
        .as-profile-stat__val {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: var(--white);
        }
        .as-profile-stat__label { font-size: 10px; color: var(--hint); margin-top: 3px; }

        /* ── EMPTY STATE ── */
        .as-empty-state {
          text-align: center; padding: 4rem 2rem;
          color: var(--hint); font-size: 13px;
        }
        .as-empty-state__icon { color: rgba(245,187,0,0.3); margin: 0 auto 1rem; }
        .as-pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .as-sidebar {
            position: fixed; left: -220px;
            height: 100vh; top: 0;
            transition: left 0.25s ease;
          }
          .as-sidebar--open { left: 0; }
          .as-hamburger { display: flex; }
          .as-stats { grid-template-columns: repeat(2, 1fr); }
          .as-home-grid { grid-template-columns: 1fr; }
          .as-profile-grid { grid-template-columns: 1fr; }
          .as-tracks-grid { grid-template-columns: repeat(2, 1fr); }
          .as-welcome-banner__ornament { display: none; }
          .as-content { padding: 1rem; }
        }

        @media (max-width: 480px) {
          .as-stats { grid-template-columns: 1fr 1fr; }
          .as-tracks-grid { grid-template-columns: 1fr 1fr; }
          .as-welcome-banner { padding: 1.25rem; }
          .as-welcome-banner__heading { font-size: 20px; }
        }
      `}</style>
    </div>
  )
}

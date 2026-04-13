'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Play, Pause, Music, Bell,
  Flame, Mic2, Globe, Sparkles, Music2,
  Calendar, Heart, LayoutDashboard,
  Library, Volume2, Menu, X,
} from 'lucide-react'
import { alterSoundApi, AudioTrack, AudioCategory, announcementApi, Announcement } from '@/lib/api'

/* ─── Types ───────────────────────────────────────────────── */
interface FormationStage {
  step: number
  label: string
  completed: boolean
  active: boolean
}

/* ─── Static data ─────────────────────────────────────────── */
const MOCK_FORMATION: FormationStage[] = [
  { step: 1, label: 'Consecration',         completed: true,  active: false },
  { step: 2, label: 'Vocal Formation',      completed: true,  active: false },
  { step: 3, label: 'Spiritual Sensitivity',completed: false, active: true  },
  { step: 4, label: 'Corporate Unity',      completed: false, active: false },
  { step: 5, label: 'Sound Release',        completed: false, active: false },
]

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Worship Sound':   Music2,
  'Prophetic Sound': Mic2,
  'Healing Sound':   Sparkles,
  'Missional Sound': Globe,
}

const NAV = [
  { id: 'home',          label: 'My Dashboard',  icon: LayoutDashboard },
  { id: 'library',       label: 'Audio Library', icon: Library         },
  { id: 'announcements', label: 'Announcements', icon: Bell            },
]

/* ═══════════════════════════════════════════════════════════ */
export default function AlterSoundMemberDashboard() {
  const router = useRouter()
  const [activeNav, setActiveNav]           = useState('home')
  const [tracks, setTracks]                 = useState<AudioTrack[]>([])
  const [categories, setCategories]         = useState<AudioCategory[]>([])
  const [announcements, setAnnouncements]   = useState<Announcement[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [loading, setLoading]               = useState(true)
  const [likedTracks, setLikedTracks]       = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [userName, setUserName]             = useState('Member')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /* Auth guard + user info */
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn')
    if (!loggedIn) { router.push('/auth/login'); return }
    setUserName(localStorage.getItem('userName') || 'Member')
  }, [router])

  /* Fetch audio data + announcements */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageData, annData] = await Promise.all([
          alterSoundApi.getPageData(),
          announcementApi.getForService('Choir'),
        ])
        setTracks(pageData.all_tracks.filter(t => t.is_active))
        setCategories(pageData.categories.filter(c => c.is_active))
        setAnnouncements(annData.announcements)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  /* Audio playback */
  const handlePlay = async (trackId: string) => {
    if (currentlyPlaying === trackId && audioRef.current) {
      audioRef.current.pause()
      setCurrentlyPlaying(null)
      return
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    try {
      const audio = new Audio(alterSoundApi.getAudioUrl(trackId))
      audioRef.current = audio
      audio.addEventListener('ended', () => setCurrentlyPlaying(null))
      audio.addEventListener('error', () => setCurrentlyPlaying(null))
      await audio.play()
      setCurrentlyPlaying(trackId)
      await alterSoundApi.incrementPlayCount(trackId)
    } catch { setCurrentlyPlaying(null) }
  }

  useEffect(() => () => { audioRef.current?.pause() }, [])

  const toggleLike = (id: string) => {
    setLikedTracks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const filteredTracks = selectedCategory === 'all' ? tracks : tracks.filter(t => t.category_id === selectedCategory)
  const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count ?? 0), 0)

  /* ── Sidebar nav item ── */
  const NavItem = ({ id, label, icon: Icon }: { id: string; label: string; icon: React.ElementType }) => (
    <button
      className={`as2-nav-item ${activeNav === id ? 'as2-nav-item--active' : ''}`}
      onClick={() => { setActiveNav(id); setSidebarOpen(false) }}
    >
      <Icon size={15} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  )

  return (
    <>
      {/* ── Mobile overlay ── */}
      {sidebarOpen && <div className="as2-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="as2-shell">
        {/* ════ SIDEBAR ════ */}
        <aside className={`as2-sidebar ${sidebarOpen ? 'as2-sidebar--open' : ''}`}>
          {/* Brand */}
          <div className="as2-brand">
            <div className="as2-brand__logo"><Flame size={15} strokeWidth={2.5} /></div>
            <div>
              <div className="as2-brand__name">ALTER SOUND</div>
              <div className="as2-brand__sub">Member Portal</div>
            </div>
            <button className="as2-brand__close" onClick={() => setSidebarOpen(false)}><X size={14} /></button>
          </div>

          <nav className="as2-nav">
            {NAV.map(item => <NavItem key={item.id} {...item} />)}
          </nav>
        </aside>

        {/* ════ MAIN ════ */}
        <div className="as2-main">
          {/* Inner topbar (below DashboardNavbar) */}
          <div className="as2-inner-bar">
            <button className="as2-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <span className="as2-inner-bar__title">
              {NAV.find(n => n.id === activeNav)?.label ?? 'Dashboard'}
            </span>
            <button className="as2-inner-bar__bell" onClick={() => setActiveNav('announcements')} aria-label="Announcements">
              <Bell size={16} />
              {announcements.length > 0 && <span className="as2-bell-dot" />}
            </button>
          </div>

          {/* Content */}
          <div className="as2-content">
            <AnimatePresence mode="wait">

              {/* ── HOME ── */}
              {activeNav === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

                  {/* Hero banner */}
                  <div className="as2-hero">
                    <div className="as2-hero__glow" />
                    <div className="as2-hero__body">
                      <div className="as2-hero__eyebrow"><Flame size={11} /> Sound Ministry</div>
                      <h1 className="as2-hero__heading">Welcome back, {userName.split(' ')[0]}</h1>
                      <p className="as2-hero__sub">You are a consecrated servant releasing heaven&apos;s sound.</p>
                      <div className="as2-hero__actions">
                        <button className="as2-btn as2-btn--gold" onClick={() => setActiveNav('library')}>
                          <Volume2 size={13} /> Open Library
                        </button>
                        <button className="as2-btn as2-btn--ghost" onClick={() => setActiveNav('announcements')}>
                          <Bell size={13} /> Announcements
                        </button>
                      </div>
                    </div>
                    <div className="as2-hero__ornament"><Music2 size={110} strokeWidth={0.5} /></div>
                  </div>

                  {/* Stats row */}
                  <div className="as2-stats">
                    {[
                      { label: 'Total Tracks',   value: loading ? '—' : `${tracks.length}`,        icon: Music2,  color: '#a78bfa' },
                      { label: 'Total Plays',    value: loading ? '—' : `${totalPlays}`,            icon: Volume2, color: '#f5bb00' },
                      { label: 'Categories',     value: loading ? '—' : `${categories.length}`,    icon: Flame,   color: '#34d399' },
                      { label: 'Announcements',  value: loading ? '—' : `${announcements.length}`, icon: Bell,    color: '#60a5fa' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="as2-stat">
                        <div className="as2-stat__icon" style={{ background: color + '1a', color }}><Icon size={14} /></div>
                        <div>
                          <div className="as2-stat__value">{value}</div>
                          <div className="as2-stat__label">{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cards grid */}
                  <div className="as2-grid">
                    {/* Recent Tracks card */}
                    <div className="as2-card">
                      <div className="as2-card__head">
                        <span className="as2-card__title">Recent Tracks</span>
                        <button className="as2-card__link" onClick={() => setActiveNav('library')}>View all →</button>
                      </div>
                      <div className="as2-ann-list">
                        {loading ? (
                          <div className="as2-empty-inline">Loading…</div>
                        ) : tracks.length === 0 ? (
                          <div className="as2-empty-inline">No tracks available.</div>
                        ) : tracks.slice(0, 5).map(track => (
                          <div key={track.id} className="as2-ann-item">
                            <div className="as2-ann-item__dot" style={{ background: '#a78bfa' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="as2-ann-item__title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                              <div className="as2-ann-item__date">{track.play_count ?? 0} plays · {track.category?.name ?? 'Uncategorised'}</div>
                            </div>
                            <button
                              className="as2-like-btn"
                              onClick={() => handlePlay(track.id)}
                              style={{ marginLeft: '8px', flexShrink: 0, color: currentlyPlaying === track.id ? '#f5bb00' : undefined }}
                            >
                              {currentlyPlaying === track.id ? <Pause size={13} /> : <Play size={13} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Announcements card */}
                    <div className="as2-card">
                      <div className="as2-card__head">
                        <span className="as2-card__title">Announcements</span>
                        <button className="as2-card__link" onClick={() => setActiveNav('announcements')}>View all →</button>
                      </div>
                      <div className="as2-ann-list">
                        {announcements.length === 0 ? (
                          <div className="as2-empty-inline">No announcements yet.</div>
                        ) : announcements.slice(0, 4).map(ann => (
                          <div key={ann.id} className="as2-ann-item">
                            <div className="as2-ann-item__dot" />
                            <div>
                              <div className="as2-ann-item__title">{ann.title}</div>
                              <div className="as2-ann-item__date">{new Date(ann.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── LIBRARY ── */}
              {activeNav === 'library' && (
                <motion.div key="library" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="as2-section-head">
                    <h2 className="as2-section-title">Audio Library</h2>
                    <p className="as2-section-sub">Browse and play consecrated sound recordings.</p>
                  </div>

                  <div className="as2-filter-row">
                    <button className={`as2-filter-btn${selectedCategory === 'all' ? ' as2-filter-btn--active' : ''}`} onClick={() => setSelectedCategory('all')}>All Sound</button>
                    {categories.map(cat => (
                      <button key={cat.id} className={`as2-filter-btn${selectedCategory === cat.id ? ' as2-filter-btn--active' : ''}`} onClick={() => setSelectedCategory(cat.id)}>{cat.name}</button>
                    ))}
                  </div>

                  {loading ? (
                    <div className="as2-empty-state"><Music size={36} className="as2-empty-state__icon as2-pulse" /><p>Loading the sound library…</p></div>
                  ) : filteredTracks.length === 0 ? (
                    <div className="as2-empty-state"><Music size={36} className="as2-empty-state__icon" /><p>No tracks in this category.</p></div>
                  ) : (
                    <div className="as2-tracks-grid">
                      <AnimatePresence>
                        {filteredTracks.map((track, i) => {
                          const CatIcon = CATEGORY_ICONS[track.category?.name] ?? Music2
                          const isPlaying = currentlyPlaying === track.id
                          return (
                            <motion.div
                              key={track.id}
                              className={`as2-track-card${isPlaying ? ' as2-track-card--playing' : ''}`}
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.97 }}
                              transition={{ delay: i * 0.04 }}
                            >
                              <div className="as2-track-cover">
                                <img
                                  src={alterSoundApi.getCoverUrl(track.id)}
                                  alt={track.title}
                                  className="as2-track-cover__img"
                                  onError={e => { e.currentTarget.style.display = 'none'; const fb = e.currentTarget.nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex' }}
                                />
                                <div className="as2-track-cover__fallback" style={{ display: 'none' }}><CatIcon size={28} strokeWidth={1.2} /></div>
                                {isPlaying && <div className="as2-track-cover__eq"><span /><span /><span /><span /></div>}
                                <button className="as2-track-play-btn" onClick={() => handlePlay(track.id)} aria-label={isPlaying ? 'Pause' : 'Play'}>
                                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                              </div>
                              <div className="as2-track-info">
                                <div className="as2-track-info__title">{track.title}</div>
                                <div className="as2-track-info__artist">{track.artist ?? 'Alter Sound'}</div>
                                <div className="as2-track-info__meta">
                                  <span className="as2-pill as2-pill--dim">{track.category?.name}</span>
                                  <button className={`as2-like-btn${likedTracks.has(track.id) ? ' as2-like-btn--liked' : ''}`} onClick={() => toggleLike(track.id)} aria-label="Like"><Heart size={12} /></button>
                                  <span className="as2-track-info__plays">{track.play_count} plays</span>
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

              {/* ── ANNOUNCEMENTS ── */}
              {activeNav === 'announcements' && (
                <motion.div key="announcements" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="as2-section-head">
                    <h2 className="as2-section-title">Announcements</h2>
                    <p className="as2-section-sub">Messages and updates from ministry leadership.</p>
                  </div>

                  {announcements.length === 0 ? (
                    <div className="as2-empty-state"><Bell size={36} className="as2-empty-state__icon" /><p>No announcements at this time.</p></div>
                  ) : (
                    <div className="as2-ann-full-list">
                      {announcements.map((ann, i) => (
                        <motion.div
                          key={ann.id}
                          className="as2-ann-card"
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                        >
                          <div className="as2-ann-card__stripe" />
                          <div className="as2-ann-card__body">
                            <h3 className="as2-ann-card__title">{ann.title}</h3>
                            <p className="as2-ann-card__content">{ann.content}</p>
                            <div className="as2-ann-card__meta">
                              <Calendar size={11} />
                              <span>{new Date(ann.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

        /* ── Reset scoped to this page ── */
        .as2-shell *, .as2-shell *::before, .as2-shell *::after { box-sizing: border-box; }
        html, body { overflow-x: hidden; }

        /* ── Tokens ── */
        .as2-shell {
          --ink:        #140152;
          --gold:       #f5bb00;
          --gold-dim:   rgba(245,187,0,0.14);
          --dark:       #0c0a1a;
          --panel:      #0d0920;
          --text:       #f0eeff;
          --muted:      rgba(240,238,255,0.5);
          --hint:       rgba(240,238,255,0.3);
          --border:     rgba(255,255,255,0.07);
          --card:       rgba(255,255,255,0.04);
          --r:          14px;
          --rm:         8px;
          font-family: 'Outfit', sans-serif;

          display: flex;
          min-height: calc(100vh - 80px);
          height: calc(100vh - 80px);
          background: var(--dark);
          color: var(--text);
          position: relative;
          overflow: hidden;
        }

        /* ── Overlay ── */
        .as2-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 49;
        }

        /* ════ SIDEBAR ════ */
        .as2-sidebar {
          width: 210px;
          flex-shrink: 0;
          background: var(--panel);
          border-right: 0.5px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 80px;               /* below DashboardNavbar */
          left: 0;
          height: calc(100vh - 80px);
          overflow-y: auto;
          z-index: 50;
        }

        .as2-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 1.1rem 1rem;
          border-bottom: 0.5px solid var(--border);
        }
        .as2-brand__logo {
          width: 28px; height: 28px;
          background: var(--gold); color: var(--ink);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .as2-brand__name {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 11px;
          letter-spacing: 0.1em; color: #fff;
        }
        .as2-brand__sub { font-size: 9px; color: var(--hint); margin-top: 1px; }
        .as2-brand__close {
          display: none;
          margin-left: auto;
          background: none; border: none;
          color: var(--hint); cursor: pointer;
          padding: 2px;
        }
        .as2-brand__close:hover { color: #fff; }

        .as2-nav { padding: 0.6rem 0; flex: 1; }
        .as2-nav-item {
          display: flex; align-items: center; gap: 9px;
          width: 100%; padding: 0.5rem 1rem;
          font-size: 12.5px; color: var(--muted);
          background: none; border: none;
          border-left: 2px solid transparent;
          cursor: pointer; text-align: left;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .as2-nav-item:hover { color: #fff; background: rgba(255,255,255,0.03); }
        .as2-nav-item--active { color: #fff; background: var(--gold-dim); border-left-color: var(--gold); }

        /* ════ MAIN ════ */
        .as2-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: calc(100vh - 80px);
          margin-left: 210px;      /* offset for fixed sidebar */
          overflow: hidden;
        }

        /* Inner bar — sticky within the scrollable main column */
        .as2-inner-bar {
          display: flex; align-items: center; gap: 10px;
          padding: 0 1.25rem;
          height: 48px;
          border-bottom: 0.5px solid var(--border);
          background: rgba(13,9,32,0.85);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .as2-hamburger {
          display: none;
          background: none; border: none;
          color: var(--muted); cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }
        .as2-hamburger:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .as2-inner-bar__title {
          flex: 1;
          font-family: 'Syne', sans-serif;
          font-weight: 700; font-size: 13px;
          color: #fff;
        }
        .as2-inner-bar__bell {
          position: relative;
          width: 32px; height: 32px;
          border-radius: var(--rm);
          background: var(--card);
          border: 0.5px solid var(--border);
          color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .as2-inner-bar__bell:hover { color: #fff; background: rgba(255,255,255,0.07); }
        .as2-bell-dot {
          position: absolute; top: 6px; right: 6px;
          width: 5px; height: 5px;
          border-radius: 50%; background: var(--gold);
        }

        /* ════ CONTENT ════ */
        .as2-content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          max-width: 960px;
          width: 100%;
          margin: 0 auto;
        }

        /* ── Buttons ── */
        .as2-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: var(--rm);
          font-size: 12.5px; font-weight: 500;
          cursor: pointer; border: none;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .as2-btn--gold  { background: var(--gold); color: var(--ink); }
        .as2-btn--gold:hover { opacity: 0.88; }
        .as2-btn--ghost { background: rgba(255,255,255,0.07); color: var(--muted); border: 0.5px solid var(--border); }
        .as2-btn--ghost:hover { color: #fff; }

        /* ── Pills ── */
        .as2-pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 600; letter-spacing: 0.04em; white-space: nowrap; }
        .as2-pill--gold { background: var(--gold-dim); color: var(--gold); }
        .as2-pill--green { background: rgba(52,211,153,0.14); color: #34d399; }
        .as2-pill--dim  { background: rgba(255,255,255,0.06); color: var(--muted); }

        /* ════ HOME PAGE ════ */

        /* Hero banner */
        .as2-hero {
          position: relative;
          background: var(--ink);
          border: 0.5px solid rgba(245,187,0,0.22);
          border-radius: var(--r);
          padding: 2rem 2rem 2rem;
          margin-bottom: 1.25rem;
          overflow: hidden;
        }
        .as2-hero__glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 45%, rgba(245,187,0,0.09) 0%, transparent 65%);
          pointer-events: none;
        }
        .as2-hero__body { position: relative; z-index: 1; max-width: 500px; }
        .as2-hero__eyebrow {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 600; color: var(--gold);
          letter-spacing: 0.12em; text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .as2-hero__heading {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800;
          color: #fff; line-height: 1.1;
          margin-bottom: 0.5rem;
        }
        .as2-hero__sub {
          font-size: 13px; color: rgba(255,255,255,0.5);
          line-height: 1.55; margin-bottom: 1.25rem;
        }
        .as2-hero__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .as2-hero__ornament {
          position: absolute; right: -12px; top: 50%;
          transform: translateY(-50%);
          color: rgba(245,187,0,0.05);
          pointer-events: none;
        }

        /* Stats */
        .as2-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 1.25rem;
        }
        .as2-stat {
          background: var(--card);
          border: 0.5px solid var(--border);
          border-radius: var(--r);
          padding: 0.875rem 1rem;
          display: flex; align-items: center; gap: 10px;
          transition: border-color 0.2s;
        }
        .as2-stat:hover { border-color: rgba(245,187,0,0.2); }
        .as2-stat__icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .as2-stat__value { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #fff; line-height: 1; }
        .as2-stat__label { font-size: 10px; color: var(--hint); margin-top: 3px; }

        /* Cards grid */
        .as2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .as2-card {
          background: var(--card);
          border: 0.5px solid var(--border);
          border-radius: var(--r);
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .as2-card:hover { border-color: rgba(245,187,0,0.15); }
        .as2-card__head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 1rem;
          border-bottom: 0.5px solid var(--border);
        }
        .as2-card__title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #fff; }
        .as2-card__badge { font-size: 10px; color: var(--gold); background: var(--gold-dim); padding: 2px 8px; border-radius: 20px; font-weight: 600; }
        .as2-card__link { font-size: 10px; color: var(--muted); background: none; border: none; cursor: pointer; transition: color 0.15s; font-family: 'Outfit', sans-serif; }
        .as2-card__link:hover { color: var(--gold); }


        /* Announcement list (compact) */
        .as2-ann-list { padding: 0.4rem 1rem 0.875rem; }
        .as2-ann-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 0.45rem 0;
          border-bottom: 0.5px solid var(--border);
        }
        .as2-ann-item:last-child { border-bottom: none; }
        .as2-ann-item__dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--gold); margin-top: 5px; flex-shrink: 0;
        }
        .as2-ann-item__title { font-size: 12px; font-weight: 500; color: #fff; line-height: 1.4; }
        .as2-ann-item__date  { font-size: 10px; color: var(--hint); margin-top: 1px; }
        .as2-empty-inline { padding: 1rem; font-size: 12px; color: var(--hint); text-align: center; }

        /* ════ SECTION HEADER ════ */
        .as2-section-head { margin-bottom: 1.25rem; }
        .as2-section-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px; }
        .as2-section-sub   { font-size: 12.5px; color: var(--muted); }

        /* ════ LIBRARY ════ */
        .as2-filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .as2-filter-btn {
          padding: 5px 13px; border-radius: 20px;
          font-size: 11.5px; font-weight: 500;
          background: var(--card); border: 0.5px solid var(--border);
          color: var(--muted); cursor: pointer;
          transition: all 0.15s; font-family: 'Outfit', sans-serif;
        }
        .as2-filter-btn:hover { color: #fff; }
        .as2-filter-btn--active { background: var(--gold); border-color: var(--gold); color: var(--ink); font-weight: 600; }

        .as2-tracks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
        .as2-track-card {
          background: var(--card);
          border: 0.5px solid var(--border);
          border-radius: var(--r);
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .as2-track-card:hover { border-color: rgba(245,187,0,0.3); transform: translateY(-2px); }
        .as2-track-card--playing { border-color: var(--gold) !important; }

        .as2-track-cover {
          position: relative; aspect-ratio: 1;
          background: linear-gradient(135deg, var(--ink) 0%, #2d1f6e 100%);
        }
        .as2-track-cover__img { width: 100%; height: 100%; object-fit: cover; }
        .as2-track-cover__fallback {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(245,187,0,0.3);
        }
        .as2-track-play-btn {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.35);
          opacity: 0; color: #fff; border: none; cursor: pointer;
          transition: opacity 0.2s;
        }
        .as2-track-card:hover .as2-track-play-btn,
        .as2-track-card--playing .as2-track-play-btn { opacity: 1; }
        .as2-track-play-btn svg {
          width: 34px; height: 34px;
          background: var(--gold); color: var(--ink);
          border-radius: 50%; padding: 7px;
        }
        .as2-track-cover__eq {
          position: absolute; bottom: 8px; left: 8px;
          display: flex; align-items: flex-end; gap: 2px;
        }
        .as2-track-cover__eq span {
          display: block; width: 3px; border-radius: 2px;
          background: var(--gold);
          animation: as2-eq 0.8s ease-in-out infinite alternate;
        }
        .as2-track-cover__eq span:nth-child(1) { height: 8px;  animation-delay: 0s;     }
        .as2-track-cover__eq span:nth-child(2) { height: 14px; animation-delay: 0.15s;  }
        .as2-track-cover__eq span:nth-child(3) { height: 10px; animation-delay: 0.3s;   }
        .as2-track-cover__eq span:nth-child(4) { height: 16px; animation-delay: 0.45s;  }
        @keyframes as2-eq { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }

        .as2-track-info { padding: 0.75rem; }
        .as2-track-info__title  { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .as2-track-info__artist { font-size: 11px; color: var(--muted); margin-bottom: 7px; }
        .as2-track-info__meta   { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .as2-track-info__plays  { font-size: 10px; color: var(--hint); margin-left: auto; }

        .as2-like-btn { background: none; border: none; color: var(--hint); cursor: pointer; display: flex; align-items: center; transition: color 0.15s, transform 0.15s; padding: 0; }
        .as2-like-btn:hover { color: #f87171; transform: scale(1.2); }
        .as2-like-btn--liked { color: #f87171; }

        /* ════ ANNOUNCEMENTS FULL ════ */
        .as2-ann-full-list { display: flex; flex-direction: column; gap: 10px; }
        .as2-ann-card {
          display: flex;
          background: var(--card);
          border: 0.5px solid var(--border);
          border-radius: var(--r);
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .as2-ann-card:hover { border-color: rgba(245,187,0,0.2); }
        .as2-ann-card__stripe { width: 4px; flex-shrink: 0; background: var(--gold); }
        .as2-ann-card__body { padding: 1rem 1.25rem; flex: 1; }
        .as2-ann-card__title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .as2-ann-card__content { font-size: 12.5px; color: var(--muted); line-height: 1.55; margin-bottom: 10px; }
        .as2-ann-card__meta { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--hint); }

        /* ════ EMPTY STATE ════ */
        .as2-empty-state { text-align: center; padding: 4rem 2rem; color: var(--hint); font-size: 13px; }
        .as2-empty-state__icon { color: rgba(245,187,0,0.3); margin: 0 auto 1rem; display: block; }
        .as2-pulse { animation: as2-pulse 1.5s ease-in-out infinite; }
        @keyframes as2-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }

        /* ── Custom scrollbar ── */
        .as2-content::-webkit-scrollbar { width: 4px; }
        .as2-content::-webkit-scrollbar-track { background: transparent; }
        .as2-content::-webkit-scrollbar-thumb {
          background: rgba(245,187,0,0.25);
          border-radius: 99px;
          transition: background 0.2s;
        }
        .as2-content::-webkit-scrollbar-thumb:hover { background: rgba(245,187,0,0.55); }
        .as2-content { scrollbar-width: thin; scrollbar-color: rgba(245,187,0,0.25) transparent; }

        /* ════ RESPONSIVE ════ */
        @media (max-width: 900px) {
          .as2-stats { grid-template-columns: repeat(2, 1fr); }
          .as2-grid  { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .as2-sidebar {
            left: -210px;
            transition: left 0.25s ease;
          }
          .as2-sidebar--open { left: 0; }
          .as2-main { margin-left: 0; }
          .as2-hamburger { display: flex; }
          .as2-brand__close { display: block; }
          .as2-tracks-grid { grid-template-columns: repeat(2, 1fr); }
          .as2-hero__ornament { display: none; }
          .as2-content { padding: 1rem; }
          .as2-hero { padding: 1.25rem; }
          .as2-hero__heading { font-size: 22px; }
        }
        @media (max-width: 480px) {
          .as2-stats { grid-template-columns: 1fr 1fr; }
          .as2-tracks-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </>
  )
}

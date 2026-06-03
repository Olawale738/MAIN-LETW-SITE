'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ServicePageLayout from '@/components/shared/ServicePageLayout'
import {
  Check, Flame, BookOpen, ChevronDown, ChevronUp, Star, Trophy, Quote,
  Search, X, Share2, CheckCheck, PenLine, Award, Target, Zap,
  Calendar, Clock, Bookmark, BookmarkCheck, Heart, TrendingUp, TrendingDown,
  Bell, BellRing, Sun, Sparkles, Users, MessageCircle, Loader2, CheckCircle2,
  HandHeart, Video, Phone, UserCheck, ArrowRight
} from 'lucide-react'
import { bibleReadingApi, bibleStudyApi, serviceRequestApi, QuarterlyTheme, WeekReflection } from '@/lib/api'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface WeekContent {
  verse: string
  ref: string
  reflection: string
}

// ─── Quarter definitions ────────────────────────────────────────────────────────
const QUARTERS = [
  {
    id: 1,
    title: 'Origins & The King',
    theme: 'The Cost of Discipleship',
    scripture: 'Luke 14:27–35',
    accent: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    weeks: [1, 13] as [number, number],
  },
  {
    id: 2,
    title: 'Redemption & Ministry',
    theme: 'Fruitfulness Through Christ',
    scripture: 'John 15:16',
    accent: '#0284c7',
    bg: '#e0f2fe',
    border: '#bae6fd',
    weeks: [14, 27] as [number, number],
  },
  {
    id: 3,
    title: 'Law & the Spirit',
    theme: 'The Sustaining Power of the Holy Spirit',
    scripture: 'Acts 1:8',
    accent: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    weeks: [28, 40] as [number, number],
  },
  {
    id: 4,
    title: 'Covenant & the Church',
    theme: 'Enter into His Rest',
    scripture: 'Hebrews 11:24–26',
    accent: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    weeks: [41, 54] as [number, number],
  },
]

const WEEK_CONTENT: Record<number, WeekContent> = {
  1: {
    verse: 'In the beginning God created the heavens and the earth.',
    ref: 'Genesis 1:1',
    reflection: 'You are beginning your greatest journey. The God who spoke the universe into existence invites you into His story. What does it mean that He is the origin of all things — including you?',
  },
  7: {
    verse: '"I am the LORD who brought you out of Ur of the Chaldeans to give you this land."',
    ref: 'Genesis 15:7',
    reflection: "God calls and then confirms. Abraham left without seeing the destination. What promise are you holding onto that hasn't fully materialized yet?",
  },
  13: {
    verse: '"You intended to harm me, but God intended it for good."',
    ref: 'Genesis 50:20',
    reflection: "Joseph's story closes with one of the most powerful declarations in Scripture. What story of betrayal in your own life might God be redeeming for a greater good?",
  },
  14: {
    verse: '"I AM WHO I AM."',
    ref: 'Exodus 3:14',
    reflection: 'Moses asked for a name. God gave an identity. He is the self-existent, eternal God. How does this name — I AM — change the way you pray?',
  },
  23: {
    verse: '"Be holy because I, the LORD your God, am holy."',
    ref: 'Leviticus 19:2',
    reflection: "Holiness is not restriction — it is an invitation. God is calling you into His nature, not just His rules. What would your week look like if you filtered every decision through 'is this holy?'",
  },
  27: {
    verse: '"The LORD bless you and keep you; the LORD make his face shine on you."',
    ref: 'Numbers 6:24–25',
    reflection: 'Even in the middle of the wilderness census of Numbers, God pauses to bless His people. Let this priestly blessing rest on you today.',
  },
  28: {
    verse: '"Very truly I tell you, whoever believes in me will do the works I have been doing."',
    ref: 'John 14:12',
    reflection: "The Gospel of John is the Gospel of belief. As you enter Q3, ask yourself: what does it truly mean to believe? Not just agree — but trust, obey, and depend?",
  },
  33: {
    verse: '"You will receive power when the Holy Spirit comes on you."',
    ref: 'Acts 1:8',
    reflection: 'The book of Acts is the story of the Spirit-empowered church. You are not reading history — you are reading your inheritance. Are you living in the power described here?',
  },
  40: {
    verse: '"Love the LORD your God with all your heart."',
    ref: 'Deuteronomy 6:5',
    reflection: "Deuteronomy is Moses' final sermon — the whole law compressed into love. Jesus called this the greatest commandment. Is love the filter through which you obey?",
  },
  41: {
    verse: '"Be strong and courageous. Do not be afraid; do not be discouraged."',
    ref: 'Joshua 1:9',
    reflection: 'You are entering Q4 — the home stretch. Joshua crossed over into the promised land. What "crossing over" is God calling you to make in this final quarter?',
  },
  48: {
    verse: '"If I speak in the tongues of men or of angels, but do not have love, I am only a resounding gong."',
    ref: '1 Corinthians 13:1',
    reflection: "Paul's famous love chapter interrupts a letter about spiritual gifts. Why? Because gifts without love are noise. What spiritual activity in your life needs more love behind it?",
  },
  54: {
    verse: '"To him who is able to keep you from stumbling... be glory, majesty, power and authority."',
    ref: 'Jude 1:24–25',
    reflection: 'You made it. 54 weeks of Scripture. You have walked from Genesis to the New Testament epistles. The God who started this journey in you will complete it. Give Him glory today.',
  },
}

function getWeekContent(week: number, oldTestament: string): WeekContent {
  if (WEEK_CONTENT[week]) return WEEK_CONTENT[week]
  if (oldTestament.startsWith('Genesis'))
    return { verse: 'So God created mankind in his own image.', ref: 'Genesis 1:27', reflection: 'You are reading your origin story. You were not an accident — you were crafted by a Creator who stamped His own image onto you. How does that truth change the way you see yourself today?' }
  if (oldTestament.startsWith('Exodus'))
    return { verse: 'The LORD will fight for you; you need only to be still.', ref: 'Exodus 14:14', reflection: 'The God of Exodus is the Great Deliverer — He has not changed. What battle are you carrying that He is asking you to lay down and let Him fight?' }
  if (oldTestament.startsWith('Leviticus'))
    return { verse: 'For the life of a creature is in the blood.', ref: 'Leviticus 17:11', reflection: 'Leviticus is the book of atonement. Every sacrifice points forward to the cross. As you read each ritual, ask: how is this pointing me to Jesus?' }
  if (oldTestament.startsWith('Numbers'))
    return { verse: 'The LORD is slow to anger, abounding in love.', ref: 'Numbers 14:18', reflection: 'Israel complained in the wilderness — and God was patient. Where in your own journey are you complaining instead of trusting? Let His patience soften you.' }
  if (oldTestament.startsWith('Deuteronomy'))
    return { verse: 'Remember how the LORD your God led you all the way in the wilderness.', ref: 'Deuteronomy 8:2', reflection: 'Deuteronomy calls Israel to remember. Memory is a spiritual discipline. Take a moment to remember how God has led you — even through your own wildernesses.' }
  if (oldTestament.startsWith('Joshua'))
    return { verse: 'Every place that the sole of your foot will tread upon I have given to you.', ref: 'Joshua 1:3', reflection: 'Joshua is a book of possession — stepping into what God has already promised. What promise of God are you not yet walking in? This week, take a step.' }
  return { verse: 'Your word is a lamp for my feet, a light on my path.', ref: 'Psalm 119:105', reflection: 'The Word you are reading this week is not ancient history — it is a living lamp. Ask God: what specific truth is He illuminating for you in this passage today?' }
}

const READING_PLAN = [
  { week: 1, oldTestament: 'Genesis 1–3', newTestament: 'Matthew 1–2' },
  { week: 2, oldTestament: 'Genesis 4–7', newTestament: 'Matthew 3–4' },
  { week: 3, oldTestament: 'Genesis 8–11', newTestament: 'Matthew 5–7' },
  { week: 4, oldTestament: 'Genesis 12–15', newTestament: 'Matthew 8–10' },
  { week: 5, oldTestament: 'Genesis 16–19', newTestament: 'Matthew 11–13' },
  { week: 6, oldTestament: 'Genesis 20–23', newTestament: 'Matthew 14–16' },
  { week: 7, oldTestament: 'Genesis 24–27', newTestament: 'Matthew 17–19' },
  { week: 8, oldTestament: 'Genesis 28–31', newTestament: 'Matthew 20–22' },
  { week: 9, oldTestament: 'Genesis 32–35', newTestament: 'Matthew 23–25' },
  { week: 10, oldTestament: 'Genesis 36–39', newTestament: 'Matthew 26–28' },
  { week: 11, oldTestament: 'Genesis 40–43', newTestament: 'Mark 1–3' },
  { week: 12, oldTestament: 'Genesis 44–47', newTestament: 'Mark 4–6' },
  { week: 13, oldTestament: 'Genesis 48–50', newTestament: 'Mark 7–9' },
  { week: 14, oldTestament: 'Exodus 1–4', newTestament: 'Mark 10–12' },
  { week: 15, oldTestament: 'Exodus 5–8', newTestament: 'Mark 13–16' },
  { week: 16, oldTestament: 'Exodus 9–12', newTestament: 'Luke 1–3' },
  { week: 17, oldTestament: 'Exodus 13–16', newTestament: 'Luke 4–6' },
  { week: 18, oldTestament: 'Exodus 17–20', newTestament: 'Luke 7–9' },
  { week: 19, oldTestament: 'Exodus 21–24', newTestament: 'Luke 10–12' },
  { week: 20, oldTestament: 'Exodus 25–28', newTestament: 'Luke 13–15' },
  { week: 21, oldTestament: 'Exodus 29–32', newTestament: 'Luke 16–18' },
  { week: 22, oldTestament: 'Exodus 33–36', newTestament: 'Luke 19–21' },
  { week: 23, oldTestament: 'Exodus 37–40', newTestament: 'Luke 22–24' },
  { week: 24, oldTestament: 'Leviticus 1–4', newTestament: 'John 1–3' },
  { week: 25, oldTestament: 'Leviticus 5–8', newTestament: 'John 4–6' },
  { week: 26, oldTestament: 'Leviticus 9–12', newTestament: 'John 7–9' },
  { week: 27, oldTestament: 'Leviticus 13–16', newTestament: 'John 10–12' },
  { week: 28, oldTestament: 'Leviticus 17–20', newTestament: 'John 13–15' },
  { week: 29, oldTestament: 'Leviticus 21–24', newTestament: 'John 16–18' },
  { week: 30, oldTestament: 'Leviticus 25–27', newTestament: 'John 19–21' },
  { week: 31, oldTestament: 'Numbers 1–4', newTestament: 'Acts 1–3' },
  { week: 32, oldTestament: 'Numbers 5–8', newTestament: 'Acts 4–6' },
  { week: 33, oldTestament: 'Numbers 9–12', newTestament: 'Acts 7–9' },
  { week: 34, oldTestament: 'Numbers 13–16', newTestament: 'Acts 10–12' },
  { week: 35, oldTestament: 'Numbers 17–20', newTestament: 'Acts 13–15' },
  { week: 36, oldTestament: 'Numbers 21–24', newTestament: 'Acts 16–18' },
  { week: 37, oldTestament: 'Numbers 25–28', newTestament: 'Acts 19–21' },
  { week: 38, oldTestament: 'Numbers 29–32', newTestament: 'Acts 22–24' },
  { week: 39, oldTestament: 'Numbers 33–36', newTestament: 'Acts 25–28' },
  { week: 40, oldTestament: 'Deuteronomy 1–4', newTestament: 'Romans 1–3' },
  { week: 41, oldTestament: 'Deuteronomy 5–8', newTestament: 'Romans 4–6' },
  { week: 42, oldTestament: 'Deuteronomy 9–12', newTestament: 'Romans 7–9' },
  { week: 43, oldTestament: 'Deuteronomy 13–16', newTestament: 'Romans 10–12' },
  { week: 44, oldTestament: 'Deuteronomy 17–20', newTestament: 'Romans 13–16' },
  { week: 45, oldTestament: 'Deuteronomy 21–24', newTestament: '1 Corinthians 1–4' },
  { week: 46, oldTestament: 'Deuteronomy 25–28', newTestament: '1 Corinthians 5–8' },
  { week: 47, oldTestament: 'Deuteronomy 29–32', newTestament: '1 Corinthians 9–12' },
  { week: 48, oldTestament: 'Deuteronomy 33–34, Joshua 1–2', newTestament: '1 Corinthians 13–16' },
  { week: 49, oldTestament: 'Joshua 3–6', newTestament: '2 Corinthians 1–4' },
  { week: 50, oldTestament: 'Joshua 7–10', newTestament: '2 Corinthians 5–8' },
  { week: 51, oldTestament: 'Joshua 11–14', newTestament: '2 Corinthians 9–13' },
  { week: 52, oldTestament: 'Joshua 15–18', newTestament: 'Galatians 1–3' },
  { week: 53, oldTestament: 'Joshua 19–22', newTestament: 'Galatians 4–6' },
  { week: 54, oldTestament: 'Joshua 23–24, Judges 1–2', newTestament: 'Ephesians 1–6' },
]
const TOTAL_WEEKS = READING_PLAN.length

function getQuarterForWeek(week: number) {
  return QUARTERS.find((q) => week >= q.weeks[0] && week <= q.weeks[1]) ?? QUARTERS[0]
}

// ─── Milestone definitions ──────────────────────────────────────────────────────
const MILESTONES = [
  { weeks: 5,  label: 'First Steps',    emoji: '🌱', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { weeks: 13, label: 'Q1 Champion',    emoji: '🥇', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { weeks: 27, label: 'Halfway Hero',   emoji: '⚡', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { weeks: 40, label: 'Q3 Conqueror',   emoji: '🔥', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { weeks: 54, label: 'Bible Finisher', emoji: '🏆', color: '#f5bb00', bg: '#fefce8', border: '#fde68a' },
]

// ─── Verse of the Day pool ───────────────────────────────────────────────────────
const DAILY_VERSES = [
  { verse: 'Your word is a lamp for my feet, a light on my path.', ref: 'Psalm 119:105' },
  { verse: 'Trust in the LORD with all your heart and lean not on your own understanding.', ref: 'Proverbs 3:5' },
  { verse: 'I can do all this through him who gives me strength.', ref: 'Philippians 4:13' },
  { verse: 'Be strong and courageous. Do not be afraid; the LORD your God will be with you.', ref: 'Joshua 1:9' },
  { verse: 'The LORD is my shepherd, I lack nothing.', ref: 'Psalm 23:1' },
  { verse: 'And we know that in all things God works for the good of those who love him.', ref: 'Romans 8:28' },
  { verse: 'Come to me, all you who are weary and burdened, and I will give you rest.', ref: 'Matthew 11:28' },
  { verse: 'For I know the plans I have for you, declares the LORD, plans to prosper you.', ref: 'Jeremiah 29:11' },
  { verse: 'But those who hope in the LORD will renew their strength.', ref: 'Isaiah 40:31' },
  { verse: 'This is the day the LORD has made; let us rejoice and be glad in it.', ref: 'Psalm 118:24' },
  { verse: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7' },
  { verse: 'The name of the LORD is a fortified tower; the righteous run to it and are safe.', ref: 'Proverbs 18:10' },
  { verse: 'Delight yourself in the LORD, and he will give you the desires of your heart.', ref: 'Psalm 37:4' },
  { verse: 'Let everything that has breath praise the LORD.', ref: 'Psalm 150:6' },
]

interface SavedVerse { verse: string; ref: string; week?: number; savedAt: string }
const SAVED_VERSES_KEY = 'bibleReadingSavedVerses'
const START_DATE_KEY = 'bibleReadingStartDate'
const REMINDER_KEY = 'bibleReadingReminderDay'
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── Verse of the Day Card ───────────────────────────────────────────────────────
function VerseOfTheDay() {
  const todayVerse = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    return DAILY_VERSES[dayOfYear % DAILY_VERSES.length]
  }, [])

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden p-6 md:p-8 border"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#fde68a' }}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#f5bb00] rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#f5bb00] flex items-center justify-center">
            <Sun className="w-4 h-4 text-[#140152]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309]">Verse of the Day</span>
        </div>
        <p className="text-[#140152] text-xl md:text-2xl font-bold leading-relaxed mb-2">&ldquo;{todayVerse.verse}&rdquo;</p>
        <p className="text-[#b45309] font-bold text-sm">— {todayVerse.ref}</p>
      </div>
    </motion.div>
  )
}

// ─── Circular SVG Progress Ring ─────────────────────────────────────────────────
function CircularProgress({ pct }: { pct: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  return (
    <div className="relative w-44 h-44 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#140152" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#f5bb00" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
        {/* Progress arc */}
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="url(#prog-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.4 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-black text-white leading-none"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        >
          {pct}%
        </motion.span>
        <span className="text-[11px] text-white/50 font-semibold uppercase tracking-wider mt-1">done</span>
      </div>
    </div>
  )
}

// ─── Per-Week Notes ─────────────────────────────────────────────────────────────
function WeekNotes({ week }: { week: number }) {
  const storageKey = `bibleNote_w${week}`
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setNote(localStorage.getItem(storageKey) ?? '')
  }, [storageKey])

  const handleSave = () => {
    localStorage.setItem(storageKey, note)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasNote = note.trim().length > 0

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-white/60 hover:text-white/90 transition-colors font-semibold mt-1"
      >
        <PenLine className="w-3.5 h-3.5" />
        {open ? 'Hide Notes' : hasNote ? 'View My Notes' : 'Add Personal Notes'}
        {hasNote && !open && <span className="w-2 h-2 bg-[#f5bb00] rounded-full animate-pulse" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mt-3"
          >
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Write your thoughts, prayers, or key takeaways from this week's reading..."
              rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white/90 placeholder-white/30 resize-none focus:outline-none focus:border-[#f5bb00]/60 transition-colors font-light leading-relaxed"
            />
            <button
              onClick={handleSave}
              className="mt-2 text-xs font-bold px-5 py-2 bg-[#f5bb00] text-[#140152] rounded-xl hover:bg-yellow-400 transition-colors flex items-center gap-2"
            >
              {saved ? <><CheckCheck className="w-3.5 h-3.5" /> Saved!</> : 'Save Note'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Share Progress Button ───────────────────────────────────────────────────────
function ShareProgress({ week, pct }: { week: number; pct: number }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const msg = `📖 I'm on Week ${week} of 54 in the LETW 2026 Bible Reading Plan! ${pct}% complete and going strong 🔥 #LightEncounterTabernacle`
    try {
      await navigator.clipboard.writeText(msg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard unavailable; silently fail
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all text-sm font-semibold group"
    >
      {copied
        ? <><CheckCheck className="w-4 h-4 text-[#f5bb00]" /> Copied to clipboard!</>
        : <><Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Share Progress</>
      }
    </button>
  )
}

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-sm border"
      style={{ borderColor: color + '40' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-xl font-black text-[#140152] leading-none">{value}</div>
        <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
      </div>
    </motion.div>
  )
}

// ─── This Week Hero ─────────────────────────────────────────────────────────────
function ThisWeekHero({
  weekData, content, quarter, isCompleted, onToggle, registered, onRegister,
  isBookmarked, onBookmark, progressPct,
}: {
  weekData: typeof READING_PLAN[0]
  content: WeekContent
  quarter: typeof QUARTERS[0]
  isCompleted: boolean
  onToggle: () => void
  registered: boolean
  onRegister: () => void
  isBookmarked: boolean
  onBookmark: () => void
  progressPct: number
}) {
  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden"
      style={{ background: `linear-gradient(135deg, #140152 0%, #1a0270 40%, ${quarter.accent}cc 100%)` }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: quarter.accent }} />
      <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full opacity-10 blur-2xl pointer-events-none bg-[#f5bb00]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none bg-white" />

      <div className="relative z-10 p-8 md:p-12">
        {/* Quarter badge */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ background: quarter.accent + '30', color: '#f5bb00', border: `1px solid ${quarter.accent}60` }}>
            Quarter {quarter.id} · {quarter.title}
          </span>
          <span className="text-white/40 text-xs font-medium">{quarter.scripture}</span>
          <span className="ml-auto flex items-center gap-1.5 text-white/40 text-xs">
            <Clock className="w-3.5 h-3.5" /> ~15 min this week
          </span>
        </div>

        {/* Week label */}
        <div className="text-white/50 text-sm font-semibold uppercase tracking-widest mb-3">
          {isCompleted ? '✓ This Week — Completed' : 'This Week — Your Reading'}
        </div>

        {/* Passages */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
            <div className="text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-2">Old Testament</div>
            <div className="text-white text-2xl font-black">{weekData.oldTestament}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
            <div className="text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-2">New Testament</div>
            <div className="text-white text-2xl font-black">{weekData.newTestament}</div>
          </div>
        </div>

        {/* Key verse */}
        <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 relative">
          <Quote className="absolute top-4 left-4 w-6 h-6 text-[#f5bb00]/30" />
          {registered && (
            <button
              onClick={onBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Save this verse'}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: isBookmarked ? '#f5bb00' : 'rgba(255,255,255,0.12)' }}
            >
              {isBookmarked
                ? <BookmarkCheck className="w-4.5 h-4.5 text-[#140152]" />
                : <Bookmark className="w-4.5 h-4.5 text-white/70" />}
            </button>
          )}
          <p className="text-white/90 text-lg leading-relaxed font-light italic pl-6 mb-3 pr-10">
            &ldquo;{content.verse}&rdquo;
          </p>
          <p className="text-[#f5bb00] text-sm font-bold pl-6">— {content.ref}</p>
        </div>

        {/* Reflection */}
        <div className="bg-black/20 rounded-2xl p-5 mb-8 border border-white/5">
          <div className="text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Star className="w-3.5 h-3.5" /> Reflect on This
          </div>
          <p className="text-white/75 leading-relaxed text-sm">{content.reflection}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {!registered ? (
            <button onClick={onRegister}
              className="bg-[#f5bb00] text-[#140152] font-black text-base px-8 py-4 rounded-2xl hover:bg-yellow-400 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]">
              Begin My Journey →
            </button>
          ) : (
            <button onClick={onToggle}
              className={`font-black text-base px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] flex items-center gap-3 ${
                isCompleted
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-[#f5bb00] text-[#140152] hover:bg-yellow-400'
              }`}>
              {isCompleted
                ? <><Check className="w-5 h-5" /> Mark as Unread</>
                : <><BookOpen className="w-5 h-5" /> Mark Week {weekData.week} as Read</>
              }
            </button>
          )}
          {registered && (
            <ShareProgress week={weekData.week} pct={progressPct} />
          )}
        </div>

        {/* Notes */}
        {registered && <WeekNotes week={weekData.week} />}
      </div>
    </motion.div>
  )
}

// ─── Week Card ──────────────────────────────────────────────────────────────────
function WeekCard({
  entry, isCompleted, isCurrent, quarterAccent, registered, onToggle,
}: {
  entry: typeof READING_PLAN[0]
  isCompleted: boolean
  isCurrent: boolean
  quarterAccent: string
  registered: boolean
  onToggle: () => void
}) {
  const hasNote = typeof window !== 'undefined' && !!localStorage.getItem(`bibleNote_w${entry.week}`)

  return (
    <div
      className={`relative rounded-2xl p-4 border transition-all duration-300 group cursor-default ${
        isCompleted
          ? 'bg-emerald-50 border-emerald-200'
          : isCurrent
          ? 'bg-white border-[#f5bb00] shadow-lg'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }`}
      style={isCurrent ? { boxShadow: '0 0 0 2px #f5bb00, 0 8px 24px rgba(245,187,0,0.15)' } : {}}
    >
      {/* Current pulse dot */}
      {isCurrent && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5bb00] opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#f5bb00]" />
        </span>
      )}

      {/* Note indicator */}
      {hasNote && !isCurrent && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-[#f5bb00] rounded-full" title="Has note" />
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
            Week {entry.week}
          </div>
          {isCurrent && (
            <span className="text-[10px] font-bold text-[#f5bb00] bg-[#f5bb00]/10 px-2 py-0.5 rounded-full">
              Start here →
            </span>
          )}
        </div>
        {registered && (
          <button
            onClick={onToggle}
            aria-label={isCompleted ? 'Mark as unread' : 'Mark as read'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200 hover:scale-110 ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            {isCompleted && <Check className="w-4 h-4" strokeWidth={3} />}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="text-xs text-gray-500 flex items-start gap-1.5">
          <span className="font-semibold text-gray-400 shrink-0">OT</span>
          <span className={`font-medium ${isCompleted ? 'text-emerald-700' : 'text-gray-700'}`}>{entry.oldTestament}</span>
        </div>
        <div className="text-xs text-gray-500 flex items-start gap-1.5">
          <span className="font-semibold text-gray-400 shrink-0">NT</span>
          <span className={`font-medium ${isCompleted ? 'text-emerald-700' : 'text-gray-700'}`}>{entry.newTestament}</span>
        </div>
      </div>

      {/* Reading time */}
      <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-400">
        <Clock className="w-3 h-3" /> ~15 min
      </div>
    </div>
  )
}

// ─── Quarter Section ────────────────────────────────────────────────────────────
function QuarterSection({
  quarter, weeks, completed, currentWeek, registered, onToggle,
}: {
  quarter: typeof QUARTERS[0]
  weeks: typeof READING_PLAN
  completed: Record<number, boolean>
  currentWeek: number
  registered: boolean
  onToggle: (week: number) => void
}) {
  const completedInQuarter = weeks.filter((w) => completed[w.week]).length
  const totalInQuarter = weeks.length
  const pct = Math.round((completedInQuarter / totalInQuarter) * 100)
  const isFinished = completedInQuarter === totalInQuarter
  const [open, setOpen] = useState(() => weeks.some((w) => w.week === currentWeek))

  return (
    <motion.div
      className="rounded-3xl overflow-hidden border"
      style={{ borderColor: quarter.border }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left transition-all hover:opacity-90"
        style={{ background: quarter.bg }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
            style={{ background: quarter.accent }}>
            Q{quarter.id}
          </div>
          <div>
            <div className="font-black text-[#140152] text-lg leading-tight">{quarter.title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{quarter.theme}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            {isFinished && (
              <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                <Trophy className="w-4 h-4" /> Complete!
              </span>
            )}
            <div className="w-28 bg-white rounded-full h-2.5 overflow-hidden border border-gray-200">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ background: quarter.accent }}
              />
            </div>
            <span className="text-sm font-bold text-gray-500 w-20 text-right">{completedInQuarter}/{totalInQuarter} weeks</span>
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Scripture tag */}
      {open && (
        <div className="px-6 py-3 text-xs font-semibold flex items-center gap-2" style={{ background: quarter.accent + '12', color: quarter.accent }}>
          <span className="italic">Theme: &ldquo;{quarter.theme}&rdquo;</span>
          <span className="opacity-60">·</span>
          <span>{quarter.scripture}</span>
        </div>
      )}

      {/* Week cards */}
      {open && (
        <div className="p-6 bg-[#fafafa]">
          {/* Mobile progress bar */}
          <div className="md:hidden mb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-semibold">{completedInQuarter} of {totalInQuarter} weeks</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: quarter.accent }} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {weeks.map((entry) => (
              <WeekCard
                key={entry.week}
                entry={entry}
                isCompleted={!!completed[entry.week]}
                isCurrent={entry.week === currentWeek}
                quarterAccent={quarter.accent}
                registered={registered}
                onToggle={() => onToggle(entry.week)}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Search Results ─────────────────────────────────────────────────────────────
function SearchResults({
  results, completed, currentWeek, registered, onToggle,
}: {
  results: typeof READING_PLAN
  completed: Record<number, boolean>
  currentWeek: number
  registered: boolean
  onToggle: (week: number) => void
}) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No weeks found for that search.</p>
        <p className="text-sm text-gray-400 mt-1">Try searching for a book name like &ldquo;Genesis&rdquo; or &ldquo;Acts&rdquo;</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {results.map((entry) => {
        const quarter = getQuarterForWeek(entry.week)
        return (
          <motion.div key={entry.week} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
            <WeekCard
              entry={entry}
              isCompleted={!!completed[entry.week]}
              isCurrent={entry.week === currentWeek}
              quarterAccent={quarter.accent}
              registered={registered}
              onToggle={() => onToggle(entry.week)}
            />
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Reading Pace Card ───────────────────────────────────────────────────────────
function PaceCard({ completedCount, startDate }: { completedCount: number; startDate: string | null }) {
  if (!startDate) return null
  const weeksSinceStart = Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / (7 * 86400000)) + 1)
  const expected = Math.min(weeksSinceStart, TOTAL_WEEKS)
  const diff = completedCount - expected
  const onTrack = diff >= 0
  const finished = completedCount >= TOTAL_WEEKS

  return (
    <motion.div
      className="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4"
      style={{ borderColor: finished ? '#a7f3d0' : onTrack ? '#bae6fd' : '#fde68a' }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: finished ? '#ecfdf5' : onTrack ? '#e0f2fe' : '#fffbeb' }}>
        {finished ? <Trophy className="w-6 h-6 text-emerald-600" />
          : onTrack ? <TrendingUp className="w-6 h-6 text-sky-600" />
          : <TrendingDown className="w-6 h-6 text-amber-600" />}
      </div>
      <div className="flex-1">
        <div className="font-black text-[#140152]">
          {finished ? 'Plan Complete! 🎉'
            : onTrack
              ? (diff === 0 ? 'Right on schedule!' : `${diff} week${diff !== 1 ? 's' : ''} ahead 🔥`)
              : `${Math.abs(diff)} week${Math.abs(diff) !== 1 ? 's' : ''} behind`}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {finished ? 'You read through the entire plan. Well done!'
            : `Week ${expected} of your schedule · ${completedCount} completed`}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Reading Reminder ────────────────────────────────────────────────────────────
function ReminderCard({ day, onSet }: { day: number | null; onSet: (d: number | null) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-xl bg-[#140152]/5 flex items-center justify-center flex-shrink-0">
          {day !== null ? <BellRing className="w-5 h-5 text-[#f5bb00]" /> : <Bell className="w-5 h-5 text-gray-400" />}
        </div>
        <div className="flex-1">
          <div className="font-bold text-[#140152] text-sm">Weekly Reading Reminder</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {day !== null ? `Set for every ${DAYS[day]}` : 'Pick a day to be reminded each week'}
          </div>
        </div>
        {day !== null && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">ON</span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap gap-2 mt-4">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => onSet(day === i ? null : i)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${day === i ? 'bg-[#140152] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3">Your reminder day is saved on this device. We'll highlight it when you visit.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Saved Verses Section ────────────────────────────────────────────────────────
function SavedVersesSection({ verses, onRemove }: { verses: SavedVerse[]; onRemove: (ref: string) => void }) {
  if (verses.length === 0) return null
  return (
    <div>
      <h2 className="text-base font-black text-[#140152] mb-4 flex items-center gap-2">
        <Heart className="w-4 h-4 text-[#f5bb00]" /> My Saved Verses
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{verses.length}</span>
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {verses.map((v) => (
          <motion.div key={v.ref + v.savedAt} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative group">
            <button onClick={() => onRemove(v.ref)}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
            <Quote className="w-5 h-5 text-[#f5bb00]/40 mb-2" />
            <p className="text-[#140152] text-sm leading-relaxed font-medium italic mb-2 pr-6">&ldquo;{v.verse}&rdquo;</p>
            <div className="flex items-center justify-between">
              <p className="text-[#f5bb00] text-xs font-bold">— {v.ref}</p>
              {v.week && <span className="text-[10px] text-gray-400">Week {v.week}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Personal Bible Mentoring ────────────────────────────────────────────────────
const MENTORING_KEY = 'bibleMentoringRequest'
const FOCUS_AREAS = [
  'Growing in spiritual maturity',
  'Understanding difficult Scriptures',
  'Building a consistent prayer life',
  'Overcoming a personal struggle',
  'Preparing for ministry / leadership',
  'New believer — foundations of faith',
  'Other (I\'ll explain)',
]
const MEETING_STYLES = [
  { id: 'in-person', label: 'In person', icon: Users },
  { id: 'virtual',   label: 'Video call', icon: Video },
  { id: 'phone',     label: 'Phone',      icon: Phone },
]
const MENTOR_BENEFITS = [
  { icon: BookOpen,   title: 'Personalised study plan', desc: 'A mentor tailors Scripture study to where you are in your walk.' },
  { icon: HandHeart,  title: 'Prayer & accountability', desc: 'Someone to pray with you and gently keep you on track.' },
  { icon: MessageCircle, title: 'Ask anything', desc: 'A safe space to bring your questions, doubts, and discoveries.' },
]

interface MentoringRequest { focus: string; style: string; availability: string; message: string; status: 'pending' | 'connected'; createdAt: string }

function MentoringSection() {
  const [request, setRequest] = useState<MentoringRequest | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [form, setForm] = useState({ focus: FOCUS_AREAS[0], style: 'virtual', availability: '', message: '' })

  useEffect(() => {
    try { const r = localStorage.getItem(MENTORING_KEY); if (r) setRequest(JSON.parse(r)) } catch { /* ignore */ }
    setLoggedIn(!!localStorage.getItem('isLoggedIn'))
  }, [])

  const submit = async () => {
    setSubmitting(true)
    const composed = `Bible Mentoring Request — Focus: ${form.focus} | Preferred: ${MEETING_STYLES.find(s => s.id === form.style)?.label} | Availability: ${form.availability || 'Flexible'} | Note: ${form.message || '—'}`
    try {
      await serviceRequestApi.submitRequests(['Bible Mentoring'], composed)
    } catch {
      /* still record locally so the user sees confirmation; admin can also be reached via contact */
    }
    const newReq: MentoringRequest = { ...form, status: 'pending', createdAt: new Date().toISOString() }
    localStorage.setItem(MENTORING_KEY, JSON.stringify(newReq))
    setRequest(newReq)
    setShowForm(false)
    setSubmitting(false)
  }

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#ddd6fe]"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
      <div className="absolute top-0 right-0 w-56 h-56 bg-[#7c3aed] rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#7c3aed] flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#6d28d9]">Personal Bible Mentoring</span>
        </div>

        {/* Connected / pending state */}
        {request ? (
          <div className="bg-white rounded-2xl p-6 border border-[#ddd6fe]">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <h3 className="font-black text-[#140152]">Request received! 🙏</h3>
                <p className="text-xs text-gray-500">A mentor coordinator will reach out to you soon.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm mt-4">
              <div className="bg-[#f5f3ff] rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-[#6d28d9]">Focus</p>
                <p className="text-[#140152] font-semibold">{request.focus}</p>
              </div>
              <div className="bg-[#f5f3ff] rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-[#6d28d9]">Preferred</p>
                <p className="text-[#140152] font-semibold">{MEETING_STYLES.find(s => s.id === request.style)?.label}</p>
              </div>
            </div>
            <button onClick={() => { localStorage.removeItem(MENTORING_KEY); setRequest(null) }}
              className="text-xs text-gray-400 hover:text-gray-600 mt-4 font-semibold">Cancel / edit request</button>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-black text-[#140152] mb-2">Walk with a Bible mentor</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-lg">
              You weren't meant to grow alone. Get paired with a mature believer who will guide you
              through Scripture, pray with you, and walk alongside your journey.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {MENTOR_BENEFITS.map((b, i) => (
                <div key={i} className="bg-white/70 rounded-2xl p-4 border border-white">
                  <b.icon className="w-5 h-5 text-[#7c3aed] mb-2" />
                  <p className="font-bold text-[#140152] text-sm mb-1">{b.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>

            {!showForm ? (
              <button onClick={() => setShowForm(true)}
                className="bg-[#7c3aed] text-white font-black px-7 py-3.5 rounded-2xl hover:bg-[#6d28d9] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
                Request a Mentor <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-2xl p-5 border border-[#ddd6fe] space-y-4">
                {!loggedIn && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                    <Bell className="w-4 h-4 flex-shrink-0" />
                    <span>Tip: <Link href="/auth/login" className="font-bold underline">sign in</Link> so your mentor can be matched to your account. You can still submit below.</span>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">What would you like to grow in?</label>
                  <select value={form.focus} onChange={e => setForm({ ...form, focus: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:border-[#7c3aed]">
                    {FOCUS_AREAS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">How would you like to meet?</label>
                  <div className="flex gap-2">
                    {MEETING_STYLES.map(s => (
                      <button key={s.id} onClick={() => setForm({ ...form, style: s.id })}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${form.style === s.id ? 'bg-[#7c3aed] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        <s.icon className="w-3.5 h-3.5" /> {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Your availability</label>
                  <input value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}
                    placeholder="e.g. Weekday evenings, Saturday mornings"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#7c3aed]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Anything you'd like your mentor to know? (optional)</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={3} placeholder="Share where you are in your walk, or any specific questions…"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none focus:outline-none focus:border-[#7c3aed]" />
                </div>
                <div className="flex gap-2">
                  <button onClick={submit} disabled={submitting}
                    className="bg-[#7c3aed] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Submit Request
                  </button>
                  <button onClick={() => setShowForm(false)} className="px-5 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function BibleReadingPage() {
  const [completed, setCompleted] = useState<Record<number, boolean>>({})
  const [registered, setRegistered] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([])
  const [startDate, setStartDate] = useState<string | null>(null)
  const [reminderDay, setReminderDay] = useState<number | null>(null)

  // Admin dynamic content
  const [adminThemes, setAdminThemes] = useState<QuarterlyTheme[]>([])
  const [adminReflections, setAdminReflections] = useState<WeekReflection[]>([])

  // Merge admin quarterly themes
  const activeQuarters = useMemo(() => {
    if (adminThemes.length === 0) return QUARTERS
    return QUARTERS.map(q => {
      const admin = adminThemes.find(t => t.quarter_number === q.id)
      if (!admin) return q
      return { ...q, title: admin.title, theme: admin.theme, scripture: admin.scripture, accent: admin.accent_color, weeks: [admin.week_start, admin.week_end] as [number, number] }
    })
  }, [adminThemes])

  // Merge admin week reflections
  const activeWeekContent = useMemo((): Record<number, WeekContent> => {
    const base = { ...WEEK_CONTENT }
    for (const r of adminReflections) {
      base[r.week_number] = { verse: r.key_verse, ref: r.verse_ref, reflection: r.reflection }
    }
    return base
  }, [adminReflections])

  // Load progress and admin content
  useEffect(() => {
    const cachedCompleted = localStorage.getItem('bibleReadingCompleted')
    const cachedRegistered = localStorage.getItem('bibleReadingRegistered')
    if (cachedCompleted) setCompleted(JSON.parse(cachedCompleted))
    if (cachedRegistered) setRegistered(true)

    // Saved verses, start date, reminder
    try { setSavedVerses(JSON.parse(localStorage.getItem(SAVED_VERSES_KEY) || '[]')) } catch { /* ignore */ }
    setStartDate(localStorage.getItem(START_DATE_KEY))
    const rd = localStorage.getItem(REMINDER_KEY)
    if (rd !== null) setReminderDay(Number(rd))

    Promise.all([
      bibleStudyApi.getQuarterlyThemes().catch(() => []),
      bibleStudyApi.getWeekReflections().catch(() => []),
    ]).then(([themes, reflections]) => {
      if (themes.length > 0) setAdminThemes(themes)
      if (reflections.length > 0) setAdminReflections(reflections)
    })

    bibleReadingApi.getProgress()
      .then((data) => {
        const numericCompleted: Record<number, boolean> = {}
        for (const [k, v] of Object.entries(data.completed_weeks)) {
          numericCompleted[Number(k)] = v
        }
        setCompleted(numericCompleted)
        if (data.registered) setRegistered(true)
        localStorage.setItem('bibleReadingCompleted', JSON.stringify(numericCompleted))
        if (data.registered) localStorage.setItem('bibleReadingRegistered', 'true')
      })
      .catch(() => { /* use localStorage cache */ })
  }, [])

  // Toggle week completion
  const toggleComplete = async (week: number) => {
    const prev = !!completed[week]
    const next = { ...completed, [week]: !prev }
    setCompleted(next)
    localStorage.setItem('bibleReadingCompleted', JSON.stringify(next))
    try {
      setSaving(true)
      const result = await bibleReadingApi.toggleWeek(week)
      const reconciled = { ...next, [week]: result.completed }
      setCompleted(reconciled)
      localStorage.setItem('bibleReadingCompleted', JSON.stringify(reconciled))
    } catch {
      setCompleted({ ...completed })
      localStorage.setItem('bibleReadingCompleted', JSON.stringify(completed))
    } finally {
      setSaving(false)
    }
  }

  const handleRegister = async () => {
    setRegistered(true)
    localStorage.setItem('bibleReadingRegistered', 'true')
    if (!localStorage.getItem(START_DATE_KEY)) {
      const now = new Date().toISOString()
      localStorage.setItem(START_DATE_KEY, now)
      setStartDate(now)
    }
    try { await bibleReadingApi.register() } catch { /* no-op */ }
  }

  // Bookmark / saved verses
  const toggleBookmark = (verse: string, ref: string, week?: number) => {
    setSavedVerses(prev => {
      const exists = prev.some(v => v.ref === ref)
      const next = exists
        ? prev.filter(v => v.ref !== ref)
        : [{ verse, ref, week, savedAt: new Date().toISOString() }, ...prev]
      localStorage.setItem(SAVED_VERSES_KEY, JSON.stringify(next))
      return next
    })
  }
  const removeVerse = (ref: string) => {
    setSavedVerses(prev => {
      const next = prev.filter(v => v.ref !== ref)
      localStorage.setItem(SAVED_VERSES_KEY, JSON.stringify(next))
      return next
    })
  }

  // Reminder
  const setReminder = (d: number | null) => {
    setReminderDay(d)
    if (d === null) localStorage.removeItem(REMINDER_KEY)
    else localStorage.setItem(REMINDER_KEY, String(d))
  }

  // Derived stats
  const completedCount = useMemo(() => Object.values(completed).filter(Boolean).length, [completed])
  const progressPct = Math.round((completedCount / TOTAL_WEEKS) * 100)

  const currentWeek = useMemo(() => {
    if (completedCount === TOTAL_WEEKS) return TOTAL_WEEKS
    for (const entry of READING_PLAN) {
      if (!completed[entry.week]) return entry.week
    }
    return 1
  }, [completed, completedCount])

  const streak = useMemo(() => {
    let s = 0
    for (const entry of READING_PLAN) {
      if (completed[entry.week]) s++
      else break
    }
    return s
  }, [completed])

  const currentWeekData = READING_PLAN.find((e) => e.week === currentWeek) ?? READING_PLAN[0]
  const currentQuarter = getQuarterForWeek(currentWeek)
  const currentContent = activeWeekContent[currentWeek] ?? getWeekContent(currentWeek, currentWeekData.oldTestament)

  const weeksByQuarter = useMemo(() => {
    return activeQuarters.map((q) => ({
      quarter: q,
      weeks: READING_PLAN.filter((e) => e.week >= q.weeks[0] && e.week <= q.weeks[1]),
    }))
  }, [activeQuarters])

  // Search filter
  const filteredPlan = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null
    return READING_PLAN.filter(e =>
      e.oldTestament.toLowerCase().includes(q) ||
      e.newTestament.toLowerCase().includes(q) ||
      `week ${e.week}`.includes(q)
    )
  }, [searchQuery])

  return (
    <ServicePageLayout serviceName="Bible study" brandTitle="Bible Reading" brandColor="#f5bb00">
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #fdfaf3 0%, #f9f6ee 100%)' }}>
        <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 pt-24 md:pt-10 space-y-8">

          {/* ── HERO with Circular Progress ── */}
          <div
            className="relative rounded-3xl overflow-hidden p-8 md:p-12"
            style={{ background: 'linear-gradient(135deg, #140152 0%, #1a0270 55%, #2d0b8e 100%)' }}
          >
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#7c3aed] rounded-full blur-3xl opacity-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f5bb00] rounded-full blur-3xl opacity-10 pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-white rounded-full blur-3xl opacity-5 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-14">
              {/* Circular ring */}
              <CircularProgress pct={progressPct} />

              {/* Text */}
              <div className="flex-1 text-center md:text-left">
                <motion.span
                  className="text-[#f5bb00] text-xs font-bold uppercase tracking-[0.2em]"
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                >
                  2026 · 54 Weeks Through Scripture
                </motion.span>
                <motion.h1
                  className="text-3xl md:text-5xl font-black text-white mt-2 mb-3 leading-tight"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                >
                  Your Bible Reading<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5bb00] to-[#fde68a]">Journey</span>
                </motion.h1>
                <motion.p
                  className="text-white/55 text-sm leading-relaxed mb-6 max-w-md"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                >
                  A year-long walk through Scripture — Old Testament & New Testament, side by side. Not a task. A conversation with God.
                </motion.p>
                {registered && (
                  <motion.div
                    className="flex flex-wrap gap-3 justify-center md:justify-start"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  >
                    <ShareProgress week={currentWeek} pct={progressPct} />
                  </motion.div>
                )}
                {!registered && (
                  <motion.button
                    onClick={handleRegister}
                    className="bg-[#f5bb00] text-[#140152] font-black px-7 py-3.5 rounded-2xl hover:bg-yellow-400 transition-all shadow-lg hover:scale-[1.03] active:scale-[0.98]"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  >
                    Begin My Journey →
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* ── VERSE OF THE DAY ── */}
          <VerseOfTheDay />

          {/* ── STATS ROW ── */}
          {registered && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatPill icon={<Flame className="w-4 h-4" />} label="Week Streak" value={streak > 0 ? `${streak} 🔥` : '—'} color="#d97706" />
              <StatPill icon={<Check className="w-4 h-4" />} label="Weeks Done" value={`${completedCount}/${TOTAL_WEEKS}`} color="#059669" />
              <StatPill icon={<Target className="w-4 h-4" />} label="Progress" value={`${progressPct}%`} color="#140152" />
              <StatPill icon={<Heart className="w-4 h-4" />} label="Saved Verses" value={savedVerses.length} color="#e11d48" />
            </div>
          )}

          {/* ── PACE + REMINDER ── */}
          {registered && (
            <div className="grid md:grid-cols-2 gap-3">
              <PaceCard completedCount={completedCount} startDate={startDate} />
              <ReminderCard day={reminderDay} onSet={setReminder} />
            </div>
          )}

          {/* ── PROGRESS BAR ── */}
          {registered && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 font-medium mb-3">
                <span className="font-bold text-gray-700">Journey Progress</span>
                <span>{completedCount} of {TOTAL_WEEKS} weeks</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  style={{ background: 'linear-gradient(90deg, #140152, #7c3aed, #f5bb00)' }}
                />
              </div>
              {/* Quarter markers */}
              <div className="flex justify-between mt-3">
                {activeQuarters.map((q) => (
                  <div key={q.id} className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-all"
                      style={{ background: completedCount >= q.weeks[1] ? q.accent : '#e5e7eb', borderColor: completedCount >= q.weeks[1] ? q.accent : '#e5e7eb' }} />
                    <span className="text-[10px] font-bold text-gray-400">Q{q.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MILESTONES ── */}
          {registered && (
            <div>
              <h2 className="text-base font-black text-[#140152] mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#f5bb00]" /> Milestones
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {MILESTONES.map((m, i) => {
                  const earned = completedCount >= m.weeks
                  return (
                    <motion.div
                      key={m.weeks}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: earned ? 1 : 0.45, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex-shrink-0 flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border-2 transition-all min-w-[100px]"
                      style={earned
                        ? { background: m.bg, borderColor: m.color, boxShadow: `0 4px 14px ${m.color}30` }
                        : { background: '#f9fafb', borderColor: '#e5e7eb' }
                      }
                    >
                      <span className={`text-3xl ${earned ? '' : 'grayscale'}`}>{m.emoji}</span>
                      <span className="text-xs font-black text-center" style={{ color: earned ? m.color : '#9ca3af' }}>{m.label}</span>
                      <span className="text-[10px] font-medium" style={{ color: earned ? m.color + 'bb' : '#d1d5db' }}>{m.weeks} wks</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── THIS WEEK HERO ── */}
          <ThisWeekHero
            weekData={currentWeekData}
            content={currentContent}
            quarter={currentQuarter}
            isCompleted={!!completed[currentWeek]}
            onToggle={() => toggleComplete(currentWeek)}
            registered={registered}
            onRegister={handleRegister}
            isBookmarked={savedVerses.some(v => v.ref === currentContent.ref)}
            onBookmark={() => toggleBookmark(currentContent.verse, currentContent.ref, currentWeek)}
            progressPct={progressPct}
          />

          {/* ── SAVED VERSES ── */}
          {registered && <SavedVersesSection verses={savedVerses} onRemove={removeVerse} />}

          {/* ── PERSONAL BIBLE MENTORING ── */}
          <MentoringSection />

          {/* ── SEARCH ── */}
          <div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by book name (e.g. Genesis, Acts, Romans…)"
                className="w-full pl-11 pr-11 py-4 bg-white rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152] transition-all shadow-sm"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            {filteredPlan && (
              <motion.p
                className="text-sm text-gray-500 mt-2 ml-1"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                {filteredPlan.length === 0
                  ? 'No results — try a different book name'
                  : `${filteredPlan.length} week${filteredPlan.length !== 1 ? 's' : ''} found for "${searchQuery}"`
                }
              </motion.p>
            )}
          </div>

          {/* ── WEEK GRID: Search results OR All Quarters ── */}
          {filteredPlan ? (
            <SearchResults
              results={filteredPlan}
              completed={completed}
              currentWeek={currentWeek}
              registered={registered}
              onToggle={toggleComplete}
            />
          ) : (
            <div>
              <h2 className="text-2xl font-black text-[#140152] mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#f5bb00]" /> The Full Journey
              </h2>
              <div className="space-y-4">
                {weeksByQuarter.map(({ quarter, weeks }) => (
                  <QuarterSection
                    key={quarter.id}
                    quarter={quarter}
                    weeks={weeks}
                    completed={completed}
                    currentWeek={currentWeek}
                    registered={registered}
                    onToggle={toggleComplete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── COMPLETION CELEBRATION ── */}
          {registered && completedCount === TOTAL_WEEKS && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 rounded-3xl text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #140152 0%, #7c3aed 50%, #f5bb00 100%)' }}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoLTZ2LTZoNnYtNmg2djZoNnY2aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              <div className="relative z-10">
                <motion.div className="text-7xl mb-5" animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>🏆</motion.div>
                <h3 className="text-4xl font-black mb-4">You&apos;ve Read the Bible!</h3>
                <p className="text-white/70 max-w-sm mx-auto leading-relaxed text-lg">
                  54 weeks. From Genesis to the Epistles. You have walked through the greatest story ever told.
                </p>
                <p className="text-[#f5bb00] font-bold mt-4">Start again — it never gets old. 📖</p>
              </div>
            </motion.div>
          )}

          {/* ── AUTO-SAVE indicator ── */}
          <AnimatePresence>
            {saving && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-20 md:bottom-8 right-8 bg-[#140152] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50"
              >
                <div className="w-2 h-2 bg-[#f5bb00] rounded-full animate-pulse" />
                Saving progress…
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FOOTER QUOTE ── */}
          <div className="text-center py-6 text-sm text-gray-400 italic">
            &ldquo;Your word is a lamp for my feet, a light on my path.&rdquo; — Psalm 119:105
          </div>
        </main>
      </div>
    </ServicePageLayout>
  )
}

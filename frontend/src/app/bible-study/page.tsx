'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SectionWrapper from '@/components/shared/SectionWrapper'
import {
    BookOpen, Cross, Flame, Heart, Sun, Users, Calendar, MessageCircle,
    ArrowRight, CheckCircle, Search, Play, Download, Star, Clock,
    TrendingUp, Award, Mic2, Globe, Lightbulb, Shield, Target,
    ChevronDown, ChevronRight, ChevronUp, BookMarked, Scroll, PenLine, Bell,
    Brain, Trophy, Zap, Check, X, RotateCcw, Plus, Trash2, Sparkles,
    Eye, EyeOff, Quote, Send, MessageSquare, Lock, Unlock,
    BarChart2, Bookmark, AlarmClock, Pen, CheckCheck, Save,
} from 'lucide-react'
import Link from 'next/link'
import { bibleStudyApi, QuarterlyTheme, BibleStudyPageSettings, BibleStudyWeeklyTopic } from '@/lib/api'
import MentoringSection from '@/components/bible/MentoringSection'

// ── Static data ────────────────────────────────────────────────────────────────

const FALLBACK_THEMES = [
    { id: 1, title: "The Cost of Discipleship",    scripture: "Luke 14:27–35",   description: "A call to wholehearted commitment—embracing sacrifice, obedience, and unwavering devotion to Christ, regardless of the cost.", accent_color: "#7c3aed", bgImage: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=60" },
    { id: 2, title: "Experiencing Transformative Power Through Fruitfulness", scripture: "John 15:16", description: "Understanding divine selection and purpose, and walking in a life that produces lasting spiritual fruit through abiding in Christ.", accent_color: "#0284c7", bgImage: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=60" },
    { id: 3, title: "The Sustaining Power of the Holy Spirit", scripture: "Acts 1:8; Hebrews 12:22–24", description: "Living daily by the enabling strength of the Holy Spirit—empowered for witness, endurance, and victorious Christian living.", accent_color: "#d97706", bgImage: "https://images.unsplash.com/photo-1501952476817-d7ae22e3f2d2?w=800&auto=format&fit=crop&q=60" },
    { id: 4, title: "Enter into His Rest Through Faith", scripture: "Hebrews 11:24–26", description: "Choosing faith over fear and eternal reward over temporary pleasure, as believers rest in God's promises and purposes.", accent_color: "#059669", bgImage: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=60" },
]

const QUARTER_BG: Record<number, string> = { 1: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=60", 2: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=60", 3: "https://images.unsplash.com/photo-1501952476817-d7ae22e3f2d2?w=800&auto=format&fit=crop&q=60", 4: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=60" }
const QUARTER_ICONS = [<Cross className="w-8 h-8 text-white" key="1" />, <Heart className="w-8 h-8 text-white" key="2" />, <Flame className="w-8 h-8 text-white" key="3" />, <Sun className="w-8 h-8 text-white" key="4" />]

const WEEKLY_TOPICS = [
    { id: 0, week: 'Week 1', title: 'The Nature of God',            verse: 'Exodus 34:6-7',       category: 'Foundation',    color: '#7c3aed' },
    { id: 1, week: 'Week 2', title: 'The Person of Jesus',          verse: 'Colossians 1:15-20',  category: 'Christology',   color: '#0284c7' },
    { id: 2, week: 'Week 3', title: 'The Work of the Holy Spirit',  verse: 'John 16:5-15',        category: 'Pneumatology',  color: '#d97706' },
    { id: 3, week: 'Week 4', title: 'Prayer & Intimacy with God',   verse: 'Matthew 6:5-13',      category: 'Devotional',    color: '#059669' },
    { id: 4, week: 'Week 5', title: 'Living by Faith',              verse: 'Hebrews 11:1-6',      category: 'Christian Life', color: '#ef4444' },
    { id: 5, week: 'Week 6', title: 'The Church & Community',       verse: 'Acts 2:42-47',        category: 'Ecclesiology',  color: '#8b5cf6' },
]

// Quiz questions per topic
const QUIZZES: Record<number, { q: string; options: string[]; answer: number }[]> = {
    0: [
        { q: 'Which attribute of God is described in Exodus 34:6-7?', options: ['Omnipotence', 'Compassion and grace', 'Omniscience', 'Sovereignty'], answer: 1 },
        { q: 'God is described as "slow to anger" — what does this imply?', options: ['God never punishes sin', 'God is patient and merciful', 'God forgets sins quickly', 'God is indifferent to sin'], answer: 1 },
        { q: 'The holiness of God means He is:', options: ['Distant and unreachable', 'Set apart and morally perfect', 'Only loving, never judging', 'A concept for philosophers'], answer: 1 },
        { q: 'Which best describes the Trinity?', options: ['Three separate gods', 'One God in three persons', 'God playing three roles', 'A metaphor for creation'], answer: 1 },
        { q: 'Knowing God\'s nature should lead us to:', options: ['Fear and hide from Him', 'Worship, trust, and imitate Him', 'Question His existence', 'Remain passive'], answer: 1 },
    ],
    1: [
        { q: 'Colossians 1:15 calls Jesus the "image of the invisible God" — this means:', options: ['Jesus is a vision or apparition', 'Jesus fully reveals God\'s character to us', 'God has a physical form', 'Jesus was created first'], answer: 1 },
        { q: 'Jesus being "firstborn over all creation" (Col 1:15) means:', options: ['Jesus was born before creation', 'Jesus holds supreme authority over creation', 'Jesus is a created being', 'Jesus is older than the universe'], answer: 1 },
        { q: 'Jesus is both fully human and fully divine — this doctrine is called:', options: ['Transubstantiation', 'The Hypostatic Union', 'Penal Substitution', 'Theophany'], answer: 1 },
        { q: 'In whom does all the fullness of God dwell (Col 1:19)?', options: ['The Church', 'The Holy Spirit only', 'Christ Jesus', 'Every believer'], answer: 2 },
        { q: 'Why is the incarnation of Jesus significant?', options: ['It proved angels are real', 'God became approachable and fully identified with humanity', 'It was a one-time miracle with no lasting effect', 'It removed the need for faith'], answer: 1 },
    ],
    2: [
        { q: 'In John 16:8, the Holy Spirit will convict the world of:', options: ['Politics and injustice', 'Sin, righteousness, and judgment', 'Wealth and poverty', 'Science and religion'], answer: 1 },
        { q: 'The word "Paraclete" (used for the Holy Spirit) means:', options: ['Judge', 'Helper or Advocate', 'Accuser', 'Servant'], answer: 1 },
        { q: 'According to Acts 1:8, the Holy Spirit is given primarily to:', options: ['Make us feel good', 'Empower believers for witnessing', 'Replace Jesus', 'Guard buildings'], answer: 1 },
        { q: 'A fruit of the Spirit (Galatians 5) includes:', options: ['Financial success', 'Popularity', 'Love, joy, and peace', 'Physical health'], answer: 2 },
        { q: 'What does it mean to be "filled with the Spirit"?', options: ['A one-time event at salvation only', 'To be continuously yielded to and empowered by the Spirit', 'To speak in tongues every day', 'To be physically full of energy'], answer: 1 },
    ],
    3: [
        { q: 'Jesus teaches in Matthew 6 that prayer should be:', options: ['Loud and public to inspire others', 'Brief, sincere, and private', 'Repeated from memory only', 'Only spoken at church'], answer: 1 },
        { q: 'What is the first petition of the Lord\'s Prayer?', options: ['"Give us today our daily bread"', '"Hallowed be your name"', '"Forgive us our debts"', '"Lead us not into temptation"'], answer: 1 },
        { q: 'Intimacy with God is primarily developed through:', options: ['Financial giving only', 'Regular prayer, Scripture reading, and obedience', 'Church attendance alone', 'Attending conferences'], answer: 1 },
        { q: 'God desires to be our:', options: ['Distant authority figure', 'Heavenly Father with whom we have relationship', 'Employer who rewards good work', 'Impersonal cosmic force'], answer: 1 },
        { q: 'The purpose of the Lord\'s Prayer as a model is:', options: ['To be recited word-for-word only', 'To teach us the principles and priorities of prayer', 'To replace personal prayer', 'To be sung, not spoken'], answer: 1 },
    ],
    4: [
        { q: 'Hebrews 11:1 defines faith as:', options: ['A feeling of confidence', 'Certainty about what we hope for, evidence of unseen things', 'Blind optimism', 'Positive thinking'], answer: 1 },
        { q: 'Moses chose to suffer with God\'s people rather than enjoy:', options: ['His family', 'The pleasures of sin for a season', 'Eternal life', 'Education'], answer: 1 },
        { q: 'Faith without works (James 2:17) is:', options: ['Still valid and powerful', 'Dead', 'Sufficient for salvation', 'A mystery'], answer: 1 },
        { q: 'The "Hall of Faith" in Hebrews 11 teaches us that:', options: ['Only perfect people receive God\'s approval', 'Flawed people who trust God can accomplish great things', 'Faith eliminates all suffering', 'God only rewards heroes'], answer: 1 },
        { q: 'Living by faith means:', options: ['Ignoring practical realities', 'Trusting God\'s character even when circumstances are uncertain', 'Expecting only positive outcomes', 'Waiting passively for miracles'], answer: 1 },
    ],
    5: [
        { q: 'Acts 2:42 says the early church devoted themselves to:', options: ['Building programs', 'The apostles\' teaching, fellowship, breaking of bread, and prayer', 'Political activism', 'Evangelism alone'], answer: 1 },
        { q: 'What distinguished the early church community?', options: ['Elaborate worship facilities', 'Generosity, unity, and shared life', 'Strict hierarchical structure', 'Separation from society'], answer: 1 },
        { q: 'The church is described in Scripture as:', options: ['A building', 'A business', 'The body of Christ', 'A social club'], answer: 2 },
        { q: 'Why is Christian community essential for spiritual growth?', options: ['It is optional — you can grow alone', 'We need accountability, encouragement, and shared mission', 'It only matters for new believers', 'Community is secondary to personal Bible reading'], answer: 1 },
        { q: 'According to Acts 2, what was the result of the early church\'s lifestyle?', options: ['Persecution and decline', 'The Lord added to their number daily', 'They became wealthy', 'They withdrew from society'], answer: 1 },
    ],
}

const DAILY_VERSES = [
    { ref: 'Psalm 119:105', text: '"Your word is a lamp for my feet, a light on my path."' },
    { ref: 'Joshua 1:8',    text: '"Keep this Book of the Law always on your lips; meditate on it day and night."' },
    { ref: '2 Timothy 3:16', text: '"All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness."' },
    { ref: 'Romans 10:17',  text: '"Faith comes from hearing the message, and the message is heard through the word about Christ."' },
    { ref: 'Hebrews 4:12',  text: '"For the word of God is alive and active. Sharper than any double-edged sword."' },
    { ref: 'Matthew 4:4',   text: '"Man shall not live on bread alone, but on every word that comes from the mouth of God."' },
    { ref: 'Proverbs 30:5', text: '"Every word of God is flawless; he is a shield to those who take refuge in him."' },
]

const BADGES = [
    { id: 'first_quiz',    emoji: '📖', label: 'First Step',       desc: 'Completed your first quiz',          condition: (s: StudyState) => s.quizScores && Object.keys(s.quizScores).length >= 1 },
    { id: 'quiz_perfect',  emoji: '💯', label: 'Perfect Score',    desc: 'Got 5/5 on any quiz',                condition: (s: StudyState) => s.quizScores && Object.values(s.quizScores).some(v => v >= 5) },
    { id: 'all_quizzes',   emoji: '🏆', label: 'Quiz Champion',    desc: 'Completed all 6 topic quizzes',      condition: (s: StudyState) => s.quizScores && Object.keys(s.quizScores).length >= 6 },
    { id: 'first_verse',   emoji: '✨', label: 'Verse Keeper',     desc: 'Added your first memory verse',      condition: (s: StudyState) => s.memVerses && s.memVerses.length >= 1 },
    { id: 'five_verses',   emoji: '💡', label: 'Scripture Scholar', desc: 'Memorised 5 verses',                condition: (s: StudyState) => s.memVerses && s.memVerses.filter((v: MemVerse) => v.status === 'memorized').length >= 5 },
    { id: 'first_journal', emoji: '✍️', label: 'Reflective Writer', desc: 'Wrote your first journal entry',   condition: (s: StudyState) => s.journals && Object.values(s.journals).some((j: string) => j.trim().length > 20) },
    { id: 'all_journals',  emoji: '📔', label: 'Deep Thinker',     desc: 'Journalled on all 6 topics',        condition: (s: StudyState) => s.journals && Object.keys(s.journals).length >= 6 && Object.values(s.journals).every((j: string) => j.trim().length > 0) },
    { id: 'four_sessions', emoji: '📅', label: 'Faithful Attender', desc: 'Marked attendance for 4 sessions', condition: (s: StudyState) => s.attendance && s.attendance.length >= 4 },
    { id: 'streak_7',      emoji: '🔥', label: '7-Day Streak',     desc: '7 consecutive days of study',       condition: (s: StudyState) => (s.streak ?? 0) >= 7 },
    { id: 'streak_30',     emoji: '⚡', label: '30-Day Warrior',   desc: '30 consecutive days of study',      condition: (s: StudyState) => (s.streak ?? 0) >= 30 },
]

interface MemVerse  { id: string; ref: string; text: string; status: 'learning' | 'memorized'; addedAt: string }
interface Discussion { id: string; topicId: number; author: string; text: string; createdAt: string; replies: Discussion[] }
interface StudyState {
    streak?: number
    lastStudied?: string
    quizScores?: Record<string, number>
    journals?: Record<string, string>
    attendance?: string[]   // date strings
    memVerses?: MemVerse[]
    discussions?: Discussion[]
    earnedBadges?: string[]
}

const LS_KEY = 'letw_bible_study'
function loadState(): StudyState { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} } }
function saveState(s: StudyState) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ } }

const RESOURCES = [
    { type: 'pdf',   title: 'Q1 Study Guide — The Cost of Discipleship',  pages: '24 pages', icon: Download, color: 'bg-red-100 text-red-600' },
    { type: 'video', title: 'Introduction to Expository Bible Study',      duration: '38 min', icon: Play,    color: 'bg-blue-100 text-blue-600' },
    { type: 'pdf',   title: 'How to Study the Bible Effectively',           pages: '16 pages', icon: Download, color: 'bg-green-100 text-green-600' },
    { type: 'audio', title: 'Lectio Divina — Ancient Bible Meditation',    duration: '22 min', icon: Mic2,    color: 'bg-purple-100 text-purple-600' },
    { type: 'pdf',   title: 'Prayer & Bible Study Journal Template',        pages: '8 pages',  icon: PenLine, color: 'bg-amber-100 text-amber-600' },
    { type: 'video', title: 'Understanding Biblical Context & Culture',     duration: '45 min', icon: Play,   color: 'bg-indigo-100 text-indigo-600' },
]

const GROUPS = [
    { name: 'Young Adults Group',    leader: 'Bro. Emmanuel', time: 'Tuesdays 6:00 PM',   size: 18, level: 'Open to all' },
    { name: "Women's Bible Circle",  leader: 'Sis. Grace',    time: 'Thursdays 5:00 PM',  size: 22, level: 'Women only' },
    { name: "Men's Study Fellowship", leader: 'Bro. Daniel',  time: 'Saturdays 8:00 AM',  size: 14, level: 'Men only' },
    { name: 'Deeper Life Class',     leader: 'Pastor Wale',   time: 'Sundays 2:00 PM',    size: 30, level: 'Advanced' },
]

const STUDY_METHODS = [
    { icon: Search,    title: 'Inductive Study',        desc: 'Observe, interpret, and apply Scripture through careful reading and questioning.' },
    { icon: Scroll,    title: 'Expository Preaching',   desc: 'Systematic, verse-by-verse exposition of entire books of the Bible.' },
    { icon: BookMarked, title: 'Topical Study',         desc: 'Deep dives into key biblical themes across Old and New Testaments.' },
    { icon: PenLine,   title: 'Journaling & Reflection', desc: 'Personal application through guided journaling and prayer prompts.' },
]

// Ring component
function RingProgress({ pct, size = 80, stroke = 7, color }: { pct: number; size?: number; stroke?: number; color: string }) {
    const r = (size - stroke) / 2; const circ = 2 * Math.PI * r
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
            <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct / 100) }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        </svg>
    )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BibleStudyPage() {
    const [adminThemes, setAdminThemes] = useState<QuarterlyTheme[]>([])
    const [settings, setSettings] = useState<BibleStudyPageSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState<'journey' | 'curriculum' | 'weekly' | 'groups' | 'resources'>('journey')
    const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

    // Study state (localStorage)
    const [studyState, setStudyState] = useState<StudyState>({})
    const [quizOpen, setQuizOpen] = useState<number | null>(null)    // topicId being quizzed
    const [quizStep, setQuizStep] = useState(0)
    const [quizSelected, setQuizSelected] = useState<number | null>(null)
    const [quizAnswers, setQuizAnswers] = useState<boolean[]>([])
    const [quizDone, setQuizDone] = useState(false)
    const [journalText, setJournalText] = useState<Record<number, string>>({})
    const [editingJournal, setEditingJournal] = useState<number | null>(null)
    const [newVerse, setNewVerse] = useState({ ref: '', text: '' })
    const [showAddVerse, setShowAddVerse] = useState(false)
    const [discText, setDiscText] = useState<Record<number, string>>({})
    const [expandedDisc, setExpandedDisc] = useState<number | null>(null)
    const [attendanceDate, setAttendanceDate] = useState('')
    const [joinedGroups, setJoinedGroups] = useState<string[]>([])
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const updateState = useCallback((patch: Partial<StudyState>) => {
        setStudyState(prev => { const next = { ...prev, ...patch }; saveState(next); return next })
    }, [])

    const toggleGroupJoin = useCallback((groupId: string) => {
        setJoinedGroups(prev => {
            const isJoining = !prev.includes(groupId)
            const next = isJoining ? [...prev, groupId] : prev.filter(g => g !== groupId)
            try { localStorage.setItem('letw_bs_joined_groups', JSON.stringify(next)) } catch { /* ignore */ }
            // Persist server-side (best-effort; localStorage is the instant fallback)
            const call = isJoining ? bibleStudyApi.joinGroup(groupId) : bibleStudyApi.leaveGroup(groupId)
            call.catch(() => { /* offline / not-logged-in — local state still reflects the choice */ })
            return next
        })
    }, [])

    // Load on mount + update streak
    useEffect(() => {
        Promise.all([
            bibleStudyApi.getQuarterlyThemes().catch(() => []),
            bibleStudyApi.getPublicSettings().catch(() => null),
        ]).then(([themes, settingsData]) => {
            if (themes.length > 0) setAdminThemes(themes)
            if (settingsData) setSettings(settingsData)
        }).finally(() => setLoading(false))

        try { setJoinedGroups(JSON.parse(localStorage.getItem('letw_bs_joined_groups') || '[]')) } catch { /* ignore */ }
        const loggedIn = !!localStorage.getItem('isLoggedIn') || !!localStorage.getItem('access_token')
        setIsLoggedIn(loggedIn)
        // Server is the source of truth for joined groups (cross-device)
        if (loggedIn) {
            bibleStudyApi.getMyGroups()
                .then(({ group_ids }) => {
                    setJoinedGroups(group_ids)
                    try { localStorage.setItem('letw_bs_joined_groups', JSON.stringify(group_ids)) } catch { /* ignore */ }
                })
                .catch(() => { /* keep localStorage fallback */ })
        }

        const s = loadState()
        // Update streak
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        let streak = s.streak ?? 0
        if (s.lastStudied === today) { /* same day, keep */ }
        else if (s.lastStudied === yesterday) { streak += 1 }
        else { streak = 1 }
        const updated = { ...s, streak, lastStudied: today }
        saveState(updated)
        setStudyState(updated)
        setJournalText(s.journals ?? {})

        // Deep-link: /bible-study?focus=mentoring → open Journey tab and scroll to mentoring
        try {
            const params = new URLSearchParams(window.location.search)
            if (params.get('focus') === 'mentoring') {
                setActiveSection('journey')
                setTimeout(() => document.getElementById('mentoring')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600)
            }
        } catch { /* ignore */ }
    }, [])

    // Derived
    const activeThemes = adminThemes.length > 0
        ? adminThemes.map(t => ({ id: t.quarter_number, title: t.title, scripture: t.scripture, description: t.description ?? '', accent_color: t.accent_color, bgImage: QUARTER_BG[t.quarter_number] ?? QUARTER_BG[1] }))
        : FALLBACK_THEMES
    const yearLabel = settings?.year_label ?? '2026'

    // Admin-managed content (falls back to built-in when not configured)
    const adminTopics = settings?.weekly_topics ?? []
    const activeTopics: BibleStudyWeeklyTopic[] = adminTopics.length > 0
        ? adminTopics.map((t, i) => ({ ...t, id: i }))
        : WEEKLY_TOPICS.map((t, i) => ({ ...t, id: i }))
    const adminGroups = settings?.study_groups ?? []
    const sessionNotes = settings?.session_notes ?? []

    // Normalize groups to a single display shape (admin overrides built-in)
    const displayGroups: { id: string; name: string; leader: string; time: string; size: number; level: string; is_open: boolean; description?: string; resources?: { title: string; url: string; type: string; meta?: string }[] }[] =
        adminGroups.length > 0
            ? adminGroups.map(g => ({ id: g.id, name: g.name, leader: g.leader, time: g.time, size: g.size, level: g.level, is_open: g.is_open, description: g.description, resources: g.resources }))
            : GROUPS.map((g, i) => ({ id: `builtin-${i}`, name: g.name, leader: g.leader, time: g.time, size: g.size, level: g.level, is_open: true }))

    // ── Library / Resources section (admin-managed, falls back to built-in) ──
    const adminLibrary = settings?.library_resources ?? []
    const displayResources: { title: string; type: string; url?: string; meta?: string }[] =
        adminLibrary.length > 0
            ? adminLibrary.map(r => ({ title: r.title, type: r.type, url: r.url, meta: r.meta }))
            : RESOURCES.map(r => ({ title: r.title, type: r.type, url: undefined, meta: r.pages ?? r.duration }))
    const adminTools = settings?.study_tools ?? []
    const displayTools = adminTools.length > 0
        ? adminTools
        : [
            { id: 't1', name: 'YouVersion Bible App', desc: 'Free Bible + reading plans',   tag: 'Free', href: 'https://www.bible.com' },
            { id: 't2', name: 'Blue Letter Bible',    desc: 'Deep word & commentary study', tag: 'Free', href: 'https://www.blueletterbible.org' },
            { id: 't3', name: 'Logos Bible Software', desc: 'Professional study library',   tag: 'Paid', href: 'https://www.logos.com' },
            { id: 't4', name: 'Bible Project',        desc: 'Visual book overviews',        tag: 'Free', href: 'https://bibleproject.com' },
        ]
    const adminPodcasts = settings?.podcasts ?? []
    const displayPodcasts = adminPodcasts.length > 0
        ? adminPodcasts
        : [
            { id: 'p1', name: 'The Bible Project Podcast',      host: 'Tim Mackie & Jon Collins',  topic: 'Biblical theology & book overviews', url: '' },
            { id: 'p2', name: 'In The Word with Alistair Begg', host: 'Alistair Begg',             topic: 'Expository preaching & application', url: '' },
            { id: 'p3', name: 'Ask Pastor John',                host: 'John Piper',                 topic: 'Q&A on Scripture & Christian life',  url: '' },
            { id: 'p4', name: 'Knowing Faith',                  host: 'Jen Wilkin & J.T. English',  topic: 'Theology for everyday believers',    url: '' },
            { id: 'p5', name: 'The Gospel Coalition',           host: 'Various authors',            topic: 'Reformed Bible teaching',            url: '' },
            { id: 'p6', name: 'RBC Ministries',                 host: 'Our Daily Bread team',       topic: 'Daily devotional Bible teaching',    url: '' },
        ]
    const resourcesHeading = settings?.resources_heading || 'Study Resources'
    const resourcesSubtitle = settings?.resources_subtitle || 'Guides, videos, audio, and templates to deepen your personal Bible study.'

    const todayVerse = useMemo(() => DAILY_VERSES[new Date().getDay() % DAILY_VERSES.length], [])

    const earnedBadges = useMemo(() => BADGES.filter(b => b.condition(studyState)), [studyState])

    // Quiz source: admin-saved quiz on the active topic wins; falls back to the
    // built-in hardcoded set so nothing breaks if admin hasn't authored one yet.
    const quizzes = quizOpen !== null
        ? ((activeTopics[quizOpen]?.quiz && activeTopics[quizOpen].quiz!.length > 0)
            ? activeTopics[quizOpen].quiz!
            : (QUIZZES[quizOpen] ?? []))
        : []
    const quizScore = quizAnswers.filter(Boolean).length

    // Quiz actions
    const startQuiz = (topicId: number) => { setQuizOpen(topicId); setQuizStep(0); setQuizSelected(null); setQuizAnswers([]); setQuizDone(false) }
    const selectQuizAnswer = (idx: number) => { if (quizSelected !== null) return; setQuizSelected(idx) }
    const nextQuizStep = () => {
        if (quizSelected === null) return
        const correct = quizSelected === quizzes[quizStep].answer
        const newAnswers = [...quizAnswers, correct]
        setQuizAnswers(newAnswers)
        if (quizStep + 1 >= quizzes.length) {
            setQuizDone(true)
            const score = newAnswers.filter(Boolean).length
            const prev = studyState.quizScores ?? {}
            const best = Math.max(score, prev[String(quizOpen)] ?? 0)
            updateState({ quizScores: { ...prev, [String(quizOpen)]: best } })
        } else {
            setQuizStep(p => p + 1); setQuizSelected(null)
        }
    }

    // Journal
    const saveJournal = (topicId: number) => {
        const journals = { ...(studyState.journals ?? {}), [String(topicId)]: journalText[topicId] ?? '' }
        updateState({ journals })
        setEditingJournal(null)
    }

    // Verse memory
    const addVerse = () => {
        if (!newVerse.ref.trim() || !newVerse.text.trim()) return
        const v: MemVerse = { id: Date.now().toString(), ref: newVerse.ref.trim(), text: newVerse.text.trim(), status: 'learning', addedAt: new Date().toISOString() }
        updateState({ memVerses: [...(studyState.memVerses ?? []), v] })
        setNewVerse({ ref: '', text: '' }); setShowAddVerse(false)
    }
    const toggleVerseStatus = (id: string) => {
        const vv = (studyState.memVerses ?? []).map(v => v.id === id ? { ...v, status: v.status === 'learning' ? 'memorized' as const : 'learning' as const } : v)
        updateState({ memVerses: vv })
    }
    const removeVerse = (id: string) => updateState({ memVerses: (studyState.memVerses ?? []).filter(v => v.id !== id) })

    // Attendance
    const markAttendance = () => {
        if (!attendanceDate) return
        const existing = studyState.attendance ?? []
        if (existing.includes(attendanceDate)) return
        updateState({ attendance: [...existing, attendanceDate].sort() })
        setAttendanceDate('')
    }
    const removeAttendance = (d: string) => updateState({ attendance: (studyState.attendance ?? []).filter(a => a !== d) })

    // Discussion
    const postDiscussion = (topicId: number) => {
        const text = discText[topicId]?.trim()
        if (!text) return
        const msg: Discussion = { id: Date.now().toString(), topicId, author: 'Me', text, createdAt: new Date().toISOString(), replies: [] }
        updateState({ discussions: [...(studyState.discussions ?? []), msg] })
        setDiscText(p => ({ ...p, [topicId]: '' }))
    }

    const navItems = [
        { id: 'journey',    label: 'My Journey',  icon: Sparkles  },
        { id: 'curriculum', label: 'Curriculum',  icon: BookOpen  },
        { id: 'weekly',     label: 'Weekly',      icon: Calendar  },
        { id: 'groups',     label: 'Groups',      icon: Users     },
        { id: 'resources',  label: 'Resources',   icon: Download  },
    ] as const

    const quizProgress = quizzes.length ? (quizStep / quizzes.length) * 100 : 0

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* ── Hero ── */}
            <div className="w-full relative">
                <img src="/Bible-study.png" alt="Bible Study" className="w-full h-auto block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140152]/70 to-transparent flex items-end">
                    <div className="p-8 md:p-16 max-w-3xl">
                        <span className="inline-block px-4 py-1.5 bg-[#f5bb00] text-[#140152] rounded-full text-sm font-bold mb-4">Live Every Tuesday · 6:00 PM</span>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">Dig Deeper Into<br />God's Word</h1>
                        <p className="text-white/80 text-lg max-w-xl">Structured, Spirit-led Bible study that transforms minds, builds faith, and creates community.</p>
                    </div>
                </div>
            </div>

            {/* Stats bar — admin-controlled (impact_stats), or honest derived metrics fallback */}
            {(() => {
                const adminStats = settings?.impact_stats ?? []
                // No fake numbers. If admin hasn't authored any, show only real,
                // derived metrics: current week #, # of weekly topics in this quarter,
                // and the visitor's own streak + topics-attempted.
                const realStats = [
                    { val: String(activeTopics.length || 0), label: 'Weekly Topics' },
                    { val: String(displayGroups.length || 0), label: 'Study Groups' },
                    { val: String(Object.keys(studyState.quizScores ?? {}).length || 0), label: 'Quizzes You\'ve Taken' },
                    { val: String(studyState.streak ?? 0), label: 'Your Streak 🔥' },
                ].filter(s => parseInt(s.val) > 0 || s.label.startsWith('Your'))

                const items = (adminStats.length > 0
                    ? adminStats.map(s => ({ val: s.value, label: s.label }))
                    : realStats)

                if (items.length === 0) return null

                return (
                    <div className="bg-[#140152] py-6">
                        <div className={`max-w-6xl mx-auto grid gap-4 px-4 text-center grid-cols-2 ${
                            items.length === 3 ? 'md:grid-cols-3' :
                            items.length === 4 ? 'md:grid-cols-4' :
                            items.length === 5 ? 'md:grid-cols-5' :
                            'md:grid-cols-4'
                        }`}>
                            {items.map((s, i) => (
                                <div key={i}>
                                    <div className="text-3xl font-black text-[#f5bb00]">{s.val}</div>
                                    <div className="text-sm text-white/70">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })()}

            {/* Sticky nav */}
            <div className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-gray-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto py-3">
                    {navItems.map(n => (
                        <button key={n.id} onClick={() => setActiveSection(n.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${activeSection === n.id ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <n.icon className="w-4 h-4" /> {n.label}
                            {n.id === 'journey' && earnedBadges.length > 0 && (
                                <span className="bg-[#f5bb00] text-[#140152] text-[10px] font-black rounded-full px-1.5 py-0.5">{earnedBadges.length}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quiz Modal */}
            <AnimatePresence>
                {quizOpen !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setQuizOpen(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={e => e.stopPropagation()}>

                            {/* Quiz header */}
                            <div className="bg-gradient-to-r from-[#140152] to-purple-800 px-6 py-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-[#f5bb00]" />
                                        <span className="font-black text-white">Scripture Quiz</span>
                                    </div>
                                    <button onClick={() => setQuizOpen(null)} className="text-white/60 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-white/70 text-sm mb-3">{quizOpen !== null && WEEKLY_TOPICS[quizOpen]?.title}</p>
                                {!quizDone && (
                                    <>
                                        <div className="flex items-center justify-between text-white/60 text-xs mb-1.5">
                                            <span>Question {quizStep + 1} of {quizzes.length}</span>
                                            <span>{quizAnswers.filter(Boolean).length} correct</span>
                                        </div>
                                        <div className="w-full bg-white/20 rounded-full h-2">
                                            <motion.div className="bg-[#f5bb00] h-2 rounded-full"
                                                animate={{ width: `${quizProgress}%` }} transition={{ duration: 0.4 }} />
                                        </div>
                                    </>
                                )}
                            </div>

                            {quizDone ? (
                                /* Results screen */
                                <div className="p-8 text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 relative">
                                        <RingProgress pct={(quizScore / quizzes.length) * 100} size={80} stroke={7} color={quizScore >= 4 ? '#059669' : quizScore >= 3 ? '#d97706' : '#ef4444'} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="font-black text-xl text-[#140152]">{quizScore}/{quizzes.length}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-[#140152] mb-2">
                                        {quizScore === 5 ? '🎉 Perfect!' : quizScore >= 4 ? '🌟 Excellent!' : quizScore >= 3 ? '👍 Good!' : '📚 Keep Studying!'}
                                    </h3>
                                    <p className="text-gray-500 mb-6">You scored {quizScore} out of {quizzes.length}. {quizScore === 5 ? 'You nailed it! Your understanding is deep.' : 'Review the passage again to strengthen your grasp.'}</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => startQuiz(quizOpen!)} className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[#140152] text-[#140152] rounded-2xl font-bold hover:bg-gray-50">
                                            <RotateCcw className="w-4 h-4" /> Retake
                                        </button>
                                        <button onClick={() => setQuizOpen(null)} className="flex-1 py-3 bg-[#140152] text-white rounded-2xl font-bold hover:bg-[#1a0270]">Done</button>
                                    </div>
                                </div>
                            ) : (
                                /* Question screen */
                                <div className="p-6 space-y-4">
                                    <AnimatePresence mode="wait">
                                        <motion.div key={quizStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                            <p className="font-black text-[#140152] text-lg mb-5 leading-snug">{quizzes[quizStep]?.q}</p>
                                            <div className="space-y-3">
                                                {quizzes[quizStep]?.options.map((opt, idx) => {
                                                    const isCorrect = idx === quizzes[quizStep].answer
                                                    const isSelected = quizSelected === idx
                                                    const revealed = quizSelected !== null
                                                    let cls = 'border-2 border-gray-200 text-gray-700 hover:border-[#140152]'
                                                    if (revealed && isCorrect) cls = 'border-2 border-green-500 bg-green-50 text-green-800'
                                                    else if (revealed && isSelected && !isCorrect) cls = 'border-2 border-red-400 bg-red-50 text-red-700'
                                                    return (
                                                        <button key={idx} onClick={() => selectQuizAnswer(idx)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-semibold transition-all ${cls}`}>
                                                            <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-black text-xs"
                                                                style={{ borderColor: revealed && isCorrect ? '#059669' : revealed && isSelected && !isCorrect ? '#ef4444' : '#d1d5db' }}>
                                                                {revealed && isCorrect ? <Check className="w-3.5 h-3.5 text-green-600" /> : revealed && isSelected && !isCorrect ? <X className="w-3.5 h-3.5 text-red-500" /> : String.fromCharCode(65 + idx)}
                                                            </span>
                                                            {opt}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                    <button onClick={nextQuizStep} disabled={quizSelected === null}
                                        className="w-full py-3.5 bg-[#140152] text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-[#1a0270] transition-all mt-2">
                                        {quizStep + 1 >= quizzes.length ? 'See Results' : 'Next Question →'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SectionWrapper>

                {/* ══════════════════ MY JOURNEY ══════════════════ */}
                {activeSection === 'journey' && (
                    <div className="space-y-10">
                        <div className="text-center">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Personal Hub</span>
                            <h2 className="text-4xl font-black text-[#140152] dark:text-white mt-2">My Study Journey</h2>
                            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full mt-3" />
                        </div>

                        {/* Daily devotional */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-[#140152] to-purple-900 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-10 pointer-events-none text-9xl font-black text-white select-none">📖</div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlarmClock className="w-4 h-4 text-[#f5bb00]" />
                                    <span className="text-[#f5bb00] text-xs font-bold uppercase tracking-widest">Today's Verse</span>
                                </div>
                                <blockquote className="text-white text-xl font-bold leading-relaxed mb-3 italic">
                                    {todayVerse.text}
                                </blockquote>
                                <p className="text-white/60 font-semibold">— {todayVerse.ref}</p>
                            </div>
                        </motion.div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Day Streak', val: studyState.streak ?? 0, icon: Flame, color: '#f97316', bg: '#fff7ed', suffix: '🔥' },
                                { label: 'Quizzes Done', val: Object.keys(studyState.quizScores ?? {}).length, icon: Brain,   color: '#7c3aed', bg: '#f5f3ff', suffix: `/ ${WEEKLY_TOPICS.length}` },
                                { label: 'Verses Memorised', val: (studyState.memVerses ?? []).filter(v => v.status === 'memorized').length, icon: BookMarked, color: '#059669', bg: '#ecfdf5', suffix: '' },
                                { label: 'Sessions Attended', val: (studyState.attendance ?? []).length, icon: Calendar, color: '#0284c7', bg: '#e0f2fe', suffix: '' },
                            ].map((s, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                                        <s.icon className="w-5 h-5" style={{ color: s.color }} />
                                    </div>
                                    <p className="font-black text-2xl leading-none text-[#140152] dark:text-white">{s.val}<span className="text-sm font-normal text-gray-400 ml-1">{s.suffix}</span></p>
                                    <p className="text-xs text-gray-400 text-center">{s.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Badges */}
                        <div>
                            <h3 className="text-xl font-black text-[#140152] dark:text-white mb-5 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-[#f5bb00]" /> Achievements
                                <span className="text-sm font-normal text-gray-400 ml-1">({earnedBadges.length}/{BADGES.length})</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {BADGES.map((b, i) => {
                                    const earned = b.condition(studyState)
                                    return (
                                        <motion.div key={b.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                            className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all ${earned ? 'border-[#f5bb00] bg-[#f5bb00]/5 shadow-md' : 'border-gray-100 bg-gray-50 dark:bg-neutral-800 opacity-50'}`}>
                                            <span className={`text-3xl ${earned ? '' : 'grayscale'}`}>{b.emoji}</span>
                                            <p className={`text-xs font-bold ${earned ? 'text-[#140152] dark:text-white' : 'text-gray-400'}`}>{b.label}</p>
                                            <p className="text-[10px] text-gray-400 leading-tight">{b.desc}</p>
                                            {earned && <span className="text-[9px] font-bold text-[#f5bb00] bg-[#140152] px-2 py-0.5 rounded-full">EARNED</span>}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Memory Verses */}
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-black text-[#140152] dark:text-white flex items-center gap-2">
                                    <Bookmark className="w-5 h-5 text-[#f5bb00]" /> Scripture Memory
                                </h3>
                                <button onClick={() => setShowAddVerse(p => !p)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#140152] text-white rounded-xl text-sm font-bold hover:bg-[#1a0270] transition-all">
                                    <Plus className="w-4 h-4" /> Add Verse
                                </button>
                            </div>

                            <AnimatePresence>
                                {showAddVerse && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="mb-4 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                                        <input value={newVerse.ref} onChange={e => setNewVerse(p => ({ ...p, ref: e.target.value }))}
                                            placeholder="Scripture reference (e.g. John 3:16)" className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152] transition-colors" />
                                        <textarea value={newVerse.text} onChange={e => setNewVerse(p => ({ ...p, text: e.target.value }))}
                                            placeholder="Type the full verse text…" rows={3} className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152] resize-none transition-colors" />
                                        <div className="flex gap-3">
                                            <button onClick={addVerse} disabled={!newVerse.ref.trim() || !newVerse.text.trim()}
                                                className="px-5 py-2.5 bg-[#140152] text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#1a0270]">Save Verse</button>
                                            <button onClick={() => setShowAddVerse(false)} className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {(studyState.memVerses ?? []).length === 0 ? (
                                <div className="bg-white dark:bg-neutral-800 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
                                    <Bookmark className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                    <p className="text-gray-400 font-semibold">No verses added yet</p>
                                    <p className="text-gray-300 text-sm mt-1">Start building your Scripture memory library</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(studyState.memVerses ?? []).map((v, i) => (
                                        <motion.div key={v.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                            className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${v.status === 'memorized' ? 'bg-green-100' : 'bg-amber-100'}`}>
                                                {v.status === 'memorized' ? <CheckCheck className="w-5 h-5 text-green-600" /> : <Brain className="w-5 h-5 text-amber-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-black text-[#140152] dark:text-white text-sm">{v.ref}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.status === 'memorized' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {v.status === 'memorized' ? '✓ Memorized' : '📚 Learning'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">"{v.text}"</p>
                                            </div>
                                            <div className="flex flex-col gap-1 flex-shrink-0">
                                                <button onClick={() => toggleVerseStatus(v.id)} title={v.status === 'memorized' ? 'Mark as learning' : 'Mark as memorized'}
                                                    className={`p-2 rounded-xl transition-all ${v.status === 'memorized' ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-green-100'}`}>
                                                    {v.status === 'memorized' ? <Unlock className="w-3.5 h-3.5 text-green-600" /> : <Lock className="w-3.5 h-3.5 text-gray-500" />}
                                                </button>
                                                <button onClick={() => removeVerse(v.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-all">
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Attendance Tracker */}
                        <div>
                            <h3 className="text-xl font-black text-[#140152] dark:text-white mb-5 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#f5bb00]" /> Session Attendance
                            </h3>
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex gap-3 mb-5">
                                    <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
                                        className="flex-1 px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152] transition-colors" />
                                    <button onClick={markAttendance} disabled={!attendanceDate}
                                        className="px-5 py-2.5 bg-[#140152] text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#1a0270] flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Mark Present
                                    </button>
                                </div>
                                {(studyState.attendance ?? []).length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-4">No sessions recorded yet</p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {[...(studyState.attendance ?? [])].reverse().map((d, i) => (
                                            <div key={d} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                                                <span className="text-xs font-bold text-green-800">{new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                                <button onClick={() => removeAttendance(d)} className="text-red-400 hover:text-red-600 ml-2">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress toward badge goals */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-black text-[#140152] dark:text-white mb-5 flex items-center gap-2">
                                <Target className="w-5 h-5 text-[#f5bb00]" /> Next Goals
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Complete all quizzes', current: Object.keys(studyState.quizScores ?? {}).length, total: WEEKLY_TOPICS.length, color: '#7c3aed' },
                                    { label: 'Memorise 5 verses',    current: (studyState.memVerses ?? []).filter(v => v.status === 'memorized').length, total: 5, color: '#059669' },
                                    { label: 'Journal 6 topics',    current: Object.keys(studyState.journals ?? {}).filter(k => (studyState.journals ?? {})[k]?.trim()).length, total: 6, color: '#d97706' },
                                    { label: 'Attend 4 sessions',    current: (studyState.attendance ?? []).length, total: 4, color: '#0284c7' },
                                ].map((g, i) => (
                                    <div key={i}>
                                        <div className="flex items-center justify-between text-sm mb-1.5">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{g.label}</span>
                                            <span className="font-black" style={{ color: g.color }}>{Math.min(g.current, g.total)}/{g.total}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <motion.div className="h-full rounded-full"
                                                style={{ background: g.color }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((g.current / g.total) * 100, 100)}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Personal Bible Mentoring — available to all Bible Study users */}
                        <div className="mt-8 scroll-mt-24" id="mentoring">
                            <MentoringSection />
                        </div>
                    </div>
                )}

                {/* ══════════════════ CURRICULUM ══════════════════ */}
                {activeSection === 'curriculum' && (
                    <>
                        <div className="text-center mb-16 space-y-4">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{yearLabel} Curriculum</span>
                            <h2 className="text-4xl md:text-5xl font-black text-[#140152] dark:text-white">Quarterly Themes</h2>
                            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                            <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mt-4">This year we embark on a journey of deeper discipleship, spiritual empowerment, and fruitful living.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                            {(loading ? FALLBACK_THEMES : activeThemes).map((theme) => (
                                <motion.div key={theme.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: theme.id * 0.1 }}>
                                    <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${theme.bgImage})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-b from-[#140152]/90 via-[#140152]/85 to-[#140152]/95" />
                                        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: theme.accent_color }} />
                                        <CardHeader className="space-y-4 relative z-10">
                                            <div className="w-14 h-14 backdrop-blur-sm rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.accent_color}30` }}>
                                                {QUARTER_ICONS[(theme.id - 1) % 4]}
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.accent_color }}>Quarter {theme.id}</span>
                                                <CardTitle className="text-2xl font-bold text-white mt-2 group-hover:text-[#f5bb00] transition-colors">{theme.title}</CardTitle>
                                                <p className="text-sm font-semibold text-gray-300 mt-1">{theme.scripture}</p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <p className="text-gray-200 leading-relaxed">{theme.description}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                        <div className="mb-16">
                            <div className="text-center mb-12">
                                <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">How We Study</span>
                                <h2 className="text-3xl font-black text-[#140152] dark:text-white mt-2">Our Study Approaches</h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {STUDY_METHODS.map((m, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                        className="p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 hover:border-[#f5bb00] hover:shadow-lg transition-all group text-center">
                                        <div className="w-14 h-14 bg-[#140152]/5 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-[#f5bb00]/10 transition-colors">
                                            <m.icon className="w-7 h-7 text-[#140152] group-hover:text-[#f5bb00] transition-colors" />
                                        </div>
                                        <h3 className="font-bold text-[#140152] dark:text-white mb-2">{m.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{m.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                            className="bg-gradient-to-br from-[#140152] to-[#1a0670] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                                <h3 className="text-2xl md:text-3xl font-bold text-[#f5bb00]">Ready to Begin Your Journey?</h3>
                                <p className="text-lg text-gray-200">Join our Bible study community today and experience transformative growth in your faith journey.</p>
                                <Link href="/auth/login">
                                    <Button size="lg" className="bg-[#f5bb00] hover:bg-[#f5bb00]/90 text-[#140152] font-bold text-lg px-8 py-6 rounded-full shadow-xl">
                                        Get Started Now <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-[#f5bb00]" />
                                    <span>Free to join · Instant access · Community support</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* ══════════════════ WEEKLY TOPICS ══════════════════ */}
                {activeSection === 'weekly' && (
                    <>
                        <div className="text-center mb-12">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Current Quarter</span>
                            <h2 className="text-4xl font-black text-[#140152] dark:text-white mt-2">Weekly Study Topics</h2>
                            <p className="text-gray-500 mt-4 max-w-xl mx-auto">Every Tuesday at 6:00 PM. Each week builds on the last.</p>
                        </div>

                        {/* Admin session notes / announcements */}
                        {sessionNotes.length > 0 && (
                            <div className="space-y-3 mb-8">
                                {sessionNotes.map(note => (
                                    <div key={note.id} className={`rounded-2xl border-l-4 p-5 ${note.urgent ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-[#f5bb00] bg-amber-50 dark:bg-amber-900/10'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {note.urgent && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">🔴 Urgent</span>}
                                            <Bell className="w-4 h-4 text-[#f5bb00]" />
                                            <span className="text-xs text-gray-400">{new Date(note.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
                                        </div>
                                        <h4 className="font-black text-[#140152] dark:text-white">{note.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{note.body}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4 mb-16">
                            {activeTopics.map((topic, i) => {
                                const isExpanded = expandedWeek === i
                                const quizScore = studyState.quizScores?.[String(i)]
                                const hasJournal = (studyState.journals?.[String(i)] ?? '').trim().length > 0
                                const topicDiscussions = (studyState.discussions ?? []).filter(d => d.topicId === i)

                                return (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                            {/* Topic header */}
                                            <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpandedWeek(isExpanded ? null : i)}>
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                                                    style={{ backgroundColor: topic.color }}>W{i + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: topic.color }}>{topic.category}</span>
                                                        {quizScore !== undefined && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Quiz: {quizScore}/5</span>}
                                                        {hasJournal && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">✍️ Journalled</span>}
                                                        {topicDiscussions.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">💬 {topicDiscussions.length}</span>}
                                                    </div>
                                                    <h3 className="font-bold text-[#140152] dark:text-white text-lg leading-tight">{topic.title}</h3>
                                                    <p className="text-sm text-gray-500">{topic.verse}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="hidden md:flex items-center gap-1 text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5">
                                                        <Clock className="w-3.5 h-3.5" /> 6:00 PM Tues
                                                    </span>
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                                </div>
                                            </div>

                                            {/* Expanded panel */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                                                        <div className="border-t border-gray-100 dark:border-neutral-700 p-5 bg-gray-50 dark:bg-neutral-700/30 space-y-6">

                                                            {/* Study focus + Discussion Questions */}
                                                            <div className="grid md:grid-cols-3 gap-5">
                                                                <div className="md:col-span-2">
                                                                    <h4 className="font-bold text-[#140152] dark:text-white mb-3">Study Focus</h4>
                                                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                                                                        {topic.study_focus
                                                                            ? topic.study_focus
                                                                            : <>This week we explore <strong>{topic.title}</strong> through <em>{topic.verse}</em>. Come prepared to engage the text, ask questions, and share how this truth applies to your daily walk.</>}
                                                                    </p>
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {topic.video_url && (
                                                                            <a href={topic.video_url} target="_blank" rel="noopener noreferrer"
                                                                                className="inline-flex items-center px-3 py-1.5 bg-[#140152] text-white rounded-lg text-xs font-bold hover:bg-[#1a0270] transition-all">
                                                                                <Play className="w-4 h-4 mr-1" /> Watch Recording
                                                                            </a>
                                                                        )}
                                                                        {topic.notes_url && (
                                                                            <a href={topic.notes_url} target="_blank" rel="noopener noreferrer"
                                                                                className="inline-flex items-center px-3 py-1.5 border border-[#140152] text-[#140152] rounded-lg text-xs font-bold hover:bg-[#140152]/5 transition-all">
                                                                                <Download className="w-4 h-4 mr-1" /> Study Notes
                                                                            </a>
                                                                        )}
                                                                        {QUIZZES[i] && (
                                                                            <button onClick={() => startQuiz(i)}
                                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all">
                                                                                <Brain className="w-3.5 h-3.5" />
                                                                                {quizScore !== undefined ? `Retake Quiz (Best: ${quizScore}/5)` : 'Take Quiz'}
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* Resources */}
                                                                    {(topic.resources?.filter(r => r.url?.trim()).length ?? 0) > 0 && (
                                                                        <div className="mt-4">
                                                                            <h4 className="font-bold text-[#140152] dark:text-white mb-2 text-sm flex items-center gap-1.5"><BookMarked className="w-4 h-4 text-[#f5bb00]" /> Resources</h4>
                                                                            <div className="space-y-1.5">
                                                                                {topic.resources!.filter(r => r.url?.trim()).map((r, ri) => (
                                                                                    <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                                                                                        className="flex items-center gap-2 text-sm text-[#140152] dark:text-blue-300 hover:underline bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-600 rounded-lg px-3 py-2">
                                                                                        {r.type === 'video' ? <Play className="w-3.5 h-3.5 text-red-500" />
                                                                                            : r.type === 'audio' ? <Mic2 className="w-3.5 h-3.5 text-purple-500" />
                                                                                            : r.type === 'link' ? <Globe className="w-3.5 h-3.5 text-blue-500" />
                                                                                            : <Download className="w-3.5 h-3.5 text-green-600" />}
                                                                                        <span className="flex-1">{r.title || r.url}</span>
                                                                                        <span className="text-[9px] font-bold uppercase text-gray-400">{r.type}</span>
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-100 dark:border-neutral-600">
                                                                    <h4 className="font-bold text-[#140152] dark:text-white mb-3 text-sm">Discussion Questions</h4>
                                                                    <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal pl-4">
                                                                        {(topic.discussion_questions?.filter(q => q.trim()).length ?? 0) > 0
                                                                            ? topic.discussion_questions!.filter(q => q.trim()).map((q, qi) => <li key={qi}>{q}</li>)
                                                                            : <>
                                                                                <li>What stands out most in this passage?</li>
                                                                                <li>How does this change your view of God?</li>
                                                                                <li>What one step will you take this week?</li>
                                                                            </>}
                                                                    </ol>
                                                                </div>
                                                            </div>

                                                            {/* Personal Journal */}
                                                            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-600 p-5">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h4 className="font-bold text-[#140152] dark:text-white flex items-center gap-2">
                                                                        <PenLine className="w-4 h-4 text-[#f5bb00]" /> My Journal
                                                                    </h4>
                                                                    {editingJournal !== i ? (
                                                                        <button onClick={() => { setEditingJournal(i); setJournalText(p => ({ ...p, [i]: studyState.journals?.[String(i)] ?? '' })) }}
                                                                            className="flex items-center gap-1.5 text-xs font-bold text-[#140152] hover:text-[#f5bb00] transition-colors">
                                                                            <Pen className="w-3.5 h-3.5" /> {hasJournal ? 'Edit' : 'Add Reflection'}
                                                                        </button>
                                                                    ) : (
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => saveJournal(i)} className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800">
                                                                                <Save className="w-3.5 h-3.5" /> Save
                                                                            </button>
                                                                            <button onClick={() => setEditingJournal(null)} className="text-xs text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {editingJournal === i ? (
                                                                    <textarea value={journalText[i] ?? ''}
                                                                        onChange={e => setJournalText(p => ({ ...p, [i]: e.target.value }))}
                                                                        placeholder={`Write your personal reflection on "${topic.title}"… What did God speak to you? How will you apply it this week?`}
                                                                        rows={5} className="w-full px-4 py-3 border-2 border-[#f5bb00]/40 rounded-xl text-sm focus:outline-none focus:border-[#f5bb00] resize-none transition-colors text-gray-700 dark:text-gray-200 dark:bg-neutral-700" />
                                                                ) : hasJournal ? (
                                                                    <div className="bg-[#f5bb00]/5 border-l-4 border-[#f5bb00] p-4 rounded-r-xl">
                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{studyState.journals?.[String(i)]}</p>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-400 italic">No journal entry yet. Click "Add Reflection" to start writing.</p>
                                                                )}
                                                            </div>

                                                            {/* Discussion */}
                                                            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-600 p-5">
                                                                <h4 className="font-bold text-[#140152] dark:text-white mb-4 flex items-center gap-2">
                                                                    <MessageSquare className="w-4 h-4 text-[#f5bb00]" /> Community Discussion
                                                                    {topicDiscussions.length > 0 && <span className="text-xs font-normal text-gray-400">({topicDiscussions.length})</span>}
                                                                </h4>
                                                                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                                                                    {topicDiscussions.length === 0
                                                                        ? <p className="text-sm text-gray-400 italic">No comments yet. Be the first to share!</p>
                                                                        : topicDiscussions.map(d => (
                                                                            <div key={d.id} className="flex gap-3">
                                                                                <div className="w-7 h-7 rounded-full bg-[#140152] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">Me</div>
                                                                                <div className="flex-1 bg-gray-50 dark:bg-neutral-700 rounded-xl px-3 py-2">
                                                                                    <p className="text-xs text-gray-700 dark:text-gray-300">{d.text}</p>
                                                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(d.createdAt).toLocaleDateString()}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <input value={discText[i] ?? ''}
                                                                        onChange={e => setDiscText(p => ({ ...p, [i]: e.target.value }))}
                                                                        placeholder="Share a thought or insight…"
                                                                        onKeyDown={e => e.key === 'Enter' && postDiscussion(i)}
                                                                        className="flex-1 px-4 py-2 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#140152] transition-colors dark:bg-neutral-700 dark:border-neutral-600 dark:text-white" />
                                                                    <button onClick={() => postDiscussion(i)} disabled={!(discText[i] ?? '').trim()}
                                                                        className="px-4 py-2 bg-[#140152] text-white rounded-xl disabled:opacity-40 hover:bg-[#1a0270] transition-all">
                                                                        <Send className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Reading plan CTA */}
                        <div className="bg-gradient-to-r from-[#140152] to-[#1a0270] rounded-3xl p-10 text-white text-center">
                            <BookOpen className="w-14 h-14 text-[#f5bb00] mx-auto mb-5" />
                            <h3 className="text-2xl font-black mb-3">Want a Full Year Reading Plan?</h3>
                            <p className="text-white/70 mb-7 max-w-md mx-auto">Track your progress through the entire Bible in a structured, manageable way.</p>
                            <Link href="/services/bible-reading">
                                <Button className="bg-[#f5bb00] text-[#140152] font-black px-8 py-4 rounded-xl hover:bg-[#f5bb00]/90">
                                    Start Reading Plan <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </>
                )}

                {/* ══════════════════ STUDY GROUPS ══════════════════ */}
                {activeSection === 'groups' && (
                    <>
                        <div className="text-center mb-12">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Small Groups</span>
                            <h2 className="text-4xl font-black text-[#140152] dark:text-white mt-2">Find Your Study Group</h2>
                            <p className="text-gray-500 mt-4 max-w-xl mx-auto">Smaller groups. Deeper conversations. Stronger community.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 mb-16">
                            {displayGroups.map((g, i) => {
                                const isOpen = g.is_open
                                const joined = joinedGroups.includes(g.id)
                                const groupResources = (g.resources ?? []).filter(r => r.url?.trim())
                                return (
                                <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                    className={`bg-white dark:bg-neutral-800 rounded-2xl p-8 border transition-all group ${joined ? 'border-[#f5bb00] shadow-lg' : 'border-gray-100 hover:shadow-xl hover:border-[#f5bb00]'}`}>
                                    <div className="flex items-start justify-between gap-5 mb-6">
                                        <div className="flex items-start gap-5">
                                            <div className="w-14 h-14 bg-[#140152]/5 group-hover:bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center transition-colors shrink-0">
                                                <Users className="w-7 h-7 text-[#140152] group-hover:text-[#f5bb00] transition-colors" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-[#140152] dark:text-white">{g.name}</h3>
                                                <p className="text-[#f5bb00] font-semibold text-sm">Led by {g.leader}</p>
                                            </div>
                                        </div>
                                        {joined
                                            ? <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Joined</span>
                                            : !isOpen && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full shrink-0">Full</span>}
                                    </div>
                                    <div className="space-y-2 mb-6">
                                        {[{ icon: Clock, text: g.time }, { icon: Users, text: `${g.size + (joined ? 1 : 0)} members` }, { icon: Shield, text: g.level }].map((r, j) => (
                                            <div key={j} className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                                                <r.icon className="w-4 h-4 text-[#f5bb00]" /> {r.text}
                                            </div>
                                        ))}
                                        {g.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 pt-1">{g.description}</p>
                                        )}
                                    </div>

                                    {/* Group resources — revealed to members */}
                                    {joined && groupResources.length > 0 && (
                                        <div className="mb-5 bg-[#f5bb00]/5 border border-[#f5bb00]/20 rounded-xl p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#b45309] mb-2 flex items-center gap-1.5"><BookMarked className="w-3.5 h-3.5" /> Group Resources</p>
                                            <div className="space-y-1.5">
                                                {groupResources.map((r, ri) => (
                                                    <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                                                        download={r.type === 'pdf' || r.type === 'doc' ? true : undefined}
                                                        className="flex items-center gap-2 text-sm text-[#140152] dark:text-blue-300 hover:underline bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-600 rounded-lg px-3 py-2">
                                                        {r.type === 'video' ? <Play className="w-3.5 h-3.5 text-red-500" />
                                                            : r.type === 'audio' ? <Mic2 className="w-3.5 h-3.5 text-purple-500" />
                                                            : r.type === 'link' ? <Globe className="w-3.5 h-3.5 text-blue-500" />
                                                            : <Download className="w-3.5 h-3.5 text-green-600" />}
                                                        <span className="flex-1 truncate">{r.title || r.url}</span>
                                                        {r.meta && <span className="text-[10px] text-gray-400">{r.meta}</span>}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isLoggedIn ? (
                                        <div className="flex gap-2">
                                            {joined && (
                                                <Link href={`/bible-study/groups/${g.id}?name=${encodeURIComponent(g.name)}`} className="flex-1">
                                                    <Button className="w-full bg-[#128c7e] text-white hover:bg-[#0f7a6e] rounded-xl flex items-center justify-center gap-2">
                                                        <MessageCircle className="w-4 h-4" /> Chat
                                                    </Button>
                                                </Link>
                                            )}
                                            <Button onClick={() => toggleGroupJoin(g.id)} disabled={!isOpen && !joined}
                                                className={`flex-1 rounded-xl disabled:opacity-50 ${joined ? 'bg-white border-2 border-[#140152] text-[#140152] hover:bg-gray-50' : 'bg-[#140152] text-white hover:bg-[#1a0270]'}`}>
                                                {joined ? 'Leave' : isOpen ? 'Join' : 'Full'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Link href="/auth/login?next=/bible-study">
                                            <Button disabled={!isOpen} className="w-full bg-[#140152] text-white hover:bg-[#1a0270] rounded-xl disabled:opacity-50">
                                                {isOpen ? 'Sign in to Join' : 'Group Full'}
                                            </Button>
                                        </Link>
                                    )}
                                </motion.div>
                                )
                            })}
                        </div>
                        <div className="bg-gray-50 dark:bg-neutral-800 rounded-3xl p-10 text-center border border-dashed border-gray-300">
                            <Globe className="w-12 h-12 text-[#f5bb00] mx-auto mb-5" />
                            <h3 className="text-2xl font-bold text-[#140152] dark:text-white mb-3">Start a New Group</h3>
                            <p className="text-gray-500 mb-7 max-w-md mx-auto">Have a passion for a particular area of Scripture? Start your own study group with our support.</p>
                            <Link href="/contact"><Button className="bg-[#140152] text-white px-8 py-4 rounded-xl hover:bg-[#1a0270]">Speak with a Leader</Button></Link>
                        </div>
                    </>
                )}

                {/* ══════════════════ RESOURCES ══════════════════ */}
                {activeSection === 'resources' && (
                    <>
                        <div className="text-center mb-12">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Library</span>
                            <h2 className="text-4xl font-black text-[#140152] dark:text-white mt-2">{resourcesHeading}</h2>
                            <p className="text-gray-500 mt-4 max-w-xl mx-auto">{resourcesSubtitle}</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                            {displayResources.map((r, i) => {
                                const ResIcon = r.type === 'video' ? Play : r.type === 'audio' ? Mic2 : Download
                                const colorCls = r.type === 'video' ? 'bg-blue-100 text-blue-600' : r.type === 'audio' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'
                                const actionLabel = r.type === 'pdf' ? 'Download' : r.type === 'video' ? 'Watch' : 'Listen'
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                        className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#f5bb00] transition-all flex flex-col">
                                        <div className={`w-12 h-12 ${colorCls} rounded-xl flex items-center justify-center mb-5`}>
                                            <ResIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-[#140152] dark:text-white mb-2 flex-1">{r.title}</h3>
                                        {r.meta && <p className="text-sm text-gray-400 mb-5">{r.meta}</p>}
                                        {r.url ? (
                                            <a href={r.url} target="_blank" rel="noopener noreferrer" download={r.type === 'pdf' ? true : undefined}>
                                                <Button size="sm" className="w-full bg-[#140152] text-white hover:bg-[#1a0270] rounded-lg">
                                                    {actionLabel}
                                                </Button>
                                            </a>
                                        ) : (
                                            <Button size="sm" disabled className="w-full bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed">
                                                Coming Soon
                                            </Button>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Recommended Tools */}
                        <div className="bg-[#140152] rounded-3xl p-10 mb-12">
                            <h3 className="text-2xl font-black text-white mb-8 text-center">Recommended Bible Study Tools</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {displayTools.map((tool, i) => (
                                    <a key={i} href={tool.href} target="_blank" rel="noopener noreferrer"
                                        className="bg-white/10 hover:bg-white/20 rounded-2xl p-5 transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <Lightbulb className="w-6 h-6 text-[#f5bb00]" />
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tool.tag === 'Free' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>{tool.tag}</span>
                                        </div>
                                        <h4 className="font-bold text-white mb-1 group-hover:text-[#f5bb00] transition-colors">{tool.name}</h4>
                                        <p className="text-xs text-white/60">{tool.desc}</p>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Podcast recommendations */}
                        <div className="bg-white dark:bg-neutral-800 rounded-3xl border border-gray-100 p-8">
                            <h3 className="text-xl font-black text-[#140152] dark:text-white mb-6 flex items-center gap-2">
                                <Mic2 className="w-5 h-5 text-[#f5bb00]" /> Recommended Podcasts
                            </h3>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {displayPodcasts.map((p, i) => {
                                    const inner = (
                                        <>
                                            <div className="w-9 h-9 bg-[#140152]/10 rounded-xl flex items-center justify-center mb-3">
                                                <Mic2 className="w-4 h-4 text-[#140152]" />
                                            </div>
                                            <p className="font-bold text-[#140152] dark:text-white text-sm">{p.name}</p>
                                            <p className="text-xs text-[#f5bb00] font-semibold">{p.host}</p>
                                            <p className="text-xs text-gray-500 mt-1">{p.topic}</p>
                                        </>
                                    )
                                    return ('url' in p && p.url) ? (
                                        <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                                            className="bg-gray-50 dark:bg-neutral-700 rounded-2xl p-4 hover:shadow-md transition-all">{inner}</a>
                                    ) : (
                                        <div key={i} className="bg-gray-50 dark:bg-neutral-700 rounded-2xl p-4">{inner}</div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </SectionWrapper>

            {/* Fixed mobile CTA */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
                <Link href="/auth/register">
                    <Button className="w-full bg-[#140152] text-white font-bold py-4 rounded-xl">Join Bible Study — Free</Button>
                </Link>
            </div>
        </div>
    )
}

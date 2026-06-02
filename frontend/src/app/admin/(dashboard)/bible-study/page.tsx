'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import {
    Book, Settings, Quote, Layers, Save, Pencil, Trash2,
    Plus, ChevronDown, ChevronUp, Loader2, Sparkles, Check, X,
    BarChart2, Users, Calendar, MessageSquare, Bell, BookOpen,
    FileText, Music2, ArrowRight, ExternalLink, AlertCircle,
    RefreshCw, Tag, Clock, ChevronRight, Eye, Star, Globe,
    Palette, Hash, ToggleLeft, ToggleRight,
} from 'lucide-react'
import {
    bibleStudyApi, WeekReflection, QuarterlyTheme, BibleStudyPageSettings,
    BibleStudyWeeklyTopic, BibleStudyGroup, BibleStudySessionNote,
} from '@/lib/api'
import { useToast } from '@/components/ui/toast'

// ── Reading plan weeks ─────────────────────────────────────────────────────────
const READING_PLAN: { week: number; ot: string; nt: string }[] = [
    { week: 1,  ot: 'Genesis 1–3',      nt: 'Matthew 1–2' },
    { week: 2,  ot: 'Genesis 4–7',      nt: 'Matthew 3–4' },
    { week: 3,  ot: 'Genesis 8–11',     nt: 'Matthew 5–7' },
    { week: 4,  ot: 'Genesis 12–15',    nt: 'Matthew 8–9' },
    { week: 5,  ot: 'Genesis 16–19',    nt: 'Matthew 10–11' },
    { week: 6,  ot: 'Genesis 20–23',    nt: 'Matthew 12–13' },
    { week: 7,  ot: 'Genesis 24–27',    nt: 'Matthew 14–15' },
    { week: 8,  ot: 'Genesis 28–31',    nt: 'Matthew 16–17' },
    { week: 9,  ot: 'Genesis 32–36',    nt: 'Matthew 18–19' },
    { week: 10, ot: 'Genesis 37–41',    nt: 'Matthew 20–21' },
    { week: 11, ot: 'Genesis 42–46',    nt: 'Matthew 22–23' },
    { week: 12, ot: 'Genesis 47–50',    nt: 'Matthew 24–25' },
    { week: 13, ot: 'Exodus 1–4',       nt: 'Matthew 26–28' },
    { week: 14, ot: 'Exodus 5–8',       nt: 'Mark 1–3' },
    { week: 15, ot: 'Exodus 9–12',      nt: 'Mark 4–5' },
    { week: 16, ot: 'Exodus 13–16',     nt: 'Mark 6–7' },
    { week: 17, ot: 'Exodus 17–20',     nt: 'Mark 8–9' },
    { week: 18, ot: 'Exodus 21–24',     nt: 'Mark 10–11' },
    { week: 19, ot: 'Exodus 25–28',     nt: 'Mark 12–13' },
    { week: 20, ot: 'Exodus 29–32',     nt: 'Mark 14–16' },
    { week: 21, ot: 'Exodus 33–36',     nt: 'Luke 1–2' },
    { week: 22, ot: 'Exodus 37–40',     nt: 'Luke 3–4' },
    { week: 23, ot: 'Leviticus 1–7',    nt: 'Luke 5–6' },
    { week: 24, ot: 'Leviticus 8–15',   nt: 'Luke 7–8' },
    { week: 25, ot: 'Leviticus 16–22',  nt: 'Luke 9–10' },
    { week: 26, ot: 'Leviticus 23–27',  nt: 'Luke 11–12' },
    { week: 27, ot: 'Numbers 1–8',      nt: 'Luke 13–14' },
    { week: 28, ot: 'Numbers 9–16',     nt: 'John 1–2' },
    { week: 29, ot: 'Numbers 17–24',    nt: 'John 3–5' },
    { week: 30, ot: 'Numbers 25–32',    nt: 'John 6–8' },
    { week: 31, ot: 'Numbers 33–36',    nt: 'John 9–11' },
    { week: 32, ot: 'Deuteronomy 1–7',  nt: 'John 12–14' },
    { week: 33, ot: 'Deuteronomy 8–14', nt: 'Acts 1–4' },
    { week: 34, ot: 'Deuteronomy 15–21',nt: 'Acts 5–8' },
    { week: 35, ot: 'Deuteronomy 22–28',nt: 'Acts 9–12' },
    { week: 36, ot: 'Deuteronomy 29–34',nt: 'Acts 13–16' },
    { week: 37, ot: 'Joshua 1–7',       nt: 'Acts 17–20' },
    { week: 38, ot: 'Joshua 8–14',      nt: 'Acts 21–24' },
    { week: 39, ot: 'Joshua 15–21',     nt: 'Acts 25–28' },
    { week: 40, ot: 'Joshua 22–24',     nt: 'Romans 1–4' },
    { week: 41, ot: 'Judges 1–8',       nt: 'Romans 5–8' },
    { week: 42, ot: 'Judges 9–16',      nt: 'Romans 9–16' },
    { week: 43, ot: 'Judges 17–21',     nt: '1 Cor 1–7' },
    { week: 44, ot: 'Ruth 1–4',         nt: '1 Cor 8–16' },
    { week: 45, ot: '1 Samuel 1–8',     nt: '2 Cor 1–7' },
    { week: 46, ot: '1 Samuel 9–16',    nt: '2 Cor 8–13' },
    { week: 47, ot: '1 Samuel 17–24',   nt: 'Galatians 1–6' },
    { week: 48, ot: '1 Samuel 25–31',   nt: 'Ephesians 1–6' },
    { week: 49, ot: '2 Samuel 1–8',     nt: 'Phil + Col' },
    { week: 50, ot: '2 Samuel 9–16',    nt: '1–2 Thess' },
    { week: 51, ot: '2 Samuel 17–24',   nt: '1–2 Timothy' },
    { week: 52, ot: '1 Kings 1–8',      nt: 'Titus + Phil + Heb 1–6' },
    { week: 53, ot: '1 Kings 9–16',     nt: 'Heb 7–13 + James' },
    { week: 54, ot: '1 Kings 17–22',    nt: '1–2 Pet + 1–3 John + Jude + Rev 1–5' },
]

const ACCENT_PRESETS = [
    { label: 'Gold',   value: '#f5bb00' }, { label: 'Purple', value: '#7c3aed' },
    { label: 'Blue',   value: '#2563eb' }, { label: 'Green',  value: '#059669' },
    { label: 'Red',    value: '#dc2626' }, { label: 'Pink',   value: '#db2777' },
    { label: 'Orange', value: '#ea580c' }, { label: 'Teal',   value: '#0d9488' },
]

const CATEGORY_OPTIONS = ['Foundation', 'Christology', 'Pneumatology', 'Devotional', 'Christian Life', 'Ecclesiology', 'Prophecy', 'Wisdom', 'Prayer', 'Missions', 'Other']

const LEVEL_OPTIONS = ['Open to all', 'Beginners', 'Intermediate', 'Advanced', 'Men only', 'Women only', 'Youth only', 'Married couples']

type Tab = 'overview' | 'topics' | 'groups' | 'notes' | 'plan' | 'reflections' | 'settings'

const DEFAULT_TOPIC: Omit<BibleStudyWeeklyTopic, 'id'> = {
    week: 'Week 1', title: '', verse: '', category: 'Foundation', color: '#7c3aed',
    time: 'Tuesdays 6:00 PM', discussion_questions: ['', '', ''],
}

const DEFAULT_GROUP: Omit<BibleStudyGroup, 'id'> = {
    name: '', leader: '', time: 'Tuesdays 6:00 PM', size: 15, level: 'Open to all',
    is_open: true, contact: '', description: '',
}

const DEFAULT_NOTE: Omit<BibleStudySessionNote, 'id'> = {
    title: '', body: '', date: new Date().toISOString().split('T')[0], urgent: false,
}

// ── helpers ────────────────────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{children}</p>
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BibleStudyAdminPage() {
    const { showToast, ToastComponent } = useToast()
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // ── Data ──
    const [themes, setThemes]         = useState<QuarterlyTheme[]>([])
    const [reflections, setReflections] = useState<WeekReflection[]>([])
    const [settings, setSettings]     = useState<BibleStudyPageSettings | null>(null)

    // Derived JSON content from settings
    const [topics, setTopics]         = useState<BibleStudyWeeklyTopic[]>([])
    const [groups, setGroups]         = useState<BibleStudyGroup[]>([])
    const [notes, setNotes]           = useState<BibleStudySessionNote[]>([])

    // ── Form state ──
    const [editingTheme, setEditingTheme]   = useState<number | null>(null)
    const [themeForm, setThemeForm]         = useState<Partial<QuarterlyTheme>>({})
    const [savingTheme, setSavingTheme]     = useState(false)
    const [seedingThemes, setSeedingThemes] = useState(false)

    const [expandedWeek, setExpandedWeek]   = useState<number | null>(null)
    const [editingWeek, setEditingWeek]     = useState<number | null>(null)
    const [weekForm, setWeekForm]           = useState({ key_verse: '', verse_ref: '', reflection: '' })
    const [savingWeek, setSavingWeek]       = useState(false)

    const [settingsForm, setSettingsForm] = useState({
        hero_title: '', hero_subtitle: '', hero_description: '', hero_background_url: '', year_label: '2026'
    })

    // Topic editing
    const [editingTopicId, setEditingTopicId] = useState<number | string | null>(null)
    const [topicForm, setTopicForm]           = useState<Omit<BibleStudyWeeklyTopic, 'id'>>(DEFAULT_TOPIC)
    const [showAddTopic, setShowAddTopic]     = useState(false)

    // Group editing
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
    const [groupForm, setGroupForm]           = useState<Omit<BibleStudyGroup, 'id'>>(DEFAULT_GROUP)
    const [showAddGroup, setShowAddGroup]     = useState(false)

    // Note editing
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
    const [noteForm, setNoteForm]           = useState<Omit<BibleStudySessionNote, 'id'>>(DEFAULT_NOTE)
    const [showAddNote, setShowAddNote]     = useState(false)

    // ── Load ──────────────────────────────────────────────────────────────────

    const loadAll = useCallback(async () => {
        setLoading(true)
        try {
            const [themesData, reflectionsData, settingsData] = await Promise.all([
                bibleStudyApi.adminGetQuarterlyThemes().catch(() => []),
                bibleStudyApi.adminGetWeekReflections().catch(() => []),
                bibleStudyApi.getSettings().catch(() => null),
            ])
            setThemes(themesData)
            setReflections(reflectionsData)
            if (settingsData) {
                setSettings(settingsData)
                setSettingsForm({
                    hero_title: settingsData.hero_title,
                    hero_subtitle: settingsData.hero_subtitle,
                    hero_description: settingsData.hero_description,
                    hero_background_url: settingsData.hero_background_url || '',
                    year_label: settingsData.year_label || '2026',
                })
                setTopics(settingsData.weekly_topics ?? [])
                setGroups(settingsData.study_groups ?? [])
                setNotes(settingsData.session_notes ?? [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { loadAll() }, [loadAll])

    // ── Persist JSON content to settings ──────────────────────────────────────

    const persistContent = async (patch: {
        weekly_topics?: BibleStudyWeeklyTopic[]
        study_groups?: BibleStudyGroup[]
        session_notes?: BibleStudySessionNote[]
    }) => {
        try {
            await bibleStudyApi.updateSettings(patch)
        } catch {
            showToast('Failed to save changes', 'error')
        }
    }

    // ── Quarterly Themes ──────────────────────────────────────────────────────

    const startEditTheme = (q: number) => {
        const existing = themes.find(t => t.quarter_number === q)
        setThemeForm(existing ?? { quarter_number: q, title: '', theme: '', scripture: '', accent_color: '#f5bb00', week_start: (q - 1) * 13 + 1, week_end: q < 4 ? q * 13 : 54 })
        setEditingTheme(q)
    }
    const saveTheme = async () => {
        if (!editingTheme) return
        setSavingTheme(true)
        try {
            await bibleStudyApi.adminUpsertQuarterlyTheme(editingTheme, themeForm)
            showToast(`Quarter ${editingTheme} theme saved!`, 'success')
            setEditingTheme(null)
            await loadAll()
        } catch { showToast('Failed to save theme', 'error') }
        finally { setSavingTheme(false) }
    }
    const seedThemes = async () => {
        setSeedingThemes(true)
        try {
            const result = await bibleStudyApi.adminSeedDefaultThemes()
            showToast(result.message, 'success')
            await loadAll()
        } catch { showToast('Failed to seed themes', 'error') }
        finally { setSeedingThemes(false) }
    }

    // ── Weekly Reflections ────────────────────────────────────────────────────

    const startEditWeek = (week: number) => {
        const existing = reflections.find(r => r.week_number === week)
        setWeekForm({ key_verse: existing?.key_verse ?? '', verse_ref: existing?.verse_ref ?? '', reflection: existing?.reflection ?? '' })
        setEditingWeek(week)
        setExpandedWeek(week)
    }
    const saveWeek = async () => {
        if (!editingWeek) return
        if (!weekForm.key_verse || !weekForm.verse_ref || !weekForm.reflection) { showToast('All fields are required', 'error'); return }
        setSavingWeek(true)
        try {
            await bibleStudyApi.adminUpsertWeekReflection(editingWeek, weekForm)
            showToast(`Week ${editingWeek} reflection saved!`, 'success')
            setEditingWeek(null)
            await loadAll()
        } catch { showToast('Failed to save reflection', 'error') }
        finally { setSavingWeek(false) }
    }
    const deleteWeek = async (week: number) => {
        if (!confirm(`Remove the reflection for Week ${week}?`)) return
        try {
            await bibleStudyApi.adminDeleteWeekReflection(week)
            showToast(`Week ${week} reflection removed`, 'success')
            await loadAll()
        } catch { showToast('Failed to delete reflection', 'error') }
    }

    // ── Page Settings ─────────────────────────────────────────────────────────

    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await bibleStudyApi.updateSettings(settingsForm)
            showToast('Page settings saved!', 'success')
            await loadAll()
        } catch { showToast('Failed to save settings', 'error') }
        finally { setSaving(false) }
    }

    // ── Weekly Topics CRUD ────────────────────────────────────────────────────

    const saveTopic = async () => {
        if (!topicForm.title || !topicForm.verse) { showToast('Title and verse are required', 'error'); return }
        setSaving(true)
        try {
            let updated: BibleStudyWeeklyTopic[]
            if (showAddTopic) {
                updated = [...topics, { ...topicForm, id: topics.length }]
            } else {
                updated = topics.map(t => t.id === editingTopicId ? { ...topicForm, id: t.id } : t)
            }
            setTopics(updated)
            await persistContent({ weekly_topics: updated })
            showToast(showAddTopic ? 'Topic added!' : 'Topic updated!', 'success')
            setShowAddTopic(false); setEditingTopicId(null); setTopicForm(DEFAULT_TOPIC)
        } catch { /* already toasted */ }
        finally { setSaving(false) }
    }

    const deleteTopic = async (id: number | string) => {
        if (!confirm('Remove this weekly topic?')) return
        const updated = topics.filter(t => t.id !== id)
        setTopics(updated)
        await persistContent({ weekly_topics: updated })
        showToast('Topic removed', 'success')
    }

    const moveTopic = async (id: number | string, dir: -1 | 1) => {
        const idx = topics.findIndex(t => t.id === id)
        if (idx < 0) return
        const newIdx = idx + dir
        if (newIdx < 0 || newIdx >= topics.length) return
        const updated = [...topics]
        ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
        setTopics(updated)
        await persistContent({ weekly_topics: updated })
    }

    // ── Study Groups CRUD ─────────────────────────────────────────────────────

    const saveGroup = async () => {
        if (!groupForm.name || !groupForm.leader) { showToast('Name and leader are required', 'error'); return }
        setSaving(true)
        try {
            let updated: BibleStudyGroup[]
            if (showAddGroup) {
                updated = [...groups, { ...groupForm, id: uid() }]
            } else {
                updated = groups.map(g => g.id === editingGroupId ? { ...groupForm, id: g.id } : g)
            }
            setGroups(updated)
            await persistContent({ study_groups: updated })
            showToast(showAddGroup ? 'Group added!' : 'Group updated!', 'success')
            setShowAddGroup(false); setEditingGroupId(null); setGroupForm(DEFAULT_GROUP)
        } catch { /* already toasted */ }
        finally { setSaving(false) }
    }

    const deleteGroup = async (id: string) => {
        if (!confirm('Remove this study group?')) return
        const updated = groups.filter(g => g.id !== id)
        setGroups(updated)
        await persistContent({ study_groups: updated })
        showToast('Group removed', 'success')
    }

    const toggleGroupOpen = async (id: string) => {
        const updated = groups.map(g => g.id === id ? { ...g, is_open: !g.is_open } : g)
        setGroups(updated)
        await persistContent({ study_groups: updated })
    }

    // ── Session Notes CRUD ────────────────────────────────────────────────────

    const saveNote = async () => {
        if (!noteForm.title || !noteForm.body) { showToast('Title and body are required', 'error'); return }
        setSaving(true)
        try {
            let updated: BibleStudySessionNote[]
            if (showAddNote) {
                updated = [{ ...noteForm, id: uid() }, ...notes]
            } else {
                updated = notes.map(n => n.id === editingNoteId ? { ...noteForm, id: n.id } : n)
            }
            setNotes(updated)
            await persistContent({ session_notes: updated })
            showToast(showAddNote ? 'Note posted!' : 'Note updated!', 'success')
            setShowAddNote(false); setEditingNoteId(null); setNoteForm(DEFAULT_NOTE)
        } catch { /* already toasted */ }
        finally { setSaving(false) }
    }

    const deleteNote = async (id: string) => {
        if (!confirm('Delete this session note?')) return
        const updated = notes.filter(n => n.id !== id)
        setNotes(updated)
        await persistContent({ session_notes: updated })
        showToast('Note deleted', 'success')
    }

    // ── Derived stats ──────────────────────────────────────────────────────────

    const quartersConfigured = themes.length
    const reflectionsSet     = reflections.length

    // ── Tab config ─────────────────────────────────────────────────────────────

    const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { id: 'overview',    label: 'Overview',        icon: <BarChart2 className="w-4 h-4" /> },
        { id: 'topics',      label: 'Weekly Topics',   icon: <Hash className="w-4 h-4" />,     badge: topics.length },
        { id: 'groups',      label: 'Study Groups',    icon: <Users className="w-4 h-4" />,    badge: groups.length },
        { id: 'notes',       label: 'Session Notes',   icon: <Bell className="w-4 h-4" />,     badge: notes.length },
        { id: 'plan',        label: 'Quarterly Plan',  icon: <Layers className="w-4 h-4" />,   badge: quartersConfigured },
        { id: 'reflections', label: 'Reflections',     icon: <Quote className="w-4 h-4" />,    badge: reflectionsSet },
        { id: 'settings',    label: 'Page Settings',   icon: <Settings className="w-4 h-4" /> },
    ]

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#140152] flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Loader2 className="w-7 h-7 animate-spin text-[#f5bb00]" />
                </div>
                <p className="text-sm text-gray-400">Loading Bible Study admin…</p>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 max-w-6xl pb-12">
            <ToastComponent />

            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#140152] flex items-center gap-3">
                        <Book className="w-6 h-6 text-[#f5bb00]" />
                        Bible Study Admin
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage quarterly themes, weekly topics, study groups, session notes and page settings.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/bible-study" target="_blank"
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#140152] border border-gray-200 px-3 py-2 rounded-xl transition-all">
                        <ExternalLink className="w-3.5 h-3.5" /> Preview Page
                    </Link>
                    <button onClick={() => loadAll()} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#140152] border border-gray-200 px-3 py-2 rounded-xl transition-all">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-0">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                            activeTab === tab.id
                                ? 'border-[#140152] text-[#140152] bg-white'
                                : 'border-transparent text-gray-500 hover:text-[#140152] hover:bg-gray-50'
                        }`}>
                        {tab.icon}
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${activeTab === tab.id ? 'bg-[#140152] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══════════ OVERVIEW ═══════════ */}
            {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Quarters Set',     val: quartersConfigured, max: 4,  icon: Layers,   color: '#7c3aed', bg: '#f3e8ff' },
                            { label: 'Weekly Topics',    val: topics.length,      max: 0,  icon: Hash,     color: '#0284c7', bg: '#e0f2fe' },
                            { label: 'Study Groups',     val: groups.length,      max: 0,  icon: Users,    color: '#059669', bg: '#ecfdf5' },
                            { label: 'Week Reflections', val: reflectionsSet,     max: 54, icon: Quote,    color: '#d97706', bg: '#fef3c7' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                                    </div>
                                    {s.max > 0 && (
                                        <span className="text-[10px] font-bold text-gray-400">{s.val}/{s.max}</span>
                                    )}
                                </div>
                                <p className="text-2xl font-black text-[#140152] leading-none">{s.val}</p>
                                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Links to sub-pages */}
                    <div>
                        <h2 className="text-sm font-black text-[#140152] mb-3">Management Sub-Pages</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { href: '/admin/bible-study/plans',    icon: BookOpen,   label: 'Reading Plans',  sub: 'Create & manage plans',  color: '#059669', bg: '#ecfdf5' },
                                { href: '/admin/bible-study/readings', icon: FileText,   label: 'Daily Readings', sub: 'Add readings to plans',  color: '#7c3aed', bg: '#f3e8ff' },
                                { href: '/admin/bible-study/resources',icon: Music2,     label: 'Resources',      sub: 'PDFs, videos, audio',    color: '#0284c7', bg: '#e0f2fe' },
                                { href: '/admin/bible-study/settings', icon: Settings,   label: 'Full Settings',  sub: 'Advanced configuration', color: '#d97706', bg: '#fef3c7' },
                            ].map((l, i) => (
                                <Link key={i} href={l.href}
                                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ background: l.bg }}>
                                        <l.icon className="w-4.5 h-4.5" style={{ color: l.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#140152]">{l.label}</p>
                                        <p className="text-xs text-gray-400">{l.sub}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Action reminders */}
                    <div className="space-y-2">
                        {quartersConfigured < 4 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-amber-800">Quarterly Themes incomplete</p>
                                    <p className="text-xs text-amber-700 mt-0.5">Only {quartersConfigured}/4 quarters configured. Visitors see placeholder themes.</p>
                                </div>
                                <button onClick={() => setActiveTab('plan')} className="text-xs font-bold text-amber-700 hover:text-amber-900 underline flex-shrink-0">
                                    Fix now
                                </button>
                            </div>
                        )}
                        {topics.length === 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-blue-800">No weekly topics set</p>
                                    <p className="text-xs text-blue-700 mt-0.5">Visitors see the built-in hardcoded topics. Add custom ones here.</p>
                                </div>
                                <button onClick={() => setActiveTab('topics')} className="text-xs font-bold text-blue-700 hover:text-blue-900 underline flex-shrink-0">
                                    Add topics
                                </button>
                            </div>
                        )}
                        {groups.length === 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-green-800">No study groups configured</p>
                                    <p className="text-xs text-green-700 mt-0.5">Visitors see placeholder groups. Create real groups here.</p>
                                </div>
                                <button onClick={() => setActiveTab('groups')} className="text-xs font-bold text-green-700 hover:text-green-900 underline flex-shrink-0">
                                    Create groups
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ═══════════ WEEKLY TOPICS ═══════════ */}
            {activeTab === 'topics' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-[#140152]">Weekly Study Topics</h2>
                            <p className="text-xs text-gray-500 mt-0.5">These appear on the public Bible Study page under "Weekly Topics". Drag to reorder.</p>
                        </div>
                        <Button onClick={() => { setShowAddTopic(true); setEditingTopicId(null); setTopicForm(DEFAULT_TOPIC) }}
                            className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-sm">
                            <Plus className="w-4 h-4 mr-1" /> Add Topic
                        </Button>
                    </div>

                    {/* Add form */}
                    <AnimatePresence>
                        {(showAddTopic || editingTopicId !== null) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                                <h3 className="font-bold text-[#140152] text-sm">{showAddTopic ? 'New Weekly Topic' : 'Edit Topic'}</h3>
                                <div className="grid md:grid-cols-3 gap-3">
                                    <div>
                                        <SectionLabel>Week Label</SectionLabel>
                                        <Input value={topicForm.week} onChange={e => setTopicForm(p => ({ ...p, week: e.target.value }))} placeholder="Week 1" className="text-gray-900 text-sm" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <SectionLabel>Topic Title *</SectionLabel>
                                        <Input value={topicForm.title} onChange={e => setTopicForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. The Nature of God" className="text-gray-900 text-sm" />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-3 gap-3">
                                    <div>
                                        <SectionLabel>Scripture Verse *</SectionLabel>
                                        <Input value={topicForm.verse} onChange={e => setTopicForm(p => ({ ...p, verse: e.target.value }))} placeholder="e.g. Exodus 34:6-7" className="text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <SectionLabel>Category</SectionLabel>
                                        <select value={topicForm.category} onChange={e => setTopicForm(p => ({ ...p, category: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#140152] bg-white text-gray-900">
                                            {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <SectionLabel>Session Time</SectionLabel>
                                        <Input value={topicForm.time ?? ''} onChange={e => setTopicForm(p => ({ ...p, time: e.target.value }))} placeholder="Tuesdays 6:00 PM" className="text-gray-900 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <SectionLabel>Accent Color</SectionLabel>
                                    <div className="flex gap-2 flex-wrap mt-1">
                                        {ACCENT_PRESETS.map(p => (
                                            <button key={p.value} title={p.label} onClick={() => setTopicForm(prev => ({ ...prev, color: p.value }))}
                                                className="w-7 h-7 rounded-full border-2 transition-all"
                                                style={{ backgroundColor: p.value, borderColor: topicForm.color === p.value ? '#140152' : 'transparent', transform: topicForm.color === p.value ? 'scale(1.25)' : 'scale(1)' }} />
                                        ))}
                                        <Input type="color" value={topicForm.color} onChange={e => setTopicForm(p => ({ ...p, color: e.target.value }))}
                                            className="w-10 h-7 p-0.5 cursor-pointer rounded-full border-0" />
                                    </div>
                                </div>
                                <div>
                                    <SectionLabel>Discussion Questions (one per line)</SectionLabel>
                                    {(topicForm.discussion_questions ?? ['', '', '']).map((q, qi) => (
                                        <Input key={qi} value={q}
                                            onChange={e => setTopicForm(p => {
                                                const dq = [...(p.discussion_questions ?? ['', '', ''])]
                                                dq[qi] = e.target.value
                                                return { ...p, discussion_questions: dq }
                                            })}
                                            placeholder={`Discussion question ${qi + 1}`}
                                            className="text-gray-900 text-sm mb-2" />
                                    ))}
                                    <button onClick={() => setTopicForm(p => ({ ...p, discussion_questions: [...(p.discussion_questions ?? []), ''] }))}
                                        className="text-xs text-[#140152] hover:underline font-semibold">+ Add question</button>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={saveTopic} disabled={saving} className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-sm">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />} Save Topic
                                    </Button>
                                    <Button variant="outline" onClick={() => { setShowAddTopic(false); setEditingTopicId(null) }} className="text-sm"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {topics.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Hash className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-semibold">No custom topics yet</p>
                            <p className="text-xs text-gray-300 mt-1">The public page shows built-in topics. Add custom ones to override them.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topics.map((topic, i) => (
                                <div key={topic.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                                        style={{ backgroundColor: topic.color }}>{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: topic.color }}>{topic.category}</span>
                                            <span className="text-[10px] text-gray-400">{topic.week}</span>
                                        </div>
                                        <p className="font-bold text-[#140152] truncate">{topic.title}</p>
                                        <p className="text-xs text-gray-500">{topic.verse}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => moveTopic(topic.id, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-gray-500" /></button>
                                        <button onClick={() => moveTopic(topic.id, 1)} disabled={i === topics.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-gray-500" /></button>
                                        <button onClick={() => { setEditingTopicId(topic.id); setShowAddTopic(false); setTopicForm({ week: topic.week, title: topic.title, verse: topic.verse, category: topic.category, color: topic.color, time: topic.time, discussion_questions: topic.discussion_questions }) }}
                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => deleteTopic(topic.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══════════ STUDY GROUPS ═══════════ */}
            {activeTab === 'groups' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-[#140152]">Study Groups</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Groups shown on the public Bible Study page. Members can join via the "Join This Group" button.</p>
                        </div>
                        <Button onClick={() => { setShowAddGroup(true); setEditingGroupId(null); setGroupForm(DEFAULT_GROUP) }}
                            className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-sm">
                            <Plus className="w-4 h-4 mr-1" /> New Group
                        </Button>
                    </div>

                    {/* Add/edit form */}
                    <AnimatePresence>
                        {(showAddGroup || editingGroupId !== null) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4">
                                <h3 className="font-bold text-[#140152] text-sm">{showAddGroup ? 'New Study Group' : 'Edit Group'}</h3>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <SectionLabel>Group Name *</SectionLabel>
                                        <Input value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Young Adults Group" className="text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <SectionLabel>Leader *</SectionLabel>
                                        <Input value={groupForm.leader} onChange={e => setGroupForm(p => ({ ...p, leader: e.target.value }))} placeholder="e.g. Bro. Emmanuel" className="text-gray-900 text-sm" />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-3 gap-3">
                                    <div>
                                        <SectionLabel>Meeting Time</SectionLabel>
                                        <Input value={groupForm.time} onChange={e => setGroupForm(p => ({ ...p, time: e.target.value }))} placeholder="Tuesdays 6:00 PM" className="text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <SectionLabel>Current Size</SectionLabel>
                                        <Input type="number" min={1} value={groupForm.size} onChange={e => setGroupForm(p => ({ ...p, size: parseInt(e.target.value) || 0 }))} className="text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <SectionLabel>Level / Audience</SectionLabel>
                                        <select value={groupForm.level} onChange={e => setGroupForm(p => ({ ...p, level: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-900">
                                            {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <SectionLabel>Contact / WhatsApp</SectionLabel>
                                        <Input value={groupForm.contact ?? ''} onChange={e => setGroupForm(p => ({ ...p, contact: e.target.value }))} placeholder="Optional phone or email" className="text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <SectionLabel>Short Description</SectionLabel>
                                        <Input value={groupForm.description ?? ''} onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))} placeholder="What this group is about" className="text-gray-900 text-sm" />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={groupForm.is_open} onChange={e => setGroupForm(p => ({ ...p, is_open: e.target.checked }))} className="w-4 h-4 rounded" />
                                    <span className="text-sm font-semibold text-gray-700">Open for new members</span>
                                </label>
                                <div className="flex gap-2">
                                    <Button onClick={saveGroup} disabled={saving} className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-sm">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />} Save Group
                                    </Button>
                                    <Button variant="outline" onClick={() => { setShowAddGroup(false); setEditingGroupId(null) }} className="text-sm"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {groups.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-semibold">No groups yet</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {groups.map(group => (
                                <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-[#140152]">{group.name}</h3>
                                            <p className="text-sm text-[#f5bb00] font-semibold">{group.leader}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => toggleGroupOpen(group.id)} title={group.is_open ? 'Close group' : 'Open group'}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${group.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {group.is_open ? 'Open' : 'Closed'}
                                            </button>
                                            <button onClick={() => { setEditingGroupId(group.id); setShowAddGroup(false); setGroupForm({ name: group.name, leader: group.leader, time: group.time, size: group.size, level: group.level, is_open: group.is_open, contact: group.contact, description: group.description }) }}
                                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => deleteGroup(group.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-sm text-gray-600">
                                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-gray-400" /> {group.time}</div>
                                        <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-gray-400" /> {group.size} members · {group.level}</div>
                                        {group.contact && <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-gray-400" /> {group.contact}</div>}
                                        {group.description && <p className="text-xs text-gray-400 mt-1">{group.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══════════ SESSION NOTES ═══════════ */}
            {activeTab === 'notes' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-[#140152]">Session Notes & Announcements</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Post notes for specific Bible Study sessions. Members see these on the study page.</p>
                        </div>
                        <Button onClick={() => { setShowAddNote(true); setEditingNoteId(null); setNoteForm(DEFAULT_NOTE) }}
                            className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-sm">
                            <Plus className="w-4 h-4 mr-1" /> Post Note
                        </Button>
                    </div>

                    {/* Add/edit note form */}
                    <AnimatePresence>
                        {(showAddNote || editingNoteId !== null) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                                <h3 className="font-bold text-[#140152] text-sm">{showAddNote ? 'New Session Note' : 'Edit Note'}</h3>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <SectionLabel>Title *</SectionLabel>
                                        <Input value={noteForm.title} onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. This Week — June 3rd Session" className="text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <SectionLabel>Session Date</SectionLabel>
                                        <Input type="date" value={noteForm.date} onChange={e => setNoteForm(p => ({ ...p, date: e.target.value }))} className="text-gray-900 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <SectionLabel>Note Body *</SectionLabel>
                                    <Textarea value={noteForm.body} onChange={e => setNoteForm(p => ({ ...p, body: e.target.value }))} rows={4}
                                        placeholder="Preparation notes, materials needed, pre-reading, special instructions…" className="text-gray-900 text-sm" />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={noteForm.urgent} onChange={e => setNoteForm(p => ({ ...p, urgent: e.target.checked }))} className="w-4 h-4 rounded" />
                                    <span className="text-sm font-semibold text-red-700">🔴 Mark as urgent</span>
                                </label>
                                <div className="flex gap-2">
                                    <Button onClick={saveNote} disabled={saving} className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-sm">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Bell className="w-4 h-4 mr-1" />} Post Note
                                    </Button>
                                    <Button variant="outline" onClick={() => { setShowAddNote(false); setEditingNoteId(null) }} className="text-sm"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {notes.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-semibold">No session notes yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notes.map(note => (
                                <div key={note.id} className={`bg-white rounded-2xl border-l-4 shadow-sm p-5 ${note.urgent ? 'border-red-500' : 'border-[#f5bb00]'} hover:shadow-md transition-all`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {note.urgent && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">🔴 Urgent</span>}
                                                <span className="text-[10px] text-gray-400">{new Date(note.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                            <h3 className="font-bold text-[#140152]">{note.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{note.body}</p>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button onClick={() => { setEditingNoteId(note.id); setShowAddNote(false); setNoteForm({ title: note.title, body: note.body, date: note.date, urgent: note.urgent }) }}
                                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => deleteNote(note.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══════════ QUARTERLY PLAN ═══════════ */}
            {activeTab === 'plan' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-[#140152]">Quarterly Plan — {settingsForm.year_label}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Define the spiritual theme for each of the 4 quarters.</p>
                        </div>
                        {themes.length === 0 && (
                            <Button onClick={seedThemes} disabled={seedingThemes} className="bg-[#140152] text-white text-sm">
                                {seedingThemes ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />} Seed Defaults
                            </Button>
                        )}
                    </div>
                    <div className="grid gap-4">
                        {[1, 2, 3, 4].map(q => {
                            const theme = themes.find(t => t.quarter_number === q)
                            const isEditing = editingTheme === q
                            return (
                                <Card key={q} className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 text-white"
                                            style={{ backgroundColor: theme?.accent_color ?? '#140152' }}>Q{q}</div>
                                        <div className="flex-1 min-w-0">
                                            {!isEditing ? (
                                                theme ? (
                                                    <>
                                                        <h3 className="font-bold text-[#140152] text-lg">{theme.title}</h3>
                                                        <p className="text-sm text-gray-600">{theme.theme}</p>
                                                        <p className="text-xs text-gray-400 mt-1 italic">{theme.scripture}</p>
                                                        <div className="flex gap-4 text-xs text-gray-400 mt-2">
                                                            <span>Weeks {theme.week_start}–{theme.week_end}</span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: theme.accent_color }} />
                                                                {theme.accent_color}
                                                            </span>
                                                        </div>
                                                        {theme.description && <p className="text-sm text-gray-500 mt-2">{theme.description}</p>}
                                                    </>
                                                ) : <p className="text-gray-400 text-sm italic">No theme set for Quarter {q}</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="grid md:grid-cols-2 gap-3">
                                                        <div><SectionLabel>Quarter Title *</SectionLabel><Input value={themeForm.title || ''} onChange={e => setThemeForm({ ...themeForm, title: e.target.value })} placeholder="e.g. Foundations of Faith" className="text-gray-900 text-sm" /></div>
                                                        <div><SectionLabel>Theme / Subtitle *</SectionLabel><Input value={themeForm.theme || ''} onChange={e => setThemeForm({ ...themeForm, theme: e.target.value })} placeholder="e.g. Creation, Call & Covenant" className="text-gray-900 text-sm" /></div>
                                                    </div>
                                                    <div><SectionLabel>Scripture Anchor *</SectionLabel><Input value={themeForm.scripture || ''} onChange={e => setThemeForm({ ...themeForm, scripture: e.target.value })} placeholder="e.g. Genesis 1:1" className="text-gray-900 text-sm" /></div>
                                                    <div><SectionLabel>Description</SectionLabel><Textarea value={themeForm.description || ''} onChange={e => setThemeForm({ ...themeForm, description: e.target.value })} rows={2} className="text-gray-900 text-sm" /></div>
                                                    <div className="grid md:grid-cols-3 gap-3">
                                                        <div><SectionLabel>Week Start</SectionLabel><Input type="number" min={1} max={54} value={themeForm.week_start || ''} onChange={e => setThemeForm({ ...themeForm, week_start: parseInt(e.target.value) })} className="text-gray-900 text-sm" /></div>
                                                        <div><SectionLabel>Week End</SectionLabel><Input type="number" min={1} max={54} value={themeForm.week_end || ''} onChange={e => setThemeForm({ ...themeForm, week_end: parseInt(e.target.value) })} className="text-gray-900 text-sm" /></div>
                                                        <div>
                                                            <SectionLabel>Accent Color</SectionLabel>
                                                            <div className="flex gap-1 flex-wrap mt-1">
                                                                {ACCENT_PRESETS.map(p => (
                                                                    <button key={p.value} title={p.label} onClick={() => setThemeForm({ ...themeForm, accent_color: p.value })}
                                                                        className="w-6 h-6 rounded-full border-2 transition-all"
                                                                        style={{ backgroundColor: p.value, borderColor: themeForm.accent_color === p.value ? '#140152' : 'transparent', transform: themeForm.accent_color === p.value ? 'scale(1.2)' : 'scale(1)' }} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={saveTheme} disabled={savingTheme} className="bg-[#140152] text-white text-sm">
                                                            {savingTheme ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />} Save Quarter
                                                        </Button>
                                                        <Button variant="outline" onClick={() => setEditingTheme(null)} className="text-sm"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {!isEditing && <Button variant="outline" size="sm" onClick={() => startEditTheme(q)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>}
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* ═══════════ REFLECTIONS ═══════════ */}
            {activeTab === 'reflections' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-sm text-gray-600">
                        Set a key verse and reflection for any of the 54 weeks.
                        <span className="ml-1 font-bold text-[#140152]">{reflections.length} / 54 weeks have custom reflections.</span>
                    </p>
                    <div className="space-y-2">
                        {READING_PLAN.map(({ week, ot, nt }) => {
                            const existing = reflections.find(r => r.week_number === week)
                            const isExpanded = expandedWeek === week
                            const isEditing = editingWeek === week
                            return (
                                <Card key={week} className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-[#140152]/20' : ''}`}>
                                    <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50"
                                        onClick={() => { if (!isEditing) setExpandedWeek(isExpanded ? null : week) }}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${existing ? 'bg-[#140152] text-white' : 'bg-gray-100 text-gray-400'}`}>{week}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-[#140152]">{ot}</span>
                                                <span className="text-gray-300">·</span>
                                                <span className="text-sm text-gray-500">{nt}</span>
                                            </div>
                                            {existing && !isExpanded && <p className="text-xs text-gray-400 truncate mt-0.5">"{existing.key_verse}" — {existing.verse_ref}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {existing && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Custom</span>}
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-100">
                                                <div className="p-4 bg-gray-50/50">
                                                    {!isEditing ? (
                                                        <>
                                                            {existing ? (
                                                                <div className="space-y-2">
                                                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Key Verse</p>
                                                                        <p className="text-sm italic text-gray-800">"{existing.key_verse}"</p>
                                                                        <p className="text-xs text-[#140152] font-semibold mt-1">— {existing.verse_ref}</p>
                                                                    </div>
                                                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reflection</p>
                                                                        <p className="text-sm text-gray-700">{existing.reflection}</p>
                                                                    </div>
                                                                </div>
                                                            ) : <p className="text-sm text-gray-400 italic">No custom reflection — using built-in default.</p>}
                                                            <div className="flex gap-2 mt-3">
                                                                <Button size="sm" onClick={() => startEditWeek(week)} className="bg-[#140152] text-white text-xs"><Pencil className="w-3 h-3 mr-1" />{existing ? 'Edit' : 'Add'}</Button>
                                                                {existing && <Button size="sm" variant="outline" onClick={() => deleteWeek(week)} className="text-red-500 border-red-200 text-xs"><Trash2 className="w-3 h-3 mr-1" />Remove</Button>}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div><SectionLabel>Key Verse *</SectionLabel><Textarea value={weekForm.key_verse} onChange={e => setWeekForm({ ...weekForm, key_verse: e.target.value })} rows={2} className="text-gray-900 text-sm" /></div>
                                                            <div><SectionLabel>Verse Reference *</SectionLabel><Input value={weekForm.verse_ref} onChange={e => setWeekForm({ ...weekForm, verse_ref: e.target.value })} placeholder="e.g. Genesis 1:1" className="text-gray-900 text-sm" /></div>
                                                            <div><SectionLabel>Reflection *</SectionLabel><Textarea value={weekForm.reflection} onChange={e => setWeekForm({ ...weekForm, reflection: e.target.value })} rows={3} className="text-gray-900 text-sm" /></div>
                                                            <div className="flex gap-2">
                                                                <Button size="sm" onClick={saveWeek} disabled={savingWeek} className="bg-[#140152] text-white text-xs">{savingWeek ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Save</Button>
                                                                <Button size="sm" variant="outline" onClick={() => setEditingWeek(null)} className="text-xs">Cancel</Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* ═══════════ PAGE SETTINGS ═══════════ */}
            {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
                    <Card className="p-6">
                        <h2 className="text-lg font-black text-[#140152] mb-5">Page Settings</h2>
                        <form onSubmit={saveSettings} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <SectionLabel>Year Label *</SectionLabel>
                                    <Input value={settingsForm.year_label} onChange={e => setSettingsForm({ ...settingsForm, year_label: e.target.value })} placeholder="2026" required className="text-gray-900" />
                                    <p className="text-xs text-gray-400 mt-1">Shown as "2026 Curriculum" on the page</p>
                                </div>
                                <div>
                                    <SectionLabel>Hero Title *</SectionLabel>
                                    <Input value={settingsForm.hero_title} onChange={e => setSettingsForm({ ...settingsForm, hero_title: e.target.value })} required className="text-gray-900" />
                                </div>
                            </div>
                            <div>
                                <SectionLabel>Hero Subtitle *</SectionLabel>
                                <Input value={settingsForm.hero_subtitle} onChange={e => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })} required className="text-gray-900" />
                            </div>
                            <div>
                                <SectionLabel>Hero Description *</SectionLabel>
                                <Textarea value={settingsForm.hero_description} onChange={e => setSettingsForm({ ...settingsForm, hero_description: e.target.value })} rows={3} required className="text-gray-900" />
                            </div>
                            <div>
                                <SectionLabel>Hero Background Image URL</SectionLabel>
                                <Input type="url" value={settingsForm.hero_background_url} onChange={e => setSettingsForm({ ...settingsForm, hero_background_url: e.target.value })} placeholder="https://..." className="text-gray-900" />
                            </div>
                            {/* Live preview */}
                            <div className="rounded-xl overflow-hidden"
                                style={{ background: settingsForm.hero_background_url ? `linear-gradient(rgba(20,1,82,0.85), rgba(20,1,82,0.85)), url(${settingsForm.hero_background_url}) center/cover` : 'linear-gradient(135deg,#140152,#220263)' }}>
                                <div className="p-6 text-white text-center">
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#f5bb00] mb-2">{settingsForm.year_label} Curriculum</p>
                                    <h3 className="text-2xl font-black">{settingsForm.hero_title || 'Hero Title'}</h3>
                                    <p className="text-[#f5bb00] font-bold mt-1">{settingsForm.hero_subtitle || 'Hero Subtitle'}</p>
                                    <p className="text-white/70 text-sm mt-2">{settingsForm.hero_description || 'Description preview'}</p>
                                </div>
                            </div>
                            <Button type="submit" disabled={saving} className="w-full bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] font-bold">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Settings
                            </Button>
                        </form>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}

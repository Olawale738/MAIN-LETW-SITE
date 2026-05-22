'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Book, Settings, Quote, Layers, Save, Pencil, Trash2,
    Plus, ChevronDown, ChevronUp, Loader2, Sparkles, Check, X
} from 'lucide-react'
import { bibleStudyApi, WeekReflection, QuarterlyTheme, BibleStudyPageSettings } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

// ─── Reading plan reference (for the weekly reflections list) ────────────────
const READING_PLAN: { week: number; ot: string; nt: string }[] = [
    { week: 1, ot: 'Genesis 1–3', nt: 'Matthew 1–2' },
    { week: 2, ot: 'Genesis 4–7', nt: 'Matthew 3–4' },
    { week: 3, ot: 'Genesis 8–11', nt: 'Matthew 5–7' },
    { week: 4, ot: 'Genesis 12–15', nt: 'Matthew 8–9' },
    { week: 5, ot: 'Genesis 16–19', nt: 'Matthew 10–11' },
    { week: 6, ot: 'Genesis 20–23', nt: 'Matthew 12–13' },
    { week: 7, ot: 'Genesis 24–27', nt: 'Matthew 14–15' },
    { week: 8, ot: 'Genesis 28–31', nt: 'Matthew 16–17' },
    { week: 9, ot: 'Genesis 32–36', nt: 'Matthew 18–19' },
    { week: 10, ot: 'Genesis 37–41', nt: 'Matthew 20–21' },
    { week: 11, ot: 'Genesis 42–46', nt: 'Matthew 22–23' },
    { week: 12, ot: 'Genesis 47–50', nt: 'Matthew 24–25' },
    { week: 13, ot: 'Exodus 1–4', nt: 'Matthew 26–28' },
    { week: 14, ot: 'Exodus 5–8', nt: 'Mark 1–3' },
    { week: 15, ot: 'Exodus 9–12', nt: 'Mark 4–5' },
    { week: 16, ot: 'Exodus 13–16', nt: 'Mark 6–7' },
    { week: 17, ot: 'Exodus 17–20', nt: 'Mark 8–9' },
    { week: 18, ot: 'Exodus 21–24', nt: 'Mark 10–11' },
    { week: 19, ot: 'Exodus 25–28', nt: 'Mark 12–13' },
    { week: 20, ot: 'Exodus 29–32', nt: 'Mark 14–16' },
    { week: 21, ot: 'Exodus 33–36', nt: 'Luke 1–2' },
    { week: 22, ot: 'Exodus 37–40', nt: 'Luke 3–4' },
    { week: 23, ot: 'Leviticus 1–7', nt: 'Luke 5–6' },
    { week: 24, ot: 'Leviticus 8–15', nt: 'Luke 7–8' },
    { week: 25, ot: 'Leviticus 16–22', nt: 'Luke 9–10' },
    { week: 26, ot: 'Leviticus 23–27', nt: 'Luke 11–12' },
    { week: 27, ot: 'Numbers 1–8', nt: 'Luke 13–14' },
    { week: 28, ot: 'Numbers 9–16', nt: 'John 1–2' },
    { week: 29, ot: 'Numbers 17–24', nt: 'John 3–5' },
    { week: 30, ot: 'Numbers 25–32', nt: 'John 6–8' },
    { week: 31, ot: 'Numbers 33–36', nt: 'John 9–11' },
    { week: 32, ot: 'Deuteronomy 1–7', nt: 'John 12–14' },
    { week: 33, ot: 'Deuteronomy 8–14', nt: 'Acts 1–4' },
    { week: 34, ot: 'Deuteronomy 15–21', nt: 'Acts 5–8' },
    { week: 35, ot: 'Deuteronomy 22–28', nt: 'Acts 9–12' },
    { week: 36, ot: 'Deuteronomy 29–34', nt: 'Acts 13–16' },
    { week: 37, ot: 'Joshua 1–7', nt: 'Acts 17–20' },
    { week: 38, ot: 'Joshua 8–14', nt: 'Acts 21–24' },
    { week: 39, ot: 'Joshua 15–21', nt: 'Acts 25–28' },
    { week: 40, ot: 'Joshua 22–24', nt: 'Romans 1–4' },
    { week: 41, ot: 'Judges 1–8', nt: 'Romans 5–8' },
    { week: 42, ot: 'Judges 9–16', nt: 'Romans 9–16' },
    { week: 43, ot: 'Judges 17–21', nt: '1 Cor 1–7' },
    { week: 44, ot: 'Ruth 1–4', nt: '1 Cor 8–16' },
    { week: 45, ot: '1 Samuel 1–8', nt: '2 Cor 1–7' },
    { week: 46, ot: '1 Samuel 9–16', nt: '2 Cor 8–13' },
    { week: 47, ot: '1 Samuel 17–24', nt: 'Galatians 1–6' },
    { week: 48, ot: '1 Samuel 25–31', nt: 'Ephesians 1–6' },
    { week: 49, ot: '2 Samuel 1–8', nt: 'Philippians + Colossians' },
    { week: 50, ot: '2 Samuel 9–16', nt: '1–2 Thess' },
    { week: 51, ot: '2 Samuel 17–24', nt: '1–2 Timothy' },
    { week: 52, ot: '1 Kings 1–8', nt: 'Titus + Philemon + Hebrews 1–6' },
    { week: 53, ot: '1 Kings 9–16', nt: 'Hebrews 7–13 + James' },
    { week: 54, ot: '1 Kings 17–22', nt: '1–2 Peter + 1–3 John + Jude + Rev 1–5' },
]

type Tab = 'quarters' | 'reflections' | 'settings'

const ACCENT_PRESETS = [
    { label: 'Gold', value: '#f5bb00' },
    { label: 'Green', value: '#4ade80' },
    { label: 'Blue', value: '#60a5fa' },
    { label: 'Pink', value: '#f472b6' },
    { label: 'Orange', value: '#fb923c' },
    { label: 'Purple', value: '#a78bfa' },
]

export default function BibleStudyAdminPage() {
    const { showToast, ToastComponent } = useToast()
    const [activeTab, setActiveTab] = useState<Tab>('quarters')

    // ── Quarterly themes state ────────────────────────────────────────────────
    const [themes, setThemes] = useState<QuarterlyTheme[]>([])
    const [editingTheme, setEditingTheme] = useState<number | null>(null)
    const [themeForm, setThemeForm] = useState<Partial<QuarterlyTheme>>({})
    const [savingTheme, setSavingTheme] = useState(false)
    const [seedingThemes, setSeedingThemes] = useState(false)

    // ── Week reflections state ────────────────────────────────────────────────
    const [reflections, setReflections] = useState<WeekReflection[]>([])
    const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
    const [editingWeek, setEditingWeek] = useState<number | null>(null)
    const [weekForm, setWeekForm] = useState({ key_verse: '', verse_ref: '', reflection: '' })
    const [savingWeek, setSavingWeek] = useState(false)

    // ── Page settings state ────────────────────────────────────────────────────
    const [settings, setSettings] = useState<BibleStudyPageSettings | null>(null)
    const [settingsForm, setSettingsForm] = useState({
        hero_title: '', hero_subtitle: '', hero_description: '', hero_background_url: '', year_label: '2026'
    })
    const [savingSettings, setSavingSettings] = useState(false)

    const [loading, setLoading] = useState(true)

    // ── Load all data ─────────────────────────────────────────────────────────
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
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadAll() }, [loadAll])

    // ── Quarterly themes handlers ─────────────────────────────────────────────
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
        } catch {
            showToast('Failed to save theme', 'error')
        } finally {
            setSavingTheme(false)
        }
    }

    const seedThemes = async () => {
        setSeedingThemes(true)
        try {
            const result = await bibleStudyApi.adminSeedDefaultThemes()
            showToast(result.message, 'success')
            await loadAll()
        } catch {
            showToast('Failed to seed themes', 'error')
        } finally {
            setSeedingThemes(false)
        }
    }

    // ── Week reflection handlers ──────────────────────────────────────────────
    const startEditWeek = (week: number) => {
        const existing = reflections.find(r => r.week_number === week)
        setWeekForm({
            key_verse: existing?.key_verse ?? '',
            verse_ref: existing?.verse_ref ?? '',
            reflection: existing?.reflection ?? '',
        })
        setEditingWeek(week)
        setExpandedWeek(week)
    }

    const saveWeek = async () => {
        if (!editingWeek) return
        if (!weekForm.key_verse || !weekForm.verse_ref || !weekForm.reflection) {
            showToast('All fields are required', 'error')
            return
        }
        setSavingWeek(true)
        try {
            await bibleStudyApi.adminUpsertWeekReflection(editingWeek, weekForm)
            showToast(`Week ${editingWeek} reflection saved!`, 'success')
            setEditingWeek(null)
            await loadAll()
        } catch {
            showToast('Failed to save reflection', 'error')
        } finally {
            setSavingWeek(false)
        }
    }

    const deleteWeek = async (week: number) => {
        if (!confirm(`Remove the reflection for Week ${week}?`)) return
        try {
            await bibleStudyApi.adminDeleteWeekReflection(week)
            showToast(`Week ${week} reflection removed`, 'success')
            await loadAll()
        } catch {
            showToast('Failed to delete reflection', 'error')
        }
    }

    // ── Page settings handlers ────────────────────────────────────────────────
    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingSettings(true)
        try {
            await bibleStudyApi.updateSettings(settingsForm)
            showToast('Page settings saved!', 'success')
            await loadAll()
        } catch {
            showToast('Failed to save settings', 'error')
        } finally {
            setSavingSettings(false)
        }
    }

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'quarters', label: 'Quarterly Themes', icon: <Layers className="w-4 h-4" /> },
        { id: 'reflections', label: 'Weekly Reflections', icon: <Quote className="w-4 h-4" /> },
        { id: 'settings', label: 'Page Settings', icon: <Settings className="w-4 h-4" /> },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-5xl">
            <ToastComponent />

            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3">
                        <Book className="w-8 h-8 text-[#f5bb00]" />
                        Bible Study Admin
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Control the quarterly themes, weekly reflections, and page content your congregation sees.
                    </p>
                </div>
            </div>

            {/* Tab nav */}
            <div className="flex gap-2 border-b border-gray-200 pb-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                            activeTab === tab.id
                                ? 'border-[#140152] text-[#140152] bg-white'
                                : 'border-transparent text-gray-500 hover:text-[#140152] hover:bg-gray-50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: Quarterly Themes ── */}
            {activeTab === 'quarters' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-600 text-sm">
                            Define the spiritual theme for each quarter of the year. These appear as section headers in the reading plan.
                        </p>
                        {themes.length === 0 && (
                            <Button
                                onClick={seedThemes}
                                disabled={seedingThemes}
                                className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-sm"
                            >
                                {seedingThemes ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Seed Defaults
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
                                        {/* Quarter badge */}
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 text-white"
                                            style={{ backgroundColor: theme?.accent_color ?? '#140152' }}
                                        >
                                            Q{q}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {!isEditing ? (
                                                <>
                                                    {theme ? (
                                                        <>
                                                            <h3 className="font-bold text-[#140152] text-lg">{theme.title}</h3>
                                                            <p className="text-sm text-gray-600 font-medium">{theme.theme}</p>
                                                            <p className="text-xs text-gray-400 mt-1 italic">{theme.scripture}</p>
                                                            <div className="flex gap-4 text-xs text-gray-400 mt-2">
                                                                <span>Weeks {theme.week_start}–{theme.week_end}</span>
                                                                <span className="flex items-center gap-1">
                                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent_color }} />
                                                                    {theme.accent_color}
                                                                </span>
                                                            </div>
                                                            {theme.description && (
                                                                <p className="text-sm text-gray-500 mt-2">{theme.description}</p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p className="text-gray-400 text-sm italic">No theme set for Quarter {q}</p>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="space-y-3 mt-1">
                                                    <div className="grid md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Quarter Title *</label>
                                                            <Input
                                                                value={themeForm.title || ''}
                                                                onChange={e => setThemeForm({ ...themeForm, title: e.target.value })}
                                                                placeholder="e.g. Foundations of Faith"
                                                                className="text-gray-900 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Theme / Subtitle *</label>
                                                            <Input
                                                                value={themeForm.theme || ''}
                                                                onChange={e => setThemeForm({ ...themeForm, theme: e.target.value })}
                                                                placeholder="e.g. Creation, Call & Covenant"
                                                                className="text-gray-900 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Scripture Anchor *</label>
                                                        <Input
                                                            value={themeForm.scripture || ''}
                                                            onChange={e => setThemeForm({ ...themeForm, scripture: e.target.value })}
                                                            placeholder="e.g. In the beginning God created…"
                                                            className="text-gray-900 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Description (optional)</label>
                                                        <Textarea
                                                            value={themeForm.description || ''}
                                                            onChange={e => setThemeForm({ ...themeForm, description: e.target.value })}
                                                            rows={2}
                                                            className="text-gray-900 text-sm"
                                                        />
                                                    </div>
                                                    <div className="grid md:grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Week Start</label>
                                                            <Input
                                                                type="number" min={1} max={54}
                                                                value={themeForm.week_start || ''}
                                                                onChange={e => setThemeForm({ ...themeForm, week_start: parseInt(e.target.value) })}
                                                                className="text-gray-900 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Week End</label>
                                                            <Input
                                                                type="number" min={1} max={54}
                                                                value={themeForm.week_end || ''}
                                                                onChange={e => setThemeForm({ ...themeForm, week_end: parseInt(e.target.value) })}
                                                                className="text-gray-900 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Accent Color</label>
                                                            <div className="flex gap-1 flex-wrap mt-1">
                                                                {ACCENT_PRESETS.map(p => (
                                                                    <button
                                                                        key={p.value}
                                                                        title={p.label}
                                                                        onClick={() => setThemeForm({ ...themeForm, accent_color: p.value })}
                                                                        className="w-6 h-6 rounded-full border-2 transition-all"
                                                                        style={{
                                                                            backgroundColor: p.value,
                                                                            borderColor: themeForm.accent_color === p.value ? '#140152' : 'transparent',
                                                                            transform: themeForm.accent_color === p.value ? 'scale(1.2)' : 'scale(1)',
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <Button onClick={saveTheme} disabled={savingTheme} className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-sm">
                                                            {savingTheme ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                                            Save Quarter
                                                        </Button>
                                                        <Button variant="outline" onClick={() => setEditingTheme(null)} className="text-sm">
                                                            <X className="w-4 h-4 mr-2" /> Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {!isEditing && (
                                            <Button
                                                variant="outline" size="sm"
                                                onClick={() => startEditTheme(q)}
                                                className="flex-shrink-0"
                                            >
                                                <Pencil className="w-4 h-4 mr-1" /> Edit
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* ── TAB: Weekly Reflections ── */}
            {activeTab === 'reflections' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-gray-600 text-sm">
                        Set a key verse and reflection prompt for any week. Weeks without a custom reflection will fall back to the built-in defaults.
                        <span className="ml-2 font-semibold text-[#140152]">{reflections.length} / 54 weeks have custom reflections.</span>
                    </p>

                    <div className="space-y-2">
                        {READING_PLAN.map(({ week, ot, nt }) => {
                            const existing = reflections.find(r => r.week_number === week)
                            const isExpanded = expandedWeek === week
                            const isEditing = editingWeek === week

                            return (
                                <Card key={week} className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-[#140152]/20' : ''}`}>
                                    {/* Row header */}
                                    <button
                                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            if (!isEditing) setExpandedWeek(isExpanded ? null : week)
                                        }}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                            existing ? 'bg-[#140152] text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {week}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-[#140152]">{ot}</span>
                                                <span className="text-gray-300">·</span>
                                                <span className="text-sm text-gray-500">{nt}</span>
                                            </div>
                                            {existing && !isExpanded && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                                    &ldquo;{existing.key_verse}&rdquo; — {existing.verse_ref}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {existing && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                    Custom
                                                </span>
                                            )}
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </button>

                                    {/* Expanded content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-gray-100"
                                            >
                                                <div className="p-4 bg-gray-50/50">
                                                    {!isEditing ? (
                                                        <>
                                                            {existing ? (
                                                                <div className="space-y-2">
                                                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Key Verse</p>
                                                                        <p className="text-sm text-gray-800 italic">&ldquo;{existing.key_verse}&rdquo;</p>
                                                                        <p className="text-xs text-[#140152] font-semibold mt-1">— {existing.verse_ref}</p>
                                                                    </div>
                                                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reflection Prompt</p>
                                                                        <p className="text-sm text-gray-700">{existing.reflection}</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-400 italic">No custom reflection set — using built-in default.</p>
                                                            )}
                                                            <div className="flex gap-2 mt-3">
                                                                <Button size="sm" onClick={() => startEditWeek(week)} className="bg-[#140152] text-white hover:bg-[#140152]/90 text-xs">
                                                                    <Pencil className="w-3 h-3 mr-1" /> {existing ? 'Edit' : 'Add'} Reflection
                                                                </Button>
                                                                {existing && (
                                                                    <Button size="sm" variant="outline" onClick={() => deleteWeek(week)} className="text-red-500 border-red-200 hover:bg-red-50 text-xs">
                                                                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Key Verse *</label>
                                                                <Textarea
                                                                    value={weekForm.key_verse}
                                                                    onChange={e => setWeekForm({ ...weekForm, key_verse: e.target.value })}
                                                                    placeholder="e.g. In the beginning God created the heavens and the earth."
                                                                    rows={2}
                                                                    className="text-gray-900 text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Verse Reference *</label>
                                                                <Input
                                                                    value={weekForm.verse_ref}
                                                                    onChange={e => setWeekForm({ ...weekForm, verse_ref: e.target.value })}
                                                                    placeholder="e.g. Genesis 1:1"
                                                                    className="text-gray-900 text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Reflection Prompt *</label>
                                                                <Textarea
                                                                    value={weekForm.reflection}
                                                                    onChange={e => setWeekForm({ ...weekForm, reflection: e.target.value })}
                                                                    placeholder="A question or thought to guide the reader's meditation on this week's passage..."
                                                                    rows={3}
                                                                    className="text-gray-900 text-sm"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2 pt-1">
                                                                <Button size="sm" onClick={saveWeek} disabled={savingWeek} className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] text-xs">
                                                                    {savingWeek ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                                                                    Save Reflection
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => setEditingWeek(null)} className="text-xs">
                                                                    Cancel
                                                                </Button>
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

            {/* ── TAB: Page Settings ── */}
            {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-[#140152] mb-5">Page Settings</h2>
                        <form onSubmit={saveSettings} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Year Label *</label>
                                    <Input
                                        value={settingsForm.year_label}
                                        onChange={e => setSettingsForm({ ...settingsForm, year_label: e.target.value })}
                                        placeholder="2026"
                                        required
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Shown as &quot;2026 Curriculum&quot; on the reading page</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Hero Title *</label>
                                    <Input
                                        value={settingsForm.hero_title}
                                        onChange={e => setSettingsForm({ ...settingsForm, hero_title: e.target.value })}
                                        required
                                        className="text-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Hero Subtitle *</label>
                                <Input
                                    value={settingsForm.hero_subtitle}
                                    onChange={e => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })}
                                    required
                                    className="text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Hero Description *</label>
                                <Textarea
                                    value={settingsForm.hero_description}
                                    onChange={e => setSettingsForm({ ...settingsForm, hero_description: e.target.value })}
                                    rows={3}
                                    required
                                    className="text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Hero Background Image URL</label>
                                <Input
                                    type="url"
                                    value={settingsForm.hero_background_url}
                                    onChange={e => setSettingsForm({ ...settingsForm, hero_background_url: e.target.value })}
                                    placeholder="https://..."
                                    className="text-gray-900"
                                />
                            </div>

                            {/* Live preview */}
                            <div className="mt-2 rounded-xl overflow-hidden"
                                style={{
                                    background: settingsForm.hero_background_url
                                        ? `linear-gradient(rgba(20,1,82,0.85), rgba(20,1,82,0.85)), url(${settingsForm.hero_background_url}) center/cover`
                                        : 'linear-gradient(135deg, #140152, #220263)',
                                }}>
                                <div className="p-6 text-white text-center">
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#f5bb00] mb-2">{settingsForm.year_label} Curriculum</p>
                                    <h3 className="text-2xl font-black">{settingsForm.hero_title || 'Hero Title'}</h3>
                                    <p className="text-[#f5bb00] font-bold mt-1">{settingsForm.hero_subtitle || 'Hero Subtitle'}</p>
                                    <p className="text-white/70 text-sm mt-2">{settingsForm.hero_description || 'Description preview'}</p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={savingSettings}
                                className="w-full bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] font-bold"
                            >
                                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Settings
                            </Button>
                        </form>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Settings, ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, BookOpen, Brain, Sparkles, CheckCircle2 } from 'lucide-react'
import {
    bibleStudyApi, BibleStudyPageSettings, BibleStudyPageSettingsUpdate,
    BibleStudyWeeklyTopic, BibleStudyImpactStat, BibleStudyQuizQuestion
} from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

export default function BibleStudySettingsAdmin() {
    const { showToast, ToastComponent } = useToast()
    const [settings, setSettings] = useState<BibleStudyPageSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<BibleStudyPageSettingsUpdate>({
        hero_title: '',
        hero_subtitle: '',
        hero_description: '',
        hero_background_url: ''
    })
    const [topics, setTopics] = useState<BibleStudyWeeklyTopic[]>([])
    const [impactStats, setImpactStats] = useState<BibleStudyImpactStat[]>([])
    const [expandedTopic, setExpandedTopic] = useState<number | null>(null)
    const [expandedQuizTopic, setExpandedQuizTopic] = useState<number | null>(null)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const data = await bibleStudyApi.getSettings()
            setSettings(data)
            setFormData({
                hero_title: data.hero_title,
                hero_subtitle: data.hero_subtitle,
                hero_description: data.hero_description,
                hero_background_url: data.hero_background_url || ''
            })
            setTopics(Array.isArray(data.weekly_topics) ? data.weekly_topics : [])
            setImpactStats(Array.isArray(data.impact_stats) ? data.impact_stats : [])
        } catch (error) {
            console.error('Failed to fetch settings:', error)
            showToast('Failed to load settings', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Helper updaters for topics / quizzes / stats
    const updateTopic = (idx: number, patch: Partial<BibleStudyWeeklyTopic>) => {
        setTopics(prev => prev.map((t, i) => i === idx ? { ...t, ...patch } : t))
    }
    const addTopic = () => {
        setTopics(prev => [...prev, {
            id: prev.length,
            week: `W${prev.length + 1}`,
            title: 'New topic',
            verse: '',
            category: 'General',
            color: '#7c3aed',
            time: '6:00 PM Tues',
            study_focus: '',
            discussion_questions: [],
            quiz: [],
        }])
    }
    const removeTopic = (idx: number) => setTopics(prev => prev.filter((_, i) => i !== idx))
    const moveTopic = (idx: number, dir: -1 | 1) => {
        const j = idx + dir
        if (j < 0 || j >= topics.length) return
        const next = [...topics]
        ;[next[idx], next[j]] = [next[j], next[idx]]
        setTopics(next)
    }
    const updateQuiz = (topicIdx: number, qIdx: number, patch: Partial<BibleStudyQuizQuestion>) => {
        setTopics(prev => prev.map((t, i) => {
            if (i !== topicIdx) return t
            const quiz = [...(t.quiz || [])]
            quiz[qIdx] = { ...quiz[qIdx], ...patch }
            return { ...t, quiz }
        }))
    }
    const addQuestion = (topicIdx: number) => {
        setTopics(prev => prev.map((t, i) => {
            if (i !== topicIdx) return t
            return { ...t, quiz: [...(t.quiz || []), { q: '', options: ['', '', '', ''], answer: 0 }] }
        }))
    }
    const removeQuestion = (topicIdx: number, qIdx: number) => {
        setTopics(prev => prev.map((t, i) => {
            if (i !== topicIdx) return t
            return { ...t, quiz: (t.quiz || []).filter((_, k) => k !== qIdx) }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const payload: BibleStudyPageSettingsUpdate = {
                ...formData,
                weekly_topics: topics.filter(t => (t.title || '').trim()),
                impact_stats: impactStats.filter(s => (s.label || '').trim() && (s.value || '').trim()),
            }
            await bibleStudyApi.updateSettings(payload)
            showToast('Settings updated successfully!', 'success')
            await fetchSettings()
        } catch (error: any) {
            console.error('Failed to update settings:', error)
            showToast(error.message || 'Failed to update settings', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Settings className="w-12 h-12 animate-pulse text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            {ToastComponent()}
            
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin">
                    <Button variant="ghost" className="mb-4 text-[#140152] hover:text-[#f5bb00]">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to Admin
                    </Button>
                </Link>
                
                <div>
                    <h1 className="text-4xl font-black text-[#140152] mb-2">Bible Study Settings</h1>
                    <p className="text-gray-600">Customize the Bible Study page appearance</p>
                </div>
            </div>

            {/* Settings Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="p-8 max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-[#140152] mb-6">Hero Section</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hero Title *
                                    </label>
                                    <Input
                                        value={formData.hero_title}
                                        onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                                        required
                                        placeholder="e.g., Weekly Bible Reading Plan"
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Main heading displayed on the page</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hero Subtitle *
                                    </label>
                                    <Input
                                        value={formData.hero_subtitle}
                                        onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                                        required
                                        placeholder="e.g., Grow in Faith Through Daily Scripture"
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Subheading below the main title</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hero Description *
                                    </label>
                                    <Textarea
                                        value={formData.hero_description}
                                        onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                                        required
                                        placeholder="Describe the Bible study program..."
                                        rows={4}
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Brief description of the Bible study program</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hero Background Image URL
                                    </label>
                                    <Input
                                        type="url"
                                        value={formData.hero_background_url}
                                        onChange={(e) => setFormData({ ...formData, hero_background_url: e.target.value })}
                                        placeholder="https://..."
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Optional background image for the hero section</p>
                                </div>
                            </div>
                        </div>

                        {/* ─── IMPACT STATS ──────────────────────────────────────── */}
                        <div className="pt-8 border-t border-gray-200">
                            <div className="flex items-start justify-between gap-3 mb-1">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#f5bb00]" />
                                    <h2 className="text-2xl font-bold text-[#140152]">Impact Stats strip</h2>
                                </div>
                                <button type="button" onClick={() => setImpactStats([...impactStats, { label: '', value: '' }])} className="inline-flex items-center gap-1 text-sm font-bold text-[#140152] hover:text-[#f5bb00]">
                                    <Plus className="w-4 h-4" /> Add stat
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Numbers shown below the hero. Leave empty to fall back to real-derived metrics (your streak, quizzes taken, topic count) instead of invented numbers.</p>
                            {impactStats.length === 0 && (
                                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                                    No stats configured. The page will show real-derived numbers only — no &ldquo;200+&rdquo; placeholders.
                                </div>
                            )}
                            <div className="space-y-2">
                                {impactStats.map((s, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-end bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="col-span-5">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Value</label>
                                            <Input value={s.value} onChange={(e) => setImpactStats(stats => stats.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="200+" className="text-gray-900 text-sm" />
                                        </div>
                                        <div className="col-span-6">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Label</label>
                                            <Input value={s.label} onChange={(e) => setImpactStats(stats => stats.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Active Participants" className="text-gray-900 text-sm" />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button type="button" onClick={() => setImpactStats(stats => stats.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── WEEKLY TOPICS + QUIZZES ───────────────────────────── */}
                        <div className="pt-8 border-t border-gray-200">
                            <div className="flex items-start justify-between gap-3 mb-1">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#f5bb00]" />
                                    <h2 className="text-2xl font-bold text-[#140152]">Weekly Topics &amp; Quizzes</h2>
                                </div>
                                <button type="button" onClick={addTopic} className="inline-flex items-center gap-1 text-sm font-bold text-[#140152] hover:text-[#f5bb00]">
                                    <Plus className="w-4 h-4" /> Add topic
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Each weekly topic powers one row on /bible-study. Add a Quiz to each so visitors can &ldquo;Take Quiz&rdquo;. Without a saved quiz, the built-in fallback is used.</p>
                            {topics.length === 0 && (
                                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                                    No topics saved yet. The page falls back to the built-in defaults until you add at least one.
                                </div>
                            )}
                            <div className="space-y-3">
                                {topics.map((t, idx) => {
                                    const isOpen = expandedTopic === idx
                                    const quizOpen = expandedQuizTopic === idx
                                    const quizCount = (t.quiz || []).length
                                    return (
                                        <Card key={idx} className="border-l-4 border-l-[#7c3aed] bg-white">
                                            <div className="flex items-center justify-between gap-3 p-3 cursor-pointer" onClick={() => setExpandedTopic(isOpen ? null : idx)}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="shrink-0 inline-flex items-center justify-center min-w-[2.5rem] h-9 rounded-lg bg-[#140152] text-white text-xs font-bold px-2">{t.week || `W${idx + 1}`}</span>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-[#140152] truncate">{t.title || '(untitled)'}</p>
                                                        <p className="text-xs text-gray-500 truncate">{t.verse || '(no scripture)'} · Quiz: {quizCount} {quizCount === 1 ? 'question' : 'questions'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); moveTopic(idx, -1) }} disabled={idx === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); moveTopic(idx, 1) }} disabled={idx === topics.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); removeTopic(idx) }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div className="p-4 pt-0 border-t border-gray-100 space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-1">Week tag</label>
                                                            <Input value={t.week} onChange={(e) => updateTopic(idx, { week: e.target.value })} placeholder="W1" className="text-gray-900 text-sm" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                                                            <Input value={t.category} onChange={(e) => updateTopic(idx, { category: e.target.value })} placeholder="Foundation" className="text-gray-900 text-sm" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-600 mb-1">Title</label>
                                                        <Input value={t.title} onChange={(e) => updateTopic(idx, { title: e.target.value })} placeholder="The Nature of God" className="text-gray-900 text-sm" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-1">Scripture</label>
                                                            <Input value={t.verse} onChange={(e) => updateTopic(idx, { verse: e.target.value })} placeholder="Exodus 34:6-7" className="text-gray-900 text-sm" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-1">Time</label>
                                                            <Input value={t.time || ''} onChange={(e) => updateTopic(idx, { time: e.target.value })} placeholder="6:00 PM Tues" className="text-gray-900 text-sm" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-600 mb-1">Study focus paragraph</label>
                                                        <Textarea value={t.study_focus || ''} onChange={(e) => updateTopic(idx, { study_focus: e.target.value })} rows={3} placeholder="This week we explore..." className="text-gray-900 text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-600 mb-1">Discussion questions (one per line)</label>
                                                        <Textarea value={(t.discussion_questions || []).join('\n')} onChange={(e) => updateTopic(idx, { discussion_questions: e.target.value.split('\n').filter(Boolean) })} rows={3} className="text-gray-900 text-sm" placeholder={"What stands out most in this passage?\nHow does this change your view of God?"} />
                                                    </div>

                                                    {/* ── QUIZ EDITOR ── */}
                                                    <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3">
                                                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedQuizTopic(quizOpen ? null : idx)}>
                                                            <div className="flex items-center gap-2">
                                                                <Brain className="w-4 h-4 text-[#7c3aed]" />
                                                                <p className="font-bold text-sm text-[#140152]">Quiz — {quizCount} {quizCount === 1 ? 'question' : 'questions'}</p>
                                                            </div>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedQuizTopic(idx); addQuestion(idx) }} className="inline-flex items-center gap-1 text-xs font-bold text-[#7c3aed] hover:text-[#140152]">
                                                                <Plus className="w-3.5 h-3.5" /> Add question
                                                            </button>
                                                        </div>
                                                        {quizOpen && (
                                                            <div className="mt-3 space-y-3">
                                                                {(t.quiz || []).length === 0 && (
                                                                    <p className="text-xs text-gray-500 italic">No quiz questions yet. Click &ldquo;Add question&rdquo;. (Until you save at least one, the built-in fallback quiz is used for this topic.)</p>
                                                                )}
                                                                {(t.quiz || []).map((q, qIdx) => (
                                                                    <div key={qIdx} className="rounded-lg bg-white border border-gray-200 p-3 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Question {qIdx + 1}</p>
                                                                            <button type="button" onClick={() => removeQuestion(idx, qIdx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                        <Textarea value={q.q} onChange={(e) => updateQuiz(idx, qIdx, { q: e.target.value })} rows={2} className="text-gray-900 text-sm" placeholder="Question prompt" />
                                                                        <div className="space-y-1.5">
                                                                            {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                                                                                <div key={oIdx} className="flex items-center gap-2">
                                                                                    <button type="button" onClick={() => updateQuiz(idx, qIdx, { answer: oIdx })} className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${q.answer === oIdx ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} title="Click to mark as correct">
                                                                                        {q.answer === oIdx ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + oIdx)}
                                                                                    </button>
                                                                                    <Input value={opt} onChange={(e) => {
                                                                                        const opts = [...(q.options || ['', '', '', ''])]
                                                                                        opts[oIdx] = e.target.value
                                                                                        updateQuiz(idx, qIdx, { options: opts })
                                                                                    }} placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} className="text-gray-900 text-sm flex-1" />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <Textarea value={q.explanation || ''} onChange={(e) => updateQuiz(idx, qIdx, { explanation: e.target.value })} rows={2} className="text-gray-900 text-xs" placeholder="Optional: explanation shown after the answer is revealed" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                            >
                                <Save className="mr-2 w-5 h-5" />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>

            {/* Preview */}
            {settings && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8"
                >
                    <Card className="p-8 max-w-3xl">
                        <h2 className="text-2xl font-bold text-[#140152] mb-6">Preview</h2>
                        <div 
                            className="relative bg-gradient-to-br from-[#140152] via-purple-900 to-[#140152] text-white p-12 rounded-lg overflow-hidden"
                            style={{
                                backgroundImage: formData.hero_background_url 
                                    ? `linear-gradient(rgba(20, 1, 82, 0.85), rgba(20, 1, 82, 0.85)), url(${formData.hero_background_url})`
                                    : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="relative z-10 text-center">
                                <h1 className="text-4xl md:text-5xl font-black mb-4">
                                    {formData.hero_title || 'Hero Title'}
                                </h1>
                                <p className="text-2xl text-[#f5bb00] font-bold mb-3">
                                    {formData.hero_subtitle || 'Hero Subtitle'}
                                </p>
                                <p className="text-lg text-gray-200">
                                    {formData.hero_description || 'Hero description will appear here...'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}


'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Plus, Edit2, Trash2, Eye, EyeOff, Users, ExternalLink,
    Loader2, X, Heart, Crown, BookOpen, Music, Baby, HandHeart,
    Shield, Globe, Sparkles, Coffee, Briefcase, Smile, Star,
    AlertCircle, CheckCircle, ImageIcon, Calendar, Megaphone,
    Mail, Phone, MapPin, Target, Award, BookText, Facebook,
    Instagram, Twitter, Youtube, MessageCircle, Settings,
    DollarSign, UserCheck, Tag,
} from 'lucide-react'
import { ministriesApi, Ministry, MinistryCreate } from '@/lib/ministries-api'

const ICON_OPTIONS = [
    { name: 'Heart', icon: Heart, emoji: '❤️' },
    { name: 'Crown', icon: Crown, emoji: '👑' },
    { name: 'BookOpen', icon: BookOpen, emoji: '📖' },
    { name: 'Music', icon: Music, emoji: '🎵' },
    { name: 'Baby', icon: Baby, emoji: '👶' },
    { name: 'HandHeart', icon: HandHeart, emoji: '🤝' },
    { name: 'Users', icon: Users, emoji: '👥' },
    { name: 'Shield', icon: Shield, emoji: '🛡️' },
    { name: 'Globe', icon: Globe, emoji: '🌍' },
    { name: 'Sparkles', icon: Sparkles, emoji: '✨' },
    { name: 'Coffee', icon: Coffee, emoji: '☕' },
    { name: 'Briefcase', icon: Briefcase, emoji: '💼' },
    { name: 'Smile', icon: Smile, emoji: '😊' },
    { name: 'Star', icon: Star, emoji: '⭐' },
]

const COLOR_PRESETS = [
    { name: 'Royal Purple', color: '#7c3aed', secondary: '#5b21b6' },
    { name: 'Deep Pink',    color: '#db2777', secondary: '#9d174d' },
    { name: 'Ocean Blue',   color: '#0284c7', secondary: '#075985' },
    { name: 'Forest Green', color: '#059669', secondary: '#065f46' },
    { name: 'Sunset Orange',color: '#ea580c', secondary: '#9a3412' },
    { name: 'Wine Red',     color: '#dc2626', secondary: '#991b1b' },
    { name: 'Golden',       color: '#d97706', secondary: '#92400e' },
    { name: 'Teal',         color: '#0d9488', secondary: '#115e59' },
    { name: 'Indigo',       color: '#4f46e5', secondary: '#3730a3' },
    { name: 'LETW Navy',    color: '#140152', secondary: '#1d0175' },
]

const DEFAULT_HERO_IMAGES = [
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=80',
    'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&q=80',
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&q=80',
    'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=1200&q=80',
    'https://images.unsplash.com/photo-1545987796-200677ee1011?w=1200&q=80',
    'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=1200&q=80',
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80',
]

const CATEGORIES = [
    'Fellowship', 'Prayer', 'Evangelism', 'Discipleship', 'Worship',
    'Outreach', 'Education', 'Counseling', 'Support Group', 'Other',
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type WizardTab = 'basic' | 'visual' | 'mission' | 'contact' | 'meeting' | 'membership' | 'gallery' | 'extra' | 'preview'

export default function AdminMinistriesPage() {
    const [ministries, setMinistries] = useState<Ministry[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingSlug, setEditingSlug] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<WizardTab>('basic')

    // Gallery & FAQ helpers
    const [galleryInput, setGalleryInput] = useState('')
    const [faqQ, setFaqQ] = useState('')
    const [faqA, setFaqA] = useState('')

    // Form state
    const initialForm: MinistryCreate = {
        name: '', slug: '', tagline: '', description: '',
        hero_image_url: '', icon_url: '', color: '#7c3aed', secondary_color: '#5b21b6',
        icon_name: 'Heart', emoji: '❤️', accepts_members: true,
        meeting_schedule: '', location: '',
        mission_statement: '', vision_statement: '', core_values: '',
        scripture_verse: '', scripture_reference: '',
        contact_email: '', contact_phone: '', whatsapp_number: '', whatsapp_group_link: '',
        facebook_url: '', instagram_url: '', twitter_url: '', youtube_url: '', website_url: '',
        meeting_day: '', meeting_time: '', online_meeting_link: '',
        category: '', target_audience: '', age_min: undefined, age_max: undefined,
        gender_filter: 'any', requires_approval: true, membership_fee: undefined,
        requires_baptism: false, requires_application: false,
        application_questions: { questions: [] },
        gallery_images: { images: [] }, goals: '',
        impact_stats: {}, faqs: { items: [] },
        is_featured: false, show_on_homepage: false,
    }
    const [form, setForm] = useState<MinistryCreate>(initialForm)
    const [submitting, setSubmitting] = useState(false)

    const load = async () => {
        try {
            setLoading(true)
            const data = await ministriesApi.listAll()
            setMinistries(data)
        } catch (e) {
            setError((e as Error).message)
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const resetForm = () => { setForm(initialForm); setEditingSlug(null); setActiveTab('basic') }

    const openCreate = () => { resetForm(); setShowForm(true) }

    const openEdit = (m: Ministry) => {
        setForm({ ...initialForm, ...m } as MinistryCreate)
        setEditingSlug(m.slug)
        setActiveTab('basic')
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) { setError('Ministry name is required'); return }
        setSubmitting(true); setError(null)
        try {
            if (editingSlug) {
                await ministriesApi.update(editingSlug, form)
                setSuccess(`Updated ${form.name}`)
            } else {
                const created = await ministriesApi.create(form)
                setSuccess(`Created ${created.name}! Page: /ministries/${created.slug}`)
            }
            setShowForm(false); resetForm(); await load()
            setTimeout(() => setSuccess(null), 5000)
        } catch (e) { setError((e as Error).message)
        } finally { setSubmitting(false) }
    }

    const toggleActive = async (m: Ministry) => {
        try { await ministriesApi.update(m.slug, { is_active: !m.is_active }); await load()
        } catch (e) { setError((e as Error).message) }
    }

    const handleDelete = async (m: Ministry) => {
        if (!confirm(`Delete "${m.name}"? Cannot be undone.`)) return
        try {
            await ministriesApi.delete(m.slug)
            setSuccess(`Deleted ${m.name}`); await load()
            setTimeout(() => setSuccess(null), 3000)
        } catch (e) { setError((e as Error).message) }
    }

    const addToGallery = () => {
        if (!galleryInput.trim()) return
        const images = (form.gallery_images as any)?.images || []
        setForm({ ...form, gallery_images: { images: [...images, galleryInput.trim()] } })
        setGalleryInput('')
    }
    const removeFromGallery = (idx: number) => {
        const images = (form.gallery_images as any)?.images || []
        setForm({ ...form, gallery_images: { images: images.filter((_: any, i: number) => i !== idx) } })
    }

    const addFaq = () => {
        if (!faqQ.trim() || !faqA.trim()) return
        const items = (form.faqs as any)?.items || []
        setForm({ ...form, faqs: { items: [...items, { question: faqQ, answer: faqA }] } })
        setFaqQ(''); setFaqA('')
    }
    const removeFaq = (idx: number) => {
        const items = (form.faqs as any)?.items || []
        setForm({ ...form, faqs: { items: items.filter((_: any, i: number) => i !== idx) } })
    }

    const WIZARD_TABS: { id: WizardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: 'basic',      label: 'Basic Info',    icon: BookText },
        { id: 'visual',     label: 'Visual',        icon: ImageIcon },
        { id: 'mission',    label: 'Mission',       icon: Target },
        { id: 'contact',    label: 'Contact',       icon: Mail },
        { id: 'meeting',    label: 'Meetings',      icon: Calendar },
        { id: 'membership', label: 'Membership',    icon: UserCheck },
        { id: 'gallery',    label: 'Gallery & FAQ', icon: ImageIcon },
        { id: 'extra',      label: 'Extras',        icon: Settings },
        { id: 'preview',    label: 'Preview',       icon: Eye },
    ]

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Custom Ministries</h1>
                    <p className="text-gray-500 mt-1">Create rich ministries with mission, events, gallery, and more</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-[#140152] hover:bg-[#1a0666] text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-lg">
                    <Plus className="w-5 h-5" /> Create Ministry
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">{success}</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
            ) : ministries.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-bold mb-2">No ministries yet</p>
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1a0666] text-white px-5 py-3 rounded-xl font-bold">
                        <Plus className="w-5 h-5" /> Create First Ministry
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ministries.map((m, i) => (
                        <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                            <div className="relative h-32 overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${m.color}, ${m.secondary_color})` }}>
                                {m.hero_image_url && <img src={m.hero_image_url} alt={m.name} className="w-full h-full object-cover opacity-60" />}
                                <div className="absolute inset-0 bg-black/30" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center text-2xl">
                                        {m.emoji || '✨'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-black truncate">{m.name}</p>
                                        <p className="text-white/80 text-xs truncate">{m.tagline}</p>
                                    </div>
                                </div>
                                {!m.is_active && (
                                    <div className="absolute top-2 right-2 bg-gray-800/80 text-white text-xs font-bold px-2 py-1 rounded">INACTIVE</div>
                                )}
                                {m.is_featured && (
                                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                        <Star className="w-3 h-3" /> Featured
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {m.member_count} members</span>
                                    {m.accepts_members && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">Accepting</span>}
                                    {m.category && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{m.category}</span>}
                                </div>
                                <div className="text-[10px] text-gray-400 mb-3">
                                    <code className="bg-gray-100 px-1.5 py-0.5 rounded">/ministries/{m.slug}</code>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link href={`/ministries/${m.slug}`} target="_blank"
                                        className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold">
                                        <ExternalLink className="w-3 h-3" /> View
                                    </Link>
                                    <button onClick={() => openEdit(m)}
                                        className="flex items-center gap-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-bold">
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => toggleActive(m)}
                                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold ${m.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                                        {m.is_active ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                                    </button>
                                    <button onClick={() => handleDelete(m)}
                                        className="ml-auto flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* CREATE/EDIT MODAL with TABS */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="bg-gradient-to-r from-[#140152] to-purple-600 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editingSlug ? `Edit ${form.name}` : 'Create New Ministry'}
                            </h2>
                            <button onClick={() => { setShowForm(false); resetForm() }}
                                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 px-6 pt-2 flex gap-1 overflow-x-auto">
                            {WIZARD_TABS.map(t => {
                                const Icon = t.icon
                                const isActive = activeTab === t.id
                                return (
                                    <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                            isActive ? 'border-[#140152] text-[#140152]' : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}>
                                        <Icon className="w-4 h-4" />
                                        {t.label}
                                    </button>
                                )
                            })}
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
                            {/* BASIC INFO TAB */}
                            {activeTab === 'basic' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Ministry Name *</label>
                                        <input type="text" value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="e.g. Women's Ministry"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">URL Slug</label>
                                        <input type="text" value={form.slug || ''}
                                            onChange={e => setForm({ ...form, slug: e.target.value })}
                                            placeholder="e.g. womens-ministry (auto-generated if empty)"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20"
                                            disabled={!!editingSlug} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Tagline</label>
                                        <input type="text" value={form.tagline || ''}
                                            onChange={e => setForm({ ...form, tagline: e.target.value })}
                                            placeholder="e.g. Empowering women in faith"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
                                        <textarea value={form.description || ''}
                                            onChange={e => setForm({ ...form, description: e.target.value })} rows={4}
                                            placeholder="Describe the ministry's purpose..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Tag className="w-4 h-4" /> Category</label>
                                            <select value={form.category || ''}
                                                onChange={e => setForm({ ...form, category: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20">
                                                <option value="">Choose...</option>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Target Audience</label>
                                            <input type="text" value={form.target_audience || ''}
                                                onChange={e => setForm({ ...form, target_audience: e.target.value })}
                                                placeholder="e.g. Adults 18+"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* VISUAL TAB */}
                            {activeTab === 'visual' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Color Theme</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {COLOR_PRESETS.map(p => (
                                                <button key={p.name} type="button"
                                                    onClick={() => setForm({ ...form, color: p.color, secondary_color: p.secondary })}
                                                    className={`p-2 rounded-lg text-white text-[10px] font-bold transition-all hover:scale-105 ${
                                                        form.color === p.color ? 'ring-2 ring-offset-2 ring-[#140152]' : ''
                                                    }`}
                                                    style={{ background: `linear-gradient(135deg, ${p.color}, ${p.secondary})` }}>
                                                    {p.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Icon</label>
                                        <div className="grid grid-cols-7 gap-2">
                                            {ICON_OPTIONS.map(opt => {
                                                const Icon = opt.icon
                                                return (
                                                    <button key={opt.name} type="button"
                                                        onClick={() => setForm({ ...form, icon_name: opt.name, emoji: opt.emoji })}
                                                        className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                                                            form.icon_name === opt.name ? 'bg-[#140152] text-white ring-2 ring-[#f5bb00]' : 'bg-gray-50 hover:bg-gray-100'
                                                        }`}>
                                                        <Icon className="w-5 h-5" />
                                                        <span className="text-[10px]">{opt.emoji}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Hero Image URL</label>
                                        <input type="url" value={form.hero_image_url || ''}
                                            onChange={e => setForm({ ...form, hero_image_url: e.target.value })}
                                            placeholder="https://images.unsplash.com/..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        <p className="text-xs text-gray-500 mt-2 mb-2">Suggested images:</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {DEFAULT_HERO_IMAGES.map((url, i) => (
                                                <button key={i} type="button" onClick={() => setForm({ ...form, hero_image_url: url })}
                                                    className={`aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                                        form.hero_image_url === url ? 'border-[#140152] ring-2 ring-[#f5bb00]' : 'border-gray-100'
                                                    }`}>
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MISSION TAB */}
                            {activeTab === 'mission' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Target className="w-4 h-4" /> Mission Statement</label>
                                        <textarea value={form.mission_statement || ''}
                                            onChange={e => setForm({ ...form, mission_statement: e.target.value })} rows={3}
                                            placeholder="Our mission is to..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Eye className="w-4 h-4" /> Vision Statement</label>
                                        <textarea value={form.vision_statement || ''}
                                            onChange={e => setForm({ ...form, vision_statement: e.target.value })} rows={3}
                                            placeholder="We envision a community..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Heart className="w-4 h-4" /> Core Values</label>
                                        <textarea value={form.core_values || ''}
                                            onChange={e => setForm({ ...form, core_values: e.target.value })} rows={3}
                                            placeholder="• Faith • Love • Service ..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><BookText className="w-4 h-4" /> Scripture Verse</label>
                                        <textarea value={form.scripture_verse || ''}
                                            onChange={e => setForm({ ...form, scripture_verse: e.target.value })} rows={2}
                                            placeholder="For we are God's handiwork, created in Christ Jesus..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                                        <input type="text" value={form.scripture_reference || ''}
                                            onChange={e => setForm({ ...form, scripture_reference: e.target.value })}
                                            placeholder="Ephesians 2:10"
                                            className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Award className="w-4 h-4" /> Goals & Objectives</label>
                                        <textarea value={form.goals || ''}
                                            onChange={e => setForm({ ...form, goals: e.target.value })} rows={3}
                                            placeholder="• Touch 100 lives this year • Hold quarterly conferences..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                                    </div>
                                </div>
                            )}

                            {/* CONTACT TAB */}
                            {activeTab === 'contact' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-700 text-sm">Contact Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Mail className="w-4 h-4" /> Email</label>
                                            <input type="email" value={form.contact_email || ''}
                                                onChange={e => setForm({ ...form, contact_email: e.target.value })}
                                                placeholder="ministry@letw.org"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Phone className="w-4 h-4" /> Phone</label>
                                            <input type="tel" value={form.contact_phone || ''}
                                                onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                                                placeholder="+234 800 000 0000"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><MessageCircle className="w-4 h-4" /> WhatsApp Number</label>
                                            <input type="tel" value={form.whatsapp_number || ''}
                                                onChange={e => setForm({ ...form, whatsapp_number: e.target.value })}
                                                placeholder="+234 800 000 0000"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block">WhatsApp Group Link</label>
                                            <input type="url" value={form.whatsapp_group_link || ''}
                                                onChange={e => setForm({ ...form, whatsapp_group_link: e.target.value })}
                                                placeholder="https://chat.whatsapp.com/..."
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-700 text-sm mt-6">Social Media</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Facebook className="w-4 h-4" /> Facebook</label>
                                            <input type="url" value={form.facebook_url || ''}
                                                onChange={e => setForm({ ...form, facebook_url: e.target.value })}
                                                placeholder="https://facebook.com/..."
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Instagram className="w-4 h-4" /> Instagram</label>
                                            <input type="url" value={form.instagram_url || ''}
                                                onChange={e => setForm({ ...form, instagram_url: e.target.value })}
                                                placeholder="https://instagram.com/..."
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Twitter className="w-4 h-4" /> Twitter / X</label>
                                            <input type="url" value={form.twitter_url || ''}
                                                onChange={e => setForm({ ...form, twitter_url: e.target.value })}
                                                placeholder="https://twitter.com/..."
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Youtube className="w-4 h-4" /> YouTube</label>
                                            <input type="url" value={form.youtube_url || ''}
                                                onChange={e => setForm({ ...form, youtube_url: e.target.value })}
                                                placeholder="https://youtube.com/..."
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><Globe className="w-4 h-4" /> Website</label>
                                        <input type="url" value={form.website_url || ''}
                                            onChange={e => setForm({ ...form, website_url: e.target.value })}
                                            placeholder="https://ministry.example.com"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                    </div>
                                </div>
                            )}

                            {/* MEETING TAB */}
                            {activeTab === 'meeting' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Meeting Schedule (text)</label>
                                        <input type="text" value={form.meeting_schedule || ''}
                                            onChange={e => setForm({ ...form, meeting_schedule: e.target.value })}
                                            placeholder="e.g. Every Saturday at 5pm"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Meeting Day</label>
                                            <select value={form.meeting_day || ''}
                                                onChange={e => setForm({ ...form, meeting_day: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20">
                                                <option value="">Choose...</option>
                                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Meeting Time</label>
                                            <input type="time" value={form.meeting_time || ''}
                                                onChange={e => setForm({ ...form, meeting_time: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><MapPin className="w-4 h-4" /> Physical Location</label>
                                        <input type="text" value={form.location || ''}
                                            onChange={e => setForm({ ...form, location: e.target.value })}
                                            placeholder="e.g. Main Sanctuary, Room 201"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Online Meeting Link</label>
                                        <input type="url" value={form.online_meeting_link || ''}
                                            onChange={e => setForm({ ...form, online_meeting_link: e.target.value })}
                                            placeholder="https://zoom.us/j/..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                    </div>
                                </div>
                            )}

                            {/* MEMBERSHIP TAB */}
                            {activeTab === 'membership' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-700 text-sm">Audience Targeting</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Min Age</label>
                                            <input type="number" value={form.age_min || ''}
                                                onChange={e => setForm({ ...form, age_min: e.target.value ? +e.target.value : undefined })}
                                                placeholder="18"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Max Age</label>
                                            <input type="number" value={form.age_max || ''}
                                                onChange={e => setForm({ ...form, age_max: e.target.value ? +e.target.value : undefined })}
                                                placeholder="No limit"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Gender</label>
                                            <select value={form.gender_filter || 'any'}
                                                onChange={e => setForm({ ...form, gender_filter: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20">
                                                <option value="any">Any</option>
                                                <option value="male">Male only</option>
                                                <option value="female">Female only</option>
                                            </select>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-700 text-sm mt-6">Requirements</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={form.accepts_members ?? true}
                                                onChange={e => setForm({ ...form, accepts_members: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#140152]" />
                                            <span className="text-sm">Accept new member requests</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={form.requires_approval ?? true}
                                                onChange={e => setForm({ ...form, requires_approval: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#140152]" />
                                            <span className="text-sm">Require coordinator approval for membership</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={form.requires_baptism ?? false}
                                                onChange={e => setForm({ ...form, requires_baptism: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#140152]" />
                                            <span className="text-sm">Members must be baptized</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={form.requires_application ?? false}
                                                onChange={e => setForm({ ...form, requires_application: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#140152]" />
                                            <span className="text-sm">Require application form (custom questions)</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block flex items-center gap-1"><DollarSign className="w-4 h-4" /> Membership Fee (optional)</label>
                                        <input type="number" value={form.membership_fee ?? ''}
                                            onChange={e => setForm({ ...form, membership_fee: e.target.value ? +e.target.value : undefined })}
                                            placeholder="0.00"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                    </div>
                                </div>
                            )}

                            {/* GALLERY & FAQ TAB */}
                            {activeTab === 'gallery' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Photo Gallery</h3>
                                        <div className="flex gap-2 mb-3">
                                            <input type="url" value={galleryInput} onChange={e => setGalleryInput(e.target.value)}
                                                placeholder="Image URL"
                                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                            <button type="button" onClick={addToGallery}
                                                className="px-5 py-3 bg-[#140152] text-white rounded-xl font-bold hover:bg-[#1a0666]">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {((form.gallery_images as any)?.images || []).map((url: string, i: number) => (
                                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => removeFromGallery(i)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-6">
                                        <h3 className="font-bold text-gray-700 text-sm mb-3">Frequently Asked Questions</h3>
                                        <div className="space-y-2 mb-3">
                                            <input type="text" value={faqQ} onChange={e => setFaqQ(e.target.value)}
                                                placeholder="Question"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                            <textarea value={faqA} onChange={e => setFaqA(e.target.value)} rows={2}
                                                placeholder="Answer"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                                            <button type="button" onClick={addFaq}
                                                className="flex items-center gap-2 px-5 py-2 bg-[#140152] text-white rounded-xl font-bold hover:bg-[#1a0666] text-sm">
                                                <Plus className="w-4 h-4" /> Add FAQ
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {((form.faqs as any)?.items || []).map((faq: any, i: number) => (
                                                <div key={i} className="bg-gray-50 rounded-xl p-4 relative">
                                                    <p className="font-bold text-sm text-gray-800 mb-1">{faq.question}</p>
                                                    <p className="text-sm text-gray-600">{faq.answer}</p>
                                                    <button type="button" onClick={() => removeFaq(i)}
                                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* EXTRA TAB */}
                            {activeTab === 'extra' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-700 text-sm">Display Settings</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={form.is_featured ?? false}
                                                onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#140152]" />
                                            <div>
                                                <p className="text-sm font-semibold flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> Featured ministry</p>
                                                <p className="text-xs text-gray-500">Shown prominently in ministry listings</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={form.show_on_homepage ?? false}
                                                onChange={e => setForm({ ...form, show_on_homepage: e.target.checked })}
                                                className="w-5 h-5 rounded text-[#140152]" />
                                            <div>
                                                <p className="text-sm font-semibold">Show on homepage</p>
                                                <p className="text-xs text-gray-500">Highlight on the main landing page</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* PREVIEW TAB */}
                            {activeTab === 'preview' && (
                                <div className="rounded-2xl overflow-hidden shadow-lg">
                                    <div className="relative h-60"
                                        style={{ background: `linear-gradient(135deg, ${form.color}, ${form.secondary_color})` }}>
                                        {form.hero_image_url && (
                                            <img src={form.hero_image_url} alt="" className="w-full h-full object-cover opacity-60" />
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-center px-6">
                                            <div>
                                                <div className="text-6xl mb-2">{form.emoji || '✨'}</div>
                                                <p className="text-white font-black text-3xl">{form.name || 'Ministry Name'}</p>
                                                {form.tagline && <p className="text-white/90 text-sm mt-2">{form.tagline}</p>}
                                                {form.scripture_reference && (
                                                    <p className="text-white/70 text-xs mt-3 italic">"{form.scripture_verse}" - {form.scripture_reference}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 grid grid-cols-2 gap-4 text-sm">
                                        {form.meeting_schedule && <div><p className="text-gray-500 text-xs">SCHEDULE</p><p className="font-semibold">{form.meeting_schedule}</p></div>}
                                        {form.location && <div><p className="text-gray-500 text-xs">LOCATION</p><p className="font-semibold">{form.location}</p></div>}
                                        {form.contact_email && <div><p className="text-gray-500 text-xs">EMAIL</p><p className="font-semibold">{form.contact_email}</p></div>}
                                        {form.contact_phone && <div><p className="text-gray-500 text-xs">PHONE</p><p className="font-semibold">{form.contact_phone}</p></div>}
                                    </div>
                                    {form.mission_statement && (
                                        <div className="bg-gray-50 p-6">
                                            <p className="text-xs font-bold text-gray-500 mb-2">MISSION</p>
                                            <p className="text-sm text-gray-800">{form.mission_statement}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>

                        <div className="bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
                            <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={submitting || !form.name.trim()}
                                className="flex-1 px-4 py-3 bg-[#140152] hover:bg-[#1a0666] text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingSlug ? 'Save Changes' : 'Create Ministry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

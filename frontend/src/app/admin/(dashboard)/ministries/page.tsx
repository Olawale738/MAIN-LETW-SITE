'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Plus, Edit2, Trash2, Eye, EyeOff, Users, ExternalLink,
    Loader2, X, Heart, Crown, BookOpen, Music, Baby, HandHeart,
    Shield, Globe, Sparkles, Coffee, Briefcase, Smile, Star,
    AlertCircle, CheckCircle, ImageIcon,
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
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80',  // women fellowship
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=80',  // men gathering
    'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&q=80',  // marriage/couple
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&q=80',     // singles fellowship
    'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=1200&q=80',  // seniors
    'https://images.unsplash.com/photo-1545987796-200677ee1011?w=1200&q=80',     // youth
    'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=1200&q=80',  // worship hands
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80',  // bible study
]

export default function AdminMinistriesPage() {
    const [ministries, setMinistries] = useState<Ministry[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingSlug, setEditingSlug] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Form state
    const [form, setForm] = useState<MinistryCreate>({
        name: '',
        slug: '',
        tagline: '',
        description: '',
        hero_image_url: '',
        icon_url: '',
        color: '#7c3aed',
        secondary_color: '#5b21b6',
        icon_name: 'Heart',
        emoji: '❤️',
        accepts_members: true,
        meeting_schedule: '',
        location: '',
    })
    const [submitting, setSubmitting] = useState(false)

    const load = async () => {
        try {
            setLoading(true)
            const data = await ministriesApi.listAll()
            setMinistries(data)
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const resetForm = () => {
        setForm({
            name: '',
            slug: '',
            tagline: '',
            description: '',
            hero_image_url: '',
            icon_url: '',
            color: '#7c3aed',
            secondary_color: '#5b21b6',
            icon_name: 'Heart',
            emoji: '❤️',
            accepts_members: true,
            meeting_schedule: '',
            location: '',
        })
        setEditingSlug(null)
    }

    const openCreate = () => {
        resetForm()
        setShowForm(true)
    }

    const openEdit = (m: Ministry) => {
        setForm({
            name: m.name,
            slug: m.slug,
            tagline: m.tagline || '',
            description: m.description || '',
            hero_image_url: m.hero_image_url || '',
            icon_url: m.icon_url || '',
            color: m.color,
            secondary_color: m.secondary_color,
            icon_name: m.icon_name,
            emoji: m.emoji || '',
            accepts_members: m.accepts_members,
            meeting_schedule: m.meeting_schedule || '',
            location: m.location || '',
        })
        setEditingSlug(m.slug)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) {
            setError('Ministry name is required')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            if (editingSlug) {
                await ministriesApi.update(editingSlug, form)
                setSuccess(`Updated ${form.name}`)
            } else {
                const created = await ministriesApi.create(form)
                setSuccess(`Created ${created.name}! Page: /ministries/${created.slug}`)
            }
            setShowForm(false)
            resetForm()
            await load()
            setTimeout(() => setSuccess(null), 5000)
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setSubmitting(false)
        }
    }

    const toggleActive = async (m: Ministry) => {
        try {
            await ministriesApi.update(m.slug, { is_active: !m.is_active })
            await load()
        } catch (e) {
            setError((e as Error).message)
        }
    }

    const handleDelete = async (m: Ministry) => {
        if (!confirm(`Delete "${m.name}"? This will remove all members, announcements, and messages. This cannot be undone.`)) return
        try {
            await ministriesApi.delete(m.slug)
            setSuccess(`Deleted ${m.name}`)
            await load()
            setTimeout(() => setSuccess(null), 3000)
        } catch (e) {
            setError((e as Error).message)
        }
    }

    const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setForm(prev => ({ ...prev, color: preset.color, secondary_color: preset.secondary }))
    }

    const applyIconPreset = (icon: typeof ICON_OPTIONS[0]) => {
        setForm(prev => ({ ...prev, icon_name: icon.name, emoji: icon.emoji }))
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Custom Ministries</h1>
                    <p className="text-gray-500 mt-1">Create and manage ministries like Women's, Men's, Marriage, etc.</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-[#140152] hover:bg-[#1a0666] text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-lg">
                    <Plus className="w-5 h-5" /> Create Ministry
                </button>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800">{success}</p>
                </div>
            )}

            {/* Ministries Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
                </div>
            ) : ministries.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-bold mb-2">No ministries yet</p>
                    <p className="text-sm text-gray-400 mb-6">Create your first ministry to get started</p>
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1a0666] text-white px-5 py-3 rounded-xl font-bold transition-colors">
                        <Plus className="w-5 h-5" /> Create First Ministry
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ministries.map((m, i) => {
                        const IconComp = ICON_OPTIONS.find(x => x.name === m.icon_name)?.icon || Users
                        return (
                            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                {/* Hero image */}
                                <div className="relative h-32 overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${m.color}, ${m.secondary_color})` }}>
                                    {m.hero_image_url && (
                                        <img src={m.hero_image_url} alt={m.name} className="w-full h-full object-cover opacity-60" />
                                    )}
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
                                        <div className="absolute top-2 right-2 bg-gray-800/80 text-white text-xs font-bold px-2 py-1 rounded">
                                            INACTIVE
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-4">
                                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" /> {m.member_count} members
                                        </span>
                                        {m.accepts_members && (
                                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                                Accepting
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-[10px] text-gray-400 mb-3">
                                        Slug: <code className="bg-gray-100 px-1.5 py-0.5 rounded">/ministries/{m.slug}</code>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link href={`/ministries/${m.slug}`} target="_blank"
                                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold transition-colors">
                                            <ExternalLink className="w-3 h-3" /> View
                                        </Link>
                                        <button onClick={() => openEdit(m)}
                                            className="flex items-center gap-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-bold transition-colors">
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => toggleActive(m)}
                                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                                                m.is_active
                                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                                            }`}>
                                            {m.is_active ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                                        </button>
                                        <button onClick={() => handleDelete(m)}
                                            className="ml-auto flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold transition-colors">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold text-[#140152]">
                                {editingSlug ? `Edit ${form.name}` : 'Create New Ministry'}
                            </h2>
                            <button onClick={() => { setShowForm(false); resetForm() }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Basic Info</h3>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Ministry Name *</label>
                                    <input type="text" value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Women's Ministry"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20"
                                        required />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">URL Slug (optional, auto-generated)</label>
                                    <input type="text" value={form.slug}
                                        onChange={e => setForm({ ...form, slug: e.target.value })}
                                        placeholder="e.g. womens-ministry"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20"
                                        disabled={!!editingSlug} />
                                    {!editingSlug && <p className="text-xs text-gray-500 mt-1">Page will be at /ministries/{form.slug || 'auto-generated'}</p>}
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
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={4}
                                        placeholder="Describe the ministry's purpose, activities, and impact..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                                </div>
                            </div>

                            {/* Visual Identity */}
                            <div className="space-y-4 border-t border-gray-100 pt-6">
                                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Visual Identity</h3>

                                {/* Color Presets */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Color Theme</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {COLOR_PRESETS.map(p => (
                                            <button key={p.name} type="button" onClick={() => applyColorPreset(p)}
                                                className={`p-2 rounded-lg text-white text-[10px] font-bold transition-all hover:scale-105 ${
                                                    form.color === p.color ? 'ring-2 ring-offset-2 ring-[#140152]' : ''
                                                }`}
                                                style={{ background: `linear-gradient(135deg, ${p.color}, ${p.secondary})` }}>
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Icon */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Icon</label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {ICON_OPTIONS.map(opt => {
                                            const Icon = opt.icon
                                            return (
                                                <button key={opt.name} type="button" onClick={() => applyIconPreset(opt)}
                                                    className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                                                        form.icon_name === opt.name
                                                            ? 'bg-[#140152] text-white ring-2 ring-[#f5bb00]'
                                                            : 'bg-gray-50 hover:bg-gray-100'
                                                    }`}>
                                                    <Icon className="w-5 h-5" />
                                                    <span className="text-[10px]">{opt.emoji}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Hero Image */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        <ImageIcon className="w-4 h-4 inline mr-1" /> Hero Image URL
                                    </label>
                                    <input type="url" value={form.hero_image_url || ''}
                                        onChange={e => setForm({ ...form, hero_image_url: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                    <p className="text-xs text-gray-500 mt-1 mb-2">Suggested images:</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {DEFAULT_HERO_IMAGES.map((url, i) => (
                                            <button key={i} type="button" onClick={() => setForm({ ...form, hero_image_url: url })}
                                                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                                    form.hero_image_url === url ? 'border-[#140152] ring-2 ring-[#f5bb00]' : 'border-gray-100'
                                                }`}>
                                                <img src={url} alt={`Suggestion ${i + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="space-y-4 border-t border-gray-100 pt-6">
                                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Settings</h3>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Meeting Schedule</label>
                                    <input type="text" value={form.meeting_schedule || ''}
                                        onChange={e => setForm({ ...form, meeting_schedule: e.target.value })}
                                        placeholder="e.g. Every Saturday at 5pm"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Location</label>
                                    <input type="text" value={form.location || ''}
                                        onChange={e => setForm({ ...form, location: e.target.value })}
                                        placeholder="e.g. Main Sanctuary, Room 201"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={form.accepts_members ?? true}
                                        onChange={e => setForm({ ...form, accepts_members: e.target.checked })}
                                        className="w-5 h-5 rounded text-[#140152]" />
                                    <div>
                                        <p className="text-sm font-semibold">Accept new member requests</p>
                                        <p className="text-xs text-gray-500">If off, users can't request to join</p>
                                    </div>
                                </label>
                            </div>

                            {/* Preview */}
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">Preview</h3>
                                <div className="rounded-2xl overflow-hidden shadow-lg">
                                    <div className="relative h-40"
                                        style={{ background: `linear-gradient(135deg, ${form.color}, ${form.secondary_color})` }}>
                                        {form.hero_image_url && (
                                            <img src={form.hero_image_url} alt="" className="w-full h-full object-cover opacity-60" />
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-5xl mb-2">{form.emoji || '✨'}</div>
                                                <p className="text-white font-black text-2xl">{form.name || 'Ministry Name'}</p>
                                                {form.tagline && <p className="text-white/90 text-sm mt-1">{form.tagline}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-6 px-6 py-4 flex gap-3">
                                <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting || !form.name.trim()}
                                    className="flex-1 px-4 py-3 bg-[#140152] hover:bg-[#1a0666] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingSlug ? 'Save Changes' : 'Create Ministry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Plus, Edit2, Trash2, Eye, EyeOff, Users, ExternalLink,
    Loader2, X, Shield, Heart, HandHeart, Music, Video,
    UserCheck, Crown, Globe, Sparkles, AlertCircle, CheckCircle,
    ImageIcon, Megaphone, MessageCircle, Mail, Phone,
    Briefcase, BookOpen, Star, Settings,
} from 'lucide-react'
import { ministriesApi, Ministry, MinistryCreate } from '@/lib/ministries-api'

// Volunteer-specific presets
const VOLUNTEER_PRESETS = [
    {
        id: 'security',  name: 'Security & Safety', emoji: '🛡️', icon: 'Shield',
        color: '#dc2626', secondary: '#991b1b',
        tagline: 'Keeping our community safe and secure',
        description: 'The Security team ensures the safety and well-being of all members during services and events.',
        hero_image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    },
    {
        id: 'ushering', name: 'Ushering & Welcome', emoji: '👋', icon: 'UserCheck',
        color: '#0284c7', secondary: '#075985',
        tagline: 'Welcoming everyone with warmth and grace',
        description: 'Our ushers create a warm, welcoming atmosphere for everyone who walks through our doors.',
        hero_image_url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80',
    },
    {
        id: 'hospitality', name: 'Hospitality Team', emoji: '🤝', icon: 'HandHeart',
        color: '#db2777', secondary: '#9d174d',
        tagline: 'Extending love through service',
        description: 'The Hospitality team ensures every guest and member feels at home in our church family.',
        hero_image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80',
    },
    {
        id: 'media',    name: 'Media & Creative', emoji: '🎥', icon: 'Video',
        color: '#7c3aed', secondary: '#5b21b6',
        tagline: 'Telling the gospel through creative arts',
        description: 'Our Media team handles audio, video, photography, and live streaming for all services.',
        hero_image_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80',
    },
    {
        id: 'worship', name: 'Worship & Music', emoji: '🎵', icon: 'Music',
        color: '#059669', secondary: '#065f46',
        tagline: 'Leading hearts to worship through song',
        description: 'The Worship team leads the congregation in praise through music and song.',
        hero_image_url: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=1200&q=80',
    },
    {
        id: 'parking', name: 'Parking & Traffic', emoji: '🅿️', icon: 'Briefcase',
        color: '#ea580c', secondary: '#9a3412',
        tagline: 'Directing traffic with patience',
        description: 'The Parking team ensures smooth arrival and departure for all attendees.',
        hero_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    },
    {
        id: 'transportation', name: 'Transportation', emoji: '🚌', icon: 'Briefcase',
        color: '#d97706', secondary: '#92400e',
        tagline: 'Helping the community reach service',
        description: 'The Transportation team helps members who need rides to church services.',
        hero_image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80',
    },
    {
        id: 'visitation', name: 'Visitation Ministry', emoji: '🏠', icon: 'Heart',
        color: '#4f46e5', secondary: '#3730a3',
        tagline: 'Caring for the sick and shut-in',
        description: 'The Visitation Ministry visits those who are sick, elderly, or unable to attend service.',
        hero_image_url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&q=80',
    },
]

export default function VolunteerDepartmentsAdminPage() {
    const [departments, setDepartments] = useState<Ministry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [creating, setCreating] = useState<string | null>(null)
    const [showCustom, setShowCustom] = useState(false)
    const [customForm, setCustomForm] = useState({
        name: '', tagline: '', description: '', hero_image_url: '',
        color: '#dc2626', secondary_color: '#991b1b', emoji: '🛡️', icon_name: 'Shield',
    })
    const [submitting, setSubmitting] = useState(false)

    const load = async () => {
        try {
            setLoading(true)
            const data = await ministriesApi.listAll()
            // Filter to volunteer departments only
            const volDepts = data.filter(m =>
                m.category === 'Volunteer Department' ||
                (m.features as any)?.is_volunteer_dept === true
            )
            setDepartments(volDepts)
        } catch (e) {
            setError((e as Error).message)
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const createFromPreset = async (preset: typeof VOLUNTEER_PRESETS[0]) => {
        setCreating(preset.id); setError(null)
        try {
            const created = await ministriesApi.create({
                name: preset.name,
                tagline: preset.tagline,
                description: preset.description,
                hero_image_url: preset.hero_image_url,
                color: preset.color,
                secondary_color: preset.secondary,
                emoji: preset.emoji,
                icon_name: preset.icon,
                category: 'Volunteer Department',
                accepts_members: true,
                requires_approval: true,
                features: { is_volunteer_dept: true },
            })
            setSuccess(`Created "${created.name}"! Dashboard ready at /ministries/${created.slug}/dashboard`)
            await load()
            setTimeout(() => setSuccess(null), 6000)
        } catch (e) {
            setError((e as Error).message)
        } finally { setCreating(null) }
    }

    const createCustom = async () => {
        if (!customForm.name.trim()) { setError('Department name is required'); return }
        setSubmitting(true); setError(null)
        try {
            const created = await ministriesApi.create({
                ...customForm,
                category: 'Volunteer Department',
                accepts_members: true,
                requires_approval: true,
                features: { is_volunteer_dept: true },
            })
            setSuccess(`Created "${created.name}"! Dashboard ready at /ministries/${created.slug}/dashboard`)
            setShowCustom(false)
            setCustomForm({
                name: '', tagline: '', description: '', hero_image_url: '',
                color: '#dc2626', secondary_color: '#991b1b', emoji: '🛡️', icon_name: 'Shield',
            })
            await load()
            setTimeout(() => setSuccess(null), 6000)
        } catch (e) {
            setError((e as Error).message)
        } finally { setSubmitting(false) }
    }

    const handleDelete = async (m: Ministry) => {
        if (!confirm(`Delete "${m.name}"? This removes the department and all its members.`)) return
        try {
            await ministriesApi.delete(m.slug)
            setSuccess(`Deleted ${m.name}`); await load()
            setTimeout(() => setSuccess(null), 3000)
        } catch (e) { setError((e as Error).message) }
    }

    const presetExists = (presetName: string) =>
        departments.some(d => d.name === presetName)

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Volunteer Departments</h1>
                    <p className="text-gray-500 mt-1">Create volunteer teams with member requests, coordinator assignment, and dashboards</p>
                </div>
                <button onClick={() => setShowCustom(true)}
                    className="flex items-center gap-2 bg-[#140152] hover:bg-[#1a0666] text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-lg">
                    <Plus className="w-5 h-5" /> Create Custom Department
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
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

            {/* Info banner */}
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">
                        💡
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-blue-900 mb-2">How Volunteer Departments Work</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Click any preset below to instantly create a volunteer department</li>
                            <li>• Each department gets: <strong>landing page</strong>, <strong>member request form</strong>, and <strong>coordinator dashboard</strong></li>
                            <li>• Members can apply to join → Coordinators approve or reject</li>
                            <li>• You can assign multiple coordinators</li>
                            <li>• Coordinators can: chat with team, post announcements, schedule events, log activities</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Existing Departments */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
            ) : departments.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-[#140152] mb-4">Active Departments ({departments.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departments.map((d, i) => (
                            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                <div className="relative h-32"
                                    style={{ background: `linear-gradient(135deg, ${d.color}, ${d.secondary_color})` }}>
                                    {d.hero_image_url && <img src={d.hero_image_url} alt="" className="w-full h-full object-cover opacity-50" />}
                                    <div className="absolute inset-0 bg-black/30" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-white/95 flex items-center justify-center text-2xl">
                                            {d.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-black truncate">{d.name}</p>
                                            <p className="text-white/80 text-xs truncate">{d.tagline}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {d.member_count} members</span>
                                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/ministries/${d.slug}`} target="_blank"
                                            className="flex items-center justify-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg font-bold">
                                            <ExternalLink className="w-3 h-3" /> Public Page
                                        </Link>
                                        <Link href={`/ministries/${d.slug}/dashboard`} target="_blank"
                                            className="flex items-center justify-center gap-1 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-lg font-bold">
                                            <Settings className="w-3 h-3" /> Dashboard
                                        </Link>
                                        <Link href={`/admin/ministries`} target="_blank"
                                            className="flex items-center justify-center gap-1 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg font-bold">
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </Link>
                                        <button onClick={() => handleDelete(d)}
                                            className="flex items-center justify-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg font-bold">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Create Presets */}
            <div>
                <h2 className="text-xl font-bold text-[#140152] mb-2">Quick Create — Common Volunteer Departments</h2>
                <p className="text-sm text-gray-500 mb-6">Click any card to instantly create a department with pre-configured settings</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {VOLUNTEER_PRESETS.map((preset, i) => {
                        const exists = presetExists(preset.name)
                        return (
                            <motion.button key={preset.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                onClick={() => !exists && createFromPreset(preset)}
                                disabled={exists || !!creating}
                                className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all ${
                                    exists
                                        ? 'border-gray-200 opacity-60 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-[#140152] hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-lg'
                                }`}>
                                <div className="relative h-28"
                                    style={{ background: `linear-gradient(135deg, ${preset.color}, ${preset.secondary})` }}>
                                    {preset.hero_image_url && (
                                        <img src={preset.hero_image_url} alt="" className="w-full h-full object-cover opacity-50" />
                                    )}
                                    <div className="absolute inset-0 bg-black/30" />
                                    <div className="absolute top-2 right-2">
                                        {exists ? (
                                            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Created
                                            </span>
                                        ) : creating === preset.id ? (
                                            <div className="bg-white/90 p-2 rounded-full">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#140152]" />
                                            </div>
                                        ) : (
                                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                                                <Plus className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end gap-2">
                                        <div className="text-3xl">{preset.emoji}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-black text-sm truncate">{preset.name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-gray-600 line-clamp-2">{preset.tagline}</p>
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Custom Create Modal */}
            {showCustom && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="bg-gradient-to-r from-[#140152] to-purple-600 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Create Custom Volunteer Department</h2>
                            <button onClick={() => setShowCustom(false)}
                                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Department Name *</label>
                                <input value={customForm.name}
                                    onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                                    placeholder="e.g. Sound Engineering Team"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Emoji</label>
                                <input value={customForm.emoji}
                                    onChange={e => setCustomForm({ ...customForm, emoji: e.target.value })}
                                    placeholder="🎵"
                                    maxLength={2}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Tagline</label>
                                <input value={customForm.tagline}
                                    onChange={e => setCustomForm({ ...customForm, tagline: e.target.value })}
                                    placeholder="e.g. Bringing clarity to every word"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
                                <textarea value={customForm.description}
                                    onChange={e => setCustomForm({ ...customForm, description: e.target.value })}
                                    rows={3} placeholder="Describe what this team does..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20 resize-none" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Hero Image URL</label>
                                <input type="url" value={customForm.hero_image_url}
                                    onChange={e => setCustomForm({ ...customForm, hero_image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Color 1</label>
                                    <input type="color" value={customForm.color}
                                        onChange={e => setCustomForm({ ...customForm, color: e.target.value })}
                                        className="w-full h-12 rounded-xl border border-gray-200 cursor-pointer" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Color 2</label>
                                    <input type="color" value={customForm.secondary_color}
                                        onChange={e => setCustomForm({ ...customForm, secondary_color: e.target.value })}
                                        className="w-full h-12 rounded-xl border border-gray-200 cursor-pointer" />
                                </div>
                            </div>

                            <div className="rounded-xl overflow-hidden border border-gray-200 mt-4">
                                <div className="relative h-32"
                                    style={{ background: `linear-gradient(135deg, ${customForm.color}, ${customForm.secondary_color})` }}>
                                    {customForm.hero_image_url && (
                                        <img src={customForm.hero_image_url} alt="" className="w-full h-full object-cover opacity-50" />
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-4">
                                        <div className="text-4xl mb-1">{customForm.emoji}</div>
                                        <p className="text-white font-black">{customForm.name || 'Department Name'}</p>
                                        {customForm.tagline && <p className="text-white/80 text-xs mt-1">{customForm.tagline}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex gap-3">
                            <button onClick={() => setShowCustom(false)}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold hover:bg-white">Cancel</button>
                            <button onClick={createCustom} disabled={submitting || !customForm.name.trim()}
                                className="flex-1 px-4 py-3 bg-[#140152] hover:bg-[#1a0666] text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Department
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

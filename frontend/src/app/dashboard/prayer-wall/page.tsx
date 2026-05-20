'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Heart, Plus, Loader2, X, HandHeart, BadgeCheck,
} from 'lucide-react'
import { prayerWallApi, type PrayerWallItem } from '@/lib/api'

const CATEGORIES = ['healing', 'family', 'financial', 'salvation', 'guidance', 'thanksgiving', 'other']

function timeAgo(iso: string) {
    const ms = Date.now() - new Date(iso).getTime()
    const m = Math.floor(ms / 60000); if (m < 60) return `${Math.max(m, 1)}m ago`
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`
    return new Date(iso).toLocaleDateString()
}

export default function PrayerWallPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<PrayerWallItem[]>([])
    const [filter, setFilter] = useState<string>('')
    const [showNew, setShowNew] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<string>('')
    const [anonymous, setAnonymous] = useState(false)

    async function reload(cat?: string) {
        setLoading(true)
        try {
            const data = await prayerWallApi.list(50, 0, cat || undefined)
            setItems(data.requests)
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('isLoggedIn')) {
            router.push('/auth/login'); return
        }
        reload(filter)
    }, [filter, router])

    async function pray(id: string) {
        try {
            const updated = await prayerWallApi.pray(id)
            setItems(prev => prev.map(p => p.id === id ? updated : p))
        } catch (e) { console.error(e) }
    }

    async function submit() {
        if (!title.trim() || !description.trim()) return
        setSubmitting(true)
        try {
            await prayerWallApi.create({
                title: title.trim(),
                description: description.trim(),
                category: category || undefined,
                is_anonymous: anonymous,
            })
            setTitle(''); setDescription(''); setCategory(''); setAnonymous(false)
            setShowNew(false)
            await reload(filter)
        } catch (e) { console.error(e); alert('Could not post request') }
        finally { setSubmitting(false) }
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="bg-[#140152] text-white">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                            <HandHeart className="w-7 h-7" /> Prayer Wall
                        </h1>
                        <p className="text-blue-200 text-sm">Share, agree, and stand with one another in prayer.</p>
                    </div>
                    <button
                        onClick={() => setShowNew(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5bb00] text-[#140152] font-bold hover:scale-105 transition-transform"
                    >
                        <Plus className="w-4 h-4" /> Post
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-6">
                {/* Filter pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                    <button
                        onClick={() => setFilter('')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === '' ? 'bg-[#140152] text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                    >
                        All
                    </button>
                    {CATEGORIES.map(c => (
                        <button
                            key={c}
                            onClick={() => setFilter(c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filter === c ? 'bg-[#140152] text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="p-16 flex items-center justify-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow p-16 text-center text-gray-500">
                        <HandHeart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No prayer requests yet. Be the first to share.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(p => (
                            <div key={p.id} id={p.id} className="bg-white rounded-3xl shadow-lg p-5 flex flex-col">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#140152] to-blue-700 text-white flex items-center justify-center font-bold shrink-0">
                                            {p.is_anonymous ? '?' : (p.author_name?.[0]?.toUpperCase() || '?')}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{p.author_name}</p>
                                            <p className="text-xs text-gray-500">{timeAgo(p.created_at)}</p>
                                        </div>
                                    </div>
                                    {p.category && (
                                        <span className="text-[10px] uppercase font-bold text-[#140152] bg-blue-50 px-2 py-0.5 rounded-full">{p.category}</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg text-[#140152] mb-1">{p.title}</h3>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{p.description}</p>

                                <div className="mt-4 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => pray(p.id)}
                                        disabled={p.has_prayed}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${p.has_prayed
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-[#140152] text-white hover:bg-[#140152]/90'}`}
                                    >
                                        {p.has_prayed ? <><BadgeCheck className="w-4 h-4" /> Prayed</> : <><Heart className="w-4 h-4" /> I'll pray</>}
                                    </button>
                                    <span className="text-sm text-gray-500">{p.prayer_count} {p.prayer_count === 1 ? 'prayer' : 'prayers'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showNew && (
                <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
                    <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#140152]">Share a prayer request</h2>
                            <button onClick={() => setShowNew(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <label className="text-xs font-semibold uppercase text-gray-500">Title</label>
                        <input
                            value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="Brief headline" maxLength={120}
                            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]"
                        />

                        <label className="text-xs font-semibold uppercase text-gray-500">Your request</label>
                        <textarea
                            value={description} onChange={e => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Share what you'd like the family to pray about…"
                            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] resize-none"
                        />

                        <label className="text-xs font-semibold uppercase text-gray-500">Category</label>
                        <select
                            value={category} onChange={e => setCategory(e.target.value)}
                            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]"
                        >
                            <option value="">(none)</option>
                            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                        </select>

                        <label className="flex items-center gap-2 mb-4">
                            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} />
                            <span className="text-sm text-gray-700">Post anonymously</span>
                        </label>

                        <button
                            onClick={submit}
                            disabled={submitting || !title.trim() || !description.trim()}
                            className="w-full py-3 rounded-xl bg-[#140152] text-white font-bold disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Post to the wall'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

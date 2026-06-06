'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Users, Calendar, MapPin, Loader2, ArrowLeft, Heart,
    CheckCircle, Clock, AlertCircle, Send, LogIn, Sparkles,
} from 'lucide-react'
import { ministriesApi, Ministry } from '@/lib/ministries-api'

export default function MinistryPublicPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params?.slug as string

    const [ministry, setMinistry] = useState<Ministry | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Join state
    const [showJoinForm, setShowJoinForm] = useState(false)
    const [joinMessage, setJoinMessage] = useState('')
    const [joining, setJoining] = useState(false)
    const [joinStatus, setJoinStatus] = useState<string | null>(null)
    const [joinError, setJoinError] = useState<string | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsLoggedIn(!!localStorage.getItem('isLoggedIn'))
        }
        if (!slug) return
        ministriesApi.get(slug)
            .then(m => setMinistry(m))
            .catch(e => setError((e as Error).message))
            .finally(() => setLoading(false))
    }, [slug])

    const handleJoin = async () => {
        if (!isLoggedIn) {
            router.push(`/auth/login?next=/ministries/${slug}`)
            return
        }
        setJoining(true)
        setJoinError(null)
        try {
            const result = await ministriesApi.join(slug, joinMessage)
            setJoinStatus(result.status)
            setShowJoinForm(false)
            setJoinMessage('')
        } catch (e) {
            setJoinError((e as Error).message)
        } finally {
            setJoining(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            <Loader2 className="w-12 h-12 animate-spin text-[#140152]" />
        </div>
    )

    if (error || !ministry) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Ministry Not Found</h1>
            <p className="text-gray-500 mb-6">{error || `No ministry found at /${slug}`}</p>
            <Link href="/" className="bg-[#140152] hover:bg-[#1a0666] text-white px-6 py-3 rounded-xl font-bold transition-colors">
                Back to Home
            </Link>
        </div>
    )

    const bgGradient = `linear-gradient(135deg, ${ministry.color}, ${ministry.secondary_color})`

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[400px] overflow-hidden" style={{ background: bgGradient }}>
                {ministry.hero_image_url && (
                    <img src={ministry.hero_image_url} alt={ministry.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

                {/* Decorative orbs */}
                <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-black/20 blur-3xl" />

                {/* Back button */}
                <Link href="/" className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors backdrop-blur-md bg-white/10 px-4 py-2 rounded-full">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6 z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}>
                        <div className="text-7xl mb-4">{ministry.emoji || '✨'}</div>
                        <h1 className="text-5xl md:text-6xl font-black mb-3">{ministry.name}</h1>
                        {ministry.tagline && (
                            <p className="text-xl md:text-2xl text-white/90 max-w-2xl">{ministry.tagline}</p>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-8 flex items-center gap-4 flex-wrap justify-center">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-bold">{ministry.member_count} members</span>
                        </div>
                        {ministry.accepts_members && (
                            <div className="flex items-center gap-2 bg-green-500/30 backdrop-blur-md px-4 py-2 rounded-full">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-bold">Accepting Members</span>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About */}
                        {ministry.description && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Heart className="w-6 h-6" style={{ color: ministry.color }} /> About Us
                                </h2>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ministry.description}</p>
                            </div>
                        )}

                        {/* Join Form */}
                        {ministry.accepts_members && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join {ministry.name}</h2>
                                <p className="text-gray-500 mb-6">Become part of our community</p>

                                {joinStatus === 'active' && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 mb-4">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <p className="text-sm text-green-800 font-bold">You are already a member!</p>
                                    </div>
                                )}

                                {joinStatus === 'pending' && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 mb-4">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                        <p className="text-sm text-amber-800 font-bold">Your request is pending approval</p>
                                    </div>
                                )}

                                {joinError && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 mb-4">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <p className="text-sm text-red-800">{joinError}</p>
                                    </div>
                                )}

                                {!joinStatus && (
                                    <>
                                        {!showJoinForm ? (
                                            <button onClick={() => isLoggedIn ? setShowJoinForm(true) : router.push(`/auth/login?next=/ministries/${slug}`)}
                                                className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                                                style={{ background: bgGradient }}>
                                                {isLoggedIn ? (
                                                    <><Heart className="w-5 h-5" /> Request to Join</>
                                                ) : (
                                                    <><LogIn className="w-5 h-5" /> Login to Join</>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-bold text-gray-700 mb-2 block">
                                                        Why do you want to join? (Optional)
                                                    </label>
                                                    <textarea value={joinMessage}
                                                        onChange={e => setJoinMessage(e.target.value)}
                                                        rows={4}
                                                        placeholder="Share why you'd like to join this ministry..."
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2"
                                                        style={{ borderColor: '#e5e7eb' }} />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button onClick={() => setShowJoinForm(false)}
                                                        className="flex-1 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50">
                                                        Cancel
                                                    </button>
                                                    <button onClick={handleJoin} disabled={joining}
                                                        className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                                        style={{ background: bgGradient }}>
                                                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        Submit Request
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Quick Info</h3>
                            <div className="space-y-4">
                                {ministry.meeting_schedule && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 mt-0.5" style={{ color: ministry.color }} />
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Schedule</p>
                                            <p className="text-sm text-gray-800">{ministry.meeting_schedule}</p>
                                        </div>
                                    </div>
                                )}
                                {ministry.location && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 mt-0.5" style={{ color: ministry.color }} />
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Location</p>
                                            <p className="text-sm text-gray-800">{ministry.location}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <Users className="w-5 h-5 mt-0.5" style={{ color: ministry.color }} />
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold">Members</p>
                                        <p className="text-sm text-gray-800 font-bold">{ministry.member_count} active</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Members Dashboard Link */}
                        {isLoggedIn && joinStatus === 'active' && (
                            <Link href={`/ministries/${slug}/dashboard`}
                                className="block bg-gradient-to-br rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all"
                                style={{ background: bgGradient }}>
                                <p className="text-white/80 text-xs font-bold uppercase tracking-wide mb-1">Member Area</p>
                                <p className="text-xl font-black">Go to Dashboard</p>
                                <p className="text-white/80 text-sm mt-2">Chat, announcements, and more</p>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

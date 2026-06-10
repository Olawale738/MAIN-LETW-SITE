'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Button } from '@/components/ui/button'
import {
    Calendar, MapPin, Clock, Share2, Loader2, ArrowLeft,
    ExternalLink, Users, AlertCircle, CalendarPlus, BellRing,
    CheckCircle2, X, ChevronDown, ThumbsUp, MessageCircle,
    Mic, Ticket, Image as ImageIcon, Award, HelpCircle,
    BarChart3, Heart, Megaphone
} from 'lucide-react'
import { eventApi, Event } from '@/lib/api'
import {
    eventExtensionsApi,
    EventSpeaker, EventSession, EventPhoto, EventComment,
    EventTicket, EventSponsor, EventFaq, EventUpdate, EventPollData
} from '@/lib/event-extensions-api'
import Link from 'next/link'
import { toast } from 'sonner'

interface MyRsvpState {
    has_rsvp: boolean
    status?: string
    plus_ones?: number
    checked_in?: boolean
    qr_token?: string
}

export default function EventDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // ── Extension data ───────────────────────────────────────────────────────
    const [updates, setUpdates] = useState<EventUpdate[]>([])
    const [speakers, setSpeakers] = useState<EventSpeaker[]>([])
    const [sessions, setSessions] = useState<EventSession[]>([])
    const [tickets, setTickets] = useState<EventTicket[]>([])
    const [photos, setPhotos] = useState<EventPhoto[]>([])
    const [sponsors, setSponsors] = useState<EventSponsor[]>([])
    const [faqs, setFaqs] = useState<EventFaq[]>([])
    const [comments, setComments] = useState<EventComment[]>([])
    const [polls, setPolls] = useState<EventPollData[]>([])
    const [donation, setDonation] = useState<{ total_raised: number; donor_count: number } | null>(null)
    const [extLoading, setExtLoading] = useState(false)

    // ── RSVP state ──────────────────────────────────────────────────────────
    const [myRsvp, setMyRsvp] = useState<MyRsvpState | null>(null)
    const [rsvpLoading, setRsvpLoading] = useState(false)
    const [plusOnes, setPlusOnes] = useState<number>(0)
    const [reminderLoading, setReminderLoading] = useState(false)

    // ── UI state ────────────────────────────────────────────────────────────
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [commentText, setCommentText] = useState('')
    const [isQuestion, setIsQuestion] = useState(false)
    const [postingComment, setPostingComment] = useState(false)
    const [customAmount, setCustomAmount] = useState<string>('')
    const [donating, setDonating] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsLoggedIn(!!localStorage.getItem('access_token'))
        }
        if (params.id) {
            loadEvent(params.id as string)
        }
    }, [params.id])

    const loadEvent = async (id: string) => {
        try {
            setLoading(true)
            const data = await eventApi.getEvent(id)
            setEvent(data)
            loadExtensions(id)
        } catch (err) {
            console.error('Failed to load event', err)
            setError('Failed to load event details. The event may have been removed or does not exist.')
        } finally {
            setLoading(false)
        }
    }

    const loadExtensions = async (id: string) => {
        setExtLoading(true)
        const results = await Promise.allSettled([
            eventExtensionsApi.listUpdates(id),
            eventExtensionsApi.listSpeakers(id),
            eventExtensionsApi.listSessions(id),
            eventExtensionsApi.listTickets(id),
            eventExtensionsApi.listPhotos(id),
            eventExtensionsApi.listSponsors(id),
            eventExtensionsApi.listFaqs(id),
            eventExtensionsApi.listComments(id),
            eventExtensionsApi.listPolls(id),
            eventExtensionsApi.donationTotal(id),
            eventExtensionsApi.myRsvp(id) as Promise<MyRsvpState>,
        ])

        if (results[0].status === 'fulfilled') setUpdates(results[0].value as EventUpdate[])
        if (results[1].status === 'fulfilled') setSpeakers(results[1].value as EventSpeaker[])
        if (results[2].status === 'fulfilled') setSessions(results[2].value as EventSession[])
        if (results[3].status === 'fulfilled') setTickets(results[3].value as EventTicket[])
        if (results[4].status === 'fulfilled') setPhotos(results[4].value as EventPhoto[])
        if (results[5].status === 'fulfilled') setSponsors(results[5].value as EventSponsor[])
        if (results[6].status === 'fulfilled') setFaqs(results[6].value as EventFaq[])
        if (results[7].status === 'fulfilled') setComments(results[7].value as EventComment[])
        if (results[8].status === 'fulfilled') setPolls(results[8].value as EventPollData[])
        if (results[9].status === 'fulfilled') setDonation(results[9].value as { total_raised: number; donor_count: number })
        if (results[10].status === 'fulfilled') {
            const r = results[10].value as MyRsvpState
            setMyRsvp(r)
            if (typeof r.plus_ones === 'number') setPlusOnes(r.plus_ones)
        }
        setExtLoading(false)
    }

    const refetchMyRsvp = async (id: string) => {
        try {
            const r = await eventExtensionsApi.myRsvp(id) as MyRsvpState
            setMyRsvp(r)
            if (typeof r.plus_ones === 'number') setPlusOnes(r.plus_ones)
        } catch (err) {
            console.error('Failed to refetch RSVP', err)
        }
    }

    // ── RSVP actions ──────────────────────────────────────────────────────────
    const handleRsvp = async () => {
        if (!event) return
        setRsvpLoading(true)
        try {
            await eventExtensionsApi.rsvp(event.id, { status: 'attending', plus_ones: plusOnes })
            await refetchMyRsvp(event.id)
            toast.success("You're going! See you there ✓")
        } catch (e) {
            toast.error((e as Error).message || 'Could not RSVP. Please try again.')
        } finally {
            setRsvpLoading(false)
        }
    }

    const handleCancelRsvp = async () => {
        if (!event) return
        setRsvpLoading(true)
        try {
            await eventExtensionsApi.cancelMyRsvp(event.id)
            await refetchMyRsvp(event.id)
            toast.success('Your RSVP has been cancelled.')
        } catch (e) {
            toast.error((e as Error).message || 'Could not cancel RSVP.')
        } finally {
            setRsvpLoading(false)
        }
    }

    const handleReminder = async () => {
        if (!event) return
        setReminderLoading(true)
        try {
            await eventExtensionsApi.setReminder(event.id, 24)
            toast.success('Reminder set! We will notify you 24h before.')
        } catch (e) {
            toast.error((e as Error).message || 'Could not set reminder.')
        } finally {
            setReminderLoading(false)
        }
    }

    // ── Comments ──────────────────────────────────────────────────────────────
    const handlePostComment = async () => {
        if (!event || !commentText.trim()) return
        setPostingComment(true)
        try {
            await eventExtensionsApi.addComment(event.id, commentText.trim(), isQuestion)
            const fresh = await eventExtensionsApi.listComments(event.id)
            setComments(fresh)
            setCommentText('')
            setIsQuestion(false)
            toast.success('Posted!')
        } catch (e) {
            toast.error((e as Error).message || 'Could not post your comment.')
        } finally {
            setPostingComment(false)
        }
    }

    const handleUpvote = async (commentId: string) => {
        if (!event) return
        try {
            await eventExtensionsApi.upvoteComment(commentId)
            const fresh = await eventExtensionsApi.listComments(event.id)
            setComments(fresh)
        } catch (e) {
            toast.error((e as Error).message || 'Could not upvote.')
        }
    }

    // ── Polls ─────────────────────────────────────────────────────────────────
    const handleVote = async (pollId: string, optionIndex: number) => {
        if (!event) return
        try {
            await eventExtensionsApi.votePoll(pollId, optionIndex)
            const fresh = await eventExtensionsApi.listPolls(event.id)
            setPolls(fresh)
            toast.success('Vote recorded!')
        } catch (e) {
            toast.error((e as Error).message || 'Could not record your vote.')
        }
    }

    // ── Donations ─────────────────────────────────────────────────────────────
    const handleDonate = async (amount: number) => {
        if (!event || !amount || amount <= 0) {
            toast.error('Please enter a valid amount.')
            return
        }
        setDonating(true)
        try {
            await eventExtensionsApi.donate(event.id, amount, {})
            const total = await eventExtensionsApi.donationTotal(event.id)
            setDonation(total)
            setCustomAmount('')
            toast.success(`Thank you for your $${amount} gift!`)
        } catch (e) {
            toast.error((e as Error).message || 'Could not process your donation.')
        } finally {
            setDonating(false)
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getMonth = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'long' })
    }

    const getDay = (dateString: string) => {
        const date = new Date(dateString)
        return date.getDate()
    }

    const getFullDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount: number, currency = 'USD') => {
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
        } catch {
            return `$${amount}`
        }
    }

    const showRsvpButton = event ? (event.registration_required || !event.registration_link) : false

    // Group sessions by date (preserve sort order)
    const sessionsByDate = sessions.reduce<Record<string, EventSession[]>>((acc, s) => {
        const key = s.session_date
        if (!acc[key]) acc[key] = []
        acc[key].push(s)
        return acc
    }, {})
    const sessionDates = Object.keys(sessionsByDate).sort()

    // Group sponsors by tier
    const tierOrder: EventSponsor['tier'][] = ['platinum', 'gold', 'silver', 'bronze', 'standard']
    const sponsorsByTier = tierOrder
        .map(tier => ({ tier, items: sponsors.filter(s => s.tier === tier).sort((a, b) => a.sort_order - b.sort_order) }))
        .filter(group => group.items.length > 0)

    const latestUpdate = updates.length > 0
        ? [...updates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null

    const sortedComments = [...comments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // ── Loading / Not found ───────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Hero
                    title="Loading Event..."
                    subtitle="Please wait while we fetch the details"
                    height="medium"
                    backgroundImage="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200"
                />
                <div className="flex-1 flex items-center justify-center p-20">
                    <Loader2 className="w-12 h-12 animate-spin text-[#140152]" />
                </div>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Hero
                    title="Event Not Found"
                    subtitle="We couldn't find what you're looking for"
                    height="medium"
                    backgroundImage="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200"
                />
                <SectionWrapper>
                    <div className="text-center max-w-2xl mx-auto">
                        <AlertCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-3xl font-black text-[#140152] mb-4">Oops! Something went wrong.</h2>
                        <p className="text-gray-600 mb-8 text-lg">{error || "The event you requested could not be found."}</p>
                        <Link href="/events">
                            <Button className="bg-[#140152] text-white hover:bg-[#2a0a6e] rounded-full px-8 py-6 text-lg font-bold">
                                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Events
                            </Button>
                        </Link>
                    </div>
                </SectionWrapper>
            </div>
        )
    }

    return (
        <>
            <Hero
                title={event.title}
                subtitle={event.event_type || 'Special Event'}
                height="medium"
                backgroundImage={event.has_image ? eventApi.getImageUrl(event.id) : "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200"}
            />

            <SectionWrapper>
                <div className="max-w-7xl mx-auto">
                    {/* Back Link */}
                    <Link href="/events" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#140152] font-semibold mb-8 group transition-colors">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to All Events
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* Left Column: Image & Quick Actions (lg:col-span-5) */}
                        <div className="lg:col-span-5 space-y-8">
                            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-100 relative group">
                                <div className="aspect-[4/5] relative">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                        style={{
                                            backgroundImage: `url(${event.has_image ? eventApi.getImageUrl(event.id) : 'https://images.unsplash.com/photo-1511527661048-b2641b655a2d?w=800&auto=format&fit=crop&q=60'})`
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                    {/* Date Badge Overlay */}
                                    <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xl px-5 py-3 rounded-2xl text-center shadow-xl border border-white/50">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{getMonth(event.event_date)}</p>
                                        <p className="text-3xl font-black text-[#140152]">{getDay(event.event_date)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                {event.registration_required && event.registration_link && (
                                    <Button
                                        onClick={() => window.open(event.registration_link, '_blank')}
                                        className="w-full bg-[#f5bb00] hover:bg-[#d9a600] text-[#140152] font-black text-lg py-7 rounded-2xl shadow-lg shadow-yellow-500/20"
                                    >
                                        Register Now <ExternalLink className="w-5 h-5 ml-2" />
                                    </Button>
                                )}

                                {/* RSVP block */}
                                {showRsvpButton && (
                                    <div className="rounded-2xl border-2 border-[#140152]/10 p-5 bg-[#140152]/[0.02] space-y-4">
                                        {myRsvp?.has_rsvp ? (
                                            <>
                                                <div className="flex items-center gap-3 text-[#140152]">
                                                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-black text-lg leading-tight">You&apos;re going ✓</p>
                                                        {typeof myRsvp.plus_ones === 'number' && myRsvp.plus_ones > 0 && (
                                                            <p className="text-sm text-gray-500 font-semibold">
                                                                + {myRsvp.plus_ones} guest{myRsvp.plus_ones > 1 ? 's' : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleCancelRsvp}
                                                    disabled={rsvpLoading}
                                                    className="w-full border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-bold rounded-xl py-5"
                                                >
                                                    {rsvpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cancel RSVP'}
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between gap-3">
                                                    <label htmlFor="plus-ones" className="text-sm font-bold text-gray-600">
                                                        Bringing guests?
                                                    </label>
                                                    <input
                                                        id="plus-ones"
                                                        type="number"
                                                        min={0}
                                                        max={20}
                                                        value={plusOnes}
                                                        onChange={(e) => setPlusOnes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                                        className="w-20 rounded-xl border-2 border-gray-200 px-3 py-2 text-center font-bold text-[#140152] focus:border-[#f5bb00] focus:outline-none"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleRsvp}
                                                    disabled={rsvpLoading}
                                                    className="w-full bg-[#140152] hover:bg-[#2a0a6e] text-white font-black text-lg py-7 rounded-2xl shadow-lg shadow-[#140152]/20"
                                                >
                                                    {rsvpLoading
                                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                                        : <>RSVP / I&apos;m Attending <CheckCircle2 className="w-5 h-5 ml-2" /></>}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Add to Calendar */}
                                <a
                                    href={eventExtensionsApi.calendarUrl(event.id)}
                                    download
                                    className="w-full inline-flex items-center justify-center border-2 border-gray-100 py-4 rounded-2xl text-gray-600 hover:bg-[#140152] hover:text-white hover:border-[#140152] font-bold transition-all"
                                >
                                    <CalendarPlus className="w-5 h-5 mr-3" /> Add to Calendar
                                </a>

                                {/* Remind me */}
                                <Button
                                    variant="outline"
                                    onClick={handleReminder}
                                    disabled={reminderLoading}
                                    className="w-full border-2 border-gray-100 py-6 rounded-2xl text-gray-600 hover:bg-[#f5bb00] hover:text-[#140152] hover:border-[#f5bb00] font-bold transition-all"
                                >
                                    {reminderLoading
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : <><BellRing className="w-5 h-5 mr-3" /> Remind me 24h before</>}
                                </Button>

                                {/* Share */}
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: event.title,
                                                text: event.description,
                                                url: window.location.href,
                                            }).catch(console.error);
                                        } else {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success('Link copied to clipboard!');
                                        }
                                    }}
                                    className="w-full border-2 border-gray-100 py-6 rounded-2xl text-gray-600 hover:bg-[#140152] hover:text-white hover:border-[#140152] font-bold transition-all"
                                >
                                    <Share2 className="w-5 h-5 mr-3" /> Share Event
                                </Button>
                            </div>
                        </div>

                        {/* Right Column: Details (lg:col-span-7) */}
                        <div className="lg:col-span-7">
                            <div className="space-y-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-4 py-1.5 rounded-full bg-[#140152]/5 text-[#140152] font-bold text-sm uppercase tracking-wider">
                                            {event.event_type || 'Event'}
                                        </span>
                                        {event.is_featured && (
                                            <span className="px-4 py-1.5 rounded-full bg-[#f5bb00]/20 text-[#d9a600] font-bold text-sm uppercase tracking-wider">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight mb-6">
                                        {event.title}
                                    </h1>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid sm:grid-cols-2 gap-6 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#f5bb00] flex-shrink-0">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Date</p>
                                            <p className="text-lg font-bold text-[#140152]">{getFullDate(event.event_date)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#f5bb00] flex-shrink-0">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Time</p>
                                            <p className="text-lg font-bold text-[#140152]">
                                                {event.start_time} {event.end_time ? `- ${event.end_time}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#f5bb00] flex-shrink-0">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Location</p>
                                            <p className="text-lg font-bold text-[#140152]">{event.location || 'To be announced'}</p>
                                        </div>
                                    </div>

                                    {event.max_attendees && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#f5bb00] flex-shrink-0">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Capacity</p>
                                                <p className="text-lg font-bold text-[#140152]">{event.max_attendees} Seats</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="prose prose-lg prose-blue max-w-none">
                                    <h3 className="text-2xl font-bold text-[#140152] mb-4">About This Event</h3>
                                    <div className="text-gray-600 leading-relaxed space-y-4 whitespace-pre-wrap">
                                        {event.description || "No description provided."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ════════════════════ ENHANCED SECTIONS ════════════════════ */}
                    <div className="mt-20 space-y-20">

                        {extLoading && (
                            <div className="flex items-center justify-center gap-3 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-semibold text-sm">Loading event details…</span>
                            </div>
                        )}

                        {/* 1. Latest Update Banner */}
                        {latestUpdate && (
                            <section>
                                <div className={`rounded-[2rem] p-8 border-2 ${latestUpdate.is_urgent ? 'border-red-300 bg-red-50' : 'border-[#f5bb00]/40 bg-[#f5bb00]/[0.06]'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Megaphone className={`w-5 h-5 ${latestUpdate.is_urgent ? 'text-red-600' : 'text-[#d9a600]'}`} />
                                        <span className={`text-xs font-black uppercase tracking-widest ${latestUpdate.is_urgent ? 'text-red-600' : 'text-[#d9a600]'}`}>
                                            {latestUpdate.is_urgent ? 'Urgent Update' : 'Latest Update'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-[#140152] mb-2">{latestUpdate.title}</h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{latestUpdate.content}</p>
                                </div>
                            </section>
                        )}

                        {/* 2. Speakers */}
                        {speakers.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <Mic className="w-7 h-7 text-[#f5bb00]" />
                                    <h2 className="text-3xl font-black text-[#140152]">Speakers</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {speakers.map((sp) => (
                                        <div key={sp.id} className="rounded-[2rem] border border-gray-100 bg-white p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
                                            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-100 mb-4 ring-4 ring-[#140152]/5">
                                                {sp.photo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={sp.photo_url} alt={sp.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[#140152] font-black text-2xl">
                                                        {sp.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            {sp.is_keynote && (
                                                <span className="inline-block mb-2 px-3 py-1 rounded-full bg-[#f5bb00]/20 text-[#d9a600] text-xs font-black uppercase tracking-wider">
                                                    Keynote
                                                </span>
                                            )}
                                            <h3 className="text-lg font-black text-[#140152]">{sp.name}</h3>
                                            {sp.title && <p className="text-sm font-semibold text-gray-500">{sp.title}</p>}
                                            {sp.organization && <p className="text-sm text-gray-400">{sp.organization}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. Agenda / Sessions */}
                        {sessions.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <Clock className="w-7 h-7 text-[#f5bb00]" />
                                    <h2 className="text-3xl font-black text-[#140152]">Agenda</h2>
                                </div>
                                <div className="space-y-10">
                                    {sessionDates.map((date) => (
                                        <div key={date}>
                                            <h3 className="text-lg font-black text-[#140152] mb-4 pb-2 border-b-2 border-[#f5bb00]/30">
                                                {getFullDate(date)}
                                            </h3>
                                            <div className="space-y-4">
                                                {sessionsByDate[date].map((s) => (
                                                    <div key={s.id} className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                                        <div className="sm:w-40 flex-shrink-0">
                                                            <p className="font-black text-[#140152]">
                                                                {s.start_time}{s.end_time ? ` – ${s.end_time}` : ''}
                                                            </p>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-[#140152] text-lg">{s.title}</h4>
                                                            {s.description && <p className="text-gray-500 text-sm mt-1 whitespace-pre-wrap">{s.description}</p>}
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                {s.room && (
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#140152]/5 text-[#140152] text-xs font-bold">
                                                                        <MapPin className="w-3 h-3" /> {s.room}
                                                                    </span>
                                                                )}
                                                                {s.track && (
                                                                    <span className="px-3 py-1 rounded-full bg-[#f5bb00]/15 text-[#d9a600] text-xs font-bold">
                                                                        {s.track}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 4. Tickets */}
                        {tickets.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <Ticket className="w-7 h-7 text-[#f5bb00]" />
                                    <h2 className="text-3xl font-black text-[#140152]">Tickets</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tickets.map((t) => {
                                        const soldOut = typeof t.capacity === 'number' && t.sold_count >= t.capacity
                                        return (
                                            <div key={t.id} className="rounded-[2rem] border-2 border-gray-100 bg-white p-7 flex flex-col shadow-sm hover:border-[#f5bb00]/40 transition-colors">
                                                <h3 className="text-xl font-black text-[#140152]">{t.name}</h3>
                                                {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
                                                <p className="text-3xl font-black text-[#140152] my-4">
                                                    {t.price === 0 ? 'Free' : formatCurrency(t.price, t.currency)}
                                                </p>
                                                {t.benefits?.items && t.benefits.items.length > 0 && (
                                                    <ul className="space-y-2 mb-4">
                                                        {t.benefits.items.map((b, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                <span>{b}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                <div className="mt-auto pt-2">
                                                    {typeof t.capacity === 'number' ? (
                                                        <p className={`text-xs font-bold uppercase tracking-wider ${soldOut ? 'text-red-500' : 'text-gray-400'}`}>
                                                            {soldOut ? 'Sold Out' : `${t.sold_count} / ${t.capacity} sold`}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                                            {t.sold_count} sold
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>
                        )}

                        {/* 5. Photo Gallery */}
                        {photos.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <ImageIcon className="w-7 h-7 text-[#f5bb00]" />
                                    <h2 className="text-3xl font-black text-[#140152]">Photo Gallery</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {photos.map((ph) => (
                                        <button
                                            key={ph.id}
                                            type="button"
                                            onClick={() => setLightboxImage(ph.image_url)}
                                            className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 focus:outline-none focus:ring-4 focus:ring-[#f5bb00]/40"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={ph.thumbnail_url || ph.image_url}
                                                alt={ph.caption || 'Event photo'}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            {ph.caption && (
                                                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {ph.caption}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 6. Sponsors */}
                        {sponsorsByTier.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <Award className="w-7 h-7 text-[#f5bb00]" />
                                    <h2 className="text-3xl font-black text-[#140152]">Our Sponsors</h2>
                                </div>
                                <div className="space-y-8">
                                    {sponsorsByTier.map((group) => (
                                        <div key={group.tier}>
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                                                {group.tier} Sponsors
                                            </p>
                                            <div className="flex flex-wrap items-center gap-6">
                                                {group.items.map((sponsor) => {
                                                    const inner = sponsor.logo_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={sponsor.logo_url} alt={sponsor.name} className="max-h-16 max-w-[160px] object-contain" />
                                                    ) : (
                                                        <span className="font-black text-[#140152] text-lg">{sponsor.name}</span>
                                                    )
                                                    return sponsor.website_url ? (
                                                        <a
                                                            key={sponsor.id}
                                                            href={sponsor.website_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm hover:shadow-md transition-shadow"
                                                        >
                                                            {inner}
                                                        </a>
                                                    ) : (
                                                        <div
                                                            key={sponsor.id}
                                                            className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm"
                                                        >
                                                            {inner}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 7. FAQ */}
                        {faqs.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <HelpCircle className="w-7 h-7 text-[#f5bb00]" />
                                    <h2 className="text-3xl font-black text-[#140152]">Frequently Asked Questions</h2>
                                </div>
                                <div className="space-y-3 max-w-3xl">
                                    {faqs.map((faq, i) => (
                                        <div key={faq.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                                className="w-full flex items-center justify-between gap-4 p-5 text-left"
                                            >
                                                <span className="font-bold text-[#140152]">{faq.question}</span>
                                                <ChevronDown className={`w-5 h-5 text-[#140152] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openFaq === i && (
                                                <div className="px-5 pb-5 -mt-1 text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 8. Q&A / Comments */}
                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <MessageCircle className="w-7 h-7 text-[#f5bb00]" />
                                <h2 className="text-3xl font-black text-[#140152]">Discussion &amp; Questions</h2>
                            </div>

                            {isLoggedIn ? (
                                <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-6 mb-8 max-w-3xl">
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Share a comment or ask a question…"
                                        rows={3}
                                        className="w-full rounded-2xl border-2 border-gray-200 p-4 text-gray-700 focus:border-[#f5bb00] focus:outline-none resize-none"
                                    />
                                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isQuestion}
                                                onChange={(e) => setIsQuestion(e.target.checked)}
                                                className="w-4 h-4 accent-[#140152]"
                                            />
                                            Mark as a question
                                        </label>
                                        <Button
                                            onClick={handlePostComment}
                                            disabled={postingComment || !commentText.trim()}
                                            className="bg-[#140152] hover:bg-[#2a0a6e] text-white font-bold rounded-xl px-8 py-5"
                                        >
                                            {postingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-6 mb-8 max-w-3xl text-center">
                                    <p className="text-gray-600 font-semibold mb-3">Join the conversation.</p>
                                    <Link href="/auth/login">
                                        <Button className="bg-[#140152] hover:bg-[#2a0a6e] text-white font-bold rounded-xl px-8 py-5">
                                            Log in to comment
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {sortedComments.length > 0 ? (
                                <div className="space-y-4 max-w-3xl">
                                    {sortedComments.map((c) => (
                                        <div key={c.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-black text-[#140152]">{c.author_name}</span>
                                                        {c.is_question && (
                                                            <span className="px-2 py-0.5 rounded-full bg-[#f5bb00]/20 text-[#d9a600] text-xs font-black uppercase tracking-wider">
                                                                Question
                                                            </span>
                                                        )}
                                                        {c.is_answered && (
                                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-black uppercase tracking-wider">
                                                                Answered
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpvote(c.id)}
                                                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#140152] transition-colors flex-shrink-0"
                                                >
                                                    <ThumbsUp className="w-5 h-5" />
                                                    <span className="text-xs font-bold">{c.upvotes}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 font-semibold max-w-3xl">No comments yet. Be the first to start the conversation!</p>
                            )}
                        </section>

                        {/* 9. Polls */}
                        {polls.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <BarChart3 className="w-7 h-7 text-[#f5bb00]" />
                                    <h2 className="text-3xl font-black text-[#140152]">Polls</h2>
                                </div>
                                <div className="space-y-8 max-w-3xl">
                                    {polls.map((poll) => (
                                        <div key={poll.id} className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-sm">
                                            <h3 className="text-xl font-black text-[#140152] mb-5">{poll.question}</h3>
                                            <div className="space-y-3">
                                                {poll.options.map((opt) => (
                                                    <button
                                                        key={opt.index}
                                                        type="button"
                                                        onClick={() => handleVote(poll.id, opt.index)}
                                                        className="relative w-full overflow-hidden rounded-xl border-2 border-gray-100 hover:border-[#f5bb00] transition-colors text-left"
                                                    >
                                                        <div
                                                            className="absolute inset-y-0 left-0 bg-[#f5bb00]/20"
                                                            style={{ width: `${opt.percentage}%` }}
                                                        />
                                                        <div className="relative flex items-center justify-between gap-4 px-5 py-3">
                                                            <span className="font-bold text-[#140152]">{opt.option}</span>
                                                            <span className="text-sm font-black text-gray-500">{Math.round(opt.percentage)}%</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-4">
                                                {poll.total_votes} vote{poll.total_votes === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 10. Donations */}
                        <section>
                            <div className="rounded-[2.5rem] bg-[#140152] p-8 sm:p-10 text-white max-w-3xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <Heart className="w-7 h-7 text-[#f5bb00]" />
                                    <h2 className="text-2xl sm:text-3xl font-black">Support This Event</h2>
                                </div>
                                {donation && (
                                    <p className="text-[#f5bb00] font-bold mb-6">
                                        {formatCurrency(donation.total_raised)} raised from {donation.donor_count} donor{donation.donor_count === 1 ? '' : 's'}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-3 mb-5">
                                    {[10, 25, 50, 100].map((amt) => (
                                        <Button
                                            key={amt}
                                            onClick={() => handleDonate(amt)}
                                            disabled={donating}
                                            className="bg-white/10 hover:bg-[#f5bb00] hover:text-[#140152] text-white font-black rounded-xl px-7 py-6 text-lg border-2 border-white/10 hover:border-[#f5bb00] transition-colors"
                                        >
                                            ${amt}
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="number"
                                        min={1}
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        placeholder="Custom amount"
                                        className="flex-1 rounded-xl bg-white/10 border-2 border-white/10 px-5 py-3 text-white placeholder:text-white/50 focus:border-[#f5bb00] focus:outline-none"
                                    />
                                    <Button
                                        onClick={() => handleDonate(parseFloat(customAmount))}
                                        disabled={donating || !customAmount}
                                        className="bg-[#f5bb00] hover:bg-[#d9a600] text-[#140152] font-black rounded-xl px-8 py-6"
                                    >
                                        {donating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Give'}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </SectionWrapper>

            {/* Lightbox overlay */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxImage}
                        alt="Event photo"
                        className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Button } from '@/components/ui/button'
import {
    Calendar, MapPin, Clock, Share2, Loader2, ArrowLeft,
    ExternalLink, Users, AlertCircle
} from 'lucide-react'
import { eventApi, Event } from '@/lib/api'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EventDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (params.id) {
            loadEvent(params.id as string)
        }
    }, [params.id])

    const loadEvent = async (id: string) => {
        try {
            setLoading(true)
            const data = await eventApi.getEvent(id)
            setEvent(data)
        } catch (err) {
            console.error('Failed to load event', err)
            setError('Failed to load event details. The event may have been removed or does not exist.')
        } finally {
            setLoading(false)
        }
    }

    // Helpers for date formatting
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
                </div>
            </SectionWrapper>
        </>
    )
}

'use client'

import { useState, useEffect } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, ArrowRight, Loader2, CalendarPlus, CheckCircle2, X, Users } from 'lucide-react'
import Link from 'next/link'
import { eventApi, Event } from '@/lib/api'

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadEvents()
    }, [])

    const loadEvents = async () => {
        try {
            setLoading(true)
            const data = await eventApi.getPublicEvents()
            setEvents(data.events)
        } catch (err) {
            console.error('Failed to load events', err)
        } finally {
            setLoading(false)
        }
    }

    // Helper to format date for the calendar badge (Day)
    const getDay = (dateString: string) => {
        const date = new Date(dateString)
        return date.getDate()
    }

    // Helper to format date for the calendar badge (Month)
    const getMonth = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'long' })
    }

    return (
        <>
            <Hero
                title="Upcoming Events"
                subtitle="Connect, Serve, and Grow with Us"
                height="large"
                backgroundImage="/EVENTS.png"
            />

            <SectionWrapper>
                <div className="text-center mb-16 space-y-4">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Mark Your Calendar</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#140152]">What's Happening</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20">
                        <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-xl font-medium text-gray-600">No upcoming events scheduled.</p>
                        <p className="text-gray-400">Please check back later!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
                        {events.map((event) => (
                            <EventCard key={event.id} event={event} getDay={getDay} getMonth={getMonth} />
                        ))}
                    </div>
                )}



                {/* Community Clean-Up Day Section - kept as static/promo section as requested for design */}
                <div className="mt-24 bg-neutral-50 rounded-[3rem] p-10 md:p-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-4">Community Clean-Up Day</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Join us as we serve our city and care for God's creation.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-xl font-bold text-[#140152] mb-4">What to Expect</h3>
                            <ul className="space-y-3">
                                {[
                                    "Cleaning parks, streets, and public spaces",
                                    "Working in teams under simple supervision",
                                    "Providing a safe, respectful environment",
                                    "Encouraging community interaction and unity"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600">
                                        <div className="w-1.5 h-1.5 bg-[#f5bb00] rounded-full mt-2.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-[#140152] mb-4">Who Can Join</h3>
                            <ul className="space-y-3">
                                {[
                                    "Open to individuals, families, and groups",
                                    "No special skills required",
                                    "Guidance provided on the day",
                                    "Suitable for all who are willing to serve"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600">
                                        <div className="w-1.5 h-1.5 bg-[#f5bb00] rounded-full mt-2.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </SectionWrapper>
        </>
    )
}

function EventCard({ event, getDay, getMonth }: { event: Event; getDay: (s: string) => number; getMonth: (s: string) => string }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState<{ ok: boolean; text: string } | null>(null)

    const spotsLeft = event.max_attendees ? Math.max(0, event.max_attendees - (event.registered_count || 0)) : null

    const submit = async () => {
        if (!name.trim() || !email.trim()) return
        setSubmitting(true); setDone(null)
        try {
            const r = await eventApi.guestRsvp(event.id, { guest_name: name.trim(), guest_email: email.trim() })
            setDone({ ok: !r.waitlisted, text: r.message })
        } catch (e) { setDone({ ok: false, text: (e as Error).message }) }
        finally { setSubmitting(false) }
    }

    return (
        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group rounded-[2rem] overflow-hidden bg-white">
            <div className="flex flex-col sm:flex-row h-full">
                <div className="sm:w-2/5 relative h-60 sm:h-auto overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${event.has_image ? eventApi.getImageUrl(event.id) : 'https://images.unsplash.com/photo-1511527661048-b2641b655a2d?w=800&auto=format&fit=crop&q=60'})` }}
                    />
                    <div className="absolute inset-0 bg-[#140152]/20 group-hover:bg-[#140152]/0 transition-colors" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-center shadow-lg">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{getMonth(event.event_date)}</p>
                        <p className="text-2xl font-black text-[#140152]">{getDay(event.event_date)}</p>
                    </div>
                </div>
                <div className="sm:w-3/5 p-8 flex flex-col justify-between">
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#f5bb00]/10 text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-4">
                            {event.event_type || 'General'}
                        </span>
                        <h3 className="text-2xl font-black text-[#140152] mb-3 leading-tight group-hover:text-[#f5bb00] transition-colors">{event.title}</h3>
                        <div className="space-y-2 mb-4">
                            {event.start_time && <div className="flex items-center gap-2 text-sm text-gray-600 font-medium"><Clock className="w-4 h-4 text-[#f5bb00]" />{event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}</div>}
                            {event.location && <div className="flex items-center gap-2 text-sm text-gray-600 font-medium"><MapPin className="w-4 h-4 text-[#f5bb00]" />{event.location}</div>}
                            {spotsLeft !== null && <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Users className="w-4 h-4 text-[#f5bb00]" />{spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'Full — join the waitlist'}</div>}
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2">{event.description || 'Join us for this special event!'}</p>
                    </div>

                    {/* RSVP result / form */}
                    {done ? (
                        <div className={`rounded-2xl p-4 mb-2 text-sm flex items-start gap-2 ${done.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
                            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{done.text}</span>
                        </div>
                    ) : open ? (
                        <div className="bg-gray-50 rounded-2xl p-4 mb-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-widest text-[#140152]">Reserve your spot</p>
                                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
                            </div>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                            <Button onClick={submit} disabled={submitting || !name.trim() || !email.trim()} className="w-full bg-[#140152] hover:bg-[#1d0175] text-white font-bold rounded-lg">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm RSVP'}
                            </Button>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2 flex-wrap pt-5 border-t border-gray-50">
                        {!open && !done && (
                            <Button onClick={() => setOpen(true)} className="bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold rounded-full px-5">RSVP</Button>
                        )}
                        <a href={eventApi.calendarUrl(event.id)} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#140152] hover:text-[#f5bb00] border border-gray-200 hover:border-[#f5bb00] rounded-full px-4 py-2 transition-colors">
                            <CalendarPlus className="w-4 h-4" /> Add to calendar
                        </a>
                        <Link href={`/events/${event.id}`} className="ml-auto">
                            <Button variant="ghost" className="p-0 h-auto font-bold text-[#140152] hover:text-[#f5bb00] hover:no-underline group/btn">
                                Details <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </Card>
    )
}

'use client'

import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, ArrowRight, Share2, Users } from 'lucide-react'
import Link from 'next/link'

// Placeholder data for events
const events = [
    {
        id: 1,
        title: "Mid-Year Thanksgiving Service",
        category: "Special Service",
        date: "July 28, 2024",
        time: "9:00 AM",
        location: "Main Auditorium",
        image: "https://images.unsplash.com/photo-1511527661048-b2641b655a2d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        description: "Join us for a special time of gratitude as we celebrate God's faithfulness in the first half of the year."
    },
    {
        id: 2,
        title: "Youth Summit 2024",
        category: "Youth",
        date: "August 3, 2024",
        time: "10:00 AM",
        location: "Youth Hall",
        image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        description: "An empowering gathering for all young people. Theme: 'Rising Giants'."
    },
    {
        id: 3,
        title: "Community Outreach",
        category: "Outreach",
        date: "August 10, 2024",
        time: "8:00 AM",
        location: "City Center Park",
        image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        description: "Let's spread the love of Christ by serving our community. Free medical checkups and food distribution."
    },
    {
        id: 4,
        title: "Couples' Dinner Night",
        category: "Family",
        date: "August 17, 2024",
        time: "6:00 PM",
        location: "Grand Hotel Banquet Hall",
        image: "https://images.unsplash.com/photo-1519225421980-715cb0202128?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        description: "A romantic evening of love, laughter, and renewal of vows for all married couples."
    }
]

export default function EventsPage() {
    return (
        <>
            <Hero
                title="Upcoming Events"
                subtitle="Connect, Serve, and Grow with Us"
                height="medium"
                backgroundImage="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200"
            />

            <SectionWrapper>
                <div className="text-center mb-16 space-y-4">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Mark Your Calendar</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#140152]">What's Happening</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
                    {events.map((event) => (
                        <Card key={event.id} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group rounded-[2rem] overflow-hidden bg-white">
                            <div className="flex flex-col sm:flex-row h-full">
                                <div className="sm:w-2/5 relative h-60 sm:h-auto overflow-hidden">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                        style={{ backgroundImage: `url(${event.image})` }}
                                    />
                                    <div className="absolute inset-0 bg-[#140152]/20 group-hover:bg-[#140152]/0 transition-colors" />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-center shadow-lg">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{event.date.split(' ')[0]}</p>
                                        <p className="text-2xl font-black text-[#140152]">{event.date.split(' ')[1].replace(',', '')}</p>
                                    </div>
                                </div>
                                <div className="sm:w-3/5 p-8 flex flex-col justify-between">
                                    <div>
                                        <span className="inline-block px-3 py-1 rounded-full bg-[#f5bb00]/10 text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-4">
                                            {event.category}
                                        </span>
                                        <h3 className="text-2xl font-black text-[#140152] mb-3 leading-tight group-hover:text-[#f5bb00] transition-colors cursor-pointer">
                                            {event.title}
                                        </h3>
                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                <Clock className="w-4 h-4 text-[#f5bb00]" />
                                                {event.time}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                <MapPin className="w-4 h-4 text-[#f5bb00]" />
                                                {event.location}
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                                            {event.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                        <Button variant="ghost" className="p-0 h-auto font-bold text-[#140152] hover:text-[#f5bb00] hover:no-underline group/btn">
                                            Event Details <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#140152] hover:bg-[#140152]/5 rounded-full">
                                            <Share2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <Link href="/contact" className="inline-flex items-center gap-2 text-[#140152]/60 font-medium hover:text-[#140152] transition-colors">
                        <Calendar className="w-5 h-5" />
                        <span>Looking for more? View full calendar</span>
                    </Link>
                </div>

                {/* Community Clean-Up Day Section */}
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

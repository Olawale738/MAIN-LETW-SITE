"use client";

import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, PlayCircle, Users, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const weeklySchedule = [
    {
        day: "Sunday", events: [
            { time: "08:00 AM", title: "First Service", venue: "Main Auditorium" },
            { time: "10:00 AM", title: "Second Service", venue: "Main Auditorium" },
            { time: "06:00 PM", title: "Evening Fellowship", venue: "Chapel" }
        ]
    },
    {
        day: "Wednesday", events: [
            { time: "05:30 PM", title: "Bible Study", venue: "Virtual / Zoom" },
            { time: "07:00 PM", title: "Mid-Week Prayer", venue: "Main Auditorium" }
        ]
    },
    {
        day: "Friday", events: [
            { time: "11:00 PM", title: "Night Vigil", venue: "Online" }
        ]
    },
];

const upcomingEvents = [
    {
        title: "Youth Retreat 2024",
        date: "Aug 20-22",
        description: "A 3-day spiritual encounter for young believers to reconnect and grow.",
        image: "https://images.unsplash.com/photo-1523240715634-9426f0bc0f05?q=80&w=2070&auto=format&fit=crop"
    },
    {
        title: "Annual Christmas Concert",
        date: "Dec 15",
        description: "JOIN LIVE on our YouTube channel as we celebrate the birth of Christ.",
        image: "https://images.unsplash.com/photo-1543706062-2f3b972d317b?q=80&w=2070&auto=format&fit=crop"
    },
];

export default function WorshipEventsPage() {
    return (
        <PageLayout>
            <section className="relative py-40 bg-secondary overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="section-container relative z-10 text-center space-y-6">
                    <div className="flex items-center gap-2 text-white font-bold tracking-widest text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full uppercase border border-white/20 w-fit mx-auto">
                        Schedule & Calendar
                    </div>
                    <h1 className="text-5xl md:text-8xl font-heading font-black text-white uppercase italic">
                        Worship <br /> <span className="text-white not-italic underline decoration-primary/50">With Us</span>
                    </h1>
                </div>
            </section>

            {/* Weekly Schedule Grid */}
            <section className="py-24 bg-white">
                <div className="section-container">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {weeklySchedule.map((sched, i) => (
                            <div key={i} className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center font-black text-xl shadow-lg">
                                        {sched.day[0]}
                                    </div>
                                    <h2 className="text-3xl font-heading font-black text-zinc-900 uppercase">
                                        {sched.day}
                                    </h2>
                                </div>
                                <div className="space-y-4">
                                    {sched.events.map((event, j) => (
                                        <div key={j} className="p-8 rounded-[2.5rem] border border-zinc-100 bg-zinc-50 hover:bg-white hover:shadow-xl hover:border-secondary/20 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2 text-primary font-bold">
                                                    <Clock className="w-4 h-4" /> {event.time}
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all text-zinc-300">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-900 mb-2">{event.title}</h3>
                                            <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                                <MapPin className="w-4 h-4" /> {event.venue}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Special Events Section */}
            <section className="py-24 bg-surface">
                <div className="section-container">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-4xl md:text-6xl font-heading font-black text-zinc-900 uppercase">
                            Special <span className="text-primary italic">Events</span>
                        </h2>
                        <p className="text-zinc-500 max-w-xl mx-auto">
                            Mark your calendars for these life-changing encounters. Join us as we celebrate and grow together.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {upcomingEvents.map((event, i) => (
                            <div key={i} className="group relative rounded-[4rem] overflow-hidden shadow-2xl h-[500px]">
                                <img src={event.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute top-8 left-8 bg-primary px-6 py-2 rounded-full text-white font-bold shadow-lg">
                                    {event.date}
                                </div>
                                <div className="absolute bottom-0 left-0 p-12 w-full space-y-4">
                                    <h3 className="text-3xl font-heading font-black text-white uppercase">{event.title}</h3>
                                    <p className="text-white/70 max-w-sm">{event.description}</p>
                                    <Button variant="white" className="mt-4">Register Now</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Watch Live CTA */}
            <section className="bg-white py-24">
                <div className="section-container">
                    <div className="bg-zinc-950 rounded-[4rem] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 text-primary font-bold animate-pulse">
                                <span className="w-3 h-3 rounded-full bg-primary" /> LIVE STREAM
                            </div>
                            <h2 className="text-4xl md:text-6xl font-heading font-black text-white uppercase">
                                Cant Make It <br /> <span className="text-primary italic">In Person?</span>
                            </h2>
                            <p className="text-zinc-400 text-lg">
                                Join our virtual congregation every Sunday at 08:00 AM. Experience the worship and message from wherever you are.
                            </p>
                            <Button size="lg" className="px-12 flex items-center gap-3">
                                <PlayCircle className="w-6 h-6" /> Join Live Stream
                            </Button>
                        </div>
                        <div className="flex-1 relative">
                            <div className="rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl rotate-2">
                                <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}

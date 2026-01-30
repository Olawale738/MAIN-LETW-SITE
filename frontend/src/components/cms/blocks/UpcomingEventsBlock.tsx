'use client'
import React, { useEffect, useState } from 'react';
import { Event, eventApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface UpcomingEventsBlockProps {
    data: {
        title?: string;
        count?: number;
    };
}

export default function UpcomingEventsBlock({ data }: UpcomingEventsBlockProps) {
    const { title = "Upcoming Events", count = 3 } = data;
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await eventApi.getPublicEvents();
                // Filter/slice client side since API doesn't support limit yet
                setEvents(response.events.slice(0, count));
            } catch (error) {
                console.error("Failed to fetch events", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [count]);

    if (loading) {
        return (
            <section className="py-24 bg-white">
                <div className="container px-4 mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black text-[#140152] mb-12 text-center">{title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (events.length === 0) return null;

    return (
        <section className="py-24 bg-white">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Join Us</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-2">{title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {events.map((event) => {
                        const eventDate = new Date(event.event_date);
                        const day = eventDate.getDate();
                        const month = eventDate.toLocaleString('default', { month: 'short' });

                        return (
                            <motion.div
                                key={event.id}
                                whileHover={{ scale: 1.02 }}
                                className="relative group h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#140152] to-[#f5bb00] rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500" />
                                <div className="relative bg-white rounded-2xl p-8 h-full border border-gray-100 shadow-lg flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-[#140152] border border-gray-100">
                                            <span className="text-2xl font-black leading-none">{day}</span>
                                            <span className="text-[10px] font-bold uppercase">{month}</span>
                                        </div>
                                        <span className="px-3 py-1 bg-[#f5bb00]/10 text-[#f5bb00] text-xs font-bold rounded-full uppercase tracking-wider">
                                            Upcoming
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-[#140152] mb-2 line-clamp-1">{event.title}</h3>
                                    <p className="text-gray-500 text-sm mb-6 flex-grow line-clamp-3">{event.description}</p>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                        <div className="flex items-center text-gray-400 text-xs font-medium">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <Link href="/events" className="w-8 h-8 rounded-full bg-[#140152] flex items-center justify-center hover:bg-[#f5bb00] transition-colors">
                                            <ArrowRight className="w-4 h-4 text-white" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="text-center mt-16">
                    <Button asChild size="lg" className="bg-[#140152] hover:bg-blue-900">
                        <Link href="/events">View Full Calendar</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

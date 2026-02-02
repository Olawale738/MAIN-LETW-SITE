'use client'
import React from 'react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'

export default function EvangelismPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero Section */}
            <section className="relative h-[40vh] flex items-center justify-center bg-black overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80")' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-purple-900/70 z-10" />
                <div className="relative z-20 text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Evangelism</h1>
                    <p className="text-xl text-neutral-200 max-w-2xl mx-auto">
                        Spreading the light of Christ through compassion and connection.
                    </p>
                </div>
            </section>

            {/* Announcements */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <ServiceAnnouncements serviceName="Evangelism" />
            </div>

            {/* Our Approach */}
            <section className="py-20 px-4 max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12 text-neutral-800 dark:text-white">Our Evangelism Approach</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Street & Community Evangelism",
                            desc: "Proclaiming the gospel in public spaces where people gather.",
                            icon: "🏙️",
                            bgImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "One-on-One Conversations",
                            desc: "Personal, heart-to-heart sharing of the Good News.",
                            icon: "🗣️",
                            bgImage: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Compassion-Driven Outreach",
                            desc: "Meeting physical needs as a bridge to spiritual truth.",
                            icon: "🤝",
                            bgImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Community Engagement",
                            desc: "Building long-term relationships for lasting impact.",
                            icon: "🌱",
                            bgImage: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Follow-up & Support",
                            desc: "Walking with new believers on their journey.",
                            icon: "👣",
                            bgImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Global Reach",
                            desc: "Participation through prayer, support, and missions.",
                            icon: "🌍",
                            bgImage: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=60"
                        }
                    ].map((item, index) => (
                        <div key={index} className="relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group min-h-[280px]">
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url(${item.bgImage})` }}
                            />
                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#140152]/80 via-[#140152]/85 to-[#140152]/90" />

                            {/* Content */}
                            <div className="relative z-10 p-6 h-full flex flex-col">
                                <div className="text-4xl mb-4">{item.icon}</div>
                                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-[#f5bb00] transition-colors">{item.title}</h3>
                                <p className="text-gray-200">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Frequency & Location */}
            <section className="py-20 bg-neutral-100 dark:bg-neutral-800">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-8 text-neutral-800 dark:text-white">Join Us</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4 text-blue-600">Frequency</h3>
                            <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
                                <li>• Weekly Local Outreaches</li>
                                <li>• Monthly Community Events</li>
                                <li>• Special Annual Crusades</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4 text-purple-600">Location</h3>
                            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                                Local communities and designated outreach areas.
                            </p>
                            <p className="text-sm text-neutral-500">
                                Contact us for this week's meeting point.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

'use client'
import React from 'react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'

export default function EvangelismPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero Section */}
            <section className="relative h-[40vh] flex items-center justify-center bg-black overflow-hidden bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80")'}}>
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
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12 text-neutral-800 dark:text-white">Our Evangelism Approach</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Street & Community Evangelism",
                            desc: "Proclaiming the gospel in public spaces where people gather.",
                            icon: "🏙️"
                        },
                        {
                            title: "One-on-One Conversations",
                            desc: "Personal, heart-to-heart sharing of the Good News.",
                            icon: "🗣️"
                        },
                        {
                            title: "Compassion-Driven Outreach",
                            desc: "Meeting physical needs as a bridge to spiritual truth.",
                            icon: "🤝"
                        },
                        {
                            title: "Community Engagement",
                            desc: "Building long-term relationships for lasting impact.",
                            icon: "🌱"
                        },
                        {
                            title: "Follow-up & Support",
                            desc: "Walking with new believers on their journey.",
                            icon: "👣"
                        },
                        {
                            title: "Global Reach",
                            desc: "Participation through prayer, support, and missions.",
                            icon: "🌍"
                        }
                    ].map((item, index) => (
                        <div key={index} className="p-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-4">{item.icon}</div>
                            <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">{item.title}</h3>
                            <p className="text-neutral-600 dark:text-neutral-300">{item.desc}</p>
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

import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'

export const metadata: Metadata = {
    title: 'Charity Initiatives | Light Encounter Tabernacle',
    description: 'Expressing the love of Christ through compassion, relief, and practical support for vulnerable individuals.',
}

export default function CharityPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero */}
            <div className="w-full">
                <img
                    src="/Charity.png"
                    alt="Charity"
                    className="w-full h-auto block"
                />
            </div>

            {/* Focus Areas */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-16 text-neutral-800 dark:text-white">Our Focus Areas</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            title: "Community Support",
                            desc: "Providing food, essentials, and relief to those in need.",
                            bgImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Care for the Vulnerable",
                            desc: "Supporting widows, orphans, and struggling families.",
                            bgImage: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Emergency Response",
                            desc: "Rapid relief during crisis and unexpected hardship.",
                            bgImage: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60"
                        },
                        {
                            title: "Ongoing Projects",
                            desc: "Sustainable compassion initiatives for long-term change.",
                            bgImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60"
                        }
                    ].map((item, index) => (
                        <div key={index} className="relative overflow-hidden rounded-xl transition-all group min-h-[280px] shadow-lg hover:shadow-xl">
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url(${item.bgImage})` }}
                            />
                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#140152]/85 via-[#140152]/80 to-[#140152]/90" />

                            {/* Content */}
                            <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                                <h3 className="text-lg font-bold mb-3 text-white group-hover:text-[#f5bb00] transition-colors">{item.title}</h3>
                                <p className="text-gray-200">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Trust Note */}
            <section className="py-12 bg-blue-50 dark:bg-blue-900/20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <p className="text-lg font-medium text-blue-900 dark:text-blue-100">
                        🛡️ All charity initiatives are handled with integrity, accountability, and spiritual responsibility.
                    </p>
                </div>
            </section>

            {/* How to get involved */}
            <section className="py-20 px-4 max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-12 text-neutral-800 dark:text-white">Get Involved</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-8 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
                        <h3 className="text-xl font-bold mb-4">🙏 Pray</h3>
                        <p className="text-neutral-600 dark:text-neutral-300">Support the work through prayer and spiritual intercession.</p>
                    </div>
                    <div className="p-8 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
                        <h3 className="text-xl font-bold mb-4">🤝 Volunteer</h3>
                        <p className="text-neutral-600 dark:text-neutral-300">Join our teams on the ground to serve the community.</p>
                    </div>
                    <div className="p-8 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
                        <h3 className="text-xl font-bold mb-4">💝 Give</h3>
                        <p className="text-neutral-600 dark:text-neutral-300">Financial support enables us to meet practical needs.</p>
                        <PremiumButton href="/giving" className="mt-4 text-[#140152] hover:text-[#f5bb00]">
                            Support Now
                        </PremiumButton>
                    </div>
                </div>
            </section>
        </div>
    )
}

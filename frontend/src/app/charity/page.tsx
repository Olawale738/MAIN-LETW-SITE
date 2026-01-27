import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Charity Initiatives | Light Encounter Tabernacle',
    description: 'Expressing the love of Christ through compassion, relief, and practical support for vulnerable individuals.',
}

export default function CharityPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero Section */}
            <section className="relative h-[50vh] flex items-center justify-center bg-black overflow-hidden bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1600&q=80")'}}>
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/50 z-10" />
                <div className="relative z-20 text-center px-4 max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Charity & Compassion</h1>
                    <p className="text-xl text-neutral-100 mb-8">
                        "Our charity initiatives are dedicated to expressing the love of Christ through compassion, relief, and practical support for vulnerable individuals and communities."
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/charity/contribute">
                            <Button size="lg" className="bg-white text-black hover:bg-neutral-200">
                                Contribute
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                                See Our Impact
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Focus Areas */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-16 text-neutral-800 dark:text-white">Our Focus Areas</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "Community Support", desc: "Providing food, essentials, and relief to those in need." },
                        { title: "Care for the Vulnerable", desc: "Supporting widows, orphans, and struggling families." },
                        { title: "Emergency Response", desc: "Rapid relief during crisis and unexpected hardship." },
                        { title: "Ongoing Projects", desc: "Sustainable compassion initiatives for long-term change." }
                    ].map((item, index) => (
                        <div key={index} className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                            <h3 className="text-lg font-bold mb-3 text-neutral-900 dark:text-white">{item.title}</h3>
                            <p className="text-neutral-600 dark:text-neutral-400">{item.desc}</p>
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
                        <Link href="/charity/contribute" className="inline-block mt-4 text-blue-600 hover:underline">
                            Support Now →
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Contribute | Charity Attributes',
    description: 'Support our charity work. Your contribution enables us to meet real needs and restore dignity.',
}

export default function ContributePage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-28 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-6 text-neutral-900 dark:text-white">Support Our Charity Work</h1>

                {/* Why Contribute */}
                <section className="mb-12 text-center">
                    <p className="text-xl text-neutral-600 dark:text-neutral-300">
                        "Your contribution enables us to meet real needs, restore dignity, and bring hope through practical acts of compassion."
                    </p>
                </section>

                {/* What Contributions Support */}
                <section className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-sm">
                        <h2 className="text-2xl font-bold mb-6 text-blue-600">What Your Support Does</h2>
                        <ul className="space-y-3 text-neutral-700 dark:text-neutral-300">
                            <li className="flex items-start gap-2">✅ <span>Food and essential supplies</span></li>
                            <li className="flex items-start gap-2">✅ <span>Community relief initiatives</span></li>
                            <li className="flex items-start gap-2">✅ <span>Support for vulnerable individuals</span></li>
                            <li className="flex items-start gap-2">✅ <span>Emergency assistance</span></li>
                            <li className="flex items-start gap-2">✅ <span>Ongoing charity programs</span></li>
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-sm flex flex-col justify-center">
                        <h2 className="text-2xl font-bold mb-6 text-purple-600">How Funds Are Managed</h2>
                        <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                            Contributions are prayerfully stewarded and used exclusively for charity and compassion initiatives, with accountability and integrity.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-100 italic">
                                "We value every gift and ensure it makes a direct impact."
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contribution Options */}
                <section className="text-center">
                    <h2 className="text-2xl font-bold mb-8 text-neutral-900 dark:text-white">Ready to make a difference?</h2>
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <div className="p-6 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-blue-500 transition-colors w-full md:w-64 cursor-pointer">
                            <h3 className="text-xl font-bold mb-2">One-time Gift</h3>
                            <p className="text-neutral-500 text-sm mb-4">Make a single impact today.</p>
                            <Link href="/charity/contribute/form?type=one-time">
                                <Button className="w-full">Contribute Now</Button>
                            </Link>
                        </div>
                        <div className="p-6 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-purple-500 transition-colors w-full md:w-64 cursor-pointer">
                            <h3 className="text-xl font-bold mb-2">Ongoing Support</h3>
                            <p className="text-neutral-500 text-sm mb-4">Partner with us monthly.</p>
                            <Link href="/charity/contribute/form?type=monthly">
                                <Button variant="secondary" className="w-full">Become a Partner</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

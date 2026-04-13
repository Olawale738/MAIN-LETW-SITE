'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Construction } from 'lucide-react'
import Link from 'next/link'

export default function SecondarySchoolComingSoonPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#140152_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative p-8 md:p-12 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8"
                    >
                        <Construction className="w-12 h-12" />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-3xl md:text-4xl font-black text-[#140152] mb-4"
                    >
                        Secondary School Website Coming Soon
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-lg text-gray-600 mb-8 max-w-md mx-auto"
                    >
                        The dedicated Secondary School website is currently under development. Please check back soon or contact us directly for admissions and enquiries.
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <Link href="/education/secondary-school" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-[#140152] hover:bg-[#140152]/90 text-white py-6 px-8 text-lg group">
                            <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Back to Secondary School
                        </Link>
                    </motion.div>
                </div>

                {/* Bottom decoration */}
                <div className="h-2 bg-gradient-to-r from-blue-400 via-[#140152] to-[#f5bb00]" />
            </div>
        </div>
    )
}

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Construction, School } from 'lucide-react'
import Link from 'next/link'

export default function EducationComingSoonPage() {
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
                        className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-8"
                    >
                        <Construction className="w-12 h-12" />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-3xl md:text-4xl font-black text-[#140152] mb-4"
                    >
                        Under Development
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-lg text-gray-600 mb-8 max-w-md mx-auto"
                    >
                        We are currently building this portal to provide you with the best experience. Please check back later!
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <Button asChild className="bg-[#140152] hover:bg-[#140152]/90 text-white font-bold py-6 px-8 rounded-xl text-lg group">
                            <Link href="/education">
                                <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Education
                            </Link>
                        </Button>
                    </motion.div>
                </div>

                {/* Bottom decoration */}
                <div className="h-2 bg-gradient-to-r from-orange-400 via-[#140152] to-blue-500" />
            </div>
        </div>
    )
}

'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UniversityComingSoon() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
            <div className="relative flex-1 flex items-center justify-center bg-[#064e3b] overflow-hidden">
                <img
                    src="/UniversityHero.jpg"
                    alt="University Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#022c22] via-transparent to-black/50" />

                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-emerald-400 font-bold tracking-widest uppercase mb-4 text-sm md:text-base">
                            The Light University
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                            Coming Soon
                        </h1>
                        <p className="text-xl md:text-2xl text-emerald-100 max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
                            Preparing the next generation of leaders. Our university portal is currently being established.
                        </p>

                        <Link href="/education/university">
                            <Button size="lg" className="rounded-full font-bold bg-emerald-500 text-white hover:bg-emerald-400 hover:text-white transition-colors">
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Return to University
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

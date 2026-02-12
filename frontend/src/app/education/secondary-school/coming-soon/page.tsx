'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SecondarySchoolComingSoon() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
            <div className="relative flex-1 flex items-center justify-center bg-[#1e293b] overflow-hidden">
                <img
                    src="/SecondarySchoolHero.jpg"
                    alt="Secondary School Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/50" />

                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-[#f5bb00] font-bold tracking-widest uppercase mb-4 text-sm md:text-base">
                            Secondary School
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                            Coming Soon
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
                            Developing excellence in education. Our new Secondary School portal is under construction.
                        </p>

                        <Link href="/education/secondary-school">
                            <Button size="lg" className="rounded-full font-bold bg-[#f5bb00] text-[#140152] hover:bg-white hover:text-[#140152] transition-colors">
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Return to Secondary School
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

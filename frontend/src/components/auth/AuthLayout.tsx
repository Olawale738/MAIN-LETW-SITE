'use client'
import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle: string
    imageSrc?: string
}

export default function AuthLayout({ children, title, subtitle, imageSrc }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex w-full bg-white dark:bg-neutral-950 font-sans">
            {/* Left Side - Visual/Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#140152] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {imageSrc ? (
                        <Image
                            src={imageSrc}
                            alt="Background"
                            fill
                            className="object-cover opacity-50 mix-blend-overlay"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#140152] via-[#1d0175] to-[#0a0029]" />
                    )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full z-10 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")` }}></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#f5bb00] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#4f46e5] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative z-20 p-12 text-white max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-4xl font-bold mb-6 leading-tight">Ministry Management Simplified.</h2>
                        <p className="text-lg text-gray-200 leading-relaxed opacity-90">
                            Experience a powerful platform designed to help you manage sermons, events, and community engagement with ease and excellence.
                        </p>
                        <div className="mt-8 flex gap-2">
                            <div className="w-12 h-1 bg-[#f5bb00] rounded-full"></div>
                            <div className="w-4 h-1 bg-white/30 rounded-full"></div>
                            <div className="w-4 h-1 bg-white/30 rounded-full"></div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
                <div className="absolute inset-0 bg-white dark:bg-neutral-950 z-0 lg:hidden">
                    {/* Mobile Background if needed */}
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="mb-8">
                        <div className="inline-block mb-6">
                            <Image
                                src="/LETWlogo.png"
                                alt="Light Encounter Logo"
                                width={80}
                                height={80}
                                className="rounded-xl"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-[#140152] dark:text-white mb-2 tracking-tight">{title}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>
                    </div>

                    {children}

                </motion.div>
            </div>
        </div>
    )
}

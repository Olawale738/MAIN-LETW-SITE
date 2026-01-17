'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ConstructionModal() {
    const router = useRouter()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-2xl"
            >
                <div className="w-20 h-20 bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#140152]">
                    <span className="text-4xl">🚧</span>
                </div>

                <h2 className="text-2xl font-black text-[#140152] mb-3">Under Development</h2>
                <p className="text-gray-600 mb-8 font-medium">
                    This section of the school website is currently being built. We're working hard to bring you a great experience!
                </p>

                <Button
                    variant="primary"
                    onClick={() => router.back()}
                    className="w-full rounded-full py-0.5 px-1 pr-5 shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300 h-12"
                >
                    <div className="flex items-center justify-center gap-4 w-full">
                        <div className="p-2 bg-white fill-current rounded-full transition-transform group-hover:-translate-x-1">
                             <ArrowLeft className="w-4 h-4 text-[#140152] rotate-45" /> 
                             {/* rotate-45 for ArrowLeft to mirror the -rotate-45 of ArrowRight? ArrowRight -45 makes it point top-right. ArrowLeft points left. If we want top-left? or just left?
                             The premium button arrow is oblique. ArrowRight is ->. -45 makes it point NE.
                             ArrowLeft is <-. If we want NW, we rotate 45?
                             Let's just keep it simple or try to match the "sleek" feel. 
                             I'll just use ArrowLeft without rotation for now or maybe -45?
                             Let's stick to no rotation for Go Back, or maybe simple translate.
                             And use the structure.
                             */}
                             <ArrowLeft className="w-4 h-4 text-[#140152]" />
                        </div>
                        <p>Go Back</p>
                    </div>
                </Button>
            </motion.div>
        </div>
    )
}

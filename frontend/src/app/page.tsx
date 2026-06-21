'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import { cmsApi, Block } from '@/lib/api'
import PageRenderer from '@/components/cms/PageRenderer'
import { DEFAULT_HOME_BLOCKS } from '@/lib/cmsDefaults'
import LiveStreamPlayer from '@/components/LiveStreamPlayer'
import DailyVerseWidget from '@/components/widgets/DailyVerseWidget'
import SeasonalBanner from '@/components/seasonal/SeasonalBanner'
import PremiumHero from '@/components/home/PremiumHero'
import WorldMapInteractive from '@/components/home/WorldMapInteractive'

export default function HomePage() {
    const [blocks, setBlocks] = useState<Block[]>([])
    const [loading, setLoading] = useState(true)

    // Cinematic scroll progress bar at very top of viewport
    const { scrollYProgress } = useScroll()
    const progressX = useSpring(scrollYProgress, { stiffness: 120, damping: 25, restDelta: 0.001 })

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await cmsApi.getPage('home')
                if (data && data.content && data.content.blocks && data.content.blocks.length > 0) {
                    setBlocks(data.content.blocks)
                } else {
                    setBlocks(DEFAULT_HOME_BLOCKS)
                }
            } catch (e) {
                setBlocks(DEFAULT_HOME_BLOCKS)
            } finally {
                // Tiny delay so the cinematic intro reads — not jarring
                setTimeout(() => setLoading(false), 250)
            }
        }
        fetchContent()
    }, [])

    return (
        <>
            {/* ── Cinematic scroll progress bar (gold, ultra-thin, top of viewport) */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left pointer-events-none"
                style={{
                    scaleX: progressX,
                    background: 'linear-gradient(90deg, #f5bb00 0%, #ffd763 50%, #f5bb00 100%)',
                    boxShadow: '0 0 12px rgba(245,187,0,0.55)',
                }}
            />

            <AnimatePresence mode="wait">
                {loading ? (
                    <BrandedSplash key="splash" />
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="relative bg-white dark:bg-black overflow-x-hidden min-h-screen"
                    >
                        {/* Ambient brand glows — soft, decorative, very low opacity. Sit behind content. */}
                        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                            <div
                                className="absolute top-[10%] -left-40 w-[40rem] h-[40rem] rounded-full blur-[180px] opacity-[0.06]"
                                style={{ background: '#f5bb00' }}
                            />
                            <div
                                className="absolute bottom-[8%] -right-40 w-[44rem] h-[44rem] rounded-full blur-[200px] opacity-[0.05]"
                                style={{ background: '#7c3aed' }}
                            />
                        </div>

                        <LiveStreamPlayer />
                        <SeasonalBanner />
                        <PremiumHero />
                        <WorldMapInteractive />
                        <PageRenderer blocks={blocks} />
                        <DailyVerseWidget />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

/* ────────────────────────────────────────────────────────────────────────────
   Cinematic brand splash — replaces the bare loading spinner.
   Uses a deep navy gradient field, animated gold orbs, the LETW monogram in
   gold, and a gentle pulsing dot pattern. Feels like a film studio bumper.
   ──────────────────────────────────────────────────────────────────────── */
function BrandedSplash() {
    return (
        <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0028 0%, #140152 55%, #1d0175 100%)' }}
        >
            {/* Animated orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-[20%] left-[15%] w-[28rem] h-[28rem] rounded-full blur-[130px]"
                    style={{ background: 'rgba(245,187,0,0.20)' }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[15%] right-[10%] w-[32rem] h-[32rem] rounded-full blur-[140px]"
                    style={{ background: 'rgba(124,58,237,0.30)' }}
                    animate={{ scale: [1.05, 1, 1.05], opacity: [0.6, 0.85, 0.6] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
            </div>

            {/* Faint grid */}
            <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }}
            />

            {/* Center mark */}
            <div className="relative z-10 text-center">
                {/* Animated monogram ring */}
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="relative mx-auto mb-7 w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #f5bb00 0%, #ffd763 100%)',
                        boxShadow: '0 0 60px rgba(245,187,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.4)',
                    }}
                >
                    <motion.span
                        className="text-4xl font-black"
                        style={{ color: '#140152', fontFamily: '"Satoshi","Cormorant Garamond",Georgia,serif' }}
                        animate={{ opacity: [0.9, 1, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        L
                    </motion.span>
                    {/* Outer animated rings */}
                    <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ border: '2px solid rgba(245,187,0,0.35)' }}
                        animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ border: '2px solid rgba(245,187,0,0.25)' }}
                        animate={{ scale: [1, 1.8], opacity: [0.45, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                    />
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="text-xs md:text-sm font-black uppercase tracking-[0.55em] text-[#f5bb00] mb-3"
                >
                    Light Encounter Tabernacle
                </motion.p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-sm md:text-base text-white/70 italic"
                    style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
                >
                    Preparing your encounter…
                </motion.p>

                {/* Three pulsing dots */}
                <div className="flex items-center justify-center gap-1.5 mt-6">
                    {[0, 1, 2].map(i => (
                        <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[#f5bb00]"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

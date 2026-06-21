'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, Calendar, Volume2, VolumeX } from 'lucide-react'

/**
 * Hillsong-style cinematic video hero.
 *
 * - Full-screen autoplaying silent background video with poster fallback
 * - Strong gradient overlay so type stays legible against any frame
 * - Centered serif headline + sans subtitle
 * - Merged messaging: identity (LETW) + invitation (Sundays + welcome + watch)
 * - Mute toggle + scroll cue + light particles for depth
 *
 * Pass `videoUrl` to wire up a custom hero video. Defaults to a beautiful
 * gradient field with cinematic motion if no video is supplied.
 */

interface Props {
    /** mp4 / webm URL. If omitted, a poster + gradient stage renders. */
    videoUrl?: string
    /** Poster shown until the video can play. */
    posterUrl?: string
}

export default function PremiumHero({
    videoUrl,
    posterUrl = '/9.png',
}: Props) {
    const [muted, setMuted] = useState(true)
    const [canPlay, setCanPlay] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const toggleMute = () => {
        setMuted(m => {
            const next = !m
            if (videoRef.current) videoRef.current.muted = next
            return next
        })
    }

    return (
        <section className="relative w-full overflow-hidden bg-[#06002a]" style={{ minHeight: '100vh' }}>
            {/* — 1 · Background video with poster fallback — */}
            {videoUrl ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={posterUrl}
                    onCanPlay={() => setCanPlay(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${canPlay ? 'opacity-60' : 'opacity-0'}`}>
                    <source src={videoUrl} type="video/mp4" />
                </video>
            ) : null}

            {/* Fallback poster + gradient (always rendered behind the video) */}
            <div className="absolute inset-0 pointer-events-none">
                {posterUrl && (
                    <img src={posterUrl} alt="" className="w-full h-full object-cover opacity-40" />
                )}
                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(29,1,117,0.55) 0%, rgba(10,0,40,0.85) 60%, rgba(2,0,15,1) 100%)' }}
                />
            </div>

            {/* Strong overlay for type legibility */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(6,0,42,0.5) 0%, rgba(6,0,42,0.25) 35%, rgba(6,0,42,0.6) 75%, rgba(6,0,42,0.95) 100%)',
                }}
            />

            {/* Ambient brand orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-40 w-[34rem] h-[34rem] rounded-full blur-[140px] animate-[orb1_18s_ease-in-out_infinite_alternate]"
                    style={{ background: 'rgba(245,187,0,0.15)' }} />
                <div className="absolute bottom-1/4 -right-40 w-[36rem] h-[36rem] rounded-full blur-[140px] animate-[orb2_22s_ease-in-out_infinite_alternate]"
                    style={{ background: 'rgba(124,58,237,0.18)' }} />
            </div>

            {/* Divine-light particles */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 24 }).map((_, i) => {
                    const dur = 9 + (i % 7) * 2
                    const size = 1 + (i % 4)
                    return (
                        <span key={i}
                            className="absolute block rounded-full bg-[#f5bb00] animate-[divineDrift_linear_infinite]"
                            style={{
                                left: `${(i * 137) % 100}%`,
                                bottom: '-2%',
                                width: `${size}px`,
                                height: `${size}px`,
                                boxShadow: '0 0 10px rgba(245,187,0,0.9)',
                                animationDuration: `${dur}s`,
                                animationDelay: `${(i * 0.27).toFixed(2)}s`,
                                opacity: 0.5,
                            }} />
                    )
                })}
            </div>

            {/* — Centerpiece — */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 min-h-screen pb-24 pt-28">
                {/* Brand eyebrow */}
                <p className="text-[#f5bb00] font-bold tracking-[0.5em] text-[10px] md:text-[11px] uppercase mb-6">
                    Light Encounter Tabernacle Worldwide
                </p>

                {/* Merged headline (identity + invitation) */}
                <h1 className="font-serif font-black text-white leading-[0.95] tracking-tight"
                    style={{ fontSize: 'clamp(2.75rem, 8vw, 7rem)' }}>
                    <span className="block">Come &amp; Worship</span>
                    <span className="block">
                        <span className="bg-gradient-to-r from-[#f5bb00] via-amber-300 to-[#f5bb00] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,187,0,0.3)]">
                            With Us
                        </span>
                    </span>
                </h1>

                {/* Merged subtitle */}
                <p className="font-sans text-white/85 text-base md:text-xl mt-6 max-w-2xl leading-relaxed font-light">
                    A worldwide family carrying the gospel into every nation — Spirit-filled worship, life-changing teaching, and the unmistakable presence of Jesus. Come as you are; leave forever changed.
                </p>

                {/* Service times strip — Hillsong-style mini info row */}
                <p className="font-sans text-white/60 text-xs md:text-sm mt-5 uppercase tracking-[0.25em] inline-flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#f5bb00]" /> Sunday · 9 AM · Worldwide · In-person &amp; online
                </p>

                {/* CTAs — merged from both blocks */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <Link href="/services/sunday-service"
                        className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-7 py-4 rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-[#f5bb00]/30 hover:scale-105 transition-transform">
                        Plan your Sunday <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/onboarding"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-4 rounded-full text-sm uppercase tracking-widest border border-white/25 backdrop-blur-md transition-colors">
                        New here? Start here
                    </Link>
                    <Link href="/live"
                        className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-white/80 hover:text-white font-bold px-5 py-4 rounded-full text-sm uppercase tracking-widest transition-colors">
                        <Play className="w-4 h-4 text-[#f5bb00] fill-current" /> Watch live
                    </Link>
                </div>

                {/* Mute toggle (only when a video is actually playing) */}
                {videoUrl && (
                    <button onClick={toggleMute} aria-label={muted ? 'Unmute video' : 'Mute video'}
                        className="absolute bottom-8 right-6 md:right-10 z-20 w-11 h-11 rounded-full bg-black/40 backdrop-blur border border-white/20 text-white/80 hover:bg-black/60 hover:text-white flex items-center justify-center">
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                )}

                {/* Scroll cue */}
                <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-60'}`}>
                    <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1">
                        <span className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
                    </div>
                </div>
            </div>

            {/* Curved bottom edge */}
            <svg viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden
                className="absolute left-0 right-0 bottom-0 w-full h-[80px] md:h-[120px]">
                <path d="M0,40 Q360,120 720,60 T1440,40 L1440,100 L0,100 Z" fill="white" />
            </svg>

            <style jsx>{`
                @keyframes orb1 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50%     { transform: translate(60px,40px) scale(1.1); }
                }
                @keyframes orb2 {
                    0%,100% { transform: translate(0,0) scale(1.05); }
                    50%     { transform: translate(-70px,-40px) scale(.95); }
                }
                @keyframes divineDrift {
                    0%   { transform: translateY(0) translateX(0); opacity: 0; }
                    8%   { opacity: 0.6; }
                    90%  { opacity: 0.6; }
                    100% { transform: translateY(-110vh) translateX(40px); opacity: 0; }
                }
            `}</style>
        </section>
    )
}

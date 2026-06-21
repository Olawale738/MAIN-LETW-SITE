'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Globe2 } from 'lucide-react'

/**
 * Premium homepage hero — gold-and-navy cinematic stage with:
 *   1. Full-screen background video (silent autoplay) with gradient overlay
 *   2. 3D animated globe (SVG) with rotating light rays
 *   3. Divine-light particle drift overhead
 *   4. Serif title (Playfair) over modern sans subtitle (Poppins)
 *   5. Curved bottom edge transitioning into the next section
 *
 * Designed to sit BEFORE PageRenderer so admin CMS blocks below remain
 * untouched.
 */
export default function PremiumHero({ videoUrl }: { videoUrl?: string }) {
    const [scrolled, setScrolled] = useState(false)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <section className="relative w-full overflow-hidden bg-[#06002a]" style={{ minHeight: '100vh' }}>
            {/* — 1 · Background video (or gradient fallback) — */}
            {videoUrl ? (
                <video autoPlay muted loop playsInline poster="/9.png"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none">
                    <source src={videoUrl} type="video/mp4" />
                </video>
            ) : (
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #1d0175 0%, #0a0028 60%, #02000f 100%)' }} />
            )}

            {/* Brand gradient overlay */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(6,0,42,0.55) 0%, rgba(6,0,42,0.35) 40%, rgba(6,0,42,0.85) 100%)' }} />

            {/* Ambient gold + violet orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-40 w-[34rem] h-[34rem] rounded-full blur-[140px] animate-[orb1_18s_ease-in-out_infinite_alternate]"
                    style={{ background: 'rgba(245,187,0,0.18)' }} />
                <div className="absolute bottom-1/4 -right-40 w-[36rem] h-[36rem] rounded-full blur-[140px] animate-[orb2_22s_ease-in-out_infinite_alternate]"
                    style={{ background: 'rgba(124,58,237,0.20)' }} />
            </div>

            {/* — 3 · Divine-light particles drifting upward — */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 36 }).map((_, i) => {
                    const dur = 8 + (i % 7) * 2
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
                                opacity: 0.6,
                            }} />
                    )
                })}
            </div>

            {/* — Centerpiece stage — */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-28 min-h-screen">

                {/* — 2 · 3D globe with rotating light rays — */}
                <Globe3D />

                {/* Brand eyebrow */}
                <p className="mt-10 inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.45em] text-[10px] uppercase">
                    <Sparkles className="w-3 h-3" /> Light Encounter Tabernacle Worldwide
                </p>

                {/* — 4 · Serif headline + sans subtitle — */}
                <h1 className="font-serif font-black text-white leading-[0.95] tracking-tight mt-5"
                    style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}>
                    <span className="block">Encounter</span>
                    <span className="block">
                        <span className="bg-gradient-to-r from-[#f5bb00] via-amber-300 to-[#f5bb00] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,187,0,0.3)]">
                            the Light
                        </span>{' '}
                        of God
                    </span>
                </h1>
                <p className="font-sans text-white/75 text-base md:text-xl mt-6 max-w-2xl leading-relaxed font-light">
                    A worldwide family carrying the gospel into every nation — through teaching, worship, outreach, and the unmistakable presence of Jesus.
                </p>

                {/* CTAs */}
                <div className="mt-10 flex items-center gap-3 flex-wrap justify-center">
                    <Link href="/onboarding"
                        className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-7 py-4 rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-[#f5bb00]/30 hover:scale-105 transition-transform">
                        New here? Start here <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/live"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-4 rounded-full text-sm uppercase tracking-widest border border-white/25 backdrop-blur-md transition-colors">
                        Watch Live
                    </Link>
                </div>

                {/* Scroll cue */}
                <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-60'}`}>
                    <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1">
                        <span className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
                    </div>
                </div>
            </div>

            {/* — 5 · Curved bottom edge (globe-inspired) — */}
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
                    8%   { opacity: 0.7; }
                    90%  { opacity: 0.7; }
                    100% { transform: translateY(-110vh) translateX(40px); opacity: 0; }
                }
            `}</style>
        </section>
    )
}


/**
 * 3D-feel animated globe. Pure SVG + CSS — no three.js so we don't pay the
 * bundle cost. Renders a sphere with longitude/latitude lines that rotate,
 * concentric halo rings, and 8 gold rays of light radiating outward.
 */
function Globe3D() {
    return (
        <div className="relative w-[280px] h-[280px] md:w-[360px] md:h-[360px]">
            {/* Rays */}
            <div className="absolute inset-0 animate-[raySpin_22s_linear_infinite]">
                {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i}
                        className="absolute top-1/2 left-1/2 w-px h-[200%] -translate-x-1/2 -translate-y-1/2 origin-center"
                        style={{
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                            background: 'linear-gradient(to bottom, transparent 0%, rgba(245,187,0,0.4) 35%, rgba(245,187,0,0.85) 50%, rgba(245,187,0,0.4) 65%, transparent 100%)',
                            filter: 'blur(0.5px)',
                            boxShadow: '0 0 12px rgba(245,187,0,0.6)',
                        }} />
                ))}
            </div>

            {/* Halo rings */}
            <div className="absolute inset-0 rounded-full border border-[#f5bb00]/25 animate-[ringPulse_4s_ease-in-out_infinite]" />
            <div className="absolute inset-3 rounded-full border border-[#f5bb00]/15 animate-[ringPulse_5s_ease-in-out_infinite] [animation-delay:.5s]" />
            <div className="absolute inset-6 rounded-full border border-white/10" />

            {/* Inner glow */}
            <div className="absolute inset-8 rounded-full"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(245,187,0,0.45), rgba(124,58,237,0.35) 60%, rgba(6,0,42,0.9) 100%)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)' }} />

            {/* Wireframe globe (SVG longitude + latitude) */}
            <svg viewBox="-100 -100 200 200" className="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)] animate-[globeSpin_30s_linear_infinite]">
                {/* Equator + tropics */}
                {[-60, -30, 0, 30, 60].map((y, i) => (
                    <ellipse key={`l${i}`} cx="0" cy={y} rx="90" ry="10"
                        fill="none" stroke="rgba(245,187,0,0.45)" strokeWidth="0.6"
                        transform={`translate(0,${y * -0.0}) scale(1, ${Math.cos(y * Math.PI / 180)})`} />
                ))}
                {/* Longitude */}
                {[0, 30, 60, 90, 120, 150].map((deg, i) => (
                    <ellipse key={`m${i}`} cx="0" cy="0" rx={90 * Math.abs(Math.cos(deg * Math.PI / 180))} ry="90"
                        fill="none" stroke="rgba(245,187,0,0.35)" strokeWidth="0.6" />
                ))}
                {/* Equator emphasis */}
                <ellipse cx="0" cy="0" rx="90" ry="90" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />

                {/* Light points scattered on surface (church branches) */}
                {[
                    [60, -25], [-50, -40], [10, -60], [-80, 10],
                    [30, 40], [-25, 55], [65, 30], [0, -10],
                ].map(([cx, cy], i) => (
                    <g key={`p${i}`}>
                        <circle cx={cx} cy={cy} r="1.5" fill="#f5bb00" />
                        <circle cx={cx} cy={cy} r="3" fill="#f5bb00" opacity="0.3">
                            <animate attributeName="r" values="2;5;2" dur="2.5s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                        </circle>
                    </g>
                ))}
            </svg>

            {/* Center cross icon hint */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Globe2 className="w-8 h-8 text-white/0" />
            </div>

            <style jsx>{`
                @keyframes globeSpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes raySpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes ringPulse {
                    0%,100% { transform: scale(1); opacity: 0.45; }
                    50%     { transform: scale(1.06); opacity: 0.15; }
                }
            `}</style>
        </div>
    )
}

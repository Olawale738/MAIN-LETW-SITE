'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, Calendar } from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

/**
 * Extract a YouTube video ID from any common URL shape:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube.com/embed/ID
 * Returns null for anything else (treated as a regular MP4).
 */
function ytId(url: string): string | null {
    if (!url) return null
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : null
}
function ytEmbedUrl(id: string): string {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1`
}

/**
 * Hillsong-style cinematic video hero.
 *
 * Video resolution order (first non-empty wins):
 *   1. videoUrl prop
 *   2. NEXT_PUBLIC_HERO_VIDEO_URL env var (set in Vercel → no code edit needed)
 *   3. /hero-bg.mp4 in /public if the file exists (graceful 404 falls through)
 *   4. The poster image with a slow Ken Burns zoom for cinematic motion
 *
 * Strong overlay + ambient orbs + drifting light particles guarantee the
 * hero feels like a film stage even without a video file.
 */

interface Props {
    /** mp4 / webm URL. If omitted, NEXT_PUBLIC_HERO_VIDEO_URL is tried, then poster. */
    videoUrl?: string
    /** Poster shown until the video can play. */
    posterUrl?: string
}

export default function PremiumHero({
    videoUrl: videoUrlProp,
    posterUrl = '/9.png',
}: Props) {
    // Resolution chain:
    //   1. videoUrl prop
    //   2. Admin-managed setting from /admin/hero-video (live, no redeploy)
    //   3. NEXT_PUBLIC_HERO_VIDEO_URL env var
    //   4. /hero-bg.mp4 in /public
    //   5. Hardcoded Pexels worship clip
    const DEFAULT_FALLBACK_VIDEO = 'https://videos.pexels.com/video-files/7515918/7515918-uhd_2560_1440_25fps.mp4'
    const [adminVideoUrl, setAdminVideoUrl] = useState<string | null>(null)
    const [adminEyebrow, setAdminEyebrow] = useState<string | null>(null)
    const [adminTitleA, setAdminTitleA] = useState<string | null>(null)
    const [adminTitleB, setAdminTitleB] = useState<string | null>(null)
    const [adminSubtitle, setAdminSubtitle] = useState<string | null>(null)
    useEffect(() => {
        ministryContentApi.get('hero-settings')
            .then(r => {
                const c = (r.content || {}) as { video_url?: string; eyebrow?: string; title_line_1?: string; title_line_2?: string; subtitle?: string }
                if (c.video_url) setAdminVideoUrl(c.video_url)
                if (c.eyebrow) setAdminEyebrow(c.eyebrow)
                if (c.title_line_1) setAdminTitleA(c.title_line_1)
                if (c.title_line_2) setAdminTitleB(c.title_line_2)
                if (c.subtitle) setAdminSubtitle(c.subtitle)
            }).catch(() => { /* fall through to defaults */ })
    }, [])
    const videoUrl = videoUrlProp
        || adminVideoUrl
        || process.env.NEXT_PUBLIC_HERO_VIDEO_URL
        || DEFAULT_FALLBACK_VIDEO
    const [videoFailed, setVideoFailed] = useState(false)
    const [canPlay, setCanPlay] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Reset failure + canPlay flags whenever the source URL changes. Without this,
    // a one-time onError from the initial Pexels default (autoplay-block, CORS, ad
    // blocker) would permanently hide every subsequent video — including the
    // admin-saved URL that arrives async from the API.
    useEffect(() => {
        setVideoFailed(false)
        setCanPlay(false)
    }, [videoUrl])

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])


    return (
        <section className="relative w-full overflow-hidden bg-[#06002a]" style={{ minHeight: '100vh' }}>
            {/* — 1 · Background video — YouTube iframe OR direct MP4 —
                  key={videoUrl} forces a remount whenever the URL changes,
                  so the admin-saved URL loaded after first paint actually
                  replaces the default Pexels source instead of being ignored. */}
            {videoUrl && !videoFailed && (() => {
                const id = ytId(videoUrl)
                if (id) {
                    return (
                        <div key={videoUrl} className="absolute inset-0 overflow-hidden">
                            <iframe
                                title="Hero background"
                                src={ytEmbedUrl(id)}
                                allow="autoplay; encrypted-media; picture-in-picture"
                                onLoad={() => setCanPlay(true)}
                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-1000 ${canPlay ? 'opacity-95' : 'opacity-0'}`}
                                style={{ width: '177.78vh', height: '56.25vw', minWidth: '100%', minHeight: '100%', border: 0 }}
                            />
                        </div>
                    )
                }
                return (
                    <video
                        key={videoUrl}
                        ref={videoRef}
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster={posterUrl}
                        onCanPlay={() => setCanPlay(true)}
                        onError={() => setVideoFailed(true)}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${canPlay ? 'opacity-95' : 'opacity-0'}`}
                        src={videoUrl}
                    />
                )
            })()}

            {/* Fallback poster with Ken Burns zoom — visible only when no video plays */}
            <div className="absolute inset-0 pointer-events-none">
                {posterUrl && (
                    <img
                        src={posterUrl}
                        alt=""
                        className={`w-full h-full object-cover transition-opacity duration-1000 ${(!videoUrl || videoFailed || !canPlay) ? 'opacity-80 animate-[kenBurns_28s_ease-in-out_infinite_alternate]' : 'opacity-0'}`}
                    />
                )}
                {/* Only show the dark gradient field when neither video nor poster is up */}
                {(!videoUrl || videoFailed) && (
                    <div
                        className="absolute inset-0"
                        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(29,1,117,0.55) 0%, rgba(10,0,40,0.85) 60%, rgba(2,0,15,1) 100%)' }}
                    />
                )}
            </div>

            {/* Lighter overlay — preserves type legibility without hiding the footage */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(6,0,42,0.30) 0%, rgba(6,0,42,0.05) 30%, rgba(6,0,42,0.40) 80%, rgba(6,0,42,0.92) 100%)',
                }}
            />

            {/* Ambient brand orbs — softer so they don't fight the video */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-40 w-[34rem] h-[34rem] rounded-full blur-[160px] animate-[orb1_18s_ease-in-out_infinite_alternate]"
                    style={{ background: 'rgba(245,187,0,0.08)' }} />
                <div className="absolute bottom-1/4 -right-40 w-[36rem] h-[36rem] rounded-full blur-[160px] animate-[orb2_22s_ease-in-out_infinite_alternate]"
                    style={{ background: 'rgba(124,58,237,0.10)' }} />
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
                {/* Brand eyebrow with shimmering gold */}
                <p className="font-bold tracking-[0.5em] text-[10px] md:text-[11px] uppercase mb-6 animate-[fadeUpHero_900ms_cubic-bezier(.16,1,.3,1)_both]"
                    style={{
                        backgroundImage: 'linear-gradient(90deg, #ffd763 0%, #f5bb00 25%, #fff5d6 50%, #f5bb00 75%, #ffd763 100%)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        animation: 'fadeUpHero 900ms cubic-bezier(.16,1,.3,1) both, eyebrowShimmer 5s linear infinite',
                        textShadow: '0 0 20px rgba(245,187,0,0.4)',
                    }}>
                    {adminEyebrow || 'Light Encounter Tabernacle Worldwide'}
                </p>

                {/* Headline — word-by-word entrance */}
                <h1 className="font-serif font-black text-white leading-[0.95] tracking-tight"
                    style={{ fontSize: 'clamp(2.75rem, 8vw, 7rem)', textShadow: '0 6px 40px rgba(0,0,0,0.55)' }}>
                    <span className="block">
                        {(adminTitleA || 'Come & Worship').split(' ').map((w, i) => (
                            <span key={i} className="inline-block mr-[0.18em] animate-[fadeUpHero_900ms_cubic-bezier(.16,1,.3,1)_both]"
                                style={{ animationDelay: `${200 + i * 110}ms` }}>{w}</span>
                        ))}
                    </span>
                    <span className="block">
                        <span className="inline-block bg-gradient-to-r from-[#ffd763] via-[#fff5d6] to-[#f5bb00] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(245,187,0,0.55)]"
                            style={{ backgroundSize: '200% auto', animation: 'titleShimmer 6s linear infinite, fadeUpHero 1100ms cubic-bezier(.16,1,.3,1) 600ms both' }}>
                            {adminTitleB || 'With Us'}
                        </span>
                    </span>
                </h1>

                {/* Subtitle — slides in from below */}
                <p className="font-sans text-white text-base md:text-xl mt-6 max-w-2xl leading-relaxed font-light animate-[fadeUpHero_1000ms_cubic-bezier(.16,1,.3,1)_900ms_both]"
                    style={{ textShadow: '0 2px 18px rgba(0,0,0,0.55)' }}>
                    {adminSubtitle || 'A worldwide family carrying the gospel into every nation — Spirit-filled worship, life-changing teaching, and the unmistakable presence of Jesus. Come as you are; leave forever changed.'}
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
                @keyframes kenBurns {
                    0%   { transform: scale(1.05) translate(0, 0); }
                    50%  { transform: scale(1.18) translate(-2%, -1.5%); }
                    100% { transform: scale(1.05) translate(2%, 1.5%); }
                }
                @keyframes fadeUpHero {
                    from { opacity: 0; transform: translateY(28px); filter: blur(8px); }
                    to   { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                @keyframes titleShimmer {
                    0%   { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes eyebrowShimmer {
                    0%   { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>
        </section>
    )
}

'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Pause, Play, Sparkles } from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

interface Article { title: string; body: string; verse?: string }
interface Content { is_public: boolean; eyebrow: string; title: string; subtitle: string; articles: Article[] }

const DEFAULTS: Content = {
    is_public: false,
    eyebrow: 'What We Believe',
    title: 'Statement of Faith',
    subtitle: 'These are the core convictions on which Light Encounter Tabernacle stands. They are the foundation of how we worship, teach, and live.',
    articles: [
        { title: 'The Bible', body: 'We believe the Bible — the 66 books of the Old and New Testaments — is the inspired, infallible, and authoritative Word of God. It is our final rule for faith and conduct.', verse: '2 Timothy 3:16-17' },
        { title: 'The Trinity', body: 'We believe in one eternal God, existing in three persons — Father, Son, and Holy Spirit — co-equal in power and glory.', verse: 'Matthew 28:19' },
        { title: 'God the Father', body: 'We believe in God the Father, almighty Creator and sustainer of all things, whose love sent Jesus Christ into the world for our redemption.', verse: 'John 3:16' },
        { title: 'Jesus Christ', body: 'We believe Jesus Christ is the eternal Son of God, conceived by the Holy Spirit, born of the virgin Mary, fully God and fully man. He lived a sinless life, died as a substitute for our sins, rose bodily, ascended, and will come again.', verse: '1 Corinthians 15:3-4' },
        { title: 'The Holy Spirit', body: 'We believe in the present ministry of the Holy Spirit, who indwells, empowers, gifts, and sanctifies every believer for godly living and Spirit-filled service.', verse: 'Acts 1:8' },
        { title: 'Humanity & Sin', body: 'Every person is created in the image of God, yet all have sinned and fallen short of His glory. Apart from Christ we are spiritually dead and in need of redemption.', verse: 'Romans 3:23' },
        { title: 'Salvation', body: 'Salvation is the free gift of God, received by grace through faith in Jesus Christ alone. All who repent and believe are forgiven, justified, and given eternal life.', verse: 'Ephesians 2:8-9' },
        { title: 'The Church', body: 'The Church is the body of Christ. Its mission is to worship God, build up believers, and proclaim the Gospel to every nation.', verse: 'Ephesians 4:11-16' },
        { title: 'Last Things', body: 'We believe in the personal, visible return of Jesus Christ, the bodily resurrection of the dead, the final judgment, and the eternal blessedness of the righteous.', verse: '1 Thessalonians 4:16-17' },
    ],
}

const SLIDE_MS = 8000

export default function StatementOfFaithSection() {
    const [content, setContent] = useState<Content | null>(null)
    const [idx, setIdx] = useState(0)
    const [playing, setPlaying] = useState(true)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        ministryContentApi.get('statement-of-faith')
            .then((r) => {
                const c = (r.content || {}) as Partial<Content>
                setContent({
                    is_public: c.is_public === true,
                    eyebrow: c.eyebrow || DEFAULTS.eyebrow,
                    title: c.title || DEFAULTS.title,
                    subtitle: c.subtitle || DEFAULTS.subtitle,
                    articles: Array.isArray(c.articles) && c.articles.length ? c.articles as Article[] : DEFAULTS.articles,
                })
            })
            .catch(() => setContent({ ...DEFAULTS }))
    }, [])

    useEffect(() => {
        if (!playing || !content) return
        timerRef.current = setInterval(() => {
            setIdx(i => (i + 1) % content.articles.length)
        }, SLIDE_MS)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [playing, content])

    if (!content || !content.is_public) return null
    const articles = content.articles
    const active = articles[idx]
    const next = () => setIdx(i => (i + 1) % articles.length)
    const prev = () => setIdx(i => (i - 1 + articles.length) % articles.length)

    return (
        <section className="relative py-24 px-4 overflow-hidden bg-[#0a0030]">
            {/* Cinematic backdrop */}
            <div className="absolute inset-0 opacity-70 pointer-events-none">
                <div className="absolute top-0 -left-32 w-[600px] h-[600px] rounded-full bg-[#140152] blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute bottom-0 -right-32 w-[600px] h-[600px] rounded-full bg-[#f5bb00]/30 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-fuchsia-700/20 blur-[140px]" />
            </div>
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

            <div className="relative max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.4em] text-xs uppercase">
                        <Sparkles className="w-3.5 h-3.5" /> {content.eyebrow}
                    </p>
                    <h2 className="text-4xl md:text-6xl font-black text-white mt-4 tracking-tight">
                        <span className="bg-gradient-to-r from-white via-[#f5bb00] to-white bg-clip-text text-transparent">{content.title}</span>
                    </h2>
                    <p className="text-white/60 mt-4 max-w-2xl mx-auto leading-relaxed">{content.subtitle}</p>
                </div>

                <div className="relative">
                    <div className="relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl shadow-black/40 overflow-hidden min-h-[420px]">
                        <div className="absolute top-8 right-10 text-[#f5bb00]/50 font-mono text-sm tracking-widest">
                            {String(idx + 1).padStart(2, '0')} <span className="text-white/30">/ {String(articles.length).padStart(2, '0')}</span>
                        </div>

                        <div key={idx} className="relative animate-[fadeSlide_700ms_ease-out]">
                            <div className="inline-flex items-center gap-2 mb-5 text-white/50 text-xs font-bold uppercase tracking-[0.3em]">
                                <BookOpen className="w-3.5 h-3.5" /> Article {idx + 1}
                            </div>
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                                <span className="bg-gradient-to-br from-white via-white to-[#f5bb00] bg-clip-text text-transparent">{active.title}</span>
                            </h3>
                            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl whitespace-pre-wrap">{active.body}</p>
                            {active.verse && (
                                <p className="mt-6 inline-block bg-[#f5bb00]/15 border border-[#f5bb00]/30 text-[#f5bb00] font-bold text-sm px-4 py-2 rounded-full">
                                    {active.verse}
                                </p>
                            )}
                        </div>

                        <div className="mt-10 flex items-center justify-between gap-4">
                            <button onClick={prev} aria-label="Previous article"
                                className="w-12 h-12 rounded-full border border-white/15 text-white hover:bg-white hover:text-[#140152] transition-all hover:scale-105 flex items-center justify-center">
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause auto-advance' : 'Play auto-advance'}
                                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-white/60 hover:text-white px-4 py-2 rounded-full border border-white/10 hover:border-white/30 transition-colors">
                                {playing ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Play</>}
                            </button>

                            <button onClick={next} aria-label="Next article"
                                className="w-12 h-12 rounded-full bg-[#f5bb00] text-[#140152] hover:scale-105 transition-transform flex items-center justify-center font-black">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="absolute left-0 bottom-0 right-0 h-1 bg-white/5">
                            <div className="h-full bg-gradient-to-r from-[#f5bb00] via-rose-400 to-fuchsia-400 transition-all duration-700" style={{ width: `${((idx + 1) / articles.length) * 100}%` }} />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                        {articles.map((a, i) => (
                            <button key={i} onClick={() => setIdx(i)}
                                className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all text-left min-w-[160px] ${i === idx ? 'bg-white text-[#140152] border-white scale-105 shadow-lg' : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70'}`}>
                                <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">Art. {String(i + 1).padStart(2, '0')}</p>
                                <p className="text-sm font-black truncate mt-0.5">{a.title}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeSlide {
                    from { opacity: 0; transform: translateY(20px); filter: blur(8px); }
                    to { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
            `}</style>
        </section>
    )
}

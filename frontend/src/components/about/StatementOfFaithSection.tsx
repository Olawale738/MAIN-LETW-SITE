'use client'
import { useEffect, useState } from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

interface Article { title: string; body: string }
interface Content { is_public: boolean; eyebrow: string; title: string; subtitle: string; articles: Article[] }

const DEFAULTS: Content = {
    is_public: false,   // Admin must explicitly toggle this on at /admin/statement-of-faith
    eyebrow: 'What We Believe',
    title: 'Statement of Faith',
    subtitle: 'These are the core convictions on which Light Encounter Tabernacle stands. They are the foundation of how we worship, teach, and live.',
    articles: [
        { title: 'The Bible', body: 'We believe the Bible — the 66 books of the Old and New Testaments — is the inspired, infallible, and authoritative Word of God. It is our final rule for faith and conduct (2 Timothy 3:16-17; 2 Peter 1:20-21).' },
        { title: 'The Trinity', body: 'We believe in one eternal God, existing in three persons — Father, Son, and Holy Spirit — co-equal in power and glory (Matthew 28:19; 2 Corinthians 13:14).' },
        { title: 'God the Father', body: 'We believe in God the Father, almighty Creator and sustainer of all things, whose love sent Jesus Christ into the world for our redemption (Genesis 1:1; John 3:16).' },
        { title: 'Jesus Christ', body: 'We believe Jesus Christ is the eternal Son of God, conceived by the Holy Spirit, born of the virgin Mary, fully God and fully man. He lived a sinless life, died on the cross as a substitute for our sins, rose bodily from the dead, ascended into heaven, and will come again (John 1:1-14; 1 Corinthians 15:3-4).' },
        { title: 'The Holy Spirit', body: 'We believe in the present ministry of the Holy Spirit, who indwells, empowers, gifts, and sanctifies every believer for godly living and Spirit-filled service (Acts 1:8; Galatians 5:22-23; 1 Corinthians 12).' },
        { title: 'Humanity & Sin', body: 'We believe every person is created in the image of God, yet all have sinned and fallen short of His glory. Apart from Christ, we are spiritually dead and in need of redemption (Genesis 1:27; Romans 3:23; Ephesians 2:1).' },
        { title: 'Salvation', body: 'We believe salvation is the free gift of God, received by grace through faith in Jesus Christ alone. It cannot be earned by works. All who repent and believe are forgiven, justified, and given eternal life (Ephesians 2:8-9; Romans 10:9-10).' },
        { title: 'The Church', body: 'We believe the Church is the body of Christ, made up of all who have trusted in Him. Its mission is to worship God, build up believers, and proclaim the Gospel to every nation (Matthew 28:18-20; Ephesians 4:11-16).' },
        { title: 'Last Things', body: 'We believe in the personal, visible return of Jesus Christ, the bodily resurrection of the dead, the final judgment, and the eternal blessedness of the righteous and conscious eternal punishment of the wicked (1 Thessalonians 4:16-17; Revelation 20:11-15).' },
    ],
}

export default function StatementOfFaithSection() {
    const [content, setContent] = useState<Content | null>(null)  // null = still loading
    const [openIdx, setOpenIdx] = useState<number | null>(0)
    const [query, setQuery] = useState('')

    useEffect(() => {
        ministryContentApi.get('statement-of-faith')
            .then((r) => {
                const c = r.content || {}
                setContent({
                    is_public: c.is_public === true,   // strict — undefined / null / false => HIDDEN
                    eyebrow: c.eyebrow || DEFAULTS.eyebrow,
                    title: c.title || DEFAULTS.title,
                    subtitle: c.subtitle || DEFAULTS.subtitle,
                    articles: Array.isArray(c.articles) && c.articles.length ? c.articles : DEFAULTS.articles,
                })
            })
            .catch(() => setContent({ ...DEFAULTS }))
    }, [])

    // Render nothing while loading AND nothing if admin hasn't turned it on
    if (!content || !content.is_public) return null

    const q = query.trim().toLowerCase()
    const filtered = q
        ? content.articles.filter(a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q))
        : content.articles

    return (
        <section className="py-20 px-4 bg-white">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase">
                        <BookOpen className="w-3.5 h-3.5" /> {content.eyebrow}
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-3">{content.title}</h2>
                    <p className="text-gray-600 mt-4 max-w-2xl mx-auto leading-relaxed">{content.subtitle}</p>
                </div>

                <div className="mb-5">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search what we believe…"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
                    />
                </div>

                <div className="space-y-2">
                    {filtered.map((a, i) => {
                        const isOpen = openIdx === i
                        return (
                            <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setOpenIdx(isOpen ? null : i)}
                                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                                >
                                    <span className="font-bold text-[#140152]">{a.title}</span>
                                    <ChevronDown className={`w-5 h-5 text-[#140152] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 pt-1 text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">
                                        {a.body}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {filtered.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No articles match "{query}".</p>
                    )}
                </div>
            </div>
        </section>
    )
}

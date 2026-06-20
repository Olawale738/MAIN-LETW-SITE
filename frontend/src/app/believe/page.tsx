'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import FaithCinemaBlock from '@/components/cms/blocks/FaithCinemaBlock'
import { ministryContentApi } from '@/lib/api'

interface Article { title: string; description: string; icon?: string; body?: string }

const DEFAULT_ARTICLES: Article[] = [
    { title: 'The Word of God', description: 'The Bible is the inspired, infallible, and authoritative Word of God — our guide for faith and living.', icon: 'BookOpen' },
    { title: 'Jesus Christ', description: 'Salvation is a gift of grace through faith in Jesus Christ alone — fully God, fully man, crucified and risen.', icon: 'Cross' },
    { title: 'The Holy Spirit', description: 'The Holy Spirit empowers every believer for holy living, gifts, and bold witness.', icon: 'Flame' },
    { title: 'The Trinity', description: 'One God eternally existing in three persons — Father, Son, and Holy Spirit.', icon: 'Sparkles' },
    { title: 'The Church', description: 'The body of Christ on earth — a family commissioned to make disciples of all nations.', icon: 'Users' },
    { title: 'The Return of Christ', description: 'Jesus will return personally and visibly to gather His own and reign forever.', icon: 'Sunrise' },
]

export default function BelievePage() {
    const [articles, setArticles] = useState<Article[]>(DEFAULT_ARTICLES)
    const [title, setTitle] = useState('What We Believe')
    const [subtitle, setSubtitle] = useState('Statement of Faith')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ministryContentApi.get('statement-of-faith')
            .then(r => {
                const c = (r.content || {}) as { title?: string; eyebrow?: string; articles?: Article[] }
                if (c.title) setTitle(c.title)
                if (c.eyebrow) setSubtitle(c.eyebrow)
                if (Array.isArray(c.articles) && c.articles.length) {
                    // ministry content uses {title, body, verse}; map to features
                    setArticles(c.articles.map(a => ({
                        title: a.title,
                        description: (a.body || a.description || '').toString(),
                        icon: a.icon,
                    })))
                }
            })
            .catch(() => { /* fall back to defaults */ })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#fbf5e6] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <main className="relative">
            {/* Floating return-to-site button (lives above the navy letterbox bar) */}
            <Link href="/about"
                className="fixed top-3 left-3 z-[60] inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/80 hover:text-white font-bold bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/15 px-3 py-2 rounded-full transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to About
            </Link>

            <FaithCinemaBlock title={title} subtitle={subtitle} features={articles} />
        </main>
    )
}

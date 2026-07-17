'use client'
/**
 * /blog/[slug] — a single Pastor's Column post, styled to match the LETW TV
 * index: branded gradient masthead (used when the post has no hero image),
 * a scroll reading-progress bar, reading time, share buttons, and related
 * posts pulled from the same tags.
 */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    Loader2, ArrowLeft, Calendar, User, ArrowRight, Clock, Share2, Check,
    Facebook, MessageCircle, PenSquare,
} from 'lucide-react'
import { blogApi, type BlogPost } from '@/lib/api'

/** ~200 wpm over the plain text of the body. Always at least 1 min. */
function readingMinutes(html: string): number {
    const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.round(words / 200))
}

export default function BlogPostPage() {
    const { slug } = useParams() as { slug: string }
    const [post, setPost] = useState<BlogPost | null>(null)
    const [related, setRelated] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        blogApi.publicGet(slug)
            .then(setPost)
            .catch(e => setErr((e as Error).message))
            .finally(() => setLoading(false))
    }, [slug])

    // Related posts — share a tag with this one; fall back to newest others.
    useEffect(() => {
        if (!post) return
        blogApi.publicList({ limit: 24 }).then(all => {
            const mine = (post.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
            const others = all.filter(p => p.id !== post.id)
            const scored = others
                .map(p => ({
                    p,
                    hits: (p.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(t => mine.includes(t)).length,
                }))
                .sort((a, b) => b.hits - a.hits)
            setRelated(scored.slice(0, 3).map(s => s.p))
        }).catch(() => setRelated([]))
    }, [post])

    // Reading-progress bar.
    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement
            const total = el.scrollHeight - el.clientHeight
            setProgress(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const mins = useMemo(() => post ? readingMinutes(post.body_html || post.excerpt || '') : 1, [post])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
    if (err || !post) return (
        <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
            <div className="text-center">
                <p className="text-gray-500 mb-4">Post not found.</p>
                <Link href="/blog" className="text-[#140152] font-bold hover:underline">← Back to blog</Link>
            </div>
        </main>
    )

    const hasHero = !!post.hero_image_url
    const hasBody = !!(post.body_html && post.body_html.trim())
    const tags = (post.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://letw.org/blog/${post.slug}`
    const shareText = encodeURIComponent(post.title)
    const shareUrl = encodeURIComponent(pageUrl)

    const copyLink = () => {
        navigator.clipboard.writeText(pageUrl)
            .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
            .catch(() => { /* clipboard unavailable */ })
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-[#fbf5e6]/40">
            {/* Reading progress */}
            <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent pointer-events-none">
                <div className="h-full bg-[#f5bb00] transition-[width] duration-150" style={{ width: `${progress}%` }} />
            </div>

            {hasHero ? (
                <div className="relative h-[55vh] bg-gray-900 overflow-hidden">
                    <img src={post.hero_image_url!} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
            ) : (
                /* Branded masthead for image-less posts — matches the TV index header. */
                <div className="relative overflow-hidden bg-gradient-to-br from-[#140152] via-[#1a0166] to-[#1d0175] pt-24 pb-40">
                    <div className="absolute -top-24 right-0 w-[420px] h-[420px] bg-[#f5bb00]/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute -bottom-28 left-0 w-[380px] h-[380px] bg-rose-400/10 rounded-full blur-[120px] pointer-events-none" />
                    <p className="relative text-center text-[#f5bb00] font-bold tracking-[0.35em] text-[10px] uppercase inline-flex items-center gap-2 w-full justify-center">
                        <PenSquare className="w-3.5 h-3.5" /> Pastor&apos;s Column
                    </p>
                </div>
            )}

            <article className={`max-w-3xl mx-auto px-4 sm:px-6 relative z-10 pb-16 ${hasHero ? '-mt-32' : '-mt-28'}`}>
                <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#140152] mb-5"><ArrowLeft className="w-4 h-4" /> All posts</Link>
                    <h1 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">{post.title}</h1>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 flex-wrap">
                        <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author_name}</span>
                        {post.published_at && <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                        <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {mins} min read</span>
                        {tags.length > 0 && <span className="inline-flex gap-1.5 flex-wrap">{tags.map(t => <span key={t} className="bg-[#f5bb00]/15 text-[#140152] px-2 py-0.5 rounded font-bold">{t}</span>)}</span>}
                    </div>

                    {post.excerpt && (
                        <div className="mt-6 border-l-4 border-[#f5bb00] bg-[#fbf5e6]/60 rounded-r-2xl px-5 py-4">
                            <p className="text-lg sm:text-xl text-[#140152]/80 leading-relaxed italic">{post.excerpt}</p>
                        </div>
                    )}

                    {hasBody
                        ? <div className="prose prose-lg max-w-none mt-6 text-gray-800 leading-relaxed prose-headings:text-[#140152] prose-a:text-[#140152] prose-blockquote:border-[#f5bb00] prose-blockquote:text-[#140152]/80" dangerouslySetInnerHTML={{ __html: post.body_html }} />
                        : <p className="text-gray-400 text-sm mt-6">More from this message coming soon.</p>}

                    {/* Share row */}
                    <div className="mt-10 pt-6 border-t border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-3 inline-flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Share this message</p>
                        <div className="flex flex-wrap gap-2">
                            <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-2 rounded-full transition-colors">
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2 rounded-full transition-colors">
                                <Facebook className="w-3.5 h-3.5" /> Facebook
                            </a>
                            <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-2 rounded-full transition-colors">
                                𝕏 Post
                            </a>
                            <button onClick={copyLink}
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#f5bb00]/15 hover:bg-[#f5bb00]/30 text-[#8a6d00] px-3.5 py-2 rounded-full transition-colors">
                                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Copy link</>}
                            </button>
                        </div>
                    </div>

                    {/* Author footer */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-sm text-gray-500">Written by <strong className="text-[#140152]">{post.author_name}</strong></p>
                        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#140152] hover:gap-2 transition-all">
                            More from the Pastor&apos;s Column <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </article>

            {/* Related posts */}
            {related.length > 0 && (
                <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="h-4 w-1 rounded-full bg-[#f5bb00]" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#140152]">Keep reading</h2>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {related.map(p => (
                            <Link key={p.id} href={`/blog/${p.slug}`} className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#f5bb00]/50 transition-all group">
                                {p.hero_image_url && <div className="aspect-video bg-gray-100 overflow-hidden"><img src={p.hero_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                                <div className="p-4 flex-1">
                                    <h3 className="font-bold text-[#140152] text-sm leading-tight group-hover:underline line-clamp-2">{p.title}</h3>
                                    <p className="text-[11px] text-gray-500 mt-2 inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" />{p.published_at ? new Date(p.published_at).toLocaleDateString() : ''}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    )
}

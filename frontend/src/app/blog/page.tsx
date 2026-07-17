'use client'
/**
 * /blog — Pastor's Column, laid out as a "LETW TV" hub (inspired by the
 * pastorchrisonline.org liveTV layout): a live/video player up top with
 * channel tabs, the posts feed as the main column, and a rich sidebar
 * (Featured Videos, Church Apps, About the Pastor, Hot Topics, Gallery).
 *
 * Adapted to the LETW brand (deep purple + gold on white) rather than the
 * reference's blue. Hero + About copy are admin-editable via the
 * 'blog-page' ministry-content key, merged over the defaults below.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
    PenSquare, Search, Calendar, ArrowRight, Radio, PlayCircle, Video, Sparkles,
    LayoutGrid, Tag, Rss, User, Dot, Mail, Loader2, Check, X,
} from 'lucide-react'
import {
    blogApi, sermonApi, liveStreamApi, ministryContentApi, newsletterApi, toVideoEmbedUrl,
    type BlogPost, type Sermon, type LiveStream,
} from '@/lib/api'

const DEFAULTS = {
    channel_name: 'LETW TV',
    eyebrow: "Pastor's Column",
    title: 'Truth that lasts. Words for now.',
    subtitle: 'Live services, teachings, and weekly reflections from Light Encounter Tabernacle Worldwide.',
    about_name: 'Light Encounter Tabernacle Worldwide',
    about_bio: 'Weekly reflections, devotionals, and pastoral notes — teaching the Word and building faith for everyday life.',
    about_image: '',
}

type Channel = { key: string; label: string; url: string; live?: boolean }

export default function BlogTVPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [live, setLive] = useState<LiveStream | null>(null)
    const [copy, setCopy] = useState(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')
    const [activeChannel, setActiveChannel] = useState<string>('')
    const [activeTag, setActiveTag] = useState<string | null>(null)

    // Posts react to the search box; everything else loads once.
    useEffect(() => {
        const id = setTimeout(() => {
            blogApi.publicList({ q: q || undefined, limit: 40 }).then(setPosts).catch(() => setPosts([]))
        }, 200)
        return () => clearTimeout(id)
    }, [q])

    useEffect(() => {
        Promise.allSettled([
            sermonApi.getPublicSermons(undefined, 8).then(r => setSermons(r.sermons || [])),
            liveStreamApi.getActiveStream().then(s => setLive(s && s.is_active ? s : null)),
            ministryContentApi.get('blog-page').then(r => setCopy({ ...DEFAULTS, ...(r.content || {}) })),
        ]).finally(() => setLoading(false))
    }, [])

    // Build the player's channel tabs: the live stream first (if on air),
    // then the most recent sermons that carry a video.
    const channels: Channel[] = useMemo(() => {
        const list: Channel[] = []
        if (live?.url) list.push({ key: 'live', label: 'LIVE NOW', url: live.url, live: true })
        sermons.filter(s => s.video_url).slice(0, 5).forEach((s, i) =>
            list.push({ key: s.id, label: i === 0 && !live ? 'Latest Teaching' : (s.series || s.title).slice(0, 22), url: s.video_url! }))
        return list
    }, [live, sermons])

    useEffect(() => {
        if (channels.length && !channels.find(c => c.key === activeChannel)) setActiveChannel(channels[0].key)
    }, [channels, activeChannel])

    const current = channels.find(c => c.key === activeChannel) || channels[0]

    const postHasTag = (p: BlogPost, tag: string) =>
        (p.tags || '').split(',').map(t => t.trim().toLowerCase()).includes(tag.toLowerCase())

    // When a category is active, restrict the whole feed to it.
    const shownPosts = activeTag ? posts.filter(p => postHasTag(p, activeTag)) : posts
    const featured = shownPosts.find(p => p.is_featured) || shownPosts[0]
    const rest = shownPosts.filter(p => p.id !== featured?.id)

    // "Hot Topics" from post tags.
    const topics = useMemo(() => {
        const counts: Record<string, number> = {}
        posts.forEach(p => (p.tags || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t)
    }, [posts])

    const galleryImgs = posts.filter(p => p.hero_image_url).slice(0, 6)

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-[#fbf5e6]/40">
            {/* Channel bar */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#140152] via-[#1a0166] to-[#1d0175] text-white pt-24 pb-8">
                <div className="absolute -top-24 right-0 w-[420px] h-[420px] bg-[#f5bb00]/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-28 left-0 w-[380px] h-[380px] bg-rose-400/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex items-end justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-[#f5bb00] font-bold tracking-[0.35em] text-[10px] uppercase inline-flex items-center gap-2"><PenSquare className="w-3.5 h-3.5" /> {copy.eyebrow}</p>
                        <h1 className="text-3xl sm:text-5xl font-black leading-tight flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#f5bb00] text-[#140152] shadow-lg shadow-[#f5bb00]/30"><Radio className="w-6 h-6" /></span>
                            {copy.channel_name}
                            {live && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-2.5 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> On air
                                </span>
                            )}
                        </h1>
                        <p className="text-white/60 text-sm mt-2.5 max-w-xl leading-relaxed">{copy.subtitle}</p>
                    </div>
                    <a href="/blog/rss.xml" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white/80 hover:text-[#140152] hover:bg-[#f5bb00] border border-white/20 hover:border-[#f5bb00] rounded-full px-4 py-2 inline-flex items-center gap-1.5 transition-colors"><Rss className="w-3.5 h-3.5" /> Subscribe (RSS)</a>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_340px] gap-6">
                {/* ── Main column ─────────────────────────────────────────── */}
                <div className="min-w-0 space-y-6">
                    {/* Player */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-[#140152]/5 border border-gray-100 overflow-hidden">
                        {current && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#140152] text-white">
                                {current.live ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : <PlayCircle className="w-4 h-4 text-[#f5bb00]" />}
                                <p className="text-[11px] font-bold uppercase tracking-wide truncate">{current.live ? 'Live now' : 'Now playing'} <span className="text-white/50">·</span> {current.label}</p>
                            </div>
                        )}
                        <div className="aspect-video bg-black relative">
                            {current ? (
                                <iframe key={current.key} src={toVideoEmbedUrl(current.url)} title={current.label}
                                    className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
                                    <Video className="w-12 h-12" />
                                    <p className="text-sm">{loading ? 'Loading channel…' : 'No broadcast right now — enjoy the column below.'}</p>
                                </div>
                            )}
                        </div>
                        {channels.length > 0 && (
                            <div className="flex gap-1.5 p-2 overflow-x-auto border-t border-gray-100">
                                {channels.map(c => (
                                    <button key={c.key} onClick={() => setActiveChannel(c.key)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                                            activeChannel === c.key ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                        {c.live ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> : <PlayCircle className="w-3.5 h-3.5" />}
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the pastor's column…"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
                    </div>

                    {/* Category filter bar */}
                    {topics.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 -mt-1">
                            <button onClick={() => setActiveTag(null)}
                                className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors ${activeTag === null ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]'}`}>
                                All
                            </button>
                            {topics.map(t => (
                                <button key={t} onClick={() => setActiveTag(t)}
                                    className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors capitalize ${activeTag?.toLowerCase() === t.toLowerCase() ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Featured post */}
                    {featured && (
                        <Link href={`/blog/${featured.slug}`} className="block bg-white rounded-2xl shadow-lg shadow-[#140152]/5 border border-gray-100 hover:border-[#f5bb00]/50 overflow-hidden group transition-colors">
                            <div className="sm:flex">
                                {featured.hero_image_url && (
                                    <div className="relative sm:w-2/5 aspect-video sm:aspect-auto bg-gray-100 overflow-hidden">
                                        <img src={featured.hero_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <span className="absolute top-3 left-3 text-[9px] font-black tracking-widest uppercase bg-[#f5bb00] text-[#140152] px-2 py-1 rounded-full inline-flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Featured</span>
                                    </div>
                                )}
                                <div className="p-5 sm:p-6 flex-1">
                                    {!featured.hero_image_url && <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#f5bb00] mb-2 inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> Featured</p>}
                                    <h2 className="text-xl sm:text-2xl font-black text-[#140152] leading-tight group-hover:underline">{featured.title}</h2>
                                    {featured.excerpt && <p className="text-gray-600 mt-2 text-sm leading-relaxed line-clamp-3">{featured.excerpt}</p>}
                                    <p className="text-xs text-gray-500 mt-3 inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" />{featured.published_at ? new Date(featured.published_at).toLocaleDateString() : ''} <Dot className="w-3 h-3" /> {featured.author_name}</p>
                                    <p className="mt-3 text-xs font-black text-[#140152] inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read the message <ArrowRight className="w-3.5 h-3.5" /></p>
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* Feed */}
                    {shownPosts.length === 0 && !loading ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
                            <PenSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p>{activeTag ? `No posts tagged "${activeTag}" yet.` : q ? 'No posts match your search.' : 'No posts yet. Check back soon.'}</p>
                            {(activeTag || q) && <button onClick={() => { setActiveTag(null); setQ('') }} className="text-xs font-bold text-[#140152] underline mt-3">Clear filters</button>}
                        </div>
                    ) : rest.length > 0 ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="h-4 w-1 rounded-full bg-[#f5bb00]" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-[#140152]">Latest from the column</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {rest.map(p => {
                                    const tag = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean)[0]
                                    return (
                                        <Link key={p.id} href={`/blog/${p.slug}`} className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#f5bb00]/50 transition-all group">
                                            {p.hero_image_url && (
                                                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                                    <img src={p.hero_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    {tag && <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wide bg-white/90 text-[#140152] px-2 py-0.5 rounded-full">{tag}</span>}
                                                </div>
                                            )}
                                            <div className="p-4 flex flex-col flex-1">
                                                {!p.hero_image_url && tag && <span className="text-[9px] font-black uppercase tracking-wide text-[#b8860b] mb-1">{tag}</span>}
                                                <h3 className="font-bold text-[#140152] leading-tight group-hover:underline">{p.title}</h3>
                                                {p.excerpt && <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 flex-1">{p.excerpt}</p>}
                                                <p className="text-[11px] text-gray-500 mt-2.5 inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" />{p.published_at ? new Date(p.published_at).toLocaleDateString() : ''}</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ) : null}

                    {/* Newsletter */}
                    <NewsletterBand />
                </div>

                {/* ── Sidebar ─────────────────────────────────────────────── */}
                <aside className="space-y-5">
                    {/* Featured Videos */}
                    <SideCard title="Featured Videos" icon={<Video className="w-4 h-4" />}>
                        {sermons.length === 0 ? <Empty text="Sermons coming soon." /> : (
                            <ul className="space-y-3">
                                {sermons.slice(0, 4).map(s => (
                                    <li key={s.id}>
                                        <Link href="/sermons" className="flex gap-3 group">
                                            <div className="w-24 aspect-video rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                                                {(s.video_thumbnail || s.has_thumbnail) && <img src={s.video_thumbnail || sermonApi.getThumbnailUrl(s.id)} alt={s.title} className="w-full h-full object-cover" />}
                                                <PlayCircle className="w-6 h-6 text-white/90 absolute inset-0 m-auto drop-shadow" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-[#140152] leading-tight line-clamp-2 group-hover:underline">{s.title}</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">{s.preacher}</p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SideCard>

                    {/* Church Apps */}
                    <SideCard title="Church Apps" icon={<LayoutGrid className="w-4 h-4" />}>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Live Service', href: '/live' },
                                { label: 'Sermons', href: '/sermons' },
                                { label: 'Give', href: '/giving' },
                                { label: 'Prayer', href: '/prayer' },
                                { label: 'Events', href: '/events' },
                                { label: 'All Apps', href: '/apps' },
                            ].map(a => (
                                <Link key={a.href} href={a.href} className="text-center text-xs font-bold text-[#140152] bg-gray-50 hover:bg-[#f5bb00]/15 border border-gray-100 rounded-xl py-3 transition-colors">{a.label}</Link>
                            ))}
                        </div>
                    </SideCard>

                    {/* About */}
                    <SideCard title="About" icon={<User className="w-4 h-4" />}>
                        <div className="flex gap-3 items-start">
                            {copy.about_image && <img src={copy.about_image} alt={copy.about_name} className="w-14 h-14 rounded-full object-cover shrink-0" />}
                            <div>
                                <p className="font-black text-[#140152] text-sm">{copy.about_name}</p>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{copy.about_bio}</p>
                            </div>
                        </div>
                    </SideCard>

                    {/* Hot Topics */}
                    {topics.length > 0 && (
                        <SideCard title="Hot Topics" icon={<Tag className="w-4 h-4" />}>
                            <div className="flex flex-wrap gap-2">
                                {topics.map(t => (
                                    <button key={t} onClick={() => { setActiveTag(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                        className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors capitalize ${activeTag?.toLowerCase() === t.toLowerCase() ? 'bg-[#140152] text-white' : 'text-[#140152] bg-[#f5bb00]/15 hover:bg-[#f5bb00]/30'}`}>{t}</button>
                                ))}
                            </div>
                        </SideCard>
                    )}

                    {/* Gallery */}
                    {galleryImgs.length > 0 && (
                        <SideCard title="Photo Gallery" icon={<Sparkles className="w-4 h-4" />}>
                            <div className="grid grid-cols-3 gap-1.5">
                                {galleryImgs.map(p => (
                                    <Link key={p.id} href={`/blog/${p.slug}`} className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                                        <img src={p.hero_image_url!} alt={p.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                                    </Link>
                                ))}
                            </div>
                        </SideCard>
                    )}
                </aside>
            </div>
        </main>
    )
}

function SideCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-[#140152] to-[#1d0175] text-white flex items-center gap-2">
                <span className="text-[#f5bb00]">{icon}</span>
                <h3 className="font-black text-sm uppercase tracking-wide">{title}</h3>
            </div>
            <div className="p-4">{children}</div>
        </div>
    )
}

function Empty({ text }: { text: string }) {
    return <p className="text-xs text-gray-400 py-2">{text}</p>
}

function NewsletterBand() {
    const [email, setEmail] = useState('')
    const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
    const [msg, setMsg] = useState('')

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setState('sending')
        try {
            const r = await newsletterApi.subscribe(email, 'blog')
            setMsg(r.message || "You're subscribed!"); setState('done'); setEmail('')
        } catch (err) {
            setMsg((err as Error).message || 'Something went wrong. Please try again.'); setState('error')
        }
    }

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl p-6 sm:p-8 text-white">
            <div className="absolute -top-16 -right-10 w-52 h-52 bg-[#f5bb00]/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-[10px] uppercase inline-flex items-center gap-2 mb-1.5"><Mail className="w-3.5 h-3.5" /> Stay in the Word</p>
                <h3 className="text-xl sm:text-2xl font-black leading-tight">Get every new message in your inbox</h3>
                <p className="text-white/60 text-sm mt-1.5">Weekly reflections and teachings from Light Encounter Tabernacle — no spam, unsubscribe anytime.</p>

                {state === 'done' ? (
                    <p className="mt-4 inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-100 font-bold text-sm px-4 py-2.5 rounded-xl"><Check className="w-4 h-4" /> {msg}</p>
                ) : (
                    <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                            className="flex-1 rounded-xl px-4 py-3 text-sm text-[#140152] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f5bb00]" />
                        <button type="submit" disabled={state === 'sending'}
                            className="inline-flex items-center justify-center gap-2 bg-[#f5bb00] hover:bg-amber-300 text-[#140152] font-black px-6 py-3 rounded-xl text-sm disabled:opacity-60 transition-colors">
                            {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Subscribe
                        </button>
                    </form>
                )}
                {state === 'error' && <p className="mt-2 text-sm text-rose-200 inline-flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> {msg}</p>}
            </div>
        </div>
    )
}

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
    LayoutGrid, Tag, Rss, User, Dot,
} from 'lucide-react'
import {
    blogApi, sermonApi, liveStreamApi, ministryContentApi, toVideoEmbedUrl,
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
    const featured = posts.find(p => p.is_featured) || posts[0]
    const rest = posts.filter(p => p.id !== featured?.id)

    // "Hot Topics" from post tags.
    const topics = useMemo(() => {
        const counts: Record<string, number> = {}
        posts.forEach(p => (p.tags || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t)
    }, [posts])

    const galleryImgs = posts.filter(p => p.hero_image_url).slice(0, 6)

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Channel bar */}
            <section className="bg-[#140152] text-white pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-[10px] uppercase inline-flex items-center gap-2"><PenSquare className="w-3.5 h-3.5" /> {copy.eyebrow}</p>
                        <h1 className="text-2xl sm:text-3xl font-black leading-tight flex items-center gap-2">
                            <Radio className="w-6 h-6 text-[#f5bb00]" /> {copy.channel_name}
                        </h1>
                    </div>
                    <a href="/blog/rss.xml" target="_blank" rel="noopener noreferrer" className="text-xs text-white/70 hover:text-[#f5bb00] inline-flex items-center gap-1.5"><Rss className="w-3.5 h-3.5" /> Subscribe (RSS)</a>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_340px] gap-6">
                {/* ── Main column ─────────────────────────────────────────── */}
                <div className="min-w-0 space-y-6">
                    {/* Player */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

                    {/* Featured post */}
                    {featured && (
                        <Link href={`/blog/${featured.slug}`} className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                            <div className="sm:flex">
                                {featured.hero_image_url && (
                                    <div className="sm:w-2/5 aspect-video sm:aspect-auto bg-gray-100 overflow-hidden">
                                        <img src={featured.hero_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="p-5 sm:p-6 flex-1">
                                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#f5bb00] mb-2 inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /> Featured</p>
                                    <h2 className="text-xl sm:text-2xl font-black text-[#140152] leading-tight group-hover:underline">{featured.title}</h2>
                                    {featured.excerpt && <p className="text-gray-600 mt-2 text-sm leading-relaxed line-clamp-3">{featured.excerpt}</p>}
                                    <p className="text-xs text-gray-500 mt-3 inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" />{featured.published_at ? new Date(featured.published_at).toLocaleDateString() : ''} <Dot className="w-3 h-3" /> {featured.author_name}</p>
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* Feed */}
                    {posts.length === 0 && !loading ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                            <PenSquare className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No posts yet. Check back soon.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {rest.map(p => (
                                <Link key={p.id} href={`/blog/${p.slug}`} className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                    {p.hero_image_url && <div className="aspect-video bg-gray-100 overflow-hidden"><img src={p.hero_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                                    <div className="p-4">
                                        <h3 className="font-bold text-[#140152] leading-tight group-hover:underline">{p.title}</h3>
                                        {p.excerpt && <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{p.excerpt}</p>}
                                        <p className="text-[11px] text-gray-500 mt-2.5 inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" />{p.published_at ? new Date(p.published_at).toLocaleDateString() : ''}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
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
                                    <button key={t} onClick={() => setQ(t)} className="text-xs font-bold text-[#140152] bg-[#f5bb00]/15 hover:bg-[#f5bb00]/30 px-2.5 py-1 rounded-full transition-colors">{t}</button>
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
            <div className="px-4 py-3 bg-[#140152] text-white flex items-center gap-2">
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

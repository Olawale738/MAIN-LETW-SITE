'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, PenSquare, Search, Calendar, ArrowRight } from 'lucide-react'
import { blogApi, type BlogPost } from '@/lib/api'

export default function BlogIndexPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')

    useEffect(() => {
        const id = setTimeout(() => {
            setLoading(true)
            blogApi.publicList({ q: q || undefined, limit: 40 })
                .then(setPosts)
                .catch(() => setPosts([]))
                .finally(() => setLoading(false))
        }, 200)
        return () => clearTimeout(id)
    }, [q])

    const featured = posts.find(p => p.is_featured) || posts[0]
    const rest = posts.filter(p => p.id !== featured?.id)

    return (
        <main className="min-h-screen bg-[#fbf5e6]">
            <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3 inline-flex items-center gap-2"><PenSquare className="w-3.5 h-3.5" /> Pastor's Column</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">Truth that lasts. Words for now.</h1>
                <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Weekly reflections, devotionals, and pastoral notes from Light Encounter Tabernacle.</p>
            </section>

            <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
                <div className="relative mb-8">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search posts…" className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
                </div>

                {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div> : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                        <PenSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No posts yet. Check back soon.</p>
                    </div>
                ) : (
                    <>
                        {featured && (
                            <Link href={`/blog/${featured.slug}`} className="block bg-white rounded-3xl shadow-xl overflow-hidden mb-8 group">
                                {featured.hero_image_url && <div className="aspect-video bg-gray-100 overflow-hidden"><img src={featured.hero_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                                <div className="p-6 sm:p-8">
                                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#f5bb00] mb-2">Featured</p>
                                    <h2 className="text-2xl md:text-3xl font-black text-[#140152] leading-tight group-hover:underline">{featured.title}</h2>
                                    {featured.excerpt && <p className="text-gray-600 mt-3 leading-relaxed">{featured.excerpt}</p>}
                                    <p className="text-xs text-gray-500 mt-4 flex items-center gap-2"><Calendar className="w-3 h-3" />{featured.published_at ? new Date(featured.published_at).toLocaleDateString() : ''} · by {featured.author_name}</p>
                                </div>
                            </Link>
                        )}

                        <div className="grid md:grid-cols-2 gap-5">
                            {rest.map(p => (
                                <Link key={p.id} href={`/blog/${p.slug}`} className="block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
                                    {p.hero_image_url && <div className="aspect-video bg-gray-100 overflow-hidden"><img src={p.hero_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                                    <div className="p-5">
                                        <h3 className="font-bold text-[#140152] text-lg leading-tight">{p.title}</h3>
                                        {p.excerpt && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.excerpt}</p>}
                                        <p className="text-[11px] text-gray-500 mt-3 flex items-center gap-2"><Calendar className="w-3 h-3" />{p.published_at ? new Date(p.published_at).toLocaleDateString() : ''}</p>
                                        <p className="mt-3 text-xs font-bold text-[#140152] inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read more <ArrowRight className="w-3 h-3" /></p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </main>
    )
}

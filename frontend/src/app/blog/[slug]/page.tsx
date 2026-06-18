'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Calendar, User } from 'lucide-react'
import { blogApi, type BlogPost } from '@/lib/api'

export default function BlogPostPage() {
    const { slug } = useParams() as { slug: string }
    const [post, setPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        blogApi.publicGet(slug)
            .then(setPost)
            .catch(e => setErr((e as Error).message))
            .finally(() => setLoading(false))
    }, [slug])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
    if (err || !post) return (
        <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
            <div className="text-center">
                <p className="text-gray-500 mb-4">Post not found.</p>
                <Link href="/blog" className="text-[#140152] font-bold hover:underline">← Back to blog</Link>
            </div>
        </main>
    )

    return (
        <main className="min-h-screen bg-[#fbf5e6]">
            {post.hero_image_url && (
                <div className="relative h-[55vh] bg-gray-900 overflow-hidden">
                    <img src={post.hero_image_url} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
            )}
            <article className="max-w-3xl mx-auto px-4 sm:px-6 -mt-32 relative z-10 pb-24">
                <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#140152] mb-5"><ArrowLeft className="w-4 h-4" /> All posts</Link>
                    <h1 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">{post.title}</h1>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-4 flex-wrap">
                        <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author_name}</span>
                        {post.published_at && <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                        {post.tags && <span className="inline-flex gap-1.5">{post.tags.split(',').map(t => <span key={t} className="bg-[#f5bb00]/15 text-[#140152] px-2 py-0.5 rounded font-bold">{t.trim()}</span>)}</span>}
                    </div>
                    {post.excerpt && <p className="text-xl text-gray-600 leading-relaxed mt-6 italic">{post.excerpt}</p>}
                    <div className="prose prose-lg max-w-none mt-6 text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.body_html || '' }} />
                </div>
            </article>
        </main>
    )
}

'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, PenSquare, Plus, AlertCircle, CheckCircle, Trash2, ExternalLink } from 'lucide-react'
import { blogApi, type BlogPost } from '@/lib/api'

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setPosts(await blogApi.adminList(filter || undefined)) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [filter])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const remove = async (id: string) => {
        if (!confirm('Delete this post permanently?')) return
        try { await blogApi.delete(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><PenSquare className="w-7 h-7 text-[#f5bb00]" /> Pastor's Blog</h1>
                    <p className="text-gray-500 mt-1 text-sm">Weekly column, devotionals, announcements. Public pages live at <Link href="/blog" className="text-[#140152] font-bold hover:underline">/blog</Link>.</p>
                </div>
                <Link href="/admin/blog/new" className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl"><Plus className="w-4 h-4" /> New Post</Link>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="flex gap-2 mb-4 flex-wrap">
                {['', 'draft', 'published'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filter === s ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s || 'All'}</button>
                ))}
            </div>

            <div className="space-y-3">
                {posts.length === 0 && <p className="text-center text-gray-400 py-12">No posts yet.</p>}
                {posts.map(p => (
                    <div key={p.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
                        {p.hero_image_url ? <img src={p.hero_image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" /> :
                            <div className="w-16 h-16 rounded-lg bg-[#f5bb00]/15 flex items-center justify-center text-[#140152]"><PenSquare className="w-6 h-6" /></div>}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152]">{p.title}</p>
                            <p className="text-xs text-gray-500 truncate">{p.excerpt || '(no excerpt)'}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">by {p.author_name} · updated {new Date(p.updated_at).toLocaleString()}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${p.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                        {p.status === 'published' && <Link href={`/blog/${p.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-[#140152]" title="View live"><ExternalLink className="w-4 h-4" /></Link>}
                        <Link href={`/admin/blog/${p.id}`} className="text-sm font-bold text-[#140152] hover:underline">Edit</Link>
                        <button onClick={() => remove(p.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

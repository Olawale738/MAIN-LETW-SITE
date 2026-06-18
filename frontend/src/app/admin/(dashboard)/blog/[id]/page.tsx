'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Save, ArrowLeft, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { blogApi, type BlogPost } from '@/lib/api'
import RichTextEditor from '@/components/ui/rich-text-editor'

export default function AdminBlogEditPage() {
    const params = useParams() as { id?: string }
    const router = useRouter()
    const isNew = !params?.id || params.id === 'new'

    const [post, setPost] = useState<Partial<BlogPost>>({
        title: '', slug: '', excerpt: '', body_html: '', hero_image_url: '',
        author_name: 'Pastor', tags: '', status: 'draft', is_featured: false,
    })
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        if (isNew) return
        blogApi.adminGet(params!.id!)
            .then(p => setPost(p))
            .catch(e => setMsg({ kind: 'err', text: (e as Error).message }))
            .finally(() => setLoading(false))
    }, [isNew, params?.id])

    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        if (!post.title?.trim()) { setMsg({ kind: 'err', text: 'Title is required.' }); return }
        setSaving(true)
        try {
            const r = isNew ? await blogApi.create(post) : await blogApi.update(params!.id!, post)
            setMsg({ kind: 'ok', text: `Post ${isNew ? 'created' : 'saved'}.` })
            if (isNew) router.push(`/admin/blog/${r.id}`)
            else setPost(r)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-32">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#140152]"><ArrowLeft className="w-4 h-4" /> Back to posts</Link>
                <div className="flex gap-2 items-center">
                    {post.slug && post.status === 'published' && <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1"><ExternalLink className="w-4 h-4" /> View live</Link>}
                    <button onClick={save} disabled={saving} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </button>
                </div>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-5">
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Title</label>
                <input value={post.title || ''} onChange={e => setPost({ ...post, title: e.target.value })} placeholder="The Power of Encountering God" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base font-bold mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Slug (URL)</label>
                        <input value={post.slug || ''} onChange={e => setPost({ ...post, slug: e.target.value })} placeholder="auto-from-title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Author</label>
                        <input value={post.author_name || ''} onChange={e => setPost({ ...post, author_name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                </div>

                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Excerpt</label>
                <textarea value={post.excerpt || ''} onChange={e => setPost({ ...post, excerpt: e.target.value })} rows={2} placeholder="1-2 sentence summary for the listing page" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" />

                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Hero Image URL</label>
                <input value={post.hero_image_url || ''} onChange={e => setPost({ ...post, hero_image_url: e.target.value })} placeholder="https://…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" />

                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Tags (comma-separated)</label>
                <input value={post.tags || ''} onChange={e => setPost({ ...post, tags: e.target.value })} placeholder="encounter, prayer, faith" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-5">
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Body</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <RichTextEditor content={post.body_html || ''} onChange={(html) => setPost({ ...post, body_html: html })} placeholder="Write the post…" />
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-3 items-center">
                    <label className="text-xs font-bold uppercase text-gray-500">Status</label>
                    <select value={post.status || 'draft'} onChange={e => setPost({ ...post, status: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!post.is_featured} onChange={e => setPost({ ...post, is_featured: e.target.checked })} /> Featured
                    </label>
                </div>
                <button onClick={save} disabled={saving} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
            </div>
        </div>
    )
}

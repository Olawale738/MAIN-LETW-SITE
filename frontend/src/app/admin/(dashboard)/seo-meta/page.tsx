'use client'
import { useEffect, useState } from 'react'
import { Loader2, Globe, Save, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { seoApi, type SeoMeta } from '@/lib/api'

const COMMON_SLUGS = ['home', 'about', 'give', 'giving', 'sermons', 'events', 'prayer', 'blog', 'leadership', 'theology-school', 'youth', 'women', 'men', 'children', 'discipleship', 'contact']

export default function AdminSeoMetaPage() {
    const [items, setItems] = useState<SeoMeta[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<SeoMeta | null>(null)
    const [newSlug, setNewSlug] = useState('')
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setItems(await seoApi.list()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async (slug: string, patch: Partial<SeoMeta>) => {
        try { await seoApi.upsert(slug, patch); setMsg({ kind: 'ok', text: 'Saved.' }); setEditing(null); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const remove = async (slug: string) => {
        if (!confirm(`Delete SEO settings for /${slug}?`)) return
        try { await seoApi.delete(slug); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const createNew = () => {
        const slug = newSlug.trim().toLowerCase().replace(/^\/+/, '')
        if (!slug) return
        setEditing({ slug, title: '', description: '', og_title: '', og_description: '', og_image_url: '', canonical_url: '', robots: 'index,follow', keywords: '', updated_at: new Date().toISOString() })
        setNewSlug('')
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Globe className="w-7 h-7 text-[#f5bb00]" /> SEO Meta</h1>
                <p className="text-gray-500 mt-1 text-sm">Page title, meta description, Open Graph card for each public page. Slug = the URL path without leading slash (e.g. <code className="bg-gray-100 px-1 rounded text-xs">home</code>, <code className="bg-gray-100 px-1 rounded text-xs">about</code>, <code className="bg-gray-100 px-1 rounded text-xs">give</code>).</p>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-5">
                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Quick add</p>
                <div className="flex gap-2 flex-wrap mb-3">
                    {COMMON_SLUGS.map(s => (
                        <button key={s} onClick={() => setEditing({ slug: s, title: '', description: '', og_title: '', og_description: '', og_image_url: '', canonical_url: '', robots: 'index,follow', keywords: '', updated_at: new Date().toISOString() })} className="text-xs font-bold px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:border-[#140152] hover:text-[#140152]">
                            /{s}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="Custom slug…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <button onClick={createNew} disabled={!newSlug.trim()} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-lg text-sm inline-flex items-center gap-1.5 disabled:opacity-50"><Plus className="w-4 h-4" /> Add</button>
                </div>
            </div>

            {editing && <MetaForm meta={editing} onCancel={() => setEditing(null)} onSave={(patch) => save(editing.slug, patch)} />}

            <div className="space-y-2 mt-5">
                {items.length === 0 && <p className="text-center text-gray-400 py-12">No SEO meta saved yet. Pick a slug above to start.</p>}
                {items.map(m => (
                    <div key={m.slug} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center"><Globe className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152]">/{m.slug}</p>
                            <p className="text-xs text-gray-500 truncate">{m.title || '(no title)'} — {m.description?.slice(0, 80) || '(no description)'}</p>
                        </div>
                        <button onClick={() => setEditing(m)} className="text-sm font-bold text-[#140152] hover:underline">Edit</button>
                        <button onClick={() => remove(m.slug)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MetaForm({ meta, onCancel, onSave }: { meta: SeoMeta; onCancel: () => void; onSave: (p: Partial<SeoMeta>) => void }) {
    const [m, setM] = useState(meta)
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md mb-5">
            <h2 className="font-black text-[#140152] mb-3">Edit /{m.slug}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <Field label="Title (HTML <title>)" v={m.title || ''} on={v => setM({ ...m, title: v })} />
                <Field label="Canonical URL" v={m.canonical_url || ''} on={v => setM({ ...m, canonical_url: v })} placeholder="https://letw.org/about" />
            </div>
            <Area label="Meta Description (~155 chars)" v={m.description || ''} on={v => setM({ ...m, description: v })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
                <Field label="OG Title (social card)" v={m.og_title || ''} on={v => setM({ ...m, og_title: v })} />
                <Field label="OG Image URL (1200×630)" v={m.og_image_url || ''} on={v => setM({ ...m, og_image_url: v })} />
            </div>
            <Area label="OG Description" v={m.og_description || ''} on={v => setM({ ...m, og_description: v })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Field label="Robots" v={m.robots || ''} on={v => setM({ ...m, robots: v })} placeholder="index,follow" />
                <Field label="Keywords (comma-separated)" v={m.keywords || ''} on={v => setM({ ...m, keywords: v })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                <button onClick={() => onSave(m)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Save className="w-4 h-4" /> Save</button>
            </div>
        </div>
    )
}

function Field({ label, v, on, placeholder }: { label: string; v: string; on: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">{label}</label>
            <input value={v} onChange={e => on(e.target.value)} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
    )
}
function Area({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">{label}</label>
            <textarea value={v} onChange={e => on(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
    )
}

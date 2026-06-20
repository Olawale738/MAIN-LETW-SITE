'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, LayoutTemplate, ExternalLink, Search, Layers, FileEdit, Layers3, ArrowUpRight } from 'lucide-react'
import { cmsApi } from '@/lib/api'
import { PUBLIC_PAGES, pageEditorHref, type PublicPage } from '@/lib/publicPagesRegistry'

interface SavedPage { slug: string; title: string; updated_at: string | null }

export default function AdminPagesIndex() {
    const [saved, setSaved] = useState<Record<string, SavedPage>>({})
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')

    useEffect(() => {
        cmsApi.listPages()
            .then(r => {
                const map: Record<string, SavedPage> = {}
                for (const p of r.pages) map[p.slug] = p
                setSaved(map)
            })
            .catch(() => { /* ignore */ })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    const filter = q.trim().toLowerCase()
    const visible = PUBLIC_PAGES.filter(p =>
        !filter ||
        p.title.toLowerCase().includes(filter) ||
        p.slug.toLowerCase().includes(filter) ||
        p.path.toLowerCase().includes(filter)
    )

    const grouped: Record<string, PublicPage[]> = {}
    for (const p of visible) {
        if (!grouped[p.category]) grouped[p.category] = []
        grouped[p.category].push(p)
    }
    const categories = Object.keys(grouped) as Array<PublicPage['category']>

    const counts = {
        total: PUBLIC_PAGES.length,
        cms: PUBLIC_PAGES.filter(p => p.editorKind === 'cms-blocks').length,
        dedicated: PUBLIC_PAGES.filter(p => p.editorKind === 'dedicated').length,
        overlay: PUBLIC_PAGES.filter(p => p.editorKind === 'overlay-only').length,
    }

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-20">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><LayoutTemplate className="w-7 h-7 text-[#f5bb00]" /> Pages</h1>
                <p className="text-gray-500 mt-1 text-sm">Edit every public page. <span className="font-bold text-[#140152]">No code needed.</span></p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <Stat label="Total pages" value={counts.total} icon={<Layers className="w-4 h-4" />} />
                <Stat label="Full block editor" value={counts.cms} icon={<Layers3 className="w-4 h-4 text-purple-500" />} tint="purple" />
                <Stat label="Dedicated editor" value={counts.dedicated} icon={<FileEdit className="w-4 h-4 text-green-600" />} tint="green" />
                <Stat label="Add extra blocks" value={counts.overlay} icon={<ArrowUpRight className="w-4 h-4 text-amber-600" />} tint="amber" />
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search a page…"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
            </div>

            {/* Helper card */}
            <div className="mb-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-rose-50 p-4 text-[13px] text-purple-900 leading-relaxed">
                <p className="font-black mb-1">How editing works</p>
                <ul className="list-disc pl-5 space-y-0.5">
                    <li><span className="font-bold">Full block editor</span> — drag-and-drop heroes, features, gallery, testimonies, etc.</li>
                    <li><span className="font-bold">Dedicated editor</span> — page has a purpose-built form (e.g. Sermons, Events, Testimony Page).</li>
                    <li><span className="font-bold">Add extra blocks</span> — page is mostly fixed but you can inject CMS blocks <em>above</em> or <em>below</em> via slugs <code className="bg-white px-1 py-0.5 rounded text-[10px]">{'{slug}-top'}</code> / <code className="bg-white px-1 py-0.5 rounded text-[10px]">{'{slug}-bottom'}</code>.</li>
                </ul>
            </div>

            {categories.map(cat => (
                <div key={cat} className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">{cat}</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {grouped[cat].map(p => (
                            <PageCard key={p.slug + p.path} page={p} saved={saved[p.slug]} />
                        ))}
                    </div>
                </div>
            ))}

            {visible.length === 0 && (
                <p className="text-center text-gray-400 py-12">No page matches "{q}".</p>
            )}
        </div>
    )
}

function Stat({ label, value, icon, tint }: { label: string; value: number; icon: React.ReactNode; tint?: 'purple' | 'green' | 'amber' }) {
    const tints: Record<string, string> = {
        purple: 'from-purple-50 to-fuchsia-50 border-purple-100',
        green: 'from-green-50 to-emerald-50 border-green-100',
        amber: 'from-amber-50 to-orange-50 border-amber-100',
    }
    return (
        <div className={`rounded-2xl border bg-gradient-to-br p-4 ${tint ? tints[tint] : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-bold">{icon} {label}</div>
            <p className="text-3xl font-black text-[#140152] mt-1">{value}</p>
        </div>
    )
}

function PageCard({ page, saved }: { page: PublicPage; saved?: SavedPage }) {
    const kindBadge: Record<PublicPage['editorKind'], { label: string; cls: string }> = {
        'cms-blocks':   { label: 'Block editor',     cls: 'bg-purple-100 text-purple-700 border-purple-200' },
        'dedicated':    { label: 'Dedicated editor', cls: 'bg-green-100 text-green-700 border-green-200' },
        'overlay-only': { label: 'Add extra blocks', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    }
    const badge = kindBadge[page.editorKind]
    const editHref = pageEditorHref(page)

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                    <p className="font-black text-[#140152] truncate">{page.title}</p>
                    <p className="text-[11px] text-gray-500 font-mono truncate">{page.path}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${badge.cls} flex-shrink-0`}>{badge.label}</span>
            </div>

            {page.notes && <p className="text-[12px] text-gray-500 leading-snug mb-3">{page.notes}</p>}

            {saved?.updated_at && (
                <p className="text-[10px] text-gray-400 mb-3">Last edited {new Date(saved.updated_at).toLocaleString()}</p>
            )}

            <div className="flex items-center gap-2">
                <Link href={editHref}
                    className="flex-1 text-center bg-[#140152] hover:bg-[#1d0175] text-white font-bold text-xs px-3 py-2 rounded-lg inline-flex items-center justify-center gap-1.5">
                    <FileEdit className="w-3.5 h-3.5" /> Edit
                </Link>
                {page.editorKind === 'overlay-only' && (
                    <Link href={`/admin/pages/${page.slug}-top`} title="Edit blocks shown ABOVE the page"
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-2 py-2 rounded-lg border border-amber-200">
                        Top
                    </Link>
                )}
                {page.editorKind === 'overlay-only' && (
                    <Link href={`/admin/pages/${page.slug}-bottom`} title="Edit blocks shown BELOW the page"
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-2 py-2 rounded-lg border border-amber-200">
                        Bottom
                    </Link>
                )}
                <Link href={page.path} target="_blank" title="Open public page"
                    className="text-gray-400 hover:text-[#140152] hover:bg-gray-50 px-2 py-2 rounded-lg border border-gray-100">
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    )
}

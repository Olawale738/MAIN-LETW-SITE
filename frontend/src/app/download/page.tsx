'use client'
import { useEffect, useState } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    FileAudio, BookOpen, FileText, Music, Video, Newspaper, Download,
    ExternalLink, File as FileIcon, Loader2, Search
} from 'lucide-react'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'
import PageRenderer from '@/components/cms/PageRenderer'
import { cmsApi, downloadsApi, type Block, type DownloadResource, type DownloadCategory } from '@/lib/api'

const CATEGORIES: Array<{ key: DownloadCategory | 'All'; icon: React.ReactNode; tint: string }> = [
    { key: 'All',      icon: <Download className="w-4 h-4" />,  tint: 'from-[#140152] to-[#7c3aed]' },
    { key: 'Sermon',   icon: <FileAudio className="w-4 h-4" />, tint: 'from-rose-500 to-orange-500' },
    { key: 'E-book',   icon: <BookOpen className="w-4 h-4" />,  tint: 'from-emerald-500 to-cyan-500' },
    { key: 'Bulletin', icon: <FileText className="w-4 h-4" />,  tint: 'from-violet-500 to-fuchsia-500' },
    { key: 'Music',    icon: <Music className="w-4 h-4" />,     tint: 'from-amber-500 to-yellow-400' },
    { key: 'Video',    icon: <Video className="w-4 h-4" />,     tint: 'from-blue-500 to-indigo-600' },
    { key: 'Article',  icon: <Newspaper className="w-4 h-4" />, tint: 'from-pink-500 to-rose-500' },
    { key: 'Other',    icon: <FileIcon className="w-4 h-4" />,  tint: 'from-gray-500 to-gray-700' },
]

function bytes(n: number | null) {
    if (!n) return ''
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export default function DownloadsPage() {
    const [cmsBlocks, setCmsBlocks] = useState<Block[] | null>(null)
    const [cmsLoaded, setCmsLoaded] = useState(false)

    const [resources, setResources] = useState<DownloadResource[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<DownloadCategory | 'All'>('All')
    const [q, setQ] = useState('')

    useEffect(() => {
        cmsApi.getPage('download')
            .then(d => setCmsBlocks((d?.content?.blocks && d.content.blocks.length > 0) ? d.content.blocks : null))
            .catch(() => setCmsBlocks(null))
            .finally(() => setCmsLoaded(true))
    }, [])

    useEffect(() => {
        downloadsApi.list()
            .then(setResources)
            .catch(() => setResources([]))
            .finally(() => setLoading(false))
    }, [])

    if (cmsLoaded && cmsBlocks) {
        return (
            <>
                <PageCmsOverlay slug="download" position="top" />
                <PageRenderer blocks={cmsBlocks} />
                <ResourceList resources={resources} loading={loading} filter={filter} setFilter={setFilter} q={q} setQ={setQ} />
                <PageCmsOverlay slug="download" position="bottom" />
            </>
        )
    }

    return (
        <>
            <PageCmsOverlay slug="download" position="top" />
            <Hero title="Resources & Downloads" subtitle="Sermons, devotionals, study guides, music — free for the journey" height="medium" />
            <ResourceList resources={resources} loading={loading} filter={filter} setFilter={setFilter} q={q} setQ={setQ} />
            <PageCmsOverlay slug="download" position="bottom" />
        </>
    )
}

function ResourceList({ resources, loading, filter, setFilter, q, setQ }: {
    resources: DownloadResource[]; loading: boolean;
    filter: DownloadCategory | 'All'; setFilter: (f: DownloadCategory | 'All') => void;
    q: string; setQ: (s: string) => void;
}) {
    const query = q.trim().toLowerCase()
    const visible = resources.filter(r => {
        if (filter !== 'All' && r.category !== filter) return false
        if (!query) return true
        return (r.title + ' ' + (r.description || '') + ' ' + r.category).toLowerCase().includes(query)
    })

    return (
        <SectionWrapper>
            {/* Search + filter chips */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search resources…"
                        className="w-full border border-gray-200 rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152]/30" />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {CATEGORIES.map(c => {
                        const n = c.key === 'All' ? resources.length : resources.filter(r => r.category === c.key).length
                        const isActive = filter === c.key
                        return (
                            <button key={c.key} onClick={() => setFilter(c.key)}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full inline-flex items-center gap-1.5 whitespace-nowrap transition-all ${isActive ? `bg-gradient-to-r ${c.tint} text-white shadow-md` : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]/40'}`}>
                                {c.icon} {c.key} <span className={isActive ? 'opacity-80' : 'opacity-50'}>({n})</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
            ) : visible.length === 0 ? (
                <div className="text-center py-20">
                    <Download className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">{resources.length === 0 ? "No resources have been uploaded yet. Check back soon." : `No results for "${q}" in ${filter}.`}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {visible.map(r => <ResourceCard key={r.id} r={r} />)}
                </div>
            )}
        </SectionWrapper>
    )
}

function ResourceCard({ r }: { r: DownloadResource }) {
    const cat = CATEGORIES.find(c => c.key === r.category) || CATEGORIES[CATEGORIES.length - 1]
    const isFile = r.kind === 'file'
    const href = isFile ? downloadsApi.fileUrl(r.id) : (r.external_url || '#')
    return (
        <Card className="hover:shadow-2xl transition-all duration-300 border-none shadow-lg group bg-white overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${cat.tint}`} />
            <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${cat.tint} text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f5bb00]">{r.category}</p>
                        <h3 className="font-black text-[#140152] text-lg leading-tight truncate">{r.title}</h3>
                    </div>
                </div>
                {r.description && <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">{r.description}</p>}
                <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-gray-400">
                        {isFile && r.file_name && <span className="truncate inline-block max-w-[180px] font-mono">{r.file_name}</span>}
                        {isFile && r.file_size && <span> · {bytes(r.file_size)}</span>}
                        {!isFile && <span>External link</span>}
                    </div>
                    <a href={href} target={isFile ? '_self' : '_blank'} rel={isFile ? undefined : 'noopener noreferrer'}
                        download={isFile ? (r.file_name || undefined) : undefined}>
                        <Button variant="primary" className="rounded-full text-xs font-black shadow-md shadow-[#f5bb00]/30">
                            {isFile ? <><Download className="w-3.5 h-3.5 mr-1.5" /> Download</> : <><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open</>}
                        </Button>
                    </a>
                </div>
            </CardContent>
        </Card>
    )
}

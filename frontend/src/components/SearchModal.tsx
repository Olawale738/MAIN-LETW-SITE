'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X, Loader2, BookOpen, Mic, Calendar, Sparkles } from 'lucide-react'
import { searchApi, type SearchResults } from '@/lib/api'

interface Props { open: boolean; onClose: () => void }

export default function SearchModal({ open, onClose }: Props) {
    const [q, setQ] = useState('')
    const [results, setResults] = useState<SearchResults | null>(null)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open) return
        setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    useEffect(() => {
        if (!q || q.length < 2) { setResults(null); return }
        const id = setTimeout(() => {
            setLoading(true)
            searchApi.query(q).then(setResults).catch(() => setResults(null)).finally(() => setLoading(false))
        }, 250)
        return () => clearTimeout(id)
    }, [q])

    if (!open) return null

    const close = () => { onClose(); setQ(''); setResults(null) }

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]" onClick={close}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search sermons, blog, events, verses…"
                        className="flex-1 text-base outline-none bg-transparent"
                    />
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-[#140152]" />}
                    <button onClick={close} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                    {!results && q.length < 2 && (
                        <div className="p-12 text-center text-gray-400 text-sm">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p>Type at least 2 characters to search</p>
                            <p className="text-[10px] mt-2 text-gray-300">Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">ESC</kbd> to close</p>
                        </div>
                    )}
                    {results && results.total === 0 && (
                        <div className="p-12 text-center text-gray-400 text-sm">No matches for "{q}". Try different keywords.</div>
                    )}
                    {results && results.total > 0 && (
                        <div className="divide-y divide-gray-100">
                            <Section title="Sermons" icon={<Mic className="w-3.5 h-3.5" />} hits={results.results.sermons.map(s => ({ id: s.id, title: s.title!, sub: s.preacher, url: s.url }))} onPick={close} />
                            <Section title="Blog" icon={<BookOpen className="w-3.5 h-3.5" />} hits={results.results.blog.map(p => ({ id: p.id, title: p.title!, sub: p.excerpt, url: p.url }))} onPick={close} />
                            <Section title="Events" icon={<Calendar className="w-3.5 h-3.5" />} hits={results.results.events.map(e => ({ id: e.id, title: e.title!, sub: e.date || '', url: e.url }))} onPick={close} />
                            <Section title="Daily Verses" icon={<Sparkles className="w-3.5 h-3.5" />} hits={results.results.verses.map(v => ({ id: v.id, title: v.reference!, sub: v.text, url: '#' }))} onPick={close} renderLink={false} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function Section({ title, icon, hits, onPick, renderLink = true }: { title: string; icon: React.ReactNode; hits: { id: string; title: string; sub?: string; url: string }[]; onPick: () => void; renderLink?: boolean }) {
    if (!hits || hits.length === 0) return null
    return (
        <div className="py-2">
            <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">{icon} {title}</p>
            {hits.map(h => {
                const inner = (
                    <div className="px-5 py-2.5 hover:bg-gray-50 cursor-pointer">
                        <p className="font-bold text-sm text-[#140152] truncate">{h.title}</p>
                        {h.sub && <p className="text-xs text-gray-500 truncate">{h.sub}</p>}
                    </div>
                )
                return renderLink ? (
                    <Link key={h.id} href={h.url} onClick={onPick}>{inner}</Link>
                ) : (
                    <div key={h.id} onClick={onPick}>{inner}</div>
                )
            })}
        </div>
    )
}

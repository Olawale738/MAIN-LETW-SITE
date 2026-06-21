'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Download, Upload, Link as LinkIcon, FileText, Music, Video,
    BookOpen, Trash2, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff,
    File as FileIcon, RefreshCw, Plus
} from 'lucide-react'
import { downloadsApi, type DownloadResource, type DownloadCategory } from '@/lib/api'

const CATEGORIES: DownloadCategory[] = ['Sermon', 'E-book', 'Bulletin', 'Music', 'Video', 'Article', 'Other']
const ICON: Record<DownloadCategory, React.ReactNode> = {
    'Sermon': <Music className="w-4 h-4" />,
    'E-book': <BookOpen className="w-4 h-4" />,
    'Bulletin': <FileText className="w-4 h-4" />,
    'Music': <Music className="w-4 h-4" />,
    'Video': <Video className="w-4 h-4" />,
    'Article': <FileText className="w-4 h-4" />,
    'Other': <FileIcon className="w-4 h-4" />,
}

function bytes(n: number | null) {
    if (!n) return ''
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export default function AdminDownloadsPage() {
    const [items, setItems] = useState<DownloadResource[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<DownloadCategory | 'all'>('all')
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [tab, setTab] = useState<'file' | 'url'>('file')

    const load = async () => {
        setLoading(true)
        try { setItems(await downloadsApi.adminAll()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const remove = async (id: string) => {
        if (!confirm('Delete this resource permanently?')) return
        try { await downloadsApi.adminDelete(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const togglePublished = async (r: DownloadResource) => {
        try { await downloadsApi.adminUpdate(r.id, { is_published: !r.is_published }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const visible = filter === 'all' ? items : items.filter(i => i.category === filter)

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Download className="w-7 h-7 text-[#f5bb00]" /> Downloads</h1>
                    <p className="text-gray-500 mt-1 text-sm">Upload PDFs, Word docs, audio, video, or paste external URLs. Public page: <Link href="/download" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">/download <ExternalLink className="w-3 h-3" /></Link></p>
                </div>
                <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {/* Upload card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-1">
                    <button onClick={() => setTab('file')} className={`px-4 py-2 text-sm font-bold rounded-lg inline-flex items-center gap-2 ${tab === 'file' ? 'bg-[#140152] text-white' : 'text-gray-500 hover:text-[#140152]'}`}>
                        <Upload className="w-4 h-4" /> Upload file
                    </button>
                    <button onClick={() => setTab('url')} className={`px-4 py-2 text-sm font-bold rounded-lg inline-flex items-center gap-2 ${tab === 'url' ? 'bg-[#140152] text-white' : 'text-gray-500 hover:text-[#140152]'}`}>
                        <LinkIcon className="w-4 h-4" /> Add external link
                    </button>
                </div>
                <div className="p-5">
                    {tab === 'file' ? (
                        <FileUploadForm onDone={() => { setMsg({ kind: 'ok', text: 'Uploaded.' }); load() }} onError={text => setMsg({ kind: 'err', text })} />
                    ) : (
                        <UrlForm onDone={() => { setMsg({ kind: 'ok', text: 'Link added.' }); load() }} onError={text => setMsg({ kind: 'err', text })} />
                    )}
                </div>
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-full ${filter === 'all' ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]'}`}>All ({items.length})</button>
                {CATEGORIES.map(c => {
                    const n = items.filter(i => i.category === c).length
                    return (
                        <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 text-xs font-bold rounded-full inline-flex items-center gap-1.5 whitespace-nowrap ${filter === c ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]'}`}>
                            {ICON[c]} {c} ({n})
                        </button>
                    )
                })}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[20vh]"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
            ) : visible.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                    <Plus className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">{filter === 'all' ? 'No resources uploaded yet. Use the form above.' : `No resources in ${filter}.`}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {visible.map(r => (
                            <div key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-[#140152]/5 text-[#140152] flex items-center justify-center flex-shrink-0">{ICON[r.category as DownloadCategory] || ICON['Other']}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-[#140152] truncate">{r.title}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {r.category}
                                        {r.kind === 'file' && r.file_name && <> · <span className="font-mono">{r.file_name}</span> · {bytes(r.file_size)}</>}
                                        {r.kind === 'url' && r.external_url && <> · <a href={r.external_url} target="_blank" rel="noopener noreferrer" className="text-[#140152] hover:underline">{r.external_url}</a></>}
                                        {r.download_count > 0 && <> · {r.download_count} downloads</>}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${r.kind === 'file' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{r.kind === 'file' ? 'File' : 'URL'}</span>
                                <button onClick={() => togglePublished(r)} title={r.is_published ? 'Hide from public' : 'Publish'}
                                    className={`p-2 rounded ${r.is_published ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:text-[#140152] hover:bg-gray-100'}`}>
                                    {r.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => remove(r.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function FileUploadForm({ onDone, onError }: { onDone: () => void; onError: (s: string) => void }) {
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState<DownloadCategory>('E-book')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        if (!title || !file) return
        setSubmitting(true)
        try {
            await downloadsApi.adminAddFile({ title, category, description: description || undefined, file })
            setTitle(''); setDescription(''); setFile(null)
            onDone()
        } catch (e) { onError((e as Error).message) }
        finally { setSubmitting(false) }
    }

    return (
        <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <select value={category} onChange={e => setCategory(e.target.value as DownloadCategory)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Short description (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <div>
                <label className="block">
                    <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="upload-file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp3,.mp4,.wav,.zip,.png,.jpg,.jpeg,.txt,.epub" />
                    <span className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-[#140152] text-sm text-gray-600 rounded-lg cursor-pointer w-full justify-center">
                        <Upload className="w-4 h-4" />
                        {file ? <><span className="font-bold text-[#140152]">{file.name}</span> · {bytes(file.size)}</> : 'Pick a file (PDF, DOC, MP3, MP4, ZIP… up to 25 MB)'}
                    </span>
                </label>
            </div>
            <div className="flex justify-end">
                <button onClick={submit} disabled={!title || !file || submitting} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 inline-flex items-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                </button>
            </div>
        </div>
    )
}

function UrlForm({ onDone, onError }: { onDone: () => void; onError: (s: string) => void }) {
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState<DownloadCategory>('Article')
    const [url, setUrl] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        if (!title || !url) return
        setSubmitting(true)
        try {
            await downloadsApi.adminAddUrl({ title, category, external_url: url, description: description || undefined })
            setTitle(''); setUrl(''); setDescription('')
            onDone()
        } catch (e) { onError((e as Error).message) }
        finally { setSubmitting(false) }
    }

    return (
        <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <select value={category} onChange={e => setCategory(e.target.value as DownloadCategory)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://… (Google Drive, Dropbox, YouTube, Spotify…) *" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Short description (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <div className="flex justify-end">
                <button onClick={submit} disabled={!title || !url || submitting} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 inline-flex items-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />} Add link
                </button>
            </div>
        </div>
    )
}

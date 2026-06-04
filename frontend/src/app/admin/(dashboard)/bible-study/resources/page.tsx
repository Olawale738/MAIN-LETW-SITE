'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, Upload, Trash2, Plus, FileText, Music, Video,
    Loader2, ExternalLink, Edit2, Save, X, Link as LinkIcon
} from 'lucide-react'
import { bibleStudyApi, type BibleStudyLibraryResource } from '@/lib/api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    pdf:   { label: 'PDF Document', icon: FileText, color: 'bg-red-100 text-red-600' },
    audio: { label: 'Audio File',   icon: Music,    color: 'bg-purple-100 text-purple-600' },
    video: { label: 'Video File',   icon: Video,    color: 'bg-blue-100 text-blue-600' },
}

type Res = BibleStudyLibraryResource & { filename?: string }

function ResourceRow({ res, onDelete, onEdit }: { res: Res; onDelete: (r: Res) => void; onEdit: (r: Res) => void }) {
    const cfg = TYPE_CONFIG[res.type] ?? TYPE_CONFIG.pdf
    const Icon = cfg.icon
    const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
        : 'http://localhost:8000'
    const fullUrl = res.url?.startsWith('http') ? res.url : `${base}${res.url}`

    return (
        <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 group transition-colors border-b border-gray-50 last:border-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#140152] text-sm truncate">{res.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{cfg.label}</span>
                    {res.meta && <span className="text-[10px] text-gray-400">{res.meta}</span>}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Preview">
                    <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => onEdit(res)} className="p-1.5 text-gray-400 hover:text-[#140152] transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(res)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BibleStudyResourcesAdmin() {
    const [resources, setResources] = useState<Res[]>([])
    const [loading, setLoading]     = useState(true)
    const [saving, setSaving]       = useState(false)
    const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

    // Form state
    const [mode, setMode]           = useState<'upload' | 'link' | null>(null)
    const [uploading, setUploading] = useState(false)
    const [title, setTitle]         = useState('')
    const [meta, setMeta]           = useState('')
    const [file, setFile]           = useState<File | null>(null)
    const [linkUrl, setLinkUrl]     = useState('')
    const [linkType, setLinkType]   = useState<'pdf' | 'audio' | 'video'>('video')
    const fileRef                   = useRef<HTMLInputElement>(null)

    // Edit state
    const [editId, setEditId]       = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editMeta, setEditMeta]   = useState('')

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    useEffect(() => {
        bibleStudyApi.getSettings()
            .then(s => setResources((s.library_resources as Res[]) || []))
            .catch(() => showToast('Failed to load resources', false))
            .finally(() => setLoading(false))
    }, [])

    const persist = async (next: Res[]) => {
        setSaving(true)
        try {
            await bibleStudyApi.updateSettings({ library_resources: next } as any)
            setResources(next)
            showToast('Saved!')
        } catch (e: any) {
            showToast(e?.message || 'Save failed', false)
        } finally { setSaving(false) }
    }

    const handleUpload = async () => {
        if (!file || !title.trim()) return
        setUploading(true)
        try {
            const res = await bibleStudyApi.uploadResource(file, title.trim(), meta.trim())
            await persist([...resources, res as Res])
            setMode(null); setTitle(''); setMeta(''); setFile(null)
        } catch (e: any) {
            showToast(e?.message || 'Upload failed', false)
        } finally { setUploading(false) }
    }

    const handleAddLink = async () => {
        if (!linkUrl.trim() || !title.trim()) return
        const newRes: Res = {
            id: Date.now().toString(),
            title: title.trim(),
            type: linkType,
            url: linkUrl.trim(),
            meta: meta.trim(),
        }
        await persist([...resources, newRes])
        setMode(null); setTitle(''); setMeta(''); setLinkUrl('')
    }

    const handleDelete = async (r: Res) => {
        if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return
        const next = resources.filter(x => x.id !== r.id)
        if (r.filename) bibleStudyApi.deleteResourceFile(r.filename).catch(() => {})
        await persist(next)
    }

    const startEdit = (r: Res) => { setEditId(r.id); setEditTitle(r.title); setEditMeta(r.meta || '') }
    const saveEdit = async () => {
        await persist(resources.map(r => r.id === editId ? { ...r, title: editTitle.trim(), meta: editMeta.trim() } : r))
        setEditId(null)
    }

    const resetForm = () => { setMode(null); setTitle(''); setMeta(''); setFile(null); setLinkUrl('') }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl text-white ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/bible-study" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#140152]">Study Library Resources</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Upload PDFs, audio, video or add external links — replaces "Coming Soon"</p>
                    </div>
                </div>
                {saving && <Loader2 className="w-5 h-5 animate-spin text-[#140152]" />}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
                <button onClick={() => setMode(mode === 'upload' ? null : 'upload')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'upload' ? 'bg-[#140152] text-white' : 'bg-[#140152]/5 text-[#140152] hover:bg-[#140152]/10'}`}>
                    <Upload className="w-4 h-4" /> Upload File (PDF / Audio / Video)
                </button>
                <button onClick={() => setMode(mode === 'link' ? null : 'link')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'link' ? 'bg-[#140152] text-white' : 'bg-[#140152]/5 text-[#140152] hover:bg-[#140152]/10'}`}>
                    <LinkIcon className="w-4 h-4" /> Add External Link (YouTube / Drive)
                </button>
            </div>

            {/* Upload form */}
            {mode === 'upload' && (
                <div className="bg-white rounded-2xl border-2 border-[#140152]/20 p-5 space-y-4">
                    <p className="font-bold text-[#140152] text-sm">Upload File</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resource title *"
                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                        <input value={meta} onChange={e => setMeta(e.target.value)} placeholder='e.g. "24 pages" or "38 min"'
                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.mp3,.m4a,.wav,.ogg,.mp4,.webm" onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                    <button onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-[#140152] rounded-xl py-8 flex flex-col items-center gap-2 text-sm text-gray-500 hover:text-[#140152] transition-colors">
                        <Upload className="w-7 h-7" />
                        {file ? <span className="font-semibold text-[#140152]">{file.name}</span> : 'Click to choose file'}
                        <span className="text-xs text-gray-400">PDF · MP3 · M4A · WAV · OGG · MP4 · WebM</span>
                    </button>
                    <div className="flex gap-3">
                        <button onClick={handleUpload} disabled={!file || !title.trim() || uploading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#140152] text-white rounded-xl text-sm font-bold hover:bg-[#1d0175] disabled:opacity-40 transition-all">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Upload & Save
                        </button>
                        <button onClick={resetForm} className="px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                    </div>
                </div>
            )}

            {/* Link form */}
            {mode === 'link' && (
                <div className="bg-white rounded-2xl border-2 border-[#140152]/20 p-5 space-y-4">
                    <p className="font-bold text-[#140152] text-sm">Add External Link</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resource title *"
                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                        <input value={meta} onChange={e => setMeta(e.target.value)} placeholder='e.g. "38 min" or "16 pages"'
                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                    </div>
                    <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                        placeholder="https://drive.google.com/…  or  https://youtube.com/…"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                    <div className="flex gap-2">
                        {(['pdf', 'audio', 'video'] as const).map(t => (
                            <button key={t} onClick={() => setLinkType(t)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${linkType === t ? 'bg-[#140152] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {TYPE_CONFIG[t].label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleAddLink} disabled={!linkUrl.trim() || !title.trim() || saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#140152] text-white rounded-xl text-sm font-bold hover:bg-[#1d0175] disabled:opacity-40 transition-all">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add & Save
                        </button>
                        <button onClick={resetForm} className="px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                    </div>
                </div>
            )}

            {/* Resource list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-black text-[#140152]">
                        Library Resources
                        <span className="ml-2 text-xs font-bold bg-[#140152]/10 text-[#140152] px-2.5 py-0.5 rounded-full">{resources.length}</span>
                    </p>
                </div>
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]/30" /></div>
                ) : resources.length === 0 ? (
                    <div className="py-16 text-center">
                        <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No resources yet. Upload a file or add a link above.</p>
                    </div>
                ) : (
                    <div>
                        {resources.map(r => (
                            editId === r.id ? (
                                <div key={r.id} className="flex items-center gap-3 px-5 py-3 bg-[#140152]/5 border-b border-gray-50">
                                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                                    <input value={editMeta} onChange={e => setEditMeta(e.target.value)} placeholder="meta"
                                        className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                                    <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Save className="w-4 h-4" /></button>
                                    <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <ResourceRow key={r.id} res={r} onDelete={handleDelete} onEdit={startEdit} />
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-[#f5bb00]/10 border border-[#f5bb00]/30 rounded-2xl p-4 text-sm text-[#92400e]">
                <p className="font-bold mb-1">📌 How this works</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                    <li>Resources here replace the "Coming Soon" placeholders on <strong>/bible-study → Resources tab</strong></li>
                    <li>Upload PDFs directly — members click <strong>Download</strong> and get the file</li>
                    <li>Paste a YouTube link (set type to Video) — members click <strong>Watch</strong></li>
                    <li>Paste a Google Drive / SoundCloud link (set type to Audio) — members click <strong>Listen</strong></li>
                    <li>The <strong>Meta</strong> field shows "24 pages", "38 min" etc. on the card</li>
                </ul>
            </div>
        </div>
    )
}

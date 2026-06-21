'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Save, Video, AlertCircle, CheckCircle, ExternalLink,
    Upload, Trash2, RotateCcw, Sparkles
} from 'lucide-react'
import { ministryContentApi, downloadsApi } from '@/lib/api'

function ytId(url: string): string | null {
    if (!url) return null
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : null
}
function ytEmbedUrl(id: string): string {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1`
}

/**
 * Admin-managed homepage hero video + copy.
 *
 * Settings are stored under the ministry-content key 'hero-settings'.
 * PremiumHero reads this on mount.
 *
 * Two ways to set a video:
 *   1. Paste any MP4 URL (Supabase Storage, S3, R2, CDN, etc.)
 *   2. Upload an MP4 right here — it's pushed through the Downloads
 *      uploader (admin auth, 25 MB cap) and the resulting stream URL
 *      is auto-populated below.
 */

interface HeroSettings {
    video_url: string
    eyebrow: string
    title_line_1: string
    title_line_2: string
    subtitle: string
}

const DEFAULTS: HeroSettings = {
    video_url: '',
    eyebrow: 'Light Encounter Tabernacle Worldwide',
    title_line_1: 'Come & Worship',
    title_line_2: 'With Us',
    subtitle: 'A worldwide family carrying the gospel into every nation — Spirit-filled worship, life-changing teaching, and the unmistakable presence of Jesus. Come as you are; leave forever changed.',
}

export default function AdminHeroVideoPage() {
    const [s, setS] = useState<HeroSettings>(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        ministryContentApi.get('hero-settings')
            .then(r => {
                const c = (r.content || {}) as Partial<HeroSettings>
                setS({ ...DEFAULTS, ...c })
            })
            .catch(() => { /* keep defaults */ })
            .finally(() => setLoading(false))
    }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try {
            await ministryContentApi.update('hero-settings', s as unknown as Record<string, unknown>)
            setMsg({ kind: 'ok', text: 'Saved. Refresh letw.org to see the change.' })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    const reset = () => {
        if (!confirm('Reset every field back to factory defaults? The current video URL will also be cleared.')) return
        setS(DEFAULTS)
    }

    const upload = async (file: File) => {
        if (!file) return
        if (file.size > 25 * 1024 * 1024) { setMsg({ kind: 'err', text: 'File too large — keep under 25 MB. For bigger files use the URL field with a Supabase/S3 link.' }); return }
        setUploading(true)
        try {
            const r = await downloadsApi.adminAddFile({
                title: `Hero Video (${new Date().toISOString().slice(0, 10)})`,
                category: 'Video',
                description: 'Uploaded for homepage hero — admin-managed',
                file,
            })
            const url = downloadsApi.fileUrl(r.id)
            setS({ ...s, video_url: url })
            setMsg({ kind: 'ok', text: 'Uploaded. URL filled in. Click Save changes to apply.' })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setUploading(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Video className="w-7 h-7 text-[#f5bb00]" /> Homepage Hero Video</h1>
                    <p className="text-gray-500 mt-1 text-sm">Upload or link a video and edit the hero copy on <Link href="/" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">letw.org <ExternalLink className="w-3 h-3" /></Link></p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={reset} className="px-4 py-3 border border-gray-200 text-gray-600 hover:text-[#140152] hover:border-gray-300 font-bold rounded-xl text-sm inline-flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {/* Section: Video */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-5">
                <h2 className="font-black text-[#140152] mb-1">1 · Background video</h2>
                <p className="text-xs text-gray-500 mb-4">Drop any silent looping MP4. 1080p, 10-30 seconds is ideal. Hillsong-style worship, congregation, candles, or city skyline all work great.</p>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">Paste a URL</label>
                        <input value={s.video_url} onChange={e => setS({ ...s, video_url: e.target.value })} placeholder="https://your-cdn.com/letw-hero.mp4"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono" />
                        <p className="text-[11px] text-gray-400 mt-1">Supabase Storage, R2, S3, public MP4 — <strong>OR a YouTube URL</strong>. Leave blank for the built-in default.</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">Or upload a file (≤25 MB)</label>
                        <label className="block">
                            <input type="file" accept="video/mp4,video/webm" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} className="hidden" id="hero-upload" />
                            <span className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-[#140152] text-sm text-gray-600 rounded-lg cursor-pointer">
                                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Pick an MP4 / WebM</>}
                            </span>
                        </label>
                        <p className="text-[11px] text-gray-400 mt-1">Stored alongside your other downloads. Stream URL is auto-filled on the left.</p>
                    </div>
                </div>

                {/* Live preview */}
                {s.video_url && (
                    <div className="mt-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Preview</p>
                        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-gray-200">
                            {(() => {
                                const id = ytId(s.video_url)
                                if (id) {
                                    return (
                                        <iframe
                                            title="Hero preview"
                                            src={ytEmbedUrl(id)}
                                            allow="autoplay; encrypted-media; picture-in-picture"
                                            className="w-full h-full"
                                            style={{ border: 0 }}
                                        />
                                    )
                                }
                                return <video src={s.video_url} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                            })()}
                        </div>
                        {ytId(s.video_url) && (
                            <p className="mt-2 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" /> YouTube URL detected — will play as a silent looping iframe background. For best quality use a direct MP4 instead.
                            </p>
                        )}
                        <button onClick={() => setS({ ...s, video_url: '' })} className="mt-2 ml-2 text-xs font-bold text-red-500 hover:text-red-700 inline-flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Clear video (fall back to default)
                        </button>
                    </div>
                )}
            </div>

            {/* Section: Copy */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-5">
                <h2 className="font-black text-[#140152] mb-1">2 · Hero copy</h2>
                <p className="text-xs text-gray-500 mb-4">The eyebrow, two-line headline, and subtitle. Keep the headline short — two punchy lines work best.</p>

                <div className="grid gap-3">
                    <Field label="Eyebrow (small gold line above the title)" value={s.eyebrow} onChange={v => setS({ ...s, eyebrow: v })} />
                    <Field label="Title — line 1 (white)" value={s.title_line_1} onChange={v => setS({ ...s, title_line_1: v })} />
                    <Field label="Title — line 2 (shimmering gold)" value={s.title_line_2} onChange={v => setS({ ...s, title_line_2: v })} />
                    <FieldText label="Subtitle" value={s.subtitle} onChange={v => setS({ ...s, subtitle: v })} rows={3} />
                </div>
            </div>

            {/* Section: Live preview composite */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-5">
                <h2 className="font-black text-[#140152] mb-1">3 · Mini preview</h2>
                <p className="text-xs text-gray-500 mb-4">A quick mock of the result. Open <Link href="/" target="_blank" className="font-bold text-[#140152] hover:underline">letw.org</Link> after saving to see the real hero.</p>
                <div className="relative aspect-[16/7] bg-[#06002a] rounded-2xl overflow-hidden">
                    {s.video_url && (() => {
                        const id = ytId(s.video_url)
                        if (id) {
                            return (
                                <div className="absolute inset-0 overflow-hidden">
                                    <iframe title="Hero composite" src={ytEmbedUrl(id)} allow="autoplay; encrypted-media"
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-95"
                                        style={{ width: '177.78%', height: '177.78%', border: 0 }} />
                                </div>
                            )
                        }
                        return <video src={s.video_url} muted autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-95" />
                    })()}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,0,42,0.30) 0%, rgba(6,0,42,0.05) 30%, rgba(6,0,42,0.45) 80%, rgba(6,0,42,0.92) 100%)' }} />
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                        <p className="text-[#f5bb00] font-bold tracking-[0.4em] text-[10px] uppercase mb-3" style={{ textShadow: '0 0 20px rgba(245,187,0,0.4)' }}>
                            {s.eyebrow}
                        </p>
                        <p className="font-serif font-black text-white text-3xl md:text-5xl leading-[0.95]" style={{ textShadow: '0 6px 40px rgba(0,0,0,0.55)' }}>
                            <span className="block">{s.title_line_1}</span>
                            <span className="block bg-gradient-to-r from-[#ffd763] via-[#fff5d6] to-[#f5bb00] bg-clip-text text-transparent">{s.title_line_2}</span>
                        </p>
                        <p className="text-white text-xs md:text-sm mt-3 max-w-lg line-clamp-3" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.55)' }}>
                            {s.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Sticky save bar */}
            <div className="sticky bottom-4 mt-8 z-30">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 pl-2 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f5bb00]" /> Saves to ministry-content key &quot;hero-settings&quot;.
                    </p>
                    <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
        </div>
    )
}
function FieldText({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows: number }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y" />
        </div>
    )
}

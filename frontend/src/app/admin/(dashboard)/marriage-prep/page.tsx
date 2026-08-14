'use client'
/**
 * /admin/marriage-prep — curriculum CRUD + couple sign-off.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
    Loader2, Plus, Save, Trash2, Heart, CheckCircle, AlertCircle, Quote, Pencil, X,
    Link as LinkIcon, FileText, Upload, Video, CalendarClock, Award, Send,
} from 'lucide-react'
import { marriagePrepApi, ministryContentApi, authApi, type MarriagePrepModule, type MarriagePrepModuleResource, type MarriagePrepCouple, type MarriagePrepPastor } from '@/lib/api'
import { marriagePrepRoom } from '@/components/JitsiMeet'
import CertPhotoUpload from '@/components/admin/CertPhotoUpload'

export default function MarriagePrepAdmin() {
    const [tab, setTab] = useState<'modules' | 'couples'>('modules')
    const [modules, setModules] = useState<MarriagePrepModule[]>([])
    const [couples, setCouples] = useState<MarriagePrepCouple[]>([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const refresh = async () => {
        setLoading(true)
        try {
            const [m, c] = await Promise.all([marriagePrepApi.modules(), marriagePrepApi.listCouples()])
            setModules(m); setCouples(c)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { refresh() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
            <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-1"><Heart className="w-7 h-7 text-[#f5bb00]" /> Marriage Prep</h1>
            <p className="text-gray-500 text-sm mb-4">6-week guided course. Build the curriculum once; couples enrol publicly; pastors sign off at the end.</p>

            <div className="inline-flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm mb-4">
                <button onClick={() => setTab('modules')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'modules' ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Curriculum ({modules.length})</button>
                <button onClick={() => setTab('couples')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'couples' ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Couples ({couples.length})</button>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : tab === 'modules' ? (
                <ModulesTab modules={modules} onSaved={refresh} onMsg={setMsg} />
            ) : (
                <CouplesTab couples={couples} onSaved={refresh} onMsg={setMsg} />
            )}
        </div>
    )
}

interface PendingResource { title: string; kind: 'url' | 'file' | 'video'; url?: string; file?: File }

function ModulesTab({ modules, onSaved, onMsg }: { modules: MarriagePrepModule[]; onSaved: () => void; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const [editing, setEditing] = useState<Omit<MarriagePrepModule, 'id'> | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    // Resources staged while creating a brand-new module — it has no id yet
    // to attach them to, so we hold them here and upload right after the
    // module itself is created (see save()). Existing modules skip this
    // entirely and upload immediately (ModuleResources below).
    const [pending, setPending] = useState<PendingResource[]>([])

    const blank: Omit<MarriagePrepModule, 'id'> = { week_number: modules.length + 1, title: '', summary: '', body_html: '', scripture: '', homework: '', is_published: true }
    const currentModule = editingId ? modules.find(m => m.id === editingId) : null

    const closeForm = () => { setEditing(null); setEditingId(null); setPending([]) }

    const save = async () => {
        if (!editing || !editing.title) return
        setSaving(true)
        try {
            if (editingId) {
                await marriagePrepApi.updateModule(editingId, editing)
            } else {
                const created = await marriagePrepApi.createModule(editing)
                for (const p of pending) {
                    if (p.kind === 'url' && p.url) await marriagePrepApi.addModuleResourceUrl(created.id, p.title, p.url)
                    if (p.kind === 'video' && p.url) await marriagePrepApi.addModuleResourceVideo(created.id, p.title, p.url)
                    if (p.kind === 'file' && p.file) await marriagePrepApi.addModuleResourceFile(created.id, p.title, p.file)
                }
            }
            closeForm()
            onMsg({ kind: 'ok', text: 'Saved.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    return (
        <div className="space-y-3">
            {editing && (
                <div className="bg-white border border-[#140152] rounded-2xl shadow-md p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <input type="number" value={editing.week_number} onChange={e => setEditing({ ...editing, week_number: parseInt(e.target.value) || 1 })} className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Module title" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <input value={editing.scripture || ''} onChange={e => setEditing({ ...editing, scripture: e.target.value })} placeholder="Key scripture (Ephesians 5:21–33)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
                    <textarea value={editing.summary || ''} onChange={e => setEditing({ ...editing, summary: e.target.value })} placeholder="Short summary" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
                    <textarea value={editing.body_html || ''} onChange={e => setEditing({ ...editing, body_html: e.target.value })} placeholder="Body (HTML)" rows={8} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono mb-2" />
                    <textarea value={editing.homework || ''} onChange={e => setEditing({ ...editing, homework: e.target.value })} placeholder="Couple's homework / discussion questions" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />

                    {currentModule ? (
                        <ModuleResources module={currentModule} onSaved={onSaved} onMsg={onMsg} />
                    ) : (
                        <ResourceEditorList
                            rows={pending.map((p, i) => ({
                                id: String(i), title: p.title, kind: p.kind,
                                meta: p.kind === 'file' && p.file ? `${Math.max(1, Math.round(p.file.size / 1024))} KB` : undefined,
                            }))}
                            note="Uploaded automatically once you save this new module."
                            onAddLink={(title, url) => setPending(prev => [...prev, { title, kind: 'url', url }])}
                            onAddVideo={(title, url) => setPending(prev => [...prev, { title, kind: 'video', url }])}
                            onAddFile={(title, file) => setPending(prev => [...prev, { title, kind: 'file', file }])}
                            onRemove={id => setPending(prev => prev.filter((_, i) => i !== Number(id)))}
                        />
                    )}

                    <div className="flex items-center gap-4 mt-3">
                        <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} /> Published</label>
                        <div className="flex-1" />
                        <button onClick={closeForm} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save module
                        </button>
                    </div>
                </div>
            )}

            {!editing && (
                <button onClick={() => { setEditing(blank); setEditingId(null); setPending([]) }} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-xl text-sm">
                    <Plus className="w-4 h-4" /> New module
                </button>
            )}

            <div className="space-y-2">
                {modules.map(m => (
                    <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#f5bb00]/20 text-[#140152] font-black flex items-center justify-center">{m.week_number}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152]">{m.title}</p>
                            {m.scripture && <p className="text-xs italic text-gray-500 inline-flex items-center gap-1"><Quote className="w-3 h-3" />{m.scripture}</p>}
                            {m.summary && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{m.summary}</p>}
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => { setEditing({ week_number: m.week_number, title: m.title, summary: m.summary, body_html: m.body_html, scripture: m.scripture, homework: m.homework, is_published: m.is_published }); setEditingId(m.id); setPending([]) }} className="text-xs underline text-[#140152]">Edit</button>
                            <button onClick={async () => { if (confirm(`Delete "${m.title}"?`)) { try { await marriagePrepApi.deleteModule(m.id); onSaved() } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) } } }} className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface ResourceRow { id: string; title: string; kind: 'url' | 'file' | 'video'; href?: string; meta?: string }

const RESOURCE_ICON: Record<ResourceRow['kind'], typeof LinkIcon> = { url: LinkIcon, file: FileText, video: Video }

/** Shared list + "add link" / "add video" / "upload file" controls. Used both
 * for an existing module's resources (persisted immediately) and for a
 * brand-new module's staged resources (persisted once the module is saved). */
function ResourceEditorList({ rows, busy, note, onAddLink, onAddVideo, onAddFile, onRemove }: {
    rows: ResourceRow[]
    busy?: boolean
    note?: string
    onAddLink: (title: string, url: string) => void
    onAddVideo: (title: string, url: string) => void
    onAddFile: (title: string, file: File) => void
    onRemove: (id: string) => void
}) {
    const [linkTitle, setLinkTitle] = useState('')
    const [linkUrl, setLinkUrl] = useState('')
    const [videoTitle, setVideoTitle] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [fileTitle, setFileTitle] = useState('')

    return (
        <div className="border-t border-gray-100 mt-1 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Resources (links, videos, PDFs, documents)</p>
            {note && <p className="text-[11px] text-gray-400 mb-2">{note}</p>}

            {rows.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                    {rows.map(r => {
                        const Icon = RESOURCE_ICON[r.kind]
                        return (
                            <li key={r.id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                                <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                {r.href ? (
                                    <a href={r.href} target="_blank" rel="noreferrer" className="flex-1 truncate underline text-[#140152]">{r.title}</a>
                                ) : (
                                    <span className="flex-1 truncate text-gray-700">{r.title}</span>
                                )}
                                {r.meta && <span className="text-[10px] text-gray-400 shrink-0">{r.meta}</span>}
                                <button onClick={() => onRemove(r.id)} className="p-1 text-red-400 hover:text-red-700 hover:bg-red-50 rounded shrink-0">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}

            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Link title" className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs" />
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs" />
                <button type="button" disabled={busy || !linkTitle || !linkUrl}
                    onClick={() => { onAddLink(linkTitle, linkUrl); setLinkTitle(''); setLinkUrl('') }}
                    className="inline-flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-lg text-xs disabled:opacity-50">
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add link
                </button>
            </div>

            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Video title" className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs" />
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube or Vimeo link" className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs" />
                <button type="button" disabled={busy || !videoTitle || !videoUrl}
                    onClick={() => { onAddVideo(videoTitle, videoUrl); setVideoTitle(''); setVideoUrl('') }}
                    className="inline-flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-lg text-xs disabled:opacity-50">
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />} Add video
                </button>
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                <input value={fileTitle} onChange={e => setFileTitle(e.target.value)} placeholder="File label (optional — defaults to filename)" className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs" />
                <label className="inline-flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-lg text-xs cursor-pointer whitespace-nowrap">
                    <Upload className="w-3 h-3" /> Upload PDF / document
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf"
                        className="hidden"
                        disabled={busy}
                        onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) { onAddFile(fileTitle || f.name, f); setFileTitle('') }
                            e.target.value = ''
                        }}
                    />
                </label>
            </div>
        </div>
    )
}

function ModuleResources({ module: m, onSaved, onMsg }: {
    module: MarriagePrepModule
    onSaved: () => void
    onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void
}) {
    const [busy, setBusy] = useState(false)
    const resources = m.resources || []

    const addLink = async (title: string, url: string) => {
        setBusy(true)
        try {
            await marriagePrepApi.addModuleResourceUrl(m.id, title, url)
            onMsg({ kind: 'ok', text: 'Link added.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setBusy(false) }
    }

    const addVideo = async (title: string, url: string) => {
        setBusy(true)
        try {
            await marriagePrepApi.addModuleResourceVideo(m.id, title, url)
            onMsg({ kind: 'ok', text: 'Video added.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setBusy(false) }
    }

    const addFile = async (title: string, file: File) => {
        setBusy(true)
        try {
            await marriagePrepApi.addModuleResourceFile(m.id, title, file)
            onMsg({ kind: 'ok', text: 'File uploaded.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setBusy(false) }
    }

    const remove = async (id: string) => {
        const r = resources.find(x => x.id === id)
        if (r && !confirm(`Remove "${r.title}"?`)) return
        try {
            await marriagePrepApi.deleteModuleResource(id)
            onMsg({ kind: 'ok', text: 'Removed.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const rows: ResourceRow[] = resources.map(r => ({
        id: r.id, title: r.title, kind: r.kind,
        href: r.kind === 'file' ? marriagePrepApi.moduleResourceFileUrl(r.id) : (r.external_url || '#'),
        meta: r.kind === 'file' && r.file_size != null ? `${Math.max(1, Math.round(r.file_size / 1024))} KB` : undefined,
    }))

    return <ResourceEditorList rows={rows} busy={busy} onAddLink={addLink} onAddVideo={addVideo} onAddFile={addFile} onRemove={remove} />
}

function CouplesTab({ couples, onSaved, onMsg }: { couples: MarriagePrepCouple[]; onSaved: () => void; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const [editing, setEditing] = useState<MarriagePrepCouple | null>(null)
    // Jitsi config mirrors the couple portal — enabled + domain are admin-set
    // in /admin/page-copy. Default: on, via meet.jit.si.
    const [jitsi, setJitsi] = useState<{ enabled: boolean; domain: string }>({ enabled: true, domain: 'meet.jit.si' })
    useEffect(() => {
        ministryContentApi.get('marriage-prep-page')
            .then(r => {
                const c = (r.content || {}) as { jitsi_enabled?: boolean; jitsi_domain?: string }
                setJitsi({ enabled: c.jitsi_enabled !== false, domain: c.jitsi_domain || 'meet.jit.si' })
            })
            .catch(() => { /* keep defaults */ })
    }, [])

    const joinCall = (c: MarriagePrepCouple) => {
        const room = marriagePrepRoom(c.id)
        const url = `https://${jitsi.domain}/${encodeURIComponent(room)}#userInfo.displayName=%22Pastor%22`
        window.open(url, '_blank', 'noopener')
    }

    const [scheduling, setScheduling] = useState<MarriagePrepCouple | null>(null)
    const [pastors, setPastors] = useState<MarriagePrepPastor[]>([])
    // "My couples" filter — show only couples assigned to the signed-in pastor.
    const [myId, setMyId] = useState<string | null>(null)
    const [mineOnly, setMineOnly] = useState(false)
    useEffect(() => { marriagePrepApi.listPastors().then(setPastors).catch(() => { /* none */ }) }, [])
    useEffect(() => { authApi.getCurrentUser().then(u => setMyId(u.id)).catch(() => { /* not critical */ }) }, [])

    const visibleCouples = mineOnly && myId ? couples.filter(c => c.assigned_pastor_user_id === myId) : couples

    const assign = async (c: MarriagePrepCouple, pastorId: string) => {
        try {
            await marriagePrepApi.assignPastor(c.id, pastorId || null)
            onMsg({ kind: 'ok', text: pastorId ? 'Pastor assigned.' : 'Pastor unassigned.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const savePhoto = async (c: MarriagePrepCouple, dataUrl: string | null) => {
        try {
            await marriagePrepApi.updateCouple(c.id, { photo_url: dataUrl })
            onMsg({ kind: 'ok', text: dataUrl ? 'Couple photo saved.' : 'Photo removed.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const signOff = async (c: MarriagePrepCouple) => {
        const sig = prompt(`Sign off on ${c.partner_a_name} & ${c.partner_b_name}? Enter your name as signature:`)
        if (!sig) return
        const note = prompt('Optional pastor note (left blank is fine):') || ''
        try {
            await marriagePrepApi.signOff(c.id, sig, note || undefined)
            onMsg({ kind: 'ok', text: `Signed off ${c.partner_a_name} & ${c.partner_b_name}.` })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const remove = async (c: MarriagePrepCouple) => {
        if (!confirm(
            `Delete ${c.partner_a_name} & ${c.partner_b_name}?\n\n`
            + `This will remove the couple and all their weekly progress notes.\n`
            + `It cannot be undone.`
        )) return
        try {
            await marriagePrepApi.deleteCouple(c.id)
            onMsg({ kind: 'ok', text: `Deleted ${c.partner_a_name} & ${c.partner_b_name}.` })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <>
            {myId && (
                <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm mb-3">
                    <button onClick={() => setMineOnly(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${!mineOnly ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>All couples ({couples.length})</button>
                    <button onClick={() => setMineOnly(true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mineOnly ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>My couples ({couples.filter(c => c.assigned_pastor_user_id === myId).length})</button>
                </div>
            )}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
                {visibleCouples.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">{mineOnly ? 'No couples assigned to you yet.' : 'No couples enrolled yet.'}</p>}
                {visibleCouples.map(c => (
                    <div key={c.id} className="p-4 grid md:grid-cols-[1fr_auto] gap-3 items-start">
                        <div>
                            <p className="font-bold text-[#140152]">{c.partner_a_name} <span className="text-gray-400 font-normal">&</span> {c.partner_b_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{c.partner_a_email}{c.partner_b_email ? ` · ${c.partner_b_email}` : ''}</p>
                            {c.intended_wedding_date && <p className="text-xs text-gray-500">Wedding {new Date(c.intended_wedding_date).toLocaleDateString()}</p>}
                            <p className="text-[10px] uppercase tracking-widest mt-1 font-bold inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{c.status}</p>
                            {c.session_at && (
                                <p className="text-xs text-rose-700 mt-1 inline-flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" /> Session {new Date(c.session_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pastor</label>
                                <select
                                    value={c.assigned_pastor_user_id || ''}
                                    onChange={e => assign(c, e.target.value)}
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-[#140152] font-semibold max-w-[200px]"
                                >
                                    <option value="">— Unassigned —</option>
                                    {pastors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="mt-2">
                                <CertPhotoUpload value={c.photo_url} onChange={d => savePhoto(c, d)} label="Couple photo" />
                                <p className="text-[10px] text-gray-400 mt-1">Sent to sharepoints with the couple for the marriage certificate.</p>
                            </div>
                            {c.pastor_signed_off && c.pastor_signature && (
                                <p className="text-xs text-emerald-700 mt-1 inline-flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Signed by {c.pastor_signature}
                                </p>
                            )}
                            {c.pastor_signed_off && (
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Completion email was sent to the couple with their certificate + next steps.
                                    <Link
                                        href={`/marriage-prep/complete/${c.id}`}
                                        target="_blank"
                                        className="underline text-[#140152] ml-1"
                                    >View their page ↗</Link>
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-start">
                            {!c.pastor_signed_off && (
                                <button onClick={() => signOff(c)} className="inline-flex items-center gap-1 bg-[#140152] hover:bg-[#1d0175] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                                    <CheckCircle className="w-3 h-3" /> Sign off
                                </button>
                            )}
                            {c.pastor_signed_off && (
                                <>
                                    <button onClick={() => {
                                        const url = `${window.location.origin}/marriage-prep/complete/${c.id}`
                                        navigator.clipboard.writeText(url)
                                            .then(() => onMsg({ kind: 'ok', text: 'Certificate link copied.' }))
                                            .catch(() => onMsg({ kind: 'err', text: url }))
                                    }} title="Copy the couple's certificate link"
                                        className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                                        <Award className="w-3 h-3" /> Certificate link
                                    </button>
                                    <button onClick={async () => {
                                        try {
                                            const r = await marriagePrepApi.resendCertificate(c.id)
                                            onMsg({ kind: 'ok', text: r.emails_sent > 0 ? `Certificate email re-sent to ${r.emails_sent} address${r.emails_sent > 1 ? 'es' : ''}.` : 'Sent (or email not configured — link copied is always safe).' })
                                        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
                                    }} title="Re-send the completion email with the certificate link"
                                        className="inline-flex items-center gap-1 border border-gray-200 hover:border-[#140152] text-gray-700 hover:text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg">
                                        <Send className="w-3 h-3" /> Re-send
                                    </button>
                                </>
                            )}
                            <button onClick={() => {
                                const url = `${window.location.origin}/marriage-prep/journey/${c.id}`
                                navigator.clipboard.writeText(url)
                                    .then(() => onMsg({ kind: 'ok', text: 'Portal link copied — send it to the couple so they can read modules + log reflections.' }))
                                    .catch(() => onMsg({ kind: 'err', text: url }))
                            }} title="Copy the couple's portal link"
                                className="inline-flex items-center gap-1 bg-[#f5bb00]/15 hover:bg-[#f5bb00]/30 text-[#8a6d00] text-xs font-bold px-3 py-1.5 rounded-lg">
                                <Quote className="w-3 h-3" /> Portal link
                            </button>
                            {jitsi.enabled && (
                                <button onClick={() => joinCall(c)} title="Join the couple's video room"
                                    className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                                    <Video className="w-3 h-3" /> Video call
                                </button>
                            )}
                            <button onClick={() => setScheduling(c)} title="Schedule a session and email the couple a calendar invite"
                                className="inline-flex items-center gap-1 border border-gray-200 hover:border-[#140152] text-gray-700 hover:text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg">
                                <CalendarClock className="w-3 h-3" /> Schedule
                            </button>
                            <button onClick={() => setEditing(c)} title="Edit couple"
                                className="inline-flex items-center gap-1 border border-gray-200 hover:border-[#140152] text-gray-700 hover:text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg">
                                <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button onClick={() => remove(c)} title="Delete couple"
                                className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {editing && (
                <EditCoupleModal
                    couple={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); onSaved() }}
                    onMsg={onMsg}
                />
            )}

            {scheduling && (
                <ScheduleModal
                    couple={scheduling}
                    onClose={() => setScheduling(null)}
                    onSaved={() => { setScheduling(null); onSaved() }}
                    onMsg={onMsg}
                />
            )}
        </>
    )
}

function ScheduleModal({ couple, onClose, onSaved, onMsg }: {
    couple: MarriagePrepCouple
    onClose: () => void
    onSaved: () => void
    onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void
}) {
    // datetime-local wants "YYYY-MM-DDTHH:mm" — trim any existing ISO value.
    const [when, setWhen] = useState(couple.session_at ? couple.session_at.slice(0, 16) : '')
    const [note, setNote] = useState(couple.session_note || '')
    const [saving, setSaving] = useState(false)

    const save = async (clear: boolean) => {
        setSaving(true)
        try {
            // Send the local wall-clock time as-is (no timezone) — the invite is
            // floating local time, matching what the pastor typed.
            await marriagePrepApi.scheduleSession(couple.id, clear ? null : (when || null), clear ? undefined : note)
            onMsg({ kind: 'ok', text: clear ? 'Session cleared.' : 'Session scheduled — calendar invite emailed to the couple.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-[#140152]">Schedule a session</h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-3">
                    <p className="text-xs text-gray-500">{couple.partner_a_name} &amp; {couple.partner_b_name} will be emailed a calendar invite (.ics) with their video-room link.</p>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Date &amp; time</label>
                        <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Note to the couple (optional)</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What this session is for, anything to prepare…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y" />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    {couple.session_at ? (
                        <button onClick={() => save(true)} disabled={saving} className="text-sm text-red-600 hover:text-red-800 font-bold">Clear session</button>
                    ) : <span />}
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                        <button onClick={() => save(false)} disabled={saving || !when} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />} Schedule &amp; invite
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function EditCoupleModal({ couple, onClose, onSaved, onMsg }: {
    couple: MarriagePrepCouple
    onClose: () => void
    onSaved: () => void
    onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void
}) {
    // Local editable copy — ISO date is trimmed to YYYY-MM-DD so the native
    // date input accepts it. Status enum is a discriminated list.
    const [form, setForm] = useState({
        partner_a_name: couple.partner_a_name || '',
        partner_a_email: couple.partner_a_email || '',
        partner_b_name: couple.partner_b_name || '',
        partner_b_email: couple.partner_b_email || '',
        intended_wedding_date: couple.intended_wedding_date ? couple.intended_wedding_date.slice(0, 10) : '',
        status: couple.status || 'enrolled',
        pastor_signature: couple.pastor_signature || '',
        pastor_note: couple.pastor_note || '',
    })
    const [saving, setSaving] = useState(false)

    const save = async () => {
        setSaving(true)
        try {
            await marriagePrepApi.updateCouple(couple.id, {
                partner_a_name: form.partner_a_name,
                partner_a_email: form.partner_a_email,
                partner_b_name: form.partner_b_name,
                partner_b_email: form.partner_b_email || null,
                intended_wedding_date: form.intended_wedding_date ? new Date(form.intended_wedding_date).toISOString() : null,
                status: form.status as 'enrolled' | 'in_progress' | 'completed' | 'withdrew',
                pastor_signature: form.pastor_signature || null,
                pastor_note: form.pastor_note || null,
            })
            onMsg({ kind: 'ok', text: 'Saved.' })
            onSaved()
        } catch (e) {
            onMsg({ kind: 'err', text: (e as Error).message })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-[#140152]">Edit couple</h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Partner A name</label>
                            <input value={form.partner_a_name} onChange={e => setForm({ ...form, partner_a_name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Partner A email</label>
                            <input type="email" value={form.partner_a_email} onChange={e => setForm({ ...form, partner_a_email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Partner B name</label>
                            <input value={form.partner_b_name} onChange={e => setForm({ ...form, partner_b_name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Partner B email</label>
                            <input type="email" value={form.partner_b_email} onChange={e => setForm({ ...form, partner_b_email: e.target.value })} placeholder="(optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Wedding date</label>
                            <input type="date" value={form.intended_wedding_date} onChange={e => setForm({ ...form, intended_wedding_date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as typeof form.status })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                <option value="enrolled">Enrolled</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                                <option value="withdrew">Withdrew</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Pastor signature</label>
                        <input value={form.pastor_signature} onChange={e => setForm({ ...form, pastor_signature: e.target.value })} placeholder="Blank clears the certificate signature" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Pastor note (private)</label>
                        <textarea value={form.pastor_note} onChange={e => setForm({ ...form, pastor_note: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y" />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                    <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </button>
                </div>
            </div>
        </div>
    )
}

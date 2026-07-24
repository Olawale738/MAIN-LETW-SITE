'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import LeadsPanel from '@/components/governance/LeadsPanel'
import AuditLogPanel from '@/components/governance/AuditLogPanel'
import {
    Loader2, ArrowLeft, Save, ExternalLink, Plus, Trash2, ChevronUp, ChevronDown,
    Sparkles, Target, Calendar, BookOpen, Megaphone, User, Image as ImageIcon,
    UserCog, Search, X, ShieldCheck,
} from 'lucide-react'
import { youthProgramApi, YouthProgram, cmsApi, dashboardApi, AdminUser } from '@/lib/api'

type Item = { title: string; description?: string; icon?: string }
type Sched = { day: string; time?: string; title?: string; description?: string }
type Resource = { title: string; url: string; type?: 'pdf' | 'video' | 'link'; meta?: string }
type Announcement = { title: string; body?: string; date?: string; urgent?: boolean }

export default function YouthProgramEditor() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const { showToast, ToastComponent } = useToast()
    const isNew = params?.id === 'new'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [slug, setSlug] = useState('')
    const [title, setTitle] = useState('')
    const [badge, setBadge] = useState('')
    const [icon, setIcon] = useState('Sparkles')
    const [colorClass, setColorClass] = useState('bg-violet-100 text-violet-600')
    const [heroImage, setHeroImage] = useState('')
    const [shortDescription, setShortDescription] = useState('')
    const [longDescription, setLongDescription] = useState('')
    const [whatYoullDo, setWhatYoullDo] = useState<Item[]>([])
    const [whoItsFor, setWhoItsFor] = useState<string[]>([])
    const [schedule, setSchedule] = useState<Sched[]>([])
    const [outcomes, setOutcomes] = useState<string[]>([])
    const [resources, setResources] = useState<Resource[]>([])
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [leaderName, setLeaderName] = useState('')
    const [leaderRole, setLeaderRole] = useState('')
    const [leaderPhoto, setLeaderPhoto] = useState('')
    const [leaderBio, setLeaderBio] = useState('')
    const [coordinatorIds, setCoordinatorIds] = useState<string[]>([])
    const [allUsers, setAllUsers] = useState<AdminUser[]>([])
    const [userSearch, setUserSearch] = useState('')
    const [usersLoading, setUsersLoading] = useState(false)
    const [registrationOpen, setRegistrationOpen] = useState(true)
    const [joinCtaText, setJoinCtaText] = useState('')
    const [serviceRequestLabel, setServiceRequestLabel] = useState('')
    const [orderIndex, setOrderIndex] = useState(0)
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        if (isNew) { setLoading(false); return }
        if (!params?.id) return
        let cancelled = false
        ;(async () => {
            try {
                const all = await youthProgramApi.admin.listAll()
                const p = all.find(x => x.id === params!.id)
                if (!p) {
                    showToast('Program not found', 'error')
                    router.push('/admin/youth/programs')
                    return
                }
                if (cancelled) return
                setSlug(p.slug)
                setTitle(p.title)
                setBadge(p.badge || '')
                setIcon(p.icon || 'Sparkles')
                setColorClass(p.color_class || 'bg-violet-100 text-violet-600')
                setHeroImage(p.hero_image_url || '')
                setShortDescription(p.short_description || '')
                setLongDescription(p.long_description || '')
                setWhatYoullDo(Array.isArray(p.what_youll_do) ? p.what_youll_do as any : [])
                setWhoItsFor(Array.isArray(p.who_its_for) ? p.who_its_for as any : [])
                setSchedule(Array.isArray(p.schedule) ? p.schedule as any : [])
                setOutcomes(Array.isArray(p.outcomes) ? p.outcomes as any : [])
                setResources(Array.isArray(p.resources) ? p.resources as any : [])
                setAnnouncements(Array.isArray(p.announcements) ? p.announcements as any : [])
                setLeaderName(p.leader_name || '')
                setLeaderRole(p.leader_role || '')
                setLeaderPhoto(p.leader_photo_url || '')
                setLeaderBio(p.leader_bio || '')
                setCoordinatorIds(Array.isArray(p.coordinator_user_ids) ? p.coordinator_user_ids : [])
                setRegistrationOpen(!!p.registration_open)
                setJoinCtaText(p.join_cta_text || '')
                setServiceRequestLabel(p.service_request_label || '')
                setOrderIndex(p.order_index || 0)
                setIsActive(!!p.is_active)
            } catch (e: any) {
                showToast(e?.message || 'Load failed', 'error')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [params?.id, isNew, router, showToast])

    // Load users for the coordinator picker (one-shot, admin-only endpoint)
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                setUsersLoading(true)
                const res = await dashboardApi.getUsers('active', 500, 0)
                if (!cancelled) setAllUsers(res.users || [])
            } catch {
                /* swallow — picker just shows empty */
            } finally {
                if (!cancelled) setUsersLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [])

    const handleImageUpload = async (file: File, setter: (url: string) => void) => {
        try {
            setUploading(true)
            const res = await cmsApi.uploadImage(file)
            setter(res.url || '')
            showToast('Image uploaded', 'success')
        } catch (e: any) {
            showToast(e?.message || 'Upload failed', 'error')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug.trim()) return showToast('Slug is required', 'error')
        if (!title.trim()) return showToast('Title is required', 'error')

        const payload: Partial<YouthProgram> = {
            slug: slug.trim(),
            title: title.trim(),
            badge: badge.trim() || undefined,
            icon: icon.trim() || undefined,
            color_class: colorClass.trim() || undefined,
            hero_image_url: heroImage.trim() || undefined,
            short_description: shortDescription || undefined,
            long_description: longDescription || undefined,
            what_youll_do: whatYoullDo.filter(x => x.title?.trim()),
            who_its_for: whoItsFor.filter(x => x?.trim()),
            schedule: schedule.filter(x => x.day?.trim()),
            outcomes: outcomes.filter(x => x?.trim()),
            resources: resources.filter(x => x.title?.trim() && x.url?.trim()),
            announcements: announcements.filter(x => x.title?.trim()),
            leader_name: leaderName || undefined,
            leader_role: leaderRole || undefined,
            leader_photo_url: leaderPhoto || undefined,
            leader_bio: leaderBio || undefined,
            coordinator_user_ids: coordinatorIds,
            registration_open: registrationOpen,
            join_cta_text: joinCtaText || undefined,
            service_request_label: serviceRequestLabel || undefined,
            order_index: orderIndex,
            is_active: isActive,
        }

        try {
            setSaving(true)
            if (isNew) {
                const created = await youthProgramApi.admin.create(payload)
                showToast(`Created "${created.title}"`, 'success')
                router.push('/admin/youth/programs')
            } else {
                await youthProgramApi.admin.update(params!.id as string, payload)
                showToast(`Saved "${title}"`, 'success')
            }
        } catch (e: any) {
            showToast(e?.message || 'Save failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {ToastComponent()}

            <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push('/admin/youth/programs')} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-black text-[#140152]">{isNew ? 'New Program' : `Edit: ${title || '(untitled)'}`}</h1>
                    {!isNew && slug && (
                        <Link href={`/youth/${slug}`} target="_blank" className="text-xs text-gray-500 hover:text-[#140152] inline-flex items-center gap-1 mt-0.5">
                            /youth/{slug} <ExternalLink className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#f5bb00]" /> Identity</CardTitle>
                        <p className="text-xs text-gray-500">Slug + title + badge + icon. The slug becomes the URL: /youth/&lt;slug&gt;.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Slug *</label>
                                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="digital-missions" className="text-gray-900 font-mono" />
                                <p className="text-xs text-gray-500 mt-1">URL-safe, lowercase, dashes only.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Digital Missions" className="text-gray-900" />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Badge</label>
                                <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Tech-Powered" className="text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Icon (lucide name)</label>
                                <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Wifi, Users, Heart..." className="text-gray-900 font-mono" />
                                <p className="text-xs text-gray-500 mt-1">e.g. <code>Tent</code>, <code>Users</code>, <code>Dumbbell</code></p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tailwind color class</label>
                                <Input value={colorClass} onChange={(e) => setColorClass(e.target.value)} placeholder="bg-cyan-100 text-cyan-600" className="text-gray-900 font-mono" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hero copy */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#f5bb00]" /> Hero</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Hero image</label>
                            <div className="flex items-center gap-3">
                                {heroImage && <img src={heroImage} alt="Hero" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />}
                                <Input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} placeholder="/Impact.png or https://..." className="text-gray-900 flex-1" />
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-xs font-bold text-gray-700">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setHeroImage)} />
                                    {uploading ? 'Uploading…' : 'Upload'}
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Short tagline (italic in hero)</label>
                            <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One sentence that captures the heart of this program." className="text-gray-900" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Long description (below the tagline)</label>
                            <Textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={5} className="text-gray-900" />
                        </div>
                    </CardContent>
                </Card>

                {/* What You'll Do */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-[#f5bb00]" /> What You&apos;ll Do</CardTitle>
                        <button type="button" onClick={() => setWhatYoullDo([...whatYoullDo, { title: '', description: '', icon: 'Sparkles' }])} className="inline-flex items-center gap-1 text-sm font-bold text-[#140152] hover:text-[#f5bb00]">
                            <Plus className="w-4 h-4" /> Add item
                        </button>
                    </CardHeader>
                    <CardContent>
                        {whatYoullDo.length === 0 && <p className="text-xs text-gray-500 italic mb-2">Nothing yet — &ldquo;What You&apos;ll Do&rdquo; section is hidden on the live page.</p>}
                        <div className="space-y-3">
                            {whatYoullDo.map((it, i) => (
                                <div key={i} className="rounded-xl border border-gray-200 p-3 bg-gray-50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Item {i + 1}</p>
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => { if (i === 0) return; const n = [...whatYoullDo]; [n[i-1], n[i]] = [n[i], n[i-1]]; setWhatYoullDo(n) }} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => { if (i === whatYoullDo.length - 1) return; const n = [...whatYoullDo]; [n[i+1], n[i]] = [n[i], n[i+1]]; setWhatYoullDo(n) }} disabled={i === whatYoullDo.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => setWhatYoullDo(whatYoullDo.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-2">
                                        <Input value={it.title} onChange={(e) => { const n = [...whatYoullDo]; n[i] = { ...n[i], title: e.target.value }; setWhatYoullDo(n) }} placeholder="Item title" className="text-gray-900 text-sm" />
                                        <Input value={it.icon || ''} onChange={(e) => { const n = [...whatYoullDo]; n[i] = { ...n[i], icon: e.target.value }; setWhatYoullDo(n) }} placeholder="Icon (e.g. Flame)" className="text-gray-900 text-sm font-mono" />
                                    </div>
                                    <Textarea value={it.description || ''} onChange={(e) => { const n = [...whatYoullDo]; n[i] = { ...n[i], description: e.target.value }; setWhatYoullDo(n) }} rows={2} placeholder="One-paragraph description" className="text-gray-900 text-sm" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Who It's For + Outcomes (string lists) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Who It&apos;s For &amp; Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Who it&apos;s for (one per line)</label>
                            <Textarea value={whoItsFor.join('\n')} onChange={(e) => setWhoItsFor(e.target.value.split('\n').filter(x => x.trim().length > 0))} rows={5} className="text-gray-900 text-sm" placeholder={"Ages 14-25\nMembers & first-time visitors\nAnyone hungry for an encounter"} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Outcomes (one per line)</label>
                            <Textarea value={outcomes.join('\n')} onChange={(e) => setOutcomes(e.target.value.split('\n').filter(x => x.trim().length > 0))} rows={5} className="text-gray-900 text-sm" placeholder={"A renewed sense of God's voice\nFriendships you'll keep\nClarity on the next step"} />
                        </div>
                    </CardContent>
                </Card>

                {/* Schedule */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-[#f5bb00]" /> When We Meet</CardTitle>
                        <button type="button" onClick={() => setSchedule([...schedule, { day: '', time: '', title: '', description: '' }])} className="inline-flex items-center gap-1 text-sm font-bold text-[#140152] hover:text-[#f5bb00]">
                            <Plus className="w-4 h-4" /> Add row
                        </button>
                    </CardHeader>
                    <CardContent>
                        {schedule.length === 0 && <p className="text-xs text-gray-500 italic mb-2">No schedule yet.</p>}
                        <div className="space-y-3">
                            {schedule.map((s, i) => (
                                <div key={i} className="rounded-xl border border-gray-200 p-3 bg-gray-50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Row {i + 1}</p>
                                        <button type="button" onClick={() => setSchedule(schedule.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-2">
                                        <Input value={s.day} onChange={(e) => { const n = [...schedule]; n[i] = { ...n[i], day: e.target.value }; setSchedule(n) }} placeholder="Day (e.g. Saturday, Day 1, Weekly)" className="text-gray-900 text-sm" />
                                        <Input value={s.time || ''} onChange={(e) => { const n = [...schedule]; n[i] = { ...n[i], time: e.target.value }; setSchedule(n) }} placeholder="Time (e.g. 6:00 PM)" className="text-gray-900 text-sm" />
                                    </div>
                                    <Input value={s.title || ''} onChange={(e) => { const n = [...schedule]; n[i] = { ...n[i], title: e.target.value }; setSchedule(n) }} placeholder="Title (e.g. Workshop + rehearsal)" className="text-gray-900 text-sm" />
                                    <Textarea value={s.description || ''} onChange={(e) => { const n = [...schedule]; n[i] = { ...n[i], description: e.target.value }; setSchedule(n) }} rows={2} placeholder="Optional description" className="text-gray-900 text-sm" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Resources */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#f5bb00]" /> Resources (member dashboard)</CardTitle>
                        <button type="button" onClick={() => setResources([...resources, { title: '', url: '', type: 'link' }])} className="inline-flex items-center gap-1 text-sm font-bold text-[#140152] hover:text-[#f5bb00]">
                            <Plus className="w-4 h-4" /> Add resource
                        </button>
                    </CardHeader>
                    <CardContent>
                        {resources.length === 0 && <p className="text-xs text-gray-500 italic mb-2">Shown on the member dashboard at /youth/{slug || '<slug>'}/dashboard.</p>}
                        <div className="space-y-3">
                            {resources.map((r, i) => (
                                <div key={i} className="rounded-xl border border-gray-200 p-3 bg-gray-50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Resource {i + 1}</p>
                                        <button type="button" onClick={() => setResources(resources.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-2">
                                        <Input value={r.title} onChange={(e) => { const n = [...resources]; n[i] = { ...n[i], title: e.target.value }; setResources(n) }} placeholder="Title" className="text-gray-900 text-sm md:col-span-2" />
                                        <select value={r.type || 'link'} onChange={(e) => { const n = [...resources]; n[i] = { ...n[i], type: e.target.value as any }; setResources(n) }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
                                            <option value="link">Link</option>
                                            <option value="pdf">PDF</option>
                                            <option value="video">Video</option>
                                        </select>
                                    </div>
                                    <Input value={r.url} onChange={(e) => { const n = [...resources]; n[i] = { ...n[i], url: e.target.value }; setResources(n) }} placeholder="URL" className="text-gray-900 text-sm" />
                                    <Input value={r.meta || ''} onChange={(e) => { const n = [...resources]; n[i] = { ...n[i], meta: e.target.value }; setResources(n) }} placeholder="Meta (e.g. 24 pages, 38 min)" className="text-gray-900 text-sm" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Announcements */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-[#f5bb00]" /> Announcements (member dashboard)</CardTitle>
                        <button type="button" onClick={() => setAnnouncements([...announcements, { title: '', body: '', date: new Date().toISOString().slice(0, 10), urgent: false }])} className="inline-flex items-center gap-1 text-sm font-bold text-[#140152] hover:text-[#f5bb00]">
                            <Plus className="w-4 h-4" /> Post announcement
                        </button>
                    </CardHeader>
                    <CardContent>
                        {announcements.length === 0 && <p className="text-xs text-gray-500 italic mb-2">No announcements posted yet.</p>}
                        <div className="space-y-3">
                            {announcements.map((a, i) => (
                                <div key={i} className={`rounded-xl border p-3 space-y-2 ${a.urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Announcement {i + 1}</p>
                                        <button type="button" onClick={() => setAnnouncements(announcements.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <Input value={a.title} onChange={(e) => { const n = [...announcements]; n[i] = { ...n[i], title: e.target.value }; setAnnouncements(n) }} placeholder="Title" className="text-gray-900 text-sm" />
                                    <Textarea value={a.body || ''} onChange={(e) => { const n = [...announcements]; n[i] = { ...n[i], body: e.target.value }; setAnnouncements(n) }} rows={2} placeholder="Body" className="text-gray-900 text-sm" />
                                    <div className="flex items-center justify-between gap-3">
                                        <Input type="date" value={(a.date || '').slice(0, 10)} onChange={(e) => { const n = [...announcements]; n[i] = { ...n[i], date: e.target.value }; setAnnouncements(n) }} className="text-gray-900 text-sm max-w-xs" />
                                        <label className="inline-flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={!!a.urgent} onChange={(e) => { const n = [...announcements]; n[i] = { ...n[i], urgent: e.target.checked }; setAnnouncements(n) }} />
                                            <span className="font-bold text-red-700">Urgent</span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Coordinators */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCog className="w-5 h-5 text-[#f5bb00]" /> Program Coordinators
                        </CardTitle>
                        <p className="text-xs text-gray-500">
                            These users can post announcements + manage resources for this program from the per-program coordinator view (admins always have access regardless).
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Assigned coordinators */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Assigned ({coordinatorIds.length})
                            </p>
                            {coordinatorIds.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No coordinators assigned. Pick from the list below.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {coordinatorIds.map((uid) => {
                                        const u = allUsers.find(x => x.id === uid)
                                        return (
                                            <span key={uid} className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full pl-3 pr-1.5 py-1 text-sm">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                <span className="font-bold">{u?.name || 'Unknown user'}</span>
                                                {u?.email && <span className="text-emerald-600/80 text-xs">{u.email}</span>}
                                                <button
                                                    type="button"
                                                    onClick={() => setCoordinatorIds(coordinatorIds.filter(x => x !== uid))}
                                                    className="ml-1 p-1 hover:bg-emerald-100 rounded-full"
                                                    aria-label="Remove coordinator"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Picker: search + add */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Add coordinator
                            </p>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="text-gray-900 pl-10"
                                />
                            </div>
                            {usersLoading ? (
                                <p className="text-sm text-gray-400 mt-3 inline-flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading members...
                                </p>
                            ) : (
                                <div className="mt-3 max-h-72 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                                    {(() => {
                                        const q = userSearch.trim().toLowerCase()
                                        const candidates = allUsers
                                            .filter(u => !coordinatorIds.includes(u.id))
                                            .filter(u => !q || (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)))
                                            .slice(0, 50)
                                        if (candidates.length === 0) {
                                            return (
                                                <p className="p-4 text-sm text-gray-400 italic text-center">
                                                    {q ? `No members match "${userSearch}".` : 'All loaded members are already coordinators.'}
                                                </p>
                                            )
                                        }
                                        return candidates.map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => { setCoordinatorIds([...coordinatorIds, u.id]); setUserSearch('') }}
                                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-[#140152] truncate">{u.name || 'Unnamed user'}</p>
                                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                                </div>
                                                <span className="text-xs font-bold text-[#140152] inline-flex items-center gap-1 shrink-0">
                                                    <Plus className="w-3.5 h-3.5" /> Assign
                                                </span>
                                            </button>
                                        ))
                                    })()}
                                </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                                Loaded {allUsers.length} active members. Use the search to narrow.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Leader */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-[#f5bb00]" /> Program Leader</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Leader name</label>
                                <Input value={leaderName} onChange={(e) => setLeaderName(e.target.value)} placeholder="Full name" className="text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                <Input value={leaderRole} onChange={(e) => setLeaderRole(e.target.value)} placeholder="e.g. Youth Director" className="text-gray-900" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Leader photo</label>
                            <div className="flex items-center gap-3">
                                {leaderPhoto && <img src={leaderPhoto} alt="Leader" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />}
                                <Input value={leaderPhoto} onChange={(e) => setLeaderPhoto(e.target.value)} placeholder="https://…/photo.jpg" className="text-gray-900 flex-1" />
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-xs font-bold text-gray-700">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setLeaderPhoto)} />
                                    {uploading ? 'Uploading…' : 'Upload'}
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Short bio</label>
                            <Textarea value={leaderBio} onChange={(e) => setLeaderBio(e.target.value)} rows={3} className="text-gray-900" />
                        </div>
                    </CardContent>
                </Card>

                {/* Registration & visibility */}
                <Card>
                    <CardHeader>
                        <CardTitle>Registration &amp; Visibility</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Join CTA text</label>
                                <Input value={joinCtaText} onChange={(e) => setJoinCtaText(e.target.value)} placeholder="e.g. Reserve a Spot" className="text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Coordinator inbox label</label>
                                <Input value={serviceRequestLabel} onChange={(e) => setServiceRequestLabel(e.target.value)} placeholder="Youth :: Digital Missions" className="text-gray-900" />
                                <p className="text-xs text-gray-500 mt-1">Used when forwarding the registration to the youth coordinator inbox.</p>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Display order</label>
                                <Input type="number" value={String(orderIndex)} onChange={(e) => setOrderIndex(parseInt(e.target.value || '0', 10))} className="text-gray-900" />
                            </div>
                            <label className="flex items-center gap-2 text-sm pt-7">
                                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                <span className="font-bold">Active (visible on /youth)</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm pt-7">
                                <input type="checkbox" checked={registrationOpen} onChange={(e) => setRegistrationOpen(e.target.checked)} />
                                <span className="font-bold">Registration open</span>
                            </label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 sticky bottom-4">
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/youth/programs')} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving} className="bg-[#140152] text-white hover:bg-[#1d0175] shadow-lg">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isNew ? 'Create program' : 'Save changes'}
                    </Button>
                </div>
            </form>

            {!isNew && (
                <div className="grid lg:grid-cols-2 gap-4 mt-8">
                    <LeadsPanel groupKind="youth_program" groupId={String(params?.id || '')} groupLabel="This Youth Program" canManage />
                    <AuditLogPanel groupKind="youth_program" groupId={String(params?.id || '')} title="Program — Activity Log" canCustomLog />
                </div>
            )}
        </div>
    )
}

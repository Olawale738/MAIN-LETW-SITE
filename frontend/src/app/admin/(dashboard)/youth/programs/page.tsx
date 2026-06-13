'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
    Loader2, Plus, Edit, Trash2, Eye, ExternalLink, EyeOff,
    Sparkles, AlertCircle, ArrowUp, ArrowDown,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { youthProgramApi, YouthProgram } from '@/lib/api'

const getIcon = (name?: string) => {
    if (!name) return Sparkles
    const I = (LucideIcons as any)[name]
    return I || Sparkles
}

export default function AdminYouthProgramsPage() {
    const router = useRouter()
    const { showToast, ToastComponent } = useToast()
    const [programs, setPrograms] = useState<YouthProgram[]>([])
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<YouthProgram | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        try {
            setLoading(true)
            const data = await youthProgramApi.admin.listAll()
            setPrograms(data)
        } catch (e: any) {
            showToast(e?.message || 'Failed to load programs', 'error')
        } finally {
            setLoading(false)
        }
    }

    const seedDefaults = async () => {
        if (!confirm('Seed default programs (only inserts if the table is empty)?')) return
        try {
            setSeeding(true)
            const { inserted } = await youthProgramApi.admin.seedDefaults()
            showToast(inserted > 0 ? `Inserted ${inserted} default programs` : 'Table already has programs — nothing to seed', 'success')
            await load()
        } catch (e: any) {
            showToast(e?.message || 'Seed failed', 'error')
        } finally {
            setSeeding(false)
        }
    }

    const move = async (p: YouthProgram, dir: -1 | 1) => {
        const ordered = [...programs].sort((a, b) => a.order_index - b.order_index)
        const i = ordered.findIndex(x => x.id === p.id)
        const j = i + dir
        if (j < 0 || j >= ordered.length) return
        const other = ordered[j]
        try {
            await Promise.all([
                youthProgramApi.admin.update(p.id, { order_index: other.order_index }),
                youthProgramApi.admin.update(other.id, { order_index: p.order_index }),
            ])
            await load()
        } catch (e: any) {
            showToast(e?.message || 'Reorder failed', 'error')
        }
    }

    const toggleActive = async (p: YouthProgram) => {
        try {
            await youthProgramApi.admin.update(p.id, { is_active: !p.is_active })
            showToast(!p.is_active ? `${p.title} is now visible on /youth` : `${p.title} is now hidden`, 'success')
            await load()
        } catch (e: any) {
            showToast(e?.message || 'Toggle failed', 'error')
        }
    }

    const toggleRegistration = async (p: YouthProgram) => {
        try {
            await youthProgramApi.admin.update(p.id, { registration_open: !p.registration_open })
            showToast(!p.registration_open ? 'Registration opened' : 'Registration closed', 'success')
            await load()
        } catch (e: any) {
            showToast(e?.message || 'Update failed', 'error')
        }
    }

    const performDelete = async () => {
        if (!pendingDelete) return
        try {
            setDeleting(true)
            await youthProgramApi.admin.remove(pendingDelete.id)
            showToast(`Deleted "${pendingDelete.title}"`, 'success')
            setPendingDelete(null)
            await load()
        } catch (e: any) {
            showToast(e?.message || 'Delete failed', 'error')
        } finally {
            setDeleting(false)
        }
    }

    const sorted = [...programs].sort((a, b) => a.order_index - b.order_index || a.title.localeCompare(b.title))

    return (
        <div className="space-y-6">
            {ToastComponent()}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#140152]">Youth Programs</h1>
                    <p className="text-gray-600 mt-1">
                        Each card lives on <Link href="/youth" target="_blank" className="underline hover:text-[#140152]">/youth</Link> as a clickable cinematic page at <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/youth/&lt;slug&gt;</code>.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={seedDefaults}
                        disabled={seeding}
                        className="border-gray-300"
                    >
                        {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Seed defaults
                    </Button>
                    <Button
                        type="button"
                        onClick={() => router.push('/admin/youth/programs/new')}
                        className="bg-[#140152] text-white hover:bg-[#1d0175]"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Program
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
                </div>
            ) : sorted.length === 0 ? (
                <Card>
                    <CardContent className="p-10 text-center">
                        <Sparkles className="w-12 h-12 text-[#f5bb00] mx-auto mb-3" />
                        <p className="font-black text-[#140152] text-lg mb-1">No programs yet</p>
                        <p className="text-sm text-gray-500 mb-4">Click &ldquo;Seed defaults&rdquo; to insert the 8 starter programs, or &ldquo;New Program&rdquo; to create your own.</p>
                        <Button onClick={seedDefaults} className="bg-[#140152] text-white hover:bg-[#1d0175]">
                            <Sparkles className="w-4 h-4 mr-2" /> Seed 8 default programs
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {sorted.map((p, idx) => {
                        const Icon = getIcon(p.icon)
                        return (
                            <Card key={p.id} className={`overflow-hidden border-l-4 ${p.is_active ? 'border-l-emerald-400' : 'border-l-gray-300'}`}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Reorder column */}
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button type="button" onClick={() => move(p, -1)} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                                                <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                                            </button>
                                            <span className="text-[10px] font-bold text-gray-400 text-center">{p.order_index}</span>
                                            <button type="button" onClick={() => move(p, 1)} disabled={idx === sorted.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                                                <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                                            </button>
                                        </div>

                                        {/* Icon */}
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#140152] to-[#1d0175] flex items-center justify-center shrink-0">
                                            <Icon className="w-7 h-7 text-[#f5bb00]" />
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-black text-[#140152] text-lg truncate">{p.title}</h3>
                                                        {p.badge && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f5bb00]/20 text-[#140152] px-2 py-0.5 rounded-full">{p.badge}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">/youth/{p.slug}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 shrink-0">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {p.is_active ? 'Live' : 'Hidden'}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${p.registration_open ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {p.registration_open ? 'Reg. open' : 'Reg. closed'}
                                                    </span>
                                                </div>
                                            </div>
                                            {p.short_description && (
                                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{p.short_description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-3 mt-3 text-xs">
                                                <span className="text-gray-500">What you&apos;ll do: <strong className="text-[#140152]">{(p.what_youll_do || []).length}</strong></span>
                                                <span className="text-gray-500">Schedule: <strong className="text-[#140152]">{(p.schedule || []).length}</strong></span>
                                                <span className="text-gray-500">Resources: <strong className="text-[#140152]">{(p.resources || []).length}</strong></span>
                                                <span className="text-gray-500">Announcements: <strong className="text-[#140152]">{(p.announcements || []).length}</strong></span>
                                                <span className="text-gray-500">Coordinators: <strong className={(p.coordinator_user_ids || []).length > 0 ? 'text-emerald-600' : 'text-amber-600'}>{(p.coordinator_user_ids || []).length}</strong></span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            <Link href={`/admin/youth/programs/${p.id}`} className="inline-flex items-center gap-1.5 bg-[#140152] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#1d0175]">
                                                <Edit className="w-3.5 h-3.5" /> Edit
                                            </Link>
                                            <a href={`/youth/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                                <ExternalLink className="w-3.5 h-3.5" /> Preview
                                            </a>
                                            <button type="button" onClick={() => toggleActive(p)} className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                                {p.is_active ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
                                            </button>
                                            <button type="button" onClick={() => toggleRegistration(p)} className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                                {p.registration_open ? 'Close reg.' : 'Open reg.'}
                                            </button>
                                            <button type="button" onClick={() => setPendingDelete(p)} className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50">
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Delete confirm modal */}
            {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setPendingDelete(null)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-3">
                            <AlertCircle className="w-7 h-7 text-red-500" />
                            <h3 className="text-xl font-black text-[#140152]">Delete {pendingDelete.title}?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-5">This removes the program from /youth and breaks any existing link to /youth/{pendingDelete.slug}. To temporarily hide instead, use the &ldquo;Hide&rdquo; button.</p>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>Cancel</Button>
                            <Button type="button" onClick={performDelete} disabled={deleting} className="bg-red-600 text-white hover:bg-red-700">
                                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Delete program
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

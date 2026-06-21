'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Users, Plus, Trash2, AlertCircle, CheckCircle, ExternalLink,
    Edit3, Eye, EyeOff
} from 'lucide-react'
import { smallGroupsApi, type SmallGroup } from '@/lib/api'
import BackendNotDeployedCard from '@/components/admin/BackendNotDeployedCard'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminSmallGroupsPage() {
    const [groups, setGroups] = useState<SmallGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [editing, setEditing] = useState<SmallGroup | null>(null)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        setLoading(true)
        try { setGroups(await smallGroupsApi.adminAll()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t) } }, [msg])

    const remove = async (gid: string) => {
        if (!confirm('Delete this group permanently?')) return
        try { await smallGroupsApi.adminDelete(gid); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const toggleActive = async (g: SmallGroup) => {
        try { await smallGroupsApi.adminUpdate(g.id, { ...g, is_active: !g.is_active }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Users className="w-7 h-7 text-[#f5bb00]" /> Small Groups</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage House Fellowships / small groups. Public discovery at <Link href="/groups" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">/groups <ExternalLink className="w-3 h-3" /></Link></p>
                </div>
                <button onClick={() => setAdding(true)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> New group</button>
            </div>

            {msg && /not found|404|method not allowed|405/i.test(msg.text) ? (
                <BackendNotDeployedCard errorText={msg.text} onRetry={load} />
            ) : msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {(adding || editing) && (
                <GroupForm
                    initial={editing || undefined}
                    onCancel={() => { setAdding(false); setEditing(null) }}
                    onDone={() => { setAdding(false); setEditing(null); load() }}
                    onError={t => setMsg({ kind: 'err', text: t })}
                />
            )}

            {loading ? (
                <div className="flex items-center justify-center min-h-[20vh]"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
            ) : groups.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No groups yet. Create your first to publish it on /groups.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {groups.map(g => (
                            <div key={g.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-[#140152]/5 text-[#140152] flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-[#140152] truncate">{g.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {DAYS[g.day_of_week]} {g.time_text} · {g.city || g.location_label} · Led by {g.leader_name} · {g.current_size}/{g.capacity}
                                    </p>
                                </div>
                                <button onClick={() => toggleActive(g)} title={g.is_active ? 'Hide from public' : 'Publish'}
                                    className={`p-2 rounded ${g.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:text-[#140152] hover:bg-gray-100'}`}>
                                    {g.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setEditing(g)} className="p-2 text-gray-400 hover:text-[#140152] hover:bg-gray-50 rounded"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => remove(g.id)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function GroupForm({ initial, onCancel, onDone, onError }: {
    initial?: SmallGroup; onCancel: () => void; onDone: () => void; onError: (t: string) => void;
}) {
    const [g, setG] = useState({
        name: initial?.name || '',
        description: initial?.description || '',
        topics: initial?.topics || '',
        audience: initial?.audience || 'any',
        day_of_week: initial?.day_of_week ?? 0,
        time_text: initial?.time_text || '6:00 PM',
        cadence: initial?.cadence || 'weekly',
        location_label: initial?.location_label || 'See group leader for address',
        city: initial?.city || '',
        country: initial?.country || '',
        leader_name: initial?.leader_name || '',
        leader_contact: initial?.leader_contact || '',
        capacity: initial?.capacity ?? 12,
        is_online: initial?.is_online ?? false,
        cover_image_url: initial?.cover_image_url || '',
    })
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        if (!g.name) return
        setBusy(true)
        try {
            if (initial) await smallGroupsApi.adminUpdate(initial.id, { ...initial, ...g })
            else await smallGroupsApi.adminCreate(g)
            onDone()
        } catch (e) { onError((e as Error).message) }
        finally { setBusy(false) }
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-[#f5bb00] p-5 mb-5 shadow-md">
            <h3 className="font-black text-[#140152] mb-3">{initial ? 'Edit group' : 'New small group'}</h3>
            <div className="grid md:grid-cols-2 gap-3">
                <input value={g.name} onChange={e => setG({ ...g, name: e.target.value })} placeholder="Group name *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />
                <textarea value={g.description} onChange={e => setG({ ...g, description: e.target.value })} rows={3} placeholder="Short description" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />
                <input value={g.topics} onChange={e => setG({ ...g, topics: e.target.value })} placeholder="Topics (comma-separated)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />
                <select value={g.audience} onChange={e => setG({ ...g, audience: e.target.value as SmallGroup['audience'] })} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {['any', 'newcomers', 'young_adults', 'couples', 'families', 'seniors', 'men', 'women', 'students'].map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
                </select>
                <select value={g.day_of_week} onChange={e => setG({ ...g, day_of_week: parseInt(e.target.value, 10) })} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}day</option>)}
                </select>
                <input value={g.time_text} onChange={e => setG({ ...g, time_text: e.target.value })} placeholder="Time (e.g. 6:00 PM)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <select value={g.cadence} onChange={e => setG({ ...g, cadence: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                </select>
                <input value={g.city} onChange={e => setG({ ...g, city: e.target.value })} placeholder="City" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={g.country} onChange={e => setG({ ...g, country: e.target.value })} placeholder="Country" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={g.location_label} onChange={e => setG({ ...g, location_label: e.target.value })} placeholder="Location label" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />
                <input value={g.leader_name} onChange={e => setG({ ...g, leader_name: e.target.value })} placeholder="Leader name" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={g.leader_contact} onChange={e => setG({ ...g, leader_contact: e.target.value })} placeholder="Leader contact (email or phone)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input type="number" value={g.capacity} onChange={e => setG({ ...g, capacity: parseInt(e.target.value, 10) || 12 })} placeholder="Capacity" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={g.is_online} onChange={e => setG({ ...g, is_online: e.target.checked })} /> Online group
                </label>
                <input value={g.cover_image_url} onChange={e => setG({ ...g, cover_image_url: e.target.value })} placeholder="Cover image URL (optional)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                <button onClick={submit} disabled={!g.name || busy} className="bg-[#140152] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (initial ? 'Save changes' : 'Create group')}
                </button>
            </div>
        </div>
    )
}

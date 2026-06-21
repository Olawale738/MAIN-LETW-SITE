'use client'
import { useEffect, useState } from 'react'
import {
    Loader2, Globe2, Plus, Trash2, Edit3, AlertCircle, CheckCircle,
    MapPin, Eye, EyeOff, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { churchLocationsApi, type ChurchLocation, type ChurchKind } from '@/lib/api'
import { CONTINENTS, countriesIn, type Continent } from '@/lib/countries'

const KINDS: ChurchKind[] = ['hq', 'branch', 'mission', 'fellowship']

export default function AdminLocationsPage() {
    const [items, setItems] = useState<ChurchLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<ChurchLocation | null>(null)
    const [adding, setAdding] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        setLoading(true)
        try { setItems(await churchLocationsApi.adminAll()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4500); return () => clearTimeout(t) } }, [msg])

    const remove = async (id: string) => {
        if (!confirm('Delete this location?')) return
        try { await churchLocationsApi.adminDelete(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const toggleActive = async (l: ChurchLocation) => {
        try { await churchLocationsApi.adminUpdate(l.id, { ...l, is_active: !l.is_active }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Globe2 className="w-7 h-7 text-[#f5bb00]" /> Church Locations</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage the worldwide reach map. Public homepage shows pins from this list.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/" target="_blank" className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><ExternalLink className="w-4 h-4" /> Preview</Link>
                    <button onClick={() => setAdding(true)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> New location</button>
                </div>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {(adding || editing) && (
                <LocationForm
                    initial={editing || undefined}
                    onCancel={() => { setAdding(false); setEditing(null) }}
                    onDone={() => { setAdding(false); setEditing(null); load() }}
                    onError={t => setMsg({ kind: 'err', text: t })}
                />
            )}

            {loading ? (
                <div className="flex items-center justify-center min-h-[20vh]"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
            ) : items.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                    <Globe2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No locations yet. Click "New location" to add Abuja HQ first.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {items.map(l => (
                            <div key={l.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-[#140152]/5 text-[#140152] flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-[#140152] truncate">{l.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {l.kind.toUpperCase()} · {l.city ? `${l.city}, ` : ''}{l.country_name} · {l.continent}
                                    </p>
                                </div>
                                <button onClick={() => toggleActive(l)} title={l.is_active ? 'Hide from public' : 'Publish'}
                                    className={`p-2 rounded ${l.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:text-[#140152] hover:bg-gray-100'}`}>
                                    {l.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setEditing(l)} className="p-2 text-gray-400 hover:text-[#140152] hover:bg-gray-50 rounded"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => remove(l.id)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function LocationForm({ initial, onCancel, onDone, onError }: {
    initial?: ChurchLocation; onCancel: () => void; onDone: () => void; onError: (t: string) => void;
}) {
    const [l, setL] = useState({
        name: initial?.name || '',
        kind: (initial?.kind || 'branch') as ChurchKind,
        continent: (initial?.continent || '') as Continent | '',
        country_code: initial?.country_code || '',
        country_name: initial?.country_name || '',
        city: initial?.city || '',
        address: initial?.address || '',
        blurb: initial?.blurb || '',
        contact_name: initial?.contact_name || '',
        contact_email: initial?.contact_email || '',
        contact_phone: initial?.contact_phone || '',
        website: initial?.website || '',
        map_x: initial?.map_x ?? 540,
        map_y: initial?.map_y ?? 290,
        lat: initial?.lat || null,
        lng: initial?.lng || null,
        photo_url: initial?.photo_url || '',
        sort_order: initial?.sort_order || 0,
        is_active: initial?.is_active ?? true,
    })
    const [busy, setBusy] = useState(false)

    const countries = l.continent ? countriesIn(l.continent as Continent) : []

    const setCountry = (code: string) => {
        const c = countries.find(x => x.code === code)
        setL({ ...l, country_code: code, country_name: c?.name || '' })
    }

    const submit = async () => {
        if (!l.name || !l.continent || !l.country_code) { onError('Name, continent and country are required.'); return }
        setBusy(true)
        try {
            const body = { ...l, continent: l.continent as string }
            if (initial) await churchLocationsApi.adminUpdate(initial.id, body as Omit<ChurchLocation, 'id' | 'created_at'>)
            else await churchLocationsApi.adminCreate(body as Omit<ChurchLocation, 'id' | 'created_at'>)
            onDone()
        } catch (e) { onError((e as Error).message) }
        finally { setBusy(false) }
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-[#f5bb00] p-5 mb-5 shadow-md">
            <h3 className="font-black text-[#140152] mb-3">{initial ? 'Edit location' : 'New church location'}</h3>
            <div className="grid md:grid-cols-2 gap-3">
                <input value={l.name} onChange={e => setL({ ...l, name: e.target.value })} placeholder="Name (e.g. Abuja HQ) *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />
                <select value={l.kind} onChange={e => setL({ ...l, kind: e.target.value as ChurchKind })} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {KINDS.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
                <input value={l.sort_order} onChange={e => setL({ ...l, sort_order: parseInt(e.target.value, 10) || 0 })} type="number" placeholder="Sort order" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />

                {/* Continent → Country dependent dropdowns */}
                <select required value={l.continent} onChange={e => setL({ ...l, continent: e.target.value as Continent | '', country_code: '', country_name: '' })}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    <option value="">Continent *</option>
                    {CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select required disabled={!l.continent} value={l.country_code} onChange={e => setCountry(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white disabled:opacity-50">
                    <option value="">{l.continent ? 'Country *' : 'Pick continent first'}</option>
                    {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>

                <input value={l.city} onChange={e => setL({ ...l, city: e.target.value })} placeholder="City" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={l.address} onChange={e => setL({ ...l, address: e.target.value })} placeholder="Address (optional)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <textarea value={l.blurb} onChange={e => setL({ ...l, blurb: e.target.value })} rows={2} placeholder="Short blurb shown in the map tooltip" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />

                <input value={l.contact_name} onChange={e => setL({ ...l, contact_name: e.target.value })} placeholder="Contact name" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={l.contact_email} onChange={e => setL({ ...l, contact_email: e.target.value })} placeholder="Contact email" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={l.contact_phone} onChange={e => setL({ ...l, contact_phone: e.target.value })} placeholder="Contact phone" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={l.website} onChange={e => setL({ ...l, website: e.target.value })} placeholder="Website URL" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={l.photo_url} onChange={e => setL({ ...l, photo_url: e.target.value })} placeholder="Photo URL (optional)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />

                <div className="md:col-span-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-2">Map pin position (SVG 1000×500)</p>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs text-gray-500">X (0-1000)</span>
                            <input value={l.map_x} onChange={e => setL({ ...l, map_x: parseInt(e.target.value, 10) || 0 })} type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </label>
                        <label className="block">
                            <span className="text-xs text-gray-500">Y (0-500)</span>
                            <input value={l.map_y} onChange={e => setL({ ...l, map_y: parseInt(e.target.value, 10) || 0 })} type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </label>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Tip: Abuja ≈ (540, 290), London ≈ (488, 200), NYC ≈ (285, 215), Sydney ≈ (880, 410).</p>
                </div>

                <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={l.is_active} onChange={e => setL({ ...l, is_active: e.target.checked })} /> Active (show on public map)
                </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                <button onClick={submit} disabled={!l.name || !l.continent || !l.country_code || busy} className="bg-[#140152] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (initial ? 'Save changes' : 'Create location')}
                </button>
            </div>
        </div>
    )
}

'use client'
/**
 * /admin/marriage-prep — curriculum CRUD + couple sign-off.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
    Loader2, Plus, Save, Trash2, Heart, CheckCircle, AlertCircle, Quote,
} from 'lucide-react'
import { marriagePrepApi, type MarriagePrepModule, type MarriagePrepCouple } from '@/lib/api'

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

function ModulesTab({ modules, onSaved, onMsg }: { modules: MarriagePrepModule[]; onSaved: () => void; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const [editing, setEditing] = useState<Omit<MarriagePrepModule, 'id'> | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const blank: Omit<MarriagePrepModule, 'id'> = { week_number: modules.length + 1, title: '', summary: '', body_html: '', scripture: '', homework: '', is_published: true }

    const save = async () => {
        if (!editing || !editing.title) return
        setSaving(true)
        try {
            if (editingId) await marriagePrepApi.updateModule(editingId, editing)
            else await marriagePrepApi.createModule(editing)
            setEditing(null); setEditingId(null)
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
                    <div className="flex items-center gap-4">
                        <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} /> Published</label>
                        <div className="flex-1" />
                        <button onClick={() => { setEditing(null); setEditingId(null) }} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save module
                        </button>
                    </div>
                </div>
            )}

            {!editing && (
                <button onClick={() => { setEditing(blank); setEditingId(null) }} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-xl text-sm">
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
                            <button onClick={() => { setEditing({ week_number: m.week_number, title: m.title, summary: m.summary, body_html: m.body_html, scripture: m.scripture, homework: m.homework, is_published: m.is_published }); setEditingId(m.id) }} className="text-xs underline text-[#140152]">Edit</button>
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

function CouplesTab({ couples, onSaved, onMsg }: { couples: MarriagePrepCouple[]; onSaved: () => void; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
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

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
            {couples.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">No couples enrolled yet.</p>}
            {couples.map(c => (
                <div key={c.id} className="p-4 grid md:grid-cols-[1fr_auto] gap-3 items-start">
                    <div>
                        <p className="font-bold text-[#140152]">{c.partner_a_name} <span className="text-gray-400 font-normal">&</span> {c.partner_b_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.partner_a_email}{c.partner_b_email ? ` · ${c.partner_b_email}` : ''}</p>
                        {c.intended_wedding_date && <p className="text-xs text-gray-500">Wedding {new Date(c.intended_wedding_date).toLocaleDateString()}</p>}
                        <p className="text-[10px] uppercase tracking-widest mt-1 font-bold inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{c.status}</p>
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
                    {!c.pastor_signed_off && (
                        <button onClick={() => signOff(c)} className="inline-flex items-center gap-1 bg-[#140152] hover:bg-[#1d0175] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                            <CheckCircle className="w-3 h-3" /> Sign off
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}

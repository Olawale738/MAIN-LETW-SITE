'use client'
/**
 * /admin/volunteer-rota — teams CRUD + per-Sunday assignments.
 *
 * Layout: teams strip on top, then a date-grouped rota list. Assigning a
 * volunteer with an email fires a best-effort notification from the backend.
 */
import { useEffect, useMemo, useState } from 'react'
import {
    Loader2, Plus, Save, Trash2, Users, CheckCircle, AlertCircle, Calendar, Mail, X,
} from 'lucide-react'
import { rotaApi, type RotaTeam, type RotaAssignment } from '@/lib/api'

export default function VolunteerRotaAdmin() {
    const [teams, setTeams] = useState<RotaTeam[]>([])
    const [assignments, setAssignments] = useState<RotaAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [showTeamForm, setShowTeamForm] = useState(false)
    const [teamName, setTeamName] = useState('')
    const [teamDesc, setTeamDesc] = useState('')
    const [showAssign, setShowAssign] = useState(false)

    const refresh = async () => {
        setLoading(true)
        try {
            // Show the trailing 2 weeks + everything upcoming.
            const from = new Date(); from.setDate(from.getDate() - 14)
            const [t, a] = await Promise.all([
                rotaApi.teams(),
                rotaApi.assignments({ from_date: from.toISOString().slice(0, 10) }),
            ])
            setTeams(t); setAssignments(a)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { refresh() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const teamName_ = (id: string) => teams.find(t => t.id === id)?.name || '—'

    // Group assignments by service_date, ascending.
    const byDate = useMemo(() => {
        const map = new Map<string, RotaAssignment[]>()
        assignments.forEach(a => {
            const k = a.service_date.slice(0, 10)
            if (!map.has(k)) map.set(k, [])
            map.get(k)!.push(a)
        })
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
    }, [assignments])

    const addTeam = async () => {
        if (!teamName.trim()) return
        try {
            await rotaApi.createTeam({ name: teamName.trim(), description: teamDesc || null, is_active: true, sort_order: teams.length })
            setTeamName(''); setTeamDesc(''); setShowTeamForm(false)
            setMsg({ kind: 'ok', text: 'Team created.' })
            refresh()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Users className="w-7 h-7 text-[#f5bb00]" /> Volunteer Rota</h1>
                    <p className="text-gray-500 mt-1 text-sm">Who serves which Sunday — ushers, kids check-in, AV, hospitality. Assigned volunteers with an email get an automatic heads-up.</p>
                </div>
                <button onClick={() => setShowAssign(true)} disabled={teams.length === 0}
                    className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl text-sm disabled:opacity-40"
                    title={teams.length === 0 ? 'Create a team first' : undefined}>
                    <Plus className="w-4 h-4" /> Assign volunteer
                </button>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {/* Teams strip */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Teams</p>
                    <button onClick={() => setShowTeamForm(v => !v)} className="text-xs underline text-[#140152]">{showTeamForm ? 'Close' : '+ New team'}</button>
                </div>
                {showTeamForm && (
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                        <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name (Ushering, Kids Check-in, AV…)" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <input value={teamDesc} onChange={e => setTeamDesc(e.target.value)} placeholder="Description (optional)" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <button onClick={addTeam} className="inline-flex items-center gap-1.5 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold px-4 py-2 rounded-lg text-sm"><Save className="w-3.5 h-3.5" /> Add</button>
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                    {teams.length === 0 && <p className="text-xs text-gray-400">No teams yet — add Ushering, Kids Check-in, AV, Hospitality…</p>}
                    {teams.map(t => (
                        <span key={t.id} className="inline-flex items-center gap-2 bg-[#140152]/5 border border-[#140152]/10 rounded-full px-3 py-1.5 text-xs font-bold text-[#140152]">
                            {t.name}
                            <button onClick={async () => {
                                if (!confirm(`Delete team "${t.name}" and all its assignments?`)) return
                                try { await rotaApi.deleteTeam(t.id); refresh() }
                                catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
                            }} className="text-red-400 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Rota list */}
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : (
                <div className="space-y-4">
                    {byDate.length === 0 && <p className="text-center text-gray-400 py-8">No assignments in the window. Click &quot;Assign volunteer&quot; to build this Sunday&apos;s rota.</p>}
                    {byDate.map(([dateStr, rows]) => (
                        <div key={dateStr} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 bg-gray-50/60 border-b border-gray-100 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#f5bb00]" />
                                <p className="font-black text-sm text-[#140152]">
                                    {new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <span className="text-xs text-gray-400">· {rows.length} serving</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {rows.map(a => (
                                    <div key={a.id} className="px-4 py-2.5 flex items-center gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest bg-[#f5bb00]/15 text-[#8a6d00] px-2 py-0.5 rounded-full shrink-0">{teamName_(a.team_id)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#140152] truncate">{a.member_name}{a.role_note ? <span className="font-normal text-gray-500"> · {a.role_note}</span> : null}</p>
                                            {a.member_email && <p className="text-[11px] text-gray-400 inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {a.member_email}</p>}
                                        </div>
                                        <select value={a.status} onChange={async e => {
                                            try { await rotaApi.updateAssignment(a.id, { status: e.target.value as RotaAssignment['status'] }); refresh() }
                                            catch (err) { setMsg({ kind: 'err', text: (err as Error).message }) }
                                        }} className={`text-xs font-bold rounded-lg px-2 py-1 border ${
                                            a.status === 'confirmed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                            a.status === 'declined' ? 'border-red-200 bg-red-50 text-red-700' :
                                            'border-amber-200 bg-amber-50 text-amber-700'
                                        }`}>
                                            <option value="assigned">Assigned</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="declined">Declined</option>
                                        </select>
                                        <button onClick={async () => {
                                            if (!confirm(`Remove ${a.member_name} from this rota?`)) return
                                            try { await rotaApi.deleteAssignment(a.id); refresh() }
                                            catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
                                        }} className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAssign && (
                <AssignModal teams={teams} onClose={() => setShowAssign(false)}
                    onSaved={() => { setShowAssign(false); setMsg({ kind: 'ok', text: 'Volunteer assigned — notification email sent if an address was given.' }); refresh() }}
                    onErr={t => setMsg({ kind: 'err', text: t })} />
            )}
        </div>
    )
}

function AssignModal({ teams, onClose, onSaved, onErr }: {
    teams: RotaTeam[]; onClose: () => void; onSaved: () => void; onErr: (t: string) => void
}) {
    const nextSunday = (() => {
        const d = new Date()
        d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
        return d.toISOString().slice(0, 10)
    })()
    const [teamId, setTeamId] = useState(teams[0]?.id || '')
    const [date, setDate] = useState(nextSunday)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')
    const [saving, setSaving] = useState(false)

    const save = async () => {
        if (!teamId || !date || !name.trim()) return
        setSaving(true)
        try {
            await rotaApi.assign({ team_id: teamId, service_date: date, member_name: name.trim(), member_email: email || undefined, role_note: role || undefined })
            onSaved()
        } catch (e) { onErr((e as Error).message) }
        finally { setSaving(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-[#140152]">Assign volunteer</h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Team</label>
                        <select value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Service date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Volunteer name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (they'll get a notification)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role note (Lead usher, Camera 2…)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                    <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                    <button onClick={save} disabled={saving || !name.trim()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Assign
                    </button>
                </div>
            </div>
        </div>
    )
}

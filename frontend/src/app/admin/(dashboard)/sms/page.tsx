'use client'
/**
 * /admin/sms — register + activate an SMS provider (Termii, Twilio, Africa's
 * Talking, or a custom HTTP gateway) and send a test. SMS stays off until a
 * provider is added and marked active.
 */
import { useEffect, useState } from 'react'
import { Loader2, MessageSquare, Plus, Save, Trash2, CheckCircle, AlertCircle, Send, Power } from 'lucide-react'
import { smsApi, type SmsProvider } from '@/lib/api'

type Draft = Omit<SmsProvider, 'id' | 'created_at'>

const PROVIDERS: { key: SmsProvider['provider']; label: string; blurb: string; fields: string[] }[] = [
    { key: 'termii', label: 'Termii', blurb: 'Nigeria-focused. Needs an API key and an approved Sender ID.', fields: ['api_key', 'sender_id'] },
    { key: 'twilio', label: 'Twilio', blurb: 'Global. API key = Account SID, Secret = Auth Token, Sender = your Twilio number.', fields: ['api_key', 'api_secret', 'sender_id'] },
    { key: 'africastalking', label: "Africa's Talking", blurb: 'Pan-African. API key + Username (as Secret). Sender ID optional.', fields: ['api_key', 'api_secret', 'sender_id'] },
    { key: 'custom', label: 'Custom HTTP', blurb: 'Any gateway. Set the endpoint URL and params using {to} {message} {sender} {key}.', fields: ['api_key', 'sender_id', 'base_url'] },
]

const blank = (provider: SmsProvider['provider'] = 'termii'): Draft => ({
    provider, name: PROVIDERS.find(p => p.key === provider)?.label || 'SMS',
    api_key: '', api_secret: '', sender_id: '', base_url: '', config: {}, is_active: true,
})

export default function AdminSmsPage() {
    const [rows, setRows] = useState<SmsProvider[]>([])
    const [status, setStatus] = useState<{ configured: boolean; provider: string | null; sender_id: string | null } | null>(null)
    const [editing, setEditing] = useState<Draft | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [testTo, setTestTo] = useState('')
    const [testing, setTesting] = useState(false)

    const refresh = async () => {
        setLoading(true)
        try {
            const [l, s] = await Promise.all([smsApi.list(), smsApi.status()])
            setRows(l); setStatus(s)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { refresh() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        if (!editing) return
        setSaving(true)
        try {
            if (editingId) await smsApi.update(editingId, editing)
            else await smsApi.create(editing)
            setEditing(null); setEditingId(null)
            setMsg({ kind: 'ok', text: 'Saved.' })
            refresh()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    const activate = async (p: SmsProvider) => {
        try { await smsApi.update(p.id, { ...p, is_active: true }); setMsg({ kind: 'ok', text: `${p.name} is now active.` }); refresh() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const remove = async (p: SmsProvider) => {
        if (!confirm(`Delete ${p.name}?`)) return
        try { await smsApi.remove(p.id); setMsg({ kind: 'ok', text: 'Deleted.' }); refresh() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const sendTest = async () => {
        if (!testTo.trim()) return
        setTesting(true)
        try {
            const r = await smsApi.test(testTo.trim())
            setMsg({ kind: r.sent ? 'ok' : 'err', text: r.sent ? `Test sent — ${r.detail}. Check the phone.` : `Not sent: ${r.detail}` })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setTesting(false) }
    }

    const meta = editing ? PROVIDERS.find(p => p.key === editing.provider) : null

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-32">
            <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-1"><MessageSquare className="w-7 h-7 text-[#f5bb00]" /> SMS Notifications</h1>
            <p className="text-gray-500 text-sm mb-4">Add your SMS gateway, activate it, and send a test. SMS stays off until a provider is active.</p>

            {status && (
                <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-sm ${status.configured ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    {status.configured ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {status.configured ? `SMS is ON — sending via ${status.provider}${status.sender_id ? ` (from ${status.sender_id})` : ''}.` : 'SMS is OFF — add and activate a provider below.'}
                </div>
            )}
            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span>{msg.text}</span>
                </div>
            )}

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : (
                <div className="space-y-4">
                    {/* Editor */}
                    {editing ? (
                        <div className="bg-white border border-[#140152] rounded-2xl shadow-md p-5 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                {PROVIDERS.map(p => (
                                    <button key={p.key} onClick={() => setEditing({ ...editing, provider: p.key, name: p.label })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${editing.provider === p.key ? 'bg-[#140152] text-white border-[#140152]' : 'border-gray-200 text-gray-600 hover:border-[#140152]'}`}>{p.label}</button>
                                ))}
                            </div>
                            {meta && <p className="text-xs text-gray-500">{meta.blurb}</p>}

                            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Label (e.g. Church SMS)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />

                            {meta?.fields.includes('api_key') && (
                                <input value={editing.api_key || ''} onChange={e => setEditing({ ...editing, api_key: e.target.value })}
                                    placeholder={editing.provider === 'twilio' ? 'Account SID' : 'API key'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                            )}
                            {meta?.fields.includes('api_secret') && (
                                <input value={editing.api_secret || ''} onChange={e => setEditing({ ...editing, api_secret: e.target.value })}
                                    placeholder={editing.provider === 'twilio' ? 'Auth Token' : editing.provider === 'africastalking' ? 'Username' : 'API secret'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                            )}
                            {meta?.fields.includes('sender_id') && (
                                <input value={editing.sender_id || ''} onChange={e => setEditing({ ...editing, sender_id: e.target.value })}
                                    placeholder={editing.provider === 'twilio' ? 'From number (+234…)' : 'Sender ID (e.g. LETW)'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                            )}
                            {meta?.fields.includes('base_url') && (
                                <input value={editing.base_url || ''} onChange={e => setEditing({ ...editing, base_url: e.target.value })}
                                    placeholder="Gateway URL, e.g. https://api.gateway.com/send?to={to}&text={message}&key={key}" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                            )}

                            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> Activate this provider (turns SMS on)</label>

                            <div className="flex items-center gap-3 pt-1">
                                <button onClick={() => { setEditing(null); setEditingId(null) }} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                                <div className="flex-1" />
                                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save provider
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => { setEditing(blank()); setEditingId(null) }} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-xl text-sm">
                            <Plus className="w-4 h-4" /> Add SMS provider
                        </button>
                    )}

                    {/* Provider list */}
                    <div className="space-y-2">
                        {rows.length === 0 && !editing && <p className="text-sm text-gray-400 py-4">No SMS provider yet. Add one to switch SMS on.</p>}
                        {rows.map(p => (
                            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#140152] flex items-center gap-2">
                                        {p.name}
                                        {p.is_active
                                            ? <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                                            : <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Off</span>}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{p.provider}{p.sender_id ? ` · from ${p.sender_id}` : ''}{p.api_key ? ` · key ${p.api_key}` : ''}</p>
                                </div>
                                {!p.is_active && <button onClick={() => activate(p)} className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg"><Power className="w-3 h-3" /> Activate</button>}
                                <button onClick={() => { setEditing({ provider: p.provider, name: p.name, api_key: p.api_key || '', api_secret: p.api_secret || '', sender_id: p.sender_id || '', base_url: p.base_url || '', config: p.config || {}, is_active: p.is_active }); setEditingId(p.id) }} className="text-xs font-bold text-[#140152] underline">Edit</button>
                                <button onClick={() => remove(p)} className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>

                    {/* Test send */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mt-2">
                        <h2 className="font-black text-[#140152] mb-3 inline-flex items-center gap-2"><Send className="w-4 h-4 text-[#f5bb00]" /> Send a test SMS</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="Phone e.g. 0803… or +234803…" className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                            <button onClick={sendTest} disabled={testing || !testTo.trim()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50">
                                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send test
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">Uses the active provider. Nigerian 0-numbers are auto-converted to +234.</p>
                    </div>

                    <Broadcast active={!!status?.configured} onMsg={setMsg} />
                </div>
            )}
        </div>
    )
}

function Broadcast({ active, onMsg }: { active: boolean; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const [audience, setAudience] = useState<'all' | 'active'>('all')
    const [count, setCount] = useState<number | null>(null)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => { smsApi.audience(audience).then(r => setCount(r.count)).catch(() => setCount(null)) }, [audience])

    const send = async () => {
        if (!message.trim()) return
        if (!confirm(`Send this SMS to ${count ?? 'all'} member${count === 1 ? '' : 's'} with a phone number?`)) return
        setSending(true)
        try {
            const r = await smsApi.broadcast(message.trim(), audience)
            onMsg({ kind: r.failed === 0 ? 'ok' : 'err', text: `Broadcast: ${r.sent}/${r.recipients} sent${r.failed ? `, ${r.failed} failed` : ''}.` })
            if (r.failed === 0) setMessage('')
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSending(false) }
    }

    const chars = message.length
    const segments = Math.max(1, Math.ceil(chars / 160))

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mt-2">
            <h2 className="font-black text-[#140152] mb-1 inline-flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#f5bb00]" /> Broadcast to members</h2>
            <p className="text-xs text-gray-500 mb-3">Text every member who has a phone number on file.</p>
            {!active && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">Activate an SMS provider above before broadcasting.</p>}

            <div className="flex items-center gap-2 mb-3">
                {(['all', 'active'] as const).map(a => (
                    <button key={a} onClick={() => setAudience(a)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${audience === a ? 'bg-[#140152] text-white border-[#140152]' : 'border-gray-200 text-gray-600 hover:border-[#140152]'}`}>
                        {a === 'all' ? 'All members' : 'Active only'}
                    </button>
                ))}
                <span className="text-xs text-gray-500">{count === null ? '…' : `${count} recipient${count === 1 ? '' : 's'}`}</span>
            </div>

            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Your message… e.g. Reminder: Sunday service starts 9am. God bless you!" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y" />
            <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-gray-400">{chars} chars · ~{segments} SMS{segments > 1 ? ' segments' : ''} each</p>
                <button onClick={send} disabled={sending || !active || !message.trim() || !count} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-lg text-sm disabled:opacity-50">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send broadcast
                </button>
            </div>
        </div>
    )
}

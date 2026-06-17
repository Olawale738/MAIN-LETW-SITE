'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2, AlertCircle, CheckCircle, CreditCard, ExternalLink, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { paymentsApi, type PaymentProvider } from '@/lib/api'

const SLUGS = [
    { value: 'paystack', label: 'Paystack', help: 'Set secret_key. Webhook: POST /api/payments/webhook/paystack' },
    { value: 'flutterwave', label: 'Flutterwave', help: 'Set secret_key + webhook_secret (Verif-Hash header). Webhook: POST /api/payments/webhook/flutterwave' },
    { value: 'stripe', label: 'Stripe', help: 'Set secret_key (sk_...). Webhook: POST /api/payments/webhook/stripe' },
    { value: 'manual', label: 'Manual / Bank Transfer', help: 'Put instructions in config.instructions_md (markdown). No API calls.' },
    { value: 'custom', label: 'Custom (any other provider)', help: 'Put config.checkout_url_template with {amount}, {ref}, {currency}, {email}, {name}.' },
]

export default function AdminPaymentsPage() {
    const [providers, setProviders] = useState<PaymentProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)
    const [editing, setEditing] = useState<PaymentProvider | null>(null)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setProviders(await paymentsApi.listProviders()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async (p: PaymentProvider) => {
        try {
            const body = {
                slug: p.slug, name: p.name, mode: p.mode,
                public_key: p.public_key, secret_key: p.secret_key, webhook_secret: p.webhook_secret,
                currency: p.currency, config: p.config, description: p.description,
                is_active: p.is_active ?? true, sort_order: p.sort_order,
            }
            if (p.id) await paymentsApi.updateProvider(p.id, body)
            else await paymentsApi.createProvider(body)
            setMsg({ kind: 'ok', text: 'Provider saved.' })
            setEditing(null); setShowNew(false); await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const remove = async (id: string) => {
        if (!confirm('Delete this provider? Existing donation records keep the reference but lose the link.')) return
        try { await paymentsApi.deleteProvider(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><CreditCard className="w-7 h-7" /> Payment Providers</h1>
                    <p className="text-gray-500 mt-1 text-sm">Plug in any payment API. Native: Paystack, Flutterwave, Stripe. Custom: paste a checkout URL template with placeholders.</p>
                </div>
                <Link href="/admin/donations" className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm">View donations <ExternalLink className="w-3.5 h-3.5" /></Link>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="flex justify-end mb-4">
                <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm"><Plus className="w-4 h-4" /> Add Provider</button>
            </div>

            {(showNew || editing) && (
                <ProviderForm
                    provider={editing || { id: '', slug: 'paystack', name: '', mode: 'test', public_key: '', secret_key: '', webhook_secret: '', currency: 'NGN', config: {}, description: '', is_active: true, sort_order: 0 }}
                    onSave={save}
                    onCancel={() => { setEditing(null); setShowNew(false) }}
                />
            )}

            <div className="space-y-3 mt-5">
                {providers.length === 0 && <p className="text-center text-gray-400 py-12">No payment providers configured. Add one to enable giving.</p>}
                {providers.map(p => (
                    <div key={p.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center flex-shrink-0"><CreditCard className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152]">{p.name} <span className="text-xs text-gray-400 font-normal">· {p.slug} · {p.currency}</span></p>
                            <p className="text-xs text-gray-400 mt-0.5">mode: {p.mode} · secret: {p.secret_key || '(none)'}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>{p.is_active ? 'Active' : 'Disabled'}</span>
                        <button onClick={() => setEditing(p)} className="text-sm font-bold text-[#140152] hover:underline">Edit</button>
                        <button onClick={() => remove(p.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ProviderForm({ provider, onSave, onCancel }: { provider: PaymentProvider; onSave: (p: PaymentProvider) => void; onCancel: () => void }) {
    const [p, setP] = useState<PaymentProvider>({ ...provider, config: provider.config || {} })
    const [showSecrets, setShowSecrets] = useState(false)
    const help = SLUGS.find(s => s.value === p.slug)?.help

    const setCfg = (k: string, v: any) => setP({ ...p, config: { ...(p.config || {}), [k]: v } })

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Provider Type</label>
                    <select value={p.slug} onChange={e => setP({ ...p, slug: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        {SLUGS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Display Name</label>
                    <input value={p.name} onChange={e => setP({ ...p, name: e.target.value })} placeholder="Pay with Paystack" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Mode</label>
                    <select value={p.mode} onChange={e => setP({ ...p, mode: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <option value="test">test</option><option value="live">live</option>
                    </select>
                </div>
            </div>
            {help && <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2 mb-3">{help}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Currency</label>
                    <input value={p.currency} onChange={e => setP({ ...p, currency: e.target.value.toUpperCase() })} placeholder="NGN" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Public Key</label>
                    <input value={p.public_key || ''} onChange={e => setP({ ...p, public_key: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
                </div>
            </div>

            <div className="flex justify-end mb-2">
                <button onClick={() => setShowSecrets(!showSecrets)} className="text-xs font-bold text-[#140152] inline-flex items-center gap-1 hover:underline">
                    {showSecrets ? <><EyeOff className="w-3 h-3" /> Hide secrets</> : <><Eye className="w-3 h-3" /> Edit secrets</>}
                </button>
            </div>
            {showSecrets && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Secret Key</label>
                        <input type="password" value={p.secret_key || ''} onChange={e => setP({ ...p, secret_key: e.target.value })} placeholder={p.secret_key?.includes('•') ? 'unchanged' : 'sk_...'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
                        <p className="text-[10px] text-gray-400 mt-1">Leave masked value to keep current key.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Webhook Secret</label>
                        <input type="password" value={p.webhook_secret || ''} onChange={e => setP({ ...p, webhook_secret: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
                    </div>
                </div>
            )}

            {p.slug === 'manual' && (
                <div className="mb-3">
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Instructions (Markdown)</label>
                    <textarea value={p.config?.instructions_md || ''} onChange={e => setCfg('instructions_md', e.target.value)} rows={4} placeholder="Bank: GTBank&#10;Account: 0123456789&#10;Name: LETW Ministries&#10;After paying, please email proof to giving@letw.org." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
                </div>
            )}

            {p.slug === 'custom' && (
                <div className="mb-3">
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Checkout URL Template</label>
                    <input value={p.config?.checkout_url_template || ''} onChange={e => setCfg('checkout_url_template', e.target.value)} placeholder="https://pay.example.com/checkout?amount={amount}&ref={ref}&email={email}" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-xs" />
                    <p className="text-[10px] text-gray-400 mt-1">Placeholders: {`{amount} {ref} {currency} {email} {name}`}</p>
                </div>
            )}

            <div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Redirect After (URL)</label>
                <input value={p.config?.redirect_after || ''} onChange={e => setCfg('redirect_after', e.target.value)} placeholder="https://letw.org/giving/thank-you" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!p.is_active} onChange={e => setP({ ...p, is_active: e.target.checked })} /> Active
                </label>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                    <button onClick={() => onSave(p)} disabled={!p.name.trim()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
                </div>
            </div>
        </div>
    )
}

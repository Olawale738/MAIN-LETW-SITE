'use client'
import { useEffect, useState } from 'react'
import { Loader2, Heart, CreditCard, AlertCircle, CheckCircle, Wallet } from 'lucide-react'
import { paymentsApi, type PaymentProvider } from '@/lib/api'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

const FUNDS = ['General', 'Tithe', 'Missions', 'Building', 'Youth', 'Charity']
const PRESETS = [1000, 5000, 10000, 25000, 50000, 100000]

export default function GivePage() {
    const [providers, setProviders] = useState<PaymentProvider[]>([])
    const [providerId, setProviderId] = useState('')
    const [amount, setAmount] = useState<number>(5000)
    const [fund, setFund] = useState('General')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [manualInstructions, setManualInstructions] = useState<string | null>(null)

    useEffect(() => {
        paymentsApi.publicProviders()
            .then((p) => { setProviders(p); if (p[0]) setProviderId(p[0].id) })
            .catch(e => setErr((e as Error).message))
            .finally(() => setLoading(false))
    }, [])

    const selected = providers.find(p => p.id === providerId)
    const currency = selected?.currency || 'NGN'

    const give = async () => {
        if (!providerId || amount <= 0) return
        setSubmitting(true); setErr(null); setManualInstructions(null)
        try {
            const r = await paymentsApi.checkout({
                provider_id: providerId, amount, currency, fund,
                payer_name: name || 'Anonymous',
                payer_email: email || undefined,
                message: message || undefined,
            })
            if (r.checkout_url) {
                window.location.href = r.checkout_url
            } else if (r.instructions_md) {
                setManualInstructions(r.instructions_md + `\n\n_Reference: ${r.reference}_`)
            }
        } catch (e) { setErr((e as Error).message) }
        finally { setSubmitting(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#140152] via-[#1a0270] to-[#140152] text-white">
            <PageCmsOverlay slug="give" position="top" />
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3">Sow into Eternity</p>
                <h1 className="text-4xl md:text-5xl font-black leading-tight">Give cheerfully. Sow generously.</h1>
                <p className="text-white/70 mt-4 text-lg max-w-xl mx-auto">"God loves a cheerful giver." — 2 Corinthians 9:7</p>
            </section>

            <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
                {providers.length === 0 && (
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                        <Wallet className="w-12 h-12 mx-auto text-[#f5bb00] mb-3" />
                        <p className="text-white/80">Giving channels are being set up.</p>
                        <p className="text-white/50 text-sm mt-2">Please check back soon, or contact the church office.</p>
                    </div>
                )}

                {providers.length > 0 && (
                    <div className="bg-white text-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                        {err && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{err}</span></div>}

                        {manualInstructions ? (
                            <div className="text-center">
                                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                                <h3 className="text-xl font-black text-[#140152] mb-2">Payment Instructions</h3>
                                <pre className="text-left bg-gray-50 rounded-xl p-4 text-sm whitespace-pre-wrap font-sans">{manualInstructions}</pre>
                                <button onClick={() => setManualInstructions(null)} className="mt-4 text-sm text-[#140152] font-bold hover:underline">Give again</button>
                            </div>
                        ) : (
                            <>
                                <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Payment method</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                                    {providers.map(p => (
                                        <button key={p.id} onClick={() => setProviderId(p.id)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left ${providerId === p.id ? 'border-[#140152] bg-[#140152]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <CreditCard className={`w-5 h-5 ${providerId === p.id ? 'text-[#140152]' : 'text-gray-400'}`} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-[#140152] truncate">{p.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase">{p.currency} · {p.slug}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Fund</label>
                                <select value={fund} onChange={e => setFund(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-5">
                                    {FUNDS.map(f => <option key={f}>{f}</option>)}
                                </select>

                                <label className="text-xs font-bold uppercase text-gray-500 block mb-2">Amount ({currency})</label>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    {PRESETS.map(v => (
                                        <button key={v} onClick={() => setAmount(v)} className={`py-2 rounded-lg text-sm font-bold ${amount === v ? 'bg-[#140152] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                                            {v.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                                <input type="number" min={100} value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-center mb-5" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" type="email" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                                </div>

                                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Optional message or prayer request…" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-5" />

                                <button onClick={give} disabled={submitting || !providerId || amount <= 0}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#140152] to-[#1a0270] hover:from-[#1d0175] hover:to-[#220290] text-white font-black px-6 py-4 rounded-xl text-lg shadow-lg disabled:opacity-50">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
                                    Give {currency} {amount.toLocaleString()}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </section>
            <PageCmsOverlay slug="give" position="bottom" />
        </main>
    )
}

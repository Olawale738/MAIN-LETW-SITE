'use client'
/**
 * /sanctuary/pay/[id] — standalone payment page for a hall booking, linked
 * from the confirmation email. Shows the fee (only the booker reaches this),
 * lets them pick a provider, and redirects to the provider's checkout. The
 * payment webhook then marks the booking paid and alerts admins.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import { sanctuaryApi, paymentsApi, type PaymentProvider } from '@/lib/api'

export default function BookingPayPage() {
    const { id } = useParams() as { id: string }
    const [status, setStatus] = useState<{ payment_status: string; amount: number; currency: string } | null>(null)
    const [providers, setProviders] = useState<PaymentProvider[]>([])
    const [providerId, setProviderId] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        sanctuaryApi.bookingPaymentStatus(id)
            .then(s => {
                setStatus(s)
                if (s.payment_status !== 'paid' && s.amount > 0) {
                    paymentsApi.publicProviders().then(ps => {
                        const usable = ps.filter(p => p.slug !== 'manual')
                        setProviders(usable)
                        if (usable[0]) setProviderId(usable[0].id)
                    }).catch(() => {})
                }
            })
            .catch((e: Error) => setErr(e.message))
            .finally(() => setLoading(false))
    }, [id])

    const pay = async () => {
        if (!status || !providerId) return
        setPaying(true); setErr(null)
        try {
            const r = await paymentsApi.checkout({
                provider_id: providerId, amount: status.amount, currency: status.currency,
                fund: 'Hall booking', payer_name: 'Hall booking', payer_email: email || undefined,
            })
            if (r.reference) await sanctuaryApi.attachPayment(id, r.reference).catch(() => {})
            if (r.checkout_url) { window.location.href = r.checkout_url; return }
            setErr('The payment provider did not return a checkout link. Please try another method.')
        } catch (e) { setErr((e as Error).message) }
        finally { setPaying(false) }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-[#140152] text-white p-6 text-center">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-[#f5bb00]" />
                    <h1 className="text-xl font-black">Hall booking payment</h1>
                </div>
                <div className="p-6">
                    {err && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5" />{err}</div>}

                    {status?.payment_status === 'paid' ? (
                        <div className="text-center py-6">
                            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                            <p className="font-black text-[#140152] text-lg">Payment received</p>
                            <p className="text-gray-500 text-sm mt-1">Thank you — nothing more to do.</p>
                        </div>
                    ) : status?.payment_status === 'waived' ? (
                        <div className="text-center py-6">
                            <CheckCircle2 className="w-14 h-14 text-blue-500 mx-auto mb-3" />
                            <p className="font-black text-[#140152] text-lg">Fee waived</p>
                            <p className="text-gray-500 text-sm mt-1">No payment is required for this booking.</p>
                        </div>
                    ) : !status || status.amount <= 0 ? (
                        <p className="text-center text-gray-500 py-6">No payment is required for this booking.</p>
                    ) : (
                        <>
                            <p className="text-center text-gray-500 text-sm">Amount due</p>
                            <p className="text-center text-3xl font-black text-[#140152] mb-5">{status.currency} {status.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>

                            {providers.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center">Online payment isn&apos;t available right now — the office will share payment details.</p>
                            ) : (
                                <>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email for your receipt (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3" />
                                    {providers.length > 1 && (
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {providers.map(p => (
                                                <button key={p.id} onClick={() => setProviderId(p.id)} className={`px-3 py-2 rounded-lg text-xs font-bold border ${providerId === p.id ? 'bg-[#140152] text-white border-[#140152]' : 'border-gray-200 text-gray-600 hover:border-[#140152]'}`}>{p.name}</button>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={pay} disabled={paying || !providerId} className="w-full inline-flex items-center justify-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-3 rounded-full text-sm disabled:opacity-60">
                                        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Pay now
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    <div className="text-center mt-6">
                        <Link href="/sanctuary" className="text-xs text-gray-400 hover:text-[#140152]">← Back to bookings</Link>
                    </div>
                </div>
            </div>
        </main>
    )
}

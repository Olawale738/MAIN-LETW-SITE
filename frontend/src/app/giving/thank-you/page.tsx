'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, Clock, XCircle, Heart, ArrowRight, HandHeart } from 'lucide-react'
import { paymentsApi } from '@/lib/api'

type Donation = Awaited<ReturnType<typeof paymentsApi.lookupByReference>>

export default function ThankYouPage() {
    return (
        <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></main>}>
            <ThankYouInner />
        </Suspense>
    )
}

function ThankYouInner() {
    const params = useSearchParams()
    // Different providers return the reference under different keys:
    //   Paystack:    ?reference=LETW-xyz&trxref=LETW-xyz
    //   Flutterwave: ?tx_ref=LETW-xyz&status=successful
    //   Stripe:      ?ref=LETW-xyz  (we set client_reference_id)
    //   Custom:      ?reference=LETW-xyz (recommended)
    const reference = (
        params.get('reference') || params.get('trxref') ||
        params.get('tx_ref') || params.get('ref') || ''
    ).trim()

    const [donation, setDonation] = useState<Donation | null>(null)
    const [loading, setLoading] = useState(!!reference)
    const [polling, setPolling] = useState(false)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!reference) { setLoading(false); return }
        let cancelled = false
        let polls = 0
        const tick = async () => {
            try {
                const d = await paymentsApi.lookupByReference(reference)
                if (cancelled) return
                setDonation(d)
                setLoading(false)
                if (d.status === 'pending' && polls < 12) {
                    setPolling(true)
                    polls += 1
                    setTimeout(tick, 3000)
                } else {
                    setPolling(false)
                }
            } catch {
                if (cancelled) return
                setNotFound(true); setLoading(false); setPolling(false)
            }
        }
        tick()
        return () => { cancelled = true }
    }, [reference])

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#140152] via-[#1a0270] to-[#140152] text-white flex items-center justify-center p-6">
            <div className="bg-white text-gray-800 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-lg w-full text-center">
                {!reference ? (
                    // No reference param — generic thank you (e.g. arrived directly)
                    <>
                        <div className="w-20 h-20 mx-auto rounded-full bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center mb-5"><Heart className="w-10 h-10" /></div>
                        <h1 className="text-3xl font-black text-[#140152]">Thank you for giving.</h1>
                        <p className="text-gray-600 mt-3 leading-relaxed">"God loves a cheerful giver." — 2 Corinthians 9:7</p>
                        <p className="text-gray-500 text-sm mt-4">Your generosity helps spread the Gospel and serve those in need.</p>
                        <Actions />
                    </>
                ) : loading ? (
                    <>
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#140152] mb-4" />
                        <p className="text-gray-600">Confirming your payment…</p>
                        <p className="text-xs text-gray-400 mt-2 font-mono">{reference}</p>
                    </>
                ) : notFound ? (
                    <>
                        <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-5"><Clock className="w-10 h-10" /></div>
                        <h1 className="text-2xl font-black text-[#140152]">Receipt pending</h1>
                        <p className="text-gray-600 mt-3">Your payment is being processed. If it succeeded with your bank, the record will appear here shortly.</p>
                        <p className="text-xs text-gray-400 mt-3 font-mono">Reference: {reference}</p>
                        <Actions />
                    </>
                ) : donation && donation.status === 'success' ? (
                    <>
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-5"><CheckCircle2 className="w-12 h-12" /></div>
                        <h1 className="text-3xl font-black text-[#140152]">Thank you, {donation.payer_name}!</h1>
                        <p className="text-gray-600 mt-3 leading-relaxed">Your gift of <strong>{donation.currency} {donation.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> to the <strong>{donation.fund}</strong> fund has been received.</p>
                        <p className="text-gray-500 text-sm mt-4">"Every man according as he purposeth in his heart, so let him give." — 2 Corinthians 9:7</p>
                        <p className="text-xs text-gray-400 mt-4 font-mono">Reference: {donation.reference}</p>
                        <Actions />
                    </>
                ) : donation && donation.status === 'pending' ? (
                    <>
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#f5bb00] mb-4" />
                        <h1 className="text-2xl font-black text-[#140152]">Almost there…</h1>
                        <p className="text-gray-600 mt-3">Waiting for your bank to confirm. This usually takes a few seconds.</p>
                        {polling && <p className="text-xs text-gray-400 mt-2">Auto-refreshing every 3 seconds.</p>}
                        <p className="text-xs text-gray-400 mt-3 font-mono">Reference: {donation.reference}</p>
                        <p className="text-xs text-gray-500 mt-4">If this page sits here past a minute, your payment may still complete in the background. You can leave; we'll email a receipt.</p>
                        <Actions />
                    </>
                ) : donation && donation.status === 'failed' ? (
                    <>
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-5"><XCircle className="w-10 h-10" /></div>
                        <h1 className="text-2xl font-black text-[#140152]">Payment didn't go through.</h1>
                        <p className="text-gray-600 mt-3">Your card was not charged. Please try again or use a different method.</p>
                        <p className="text-xs text-gray-400 mt-3 font-mono">Reference: {donation.reference}</p>
                        <div className="mt-6 flex gap-3 justify-center">
                            <Link href="/give" className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm">Try again <ArrowRight className="w-4 h-4" /></Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 mx-auto rounded-full bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center mb-5"><Heart className="w-10 h-10" /></div>
                        <h1 className="text-2xl font-black text-[#140152]">Thank you.</h1>
                        <p className="text-gray-600 mt-3">Your gift is being processed.</p>
                        <p className="text-xs text-gray-400 mt-3 font-mono">{reference}</p>
                        <Actions />
                    </>
                )}
            </div>
        </main>
    )
}

function Actions() {
    return (
        <div className="mt-7 flex flex-wrap gap-2 justify-center">
            <Link href="/" className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-lg text-sm">Back home</Link>
            <Link href="/give" className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2 rounded-lg text-sm"><HandHeart className="w-4 h-4" /> Give again</Link>
            <Link href="/prayer-request" className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2 rounded-lg text-sm">Submit a prayer request</Link>
        </div>
    )
}

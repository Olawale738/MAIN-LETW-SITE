'use client'
/**
 * /admin/donations/statement?year=YYYY&email=…  (or &name=…)
 *
 * A printable year-end giving statement / tax receipt for one donor. Admin
 * opens it from the Donations page; Print / Save-as-PDF produces the document
 * to hand or email to the donor. Everything but the statement itself is hidden
 * when printing (same visibility trick as the marriage-prep certificate).
 */
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Printer, AlertCircle, HandHeart } from 'lucide-react'
import { paymentsApi } from '@/lib/api'

function money(n: number) { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }

function StatementInner() {
    const sp = useSearchParams()
    const year = Number(sp.get('year')) || new Date().getFullYear() - 1
    const email = sp.get('email') || ''
    const name = sp.get('name') || ''

    const [data, setData] = useState<Awaited<ReturnType<typeof paymentsApi.givingStatement>> | null>(null)
    const [err, setErr] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        paymentsApi.givingStatement(year, { email: email || undefined, name: name || undefined })
            .then(setData)
            .catch((e: Error) => setErr(e.message))
            .finally(() => setLoading(false))
    }, [year, email, name])

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
    if (err || !data) return (
        <div className="max-w-lg mx-auto mt-20 bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
            <p className="text-gray-600">{err || 'No statement found.'}</p>
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
            <div className="text-center mb-4 print:hidden">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-full text-sm">
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
            </div>

            <div id="stmt-print" className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-sm print:shadow-none print:border-0">
                <div className="flex items-start justify-between border-b-2 border-[#140152] pb-4 mb-6">
                    <div>
                        <p className="inline-flex items-center gap-2 text-[#f5bb00] font-black text-xs uppercase tracking-widest"><HandHeart className="w-4 h-4" /> Light Encounter Tabernacle Worldwide</p>
                        <h1 className="text-2xl font-black text-[#140152] mt-1">Annual Giving Statement</h1>
                        <p className="text-sm text-gray-500">For the year {data.year}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                        <p>letw.org</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Donor</p>
                        <p className="font-bold text-[#140152]">{data.donor_name}</p>
                        {data.donor_email && <p className="text-gray-500">{data.donor_email}</p>}
                    </div>
                    <div className="sm:text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Gifts recorded</p>
                        <p className="font-bold text-[#140152]">{data.count}</p>
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-[#fbf5e6] border border-[#f5bb00]/40 rounded-xl p-4 mb-6">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#b8860b] mb-2">Total contributions {data.year}</p>
                    <div className="flex flex-wrap gap-x-8 gap-y-1">
                        {data.totals.map(t => (
                            <p key={t.currency} className="text-2xl font-black text-[#140152]">{t.currency} {money(t.amount)}</p>
                        ))}
                    </div>
                </div>

                {/* By fund */}
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">By fund</p>
                <table className="w-full text-sm mb-6">
                    <tbody className="divide-y divide-gray-100">
                        {data.by_fund.map((f, i) => (
                            <tr key={i}>
                                <td className="py-1.5 text-gray-700">{f.fund}</td>
                                <td className="py-1.5 text-right font-bold text-[#140152]">{f.currency} {money(f.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Line items */}
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">All gifts</p>
                <table className="w-full text-xs">
                    <thead className="text-left text-gray-400 border-b border-gray-200">
                        <tr><th className="py-1.5">Date</th><th className="py-1.5">Fund</th><th className="py-1.5">Reference</th><th className="py-1.5 text-right">Amount</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.items.map((it, i) => (
                            <tr key={i}>
                                <td className="py-1.5 text-gray-600">{fmtDate(it.date)}</td>
                                <td className="py-1.5 text-gray-600">{it.fund}{it.recurring ? ' (recurring)' : ''}</td>
                                <td className="py-1.5 text-gray-400 font-mono">{it.reference}</td>
                                <td className="py-1.5 text-right font-bold text-[#140152]">{it.currency} {money(it.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <p className="text-[10px] text-gray-400 mt-8 leading-relaxed border-t border-gray-100 pt-4">
                    This statement summarises contributions received and recorded by Light Encounter Tabernacle Worldwide during {data.year}.
                    No goods or services were provided in exchange for these gifts except intangible religious benefits. Please retain for your records.
                </p>
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    body * { visibility: hidden !important; }
                    #stmt-print, #stmt-print * { visibility: visible !important; }
                    #stmt-print { position: absolute !important; left: 0; top: 0; width: 100% !important; }
                    @page { size: A4 portrait; margin: 14mm; }
                }
            `}</style>
        </div>
    )
}

export default function GivingStatementPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>}>
            <StatementInner />
        </Suspense>
    )
}

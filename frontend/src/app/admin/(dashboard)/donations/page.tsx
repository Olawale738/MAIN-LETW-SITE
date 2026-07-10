'use client'
import { useEffect, useState } from 'react'
import { Loader2, Wallet, RefreshCw, AlertCircle, FileText, ChevronDown } from 'lucide-react'
import { paymentsApi, type Donation } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
    success: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700', refunded: 'bg-gray-50 text-gray-700',
}

export default function AdminDonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('')
    const [err, setErr] = useState<string | null>(null)

    const load = async () => {
        try {
            const [d, s] = await Promise.all([paymentsApi.donations(filter || undefined), paymentsApi.stats()])
            setDonations(d); setStats(s)
        } catch (e) { setErr((e as Error).message) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [filter])

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    const totalSuccess = stats?.by_status?.success?.amount || 0
    const countSuccess = stats?.by_status?.success?.count || 0

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Wallet className="w-7 h-7 text-[#f5bb00]" /> Donations</h1>
                    <p className="text-gray-500 mt-1 text-sm">All giving across every provider. Filter by status. Live data from webhooks.</p>
                </div>
                <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
            </div>

            {err && <div className="mb-4 p-3 rounded-xl border bg-red-50 border-red-200 text-red-800 flex items-start gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{err}</span></div>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#140152] text-white rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-white/60">Total Received</p>
                    <p className="text-2xl font-black leading-tight mt-1">{totalSuccess.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-[11px] text-white/60 mt-0.5">{countSuccess} successful</p>
                </div>
                {stats?.by_fund?.slice(0, 3).map((f: any) => (
                    <div key={f.fund} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500">{f.fund}</p>
                        <p className="text-2xl font-black text-[#140152] mt-1">{f.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{f.count} gifts</p>
                    </div>
                ))}
            </div>

            <YearEndStatements />

            <div className="flex gap-2 mb-4 flex-wrap">
                {['', 'success', 'pending', 'failed', 'refunded'].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filter === s ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Date</th><th className="px-4 py-3">Donor</th><th className="px-4 py-3">Fund</th>
                            <th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {donations.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No donations yet.</td></tr>}
                        {donations.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <p className="font-bold text-[#140152]">{d.payer_name}</p>
                                    {d.payer_email && <p className="text-xs text-gray-400">{d.payer_email}</p>}
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{d.reference}</p>
                                </td>
                                <td className="px-4 py-3"><span className="text-xs font-bold bg-[#f5bb00]/15 text-[#140152] px-2 py-0.5 rounded">{d.fund}</span></td>
                                <td className="px-4 py-3 text-right font-bold text-[#140152]">{d.currency} {Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded ${STATUS_COLORS[d.status] || 'bg-gray-50 text-gray-500'}`}>{d.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function YearEndStatements() {
    const now = new Date().getFullYear()
    const [open, setOpen] = useState(false)
    const [year, setYear] = useState(now - 1)
    const [rows, setRows] = useState<Array<{ email: string | null; name: string; count: number; totals: Array<{ currency: string; amount: number }> }> | null>(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const generate = async () => {
        setLoading(true); setErr(null); setRows(null)
        try {
            const r = await paymentsApi.givingStatements(year)
            setRows(r.donors)
        } catch (e) { setErr((e as Error).message) }
        finally { setLoading(false) }
    }

    const openStatement = (d: { email: string | null; name: string }) => {
        const qs = new URLSearchParams({ year: String(year) })
        if (d.email) qs.set('email', d.email); else qs.set('name', d.name)
        window.open(`/admin/donations/statement?${qs.toString()}`, '_blank')
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left">
                <FileText className="w-5 h-5 text-[#f5bb00]" />
                <div className="flex-1">
                    <p className="font-black text-[#140152]">Year-end giving statements</p>
                    <p className="text-xs text-gray-500">Generate a printable annual statement (tax receipt) for each donor.</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="flex items-end gap-2 mt-3 mb-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Tax year</label>
                            <input type="number" value={year} onChange={e => setYear(Number(e.target.value) || now)} className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <button onClick={generate} disabled={loading} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Generate
                        </button>
                    </div>

                    {err && <p className="text-sm text-red-600 mb-2">{err}</p>}

                    {rows && rows.length === 0 && <p className="text-sm text-gray-400 py-4">No successful gifts recorded in {year}.</p>}
                    {rows && rows.length > 0 && (
                        <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl">
                            {rows.map((d, i) => (
                                <div key={i} className="flex items-center gap-3 p-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[#140152] truncate">{d.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{d.email || 'no email on file'} · {d.count} gift{d.count !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="text-right text-sm font-bold text-[#140152] shrink-0">
                                        {d.totals.map(t => <div key={t.currency}>{t.currency} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>)}
                                    </div>
                                    <button onClick={() => openStatement(d)} className="text-xs font-bold text-[#140152] underline shrink-0">View / print →</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

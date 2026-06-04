'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, Trash2, Mail, Phone, Calendar, Download } from 'lucide-react'
import { evangelismApi } from '@/lib/api'

interface Interest {
    id: string
    name: string
    email: string
    phone?: string
    availability?: string
    message?: string
    created_at: string
}

export default function EvangelismSignupsPage() {
    const [data, setData] = useState<Interest[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [deleting, setDeleting] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try { setData(await evangelismApi.admin.listInterests()) }
        catch (e: any) { alert(e?.message || 'Failed to load') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Remove ${name}'s sign-up? This cannot be undone.`)) return
        setDeleting(id)
        try { await evangelismApi.admin.deleteInterest(id); setData(p => p.filter(x => x.id !== id)) }
        catch (e: any) { alert(e?.message || 'Failed to delete') }
        finally { setDeleting(null) }
    }

    const filtered = data.filter(r =>
        !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase())
    )

    const exportCSV = () => {
        const rows = [['Name', 'Email', 'Phone', 'Availability', 'Message', 'Date'], ...data.map(r => [r.name, r.email, r.phone || '', r.availability || '', r.message || '', new Date(r.created_at).toLocaleDateString()])]
        const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
        a.download = 'evangelism-signups.csv'
        a.click()
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#140152]">🙏 Evangelism Sign-Ups</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        People who signed up via the public evangelism page — no login required
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-[#140152] bg-[#140152]/5 px-4 py-2 rounded-xl">
                        {data.length}
                    </span>
                    <button onClick={exportCSV}
                        className="flex items-center gap-2 text-xs font-bold text-[#140152] bg-[#140152]/5 hover:bg-[#140152]/10 px-3 py-2 rounded-xl transition-colors">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                </div>
            </div>

            <div className="flex gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 bg-white" />
                <button onClick={load} className="text-xs font-bold text-[#140152] bg-[#140152]/5 hover:bg-[#140152]/10 px-4 py-2.5 rounded-xl transition-colors">
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#140152]/30" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <span className="text-5xl mb-4 block">🙏</span>
                    <p className="text-gray-500 font-semibold">
                        {data.length === 0 ? 'No sign-ups yet' : 'No results for your search'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        People who fill in the evangelism page form will appear here
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(r => (
                        <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#140152] text-white font-black flex items-center justify-center text-sm shrink-0">
                                        {r.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-black text-[#140152]">{r.name}</p>
                                        <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(r.id, r.name)} disabled={deleting === r.id}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <a href={`mailto:${r.email}`}
                                    className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                    <Mail className="w-3.5 h-3.5 shrink-0" /> {r.email}
                                </a>
                                {r.phone && (
                                    <a href={`tel:${r.phone}`}
                                        className="flex items-center gap-2 text-xs text-gray-600">
                                        <Phone className="w-3.5 h-3.5 text-[#f5bb00] shrink-0" /> {r.phone}
                                    </a>
                                )}
                                {r.availability && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Calendar className="w-3.5 h-3.5 text-[#f5bb00] shrink-0" /> {r.availability}
                                    </div>
                                )}
                            </div>

                            {r.message && (
                                <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2">
                                    <p className="text-xs text-gray-600 italic">"{r.message}"</p>
                                </div>
                            )}

                            <div className="mt-3 flex gap-2">
                                <a href={`mailto:${r.email}`}
                                    className="flex-1 text-center text-xs font-bold bg-[#140152] text-white py-2 rounded-lg hover:bg-[#1a0175] transition-colors">
                                    Email
                                </a>
                                {r.phone && (
                                    <a href={`tel:${r.phone}`}
                                        className="flex-1 text-center text-xs font-bold bg-[#f5bb00] text-[#140152] py-2 rounded-lg hover:bg-yellow-400 transition-colors">
                                        Call
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

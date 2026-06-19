'use client'
import { useEffect, useState } from 'react'
import { Loader2, Database, Play, Trash2, Download, RefreshCw, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import { backupsApi, type BackupEntry } from '@/lib/api'

export default function AdminBackupsPage() {
    const [backups, setBackups] = useState<BackupEntry[]>([])
    const [retention, setRetention] = useState(30)
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try {
            const r = await backupsApi.list()
            setBackups(r.backups)
            setRetention(r.retention_days)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(t) } }, [msg])

    const run = async () => {
        if (!confirm('Run a full database backup now? This may take a minute on a large database.')) return
        setRunning(true)
        try {
            const r = await backupsApi.run()
            setMsg({ kind: 'ok', text: `Backup complete: ${r.filename} (${r.size_mb} MB). ${r.auto_cleaned_old} old backup(s) auto-deleted.` })
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setRunning(false) }
    }
    const remove = async (name: string) => {
        if (!confirm(`Delete backup "${name}"? This cannot be undone.`)) return
        try { await backupsApi.delete(name); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const cleanup = async () => {
        if (!confirm(`Delete every backup older than ${retention} days?`)) return
        try { const r = await backupsApi.cleanup(); setMsg({ kind: 'ok', text: `Deleted ${r.deleted} old backup(s).` }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Database className="w-7 h-7 text-[#f5bb00]" /> Database Backups</h1>
                    <p className="text-gray-500 mt-1 text-sm">Daily snapshots of the entire database stored in Supabase Storage. Last <strong>{retention}</strong> days kept. Belt-and-braces backup on top of Supabase's 7-day rolling backups.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5 px-3 py-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
                    <button onClick={run} disabled={running} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50">
                        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run Backup Now
                    </button>
                </div>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="bg-gradient-to-br from-[#140152] to-[#1a0270] text-white rounded-2xl p-5 mb-6">
                <p className="text-xs uppercase tracking-wider text-[#f5bb00] font-bold mb-2 inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Automate daily backups</p>
                <p className="text-sm text-white/80 leading-relaxed">Sign up at <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-[#f5bb00] underline">cron-job.org</a> (free) → add a job:</p>
                <ul className="mt-3 text-xs text-white/80 space-y-1 font-mono bg-white/5 rounded-lg p-3">
                    <li><strong className="text-[#f5bb00]">URL:</strong> https://letw-backend.onrender.com/api/admin/backups/run</li>
                    <li><strong className="text-[#f5bb00]">Method:</strong> POST</li>
                    <li><strong className="text-[#f5bb00]">Schedule:</strong> 0 2 * * * (daily at 2 AM UTC)</li>
                    <li><strong className="text-[#f5bb00]">Header:</strong> X-Backup-Token: &lt;value of BACKUP_TOKEN env var&gt;</li>
                </ul>
                <p className="text-[11px] text-white/60 mt-3">Set <code className="bg-white/10 px-1 rounded">BACKUP_TOKEN</code> to any long random string on Render → use the same value in the cron-job header.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-[#140152]">Backups ({backups.length})</p>
                    {backups.length > 0 && <button onClick={cleanup} className="text-xs text-red-500 hover:bg-red-50 px-3 py-1 rounded">Delete old (&gt;{retention} days)</button>}
                </div>
                {backups.length === 0 ? (
                    <p className="px-5 py-12 text-center text-gray-400">No backups yet. Click "Run Backup Now" to create the first one.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr><th className="px-4 py-3">Filename</th><th className="px-4 py-3">When</th><th className="px-4 py-3 text-right">Size</th><th className="px-4 py-3"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {backups.map(b => (
                                <tr key={b.name} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-xs text-[#140152]">{b.name}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
                                    <td className="px-4 py-3 text-right text-xs text-gray-500">{(b.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <a href={b.public_url} download className="inline-flex items-center gap-1 text-xs font-bold text-[#140152] hover:underline mr-3"><Download className="w-3.5 h-3.5" /> Download</a>
                                        <button onClick={() => remove(b.name)} className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

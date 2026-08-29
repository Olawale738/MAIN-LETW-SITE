'use client'
/**
 * The school's setup, as one ordered list.
 *
 * Every check here used to be a separate button an administrator had to know
 * to press, in an order nobody had written down. This shows the order, says
 * who each step is waiting on, and does the ones that need no decision.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, AlertCircle, Wand2, ChevronDown, ChevronRight } from 'lucide-react'
import { theologyApi, type TheologyReadinessReport } from '@/lib/api'

export default function TheologyReadiness({ onChanged }: { onChanged?: () => void }) {
    const [data, setData] = useState<TheologyReadinessReport | null>(null)
    const [running, setRunning] = useState(false)
    const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [open, setOpen] = useState(false)

    const load = useCallback(() => {
        theologyApi.readiness().then(setData).catch(() => setData(null))
    }, [])
    useEffect(() => { load() }, [load])

    const run = async () => {
        setRunning(true); setNote(null)
        try {
            const r = await theologyApi.autoSetup()
            if (!r.ok) { setNote({ kind: 'err', text: r.reason || 'Could not run setup.' }); return }
            setData(r.readiness)
            const done = r.actions.filter(a => a.ok).length
            const failed = r.actions.filter(a => !a.ok)
            setNote(failed.length
                ? { kind: 'err', text: `${done} done. ${failed.length} could not be completed — ${failed[0].detail ?? 'see the steps below'}.` }
                : { kind: 'ok', text: done ? `${done} step${done === 1 ? '' : 's'} completed.` : 'Nothing needed doing.' })
            onChanged?.()
        } catch (e) { setNote({ kind: 'err', text: (e as Error).message }) }
        finally { setRunning(false) }
    }

    if (!data) return null

    const next = data.next
    const canRun = data.fixable_now.length > 0

    return (
        <div className={`mb-5 rounded-2xl border shadow-sm overflow-hidden ${data.ready ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-300 bg-amber-50/70'}`}>
            <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        {data.ready ? (
                            <p className="font-black text-emerald-900 flex items-center gap-2">
                                <Check className="w-5 h-5" /> The school is ready to take students
                            </p>
                        ) : (
                            <>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Next step</p>
                                <p className="font-black text-[#140152] text-lg mt-0.5">{next?.title}</p>
                                <p className="text-sm text-gray-700 mt-1 max-w-xl">{next?.detail}</p>
                            </>
                        )}
                    </div>
                    {canRun && (
                        <button onClick={run} disabled={running}
                            className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 shrink-0">
                            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            {running ? 'Working…' : 'Do what you can'}
                        </button>
                    )}
                </div>

                {note && (
                    <div className={`mt-3 text-sm rounded-lg px-3 py-2 ${note.kind === 'ok' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-50 text-red-800'}`}>
                        {note.text}
                    </div>
                )}

                <button onClick={() => setOpen(v => !v)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#140152] hover:underline">
                    {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    {open ? 'Hide all steps' : `Show all ${data.steps.length} steps`}
                </button>
            </div>

            {open && (
                <ul className="border-t border-black/5 divide-y divide-black/5 bg-white/70">
                    {data.steps.map(s => (
                        <li key={s.key} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                            <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black
                                ${s.done ? 'bg-emerald-100 text-emerald-700'
                                    : s.blocking ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                                {s.done ? <Check className="w-3 h-3" /> : s.blocking ? '!' : '·'}
                            </span>
                            <div className="min-w-0">
                                <p className={`text-sm font-bold ${s.done ? 'text-gray-500' : 'text-[#140152]'}`}>
                                    {s.title}
                                    {!s.done && s.owner === 'classroom' && (
                                        <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">needs the classroom</span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5">{s.detail}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {!data.ready && (
                <div className="px-4 sm:px-5 py-2.5 border-t border-black/5 bg-white/50 text-[11px] text-gray-500">
                    Settings live under <Link href="/admin/integrations" className="font-bold text-[#140152] underline">Integrations</Link>.
                    &nbsp;“Do what you can” only runs steps that need no decision — fees, signatories and duplicates are left to you.
                </div>
            )}
        </div>
    )
}

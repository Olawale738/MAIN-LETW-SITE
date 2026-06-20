'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2, Send, Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { welcomeFlowApi, wakeBackend, type WelcomeStep } from '@/lib/api'
import RichTextEditor from '@/components/ui/rich-text-editor'

export default function AdminWelcomeFlowPage() {
    const [steps, setSteps] = useState<WelcomeStep[]>([])
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [editing, setEditing] = useState<WelcomeStep | null>(null)
    const [showNew, setShowNew] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const [loadError, setLoadError] = useState<string | null>(null)
    const load = async () => {
        setLoadError(null)
        try {
            setSteps(await welcomeFlowApi.listSteps())
        } catch (e) {
            setLoadError((e as Error).message)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const runNow = async () => {
        setRunning(true)
        try {
            const r = await welcomeFlowApi.runTick()
            setMsg({ kind: 'ok', text: `Sent ${r.sent} email${r.sent === 1 ? '' : 's'} just now.` })
        } catch (e) {
            // If the request never reached the server (cold start), wake it then retry once.
            const msgText = (e as Error).message || ''
            if (msgText.toLowerCase().includes("couldn't reach")) {
                setMsg({ kind: 'err', text: 'Server was asleep. Waking it now…' })
                const ok = await wakeBackend(60_000)
                if (ok) {
                    try {
                        const r = await welcomeFlowApi.runTick()
                        setMsg({ kind: 'ok', text: `Server awake. Sent ${r.sent} email${r.sent === 1 ? '' : 's'} just now.` })
                        return
                    } catch (e2) { setMsg({ kind: 'err', text: (e2 as Error).message }) }
                } else {
                    setMsg({ kind: 'err', text: 'Backend still not responding after 60s. Check Render dashboard.' })
                }
            } else {
                setMsg({ kind: 'err', text: msgText })
            }
        }
        finally { setRunning(false) }
    }

    const save = async (step: WelcomeStep) => {
        try {
            const body = { day_offset: step.day_offset, subject: step.subject, body_html: step.body_html, is_active: step.is_active, sort_order: step.sort_order }
            if (step.id) {
                await welcomeFlowApi.updateStep(step.id, body)
            } else {
                await welcomeFlowApi.createStep(body)
            }
            setMsg({ kind: 'ok', text: 'Step saved.' })
            setEditing(null); setShowNew(false)
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const remove = async (id: string) => {
        if (!confirm('Delete this welcome step? Users yet to receive it will not get it anymore.')) return
        try {
            await welcomeFlowApi.deleteStep(id)
            setMsg({ kind: 'ok', text: 'Step deleted.' })
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    if (loadError) return (
        <div className="max-w-md mx-auto mt-24 bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <h2 className="text-xl font-black text-[#140152]">Welcome Flow couldn't load</h2>
            <p className="text-sm text-gray-600 mt-2 break-words">{loadError}</p>
            <p className="text-xs text-gray-400 mt-3">Render free-tier servers sleep after inactivity. The first request after idle can take 30–60 seconds to wake. Wake it manually, then retry:</p>
            <div className="mt-5 flex gap-2 justify-center flex-wrap">
                <button onClick={async () => {
                    setLoadError(null)
                    const ok = await wakeBackend(60_000)
                    if (ok) { setLoading(true); load() }
                    else setLoadError("Backend still not responding after 60 seconds. Check Render dashboard.")
                }} className="bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold px-5 py-2.5 rounded-xl text-sm">
                    Wake server &amp; retry
                </button>
                <button onClick={() => { setLoading(true); load() }} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm">Try again</button>
            </div>
        </div>
    )

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Mail className="w-7 h-7" /> Welcome Flow</h1>
                    <p className="text-gray-500 mt-1 text-sm">Auto-emails sent to every new member based on days since signup. Use <code className="bg-gray-100 px-1 rounded text-xs">{'{name}'}</code> and <code className="bg-gray-100 px-1 rounded text-xs">{'{email}'}</code> in subject/body.</p>
                </div>
                <button onClick={runNow} disabled={running} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Run now
                </button>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                <span className="text-sm">{msg.text}</span>
            </div>}

            <div className="flex justify-end mb-4">
                <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm">
                    <Plus className="w-4 h-4" /> New Step
                </button>
            </div>

            {(showNew || editing) && (
                <StepForm
                    step={editing || { id: '', day_offset: 0, subject: '', body_html: '', is_active: true, sort_order: 0 }}
                    onSave={save}
                    onCancel={() => { setEditing(null); setShowNew(false) }}
                />
            )}

            <div className="space-y-3 mt-5">
                {steps.length === 0 && <p className="text-center text-gray-400 py-12">No welcome steps yet. Add one to start auto-greeting new members.</p>}
                {steps.map(s => (
                    <div key={s.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-start gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-[#140152]/10 text-[#140152] flex items-center justify-center font-black flex-shrink-0">
                            <div className="text-center">
                                <Clock className="w-3 h-3 mx-auto opacity-60" />
                                <p className="text-xs mt-0.5">D+{s.day_offset}</p>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152] truncate">{s.subject}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.is_active ? <span className="text-green-600 font-bold">● Active</span> : <span className="text-gray-400 font-bold">○ Paused</span>}</p>
                        </div>
                        <button onClick={() => setEditing(s)} className="text-sm font-bold text-[#140152] hover:underline">Edit</button>
                        <button onClick={() => remove(s.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function StepForm({ step, onSave, onCancel }: { step: WelcomeStep; onSave: (s: WelcomeStep) => void; onCancel: () => void }) {
    const [s, setS] = useState(step)
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Day Offset</label>
                    <input type="number" min={0} value={s.day_offset} onChange={e => setS({ ...s, day_offset: parseInt(e.target.value) || 0 })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <p className="text-[10px] text-gray-400 mt-1">0 = sent on signup, 3 = 3 days after</p>
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Subject</label>
                    <input value={s.subject} onChange={e => setS({ ...s, subject: e.target.value })}
                        placeholder="Welcome to LETW, {name}!"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
            </div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Body</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <RichTextEditor content={s.body_html} onChange={(html) => setS({ ...s, body_html: html })} placeholder="Hi {name}, we're so glad you've joined..." />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={s.is_active} onChange={e => setS({ ...s, is_active: e.target.checked })} />
                    Active
                </label>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                    <button onClick={() => onSave(s)} disabled={!s.subject.trim() || !s.body_html.trim()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                        <Save className="w-4 h-4" /> Save
                    </button>
                </div>
            </div>
        </div>
    )
}

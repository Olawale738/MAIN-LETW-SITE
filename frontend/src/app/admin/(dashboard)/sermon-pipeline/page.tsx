'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileVideo, Sparkles, Loader2, AlertTriangle, ArrowLeft, Copy, Check, ChevronDown } from 'lucide-react'
import { aiApi, sermonApi, type Sermon } from '@/lib/api'

const OUTPUTS = [
    { key: 'summary',          label: 'Podcast summary',       desc: '3-paragraph description for Apple/Spotify' },
    { key: 'blog_post',        label: 'Blog post',             desc: '5-paragraph article with scripture references' },
    { key: 'social_clips',     label: 'Social media clips',    desc: '5 tweet-sized captions for IG / X / Threads' },
    { key: 'devotional_series', label: '7-day devotional',     desc: 'Daily email series with prayer prompts' },
    { key: 'study_guide',      label: 'Small group guide',     desc: '5 discussion questions for your cells' },
    { key: 'memory_verses',    label: 'Memory verses',         desc: '3 scriptures (KJV) to memorise' },
]

export default function SermonPipelinePage() {
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [chosenId, setChosenId] = useState<string>('')
    const [transcript, setTranscript] = useState('')
    const [aiReady, setAiReady] = useState<boolean | null>(null)
    const [selected, setSelected] = useState<Set<string>>(new Set(OUTPUTS.map(o => o.key)))
    const [running, setRunning] = useState(false)
    const [results, setResults] = useState<Record<string, string> | null>(null)
    const [openOutput, setOpenOutput] = useState<string | null>(null)
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        aiApi.status().then(s => setAiReady(s.ai_configured)).catch(() => setAiReady(false))
        sermonApi.getAllSermons(true).then(r => setSermons(r.sermons || [])).catch(() => setSermons([]))
    }, [])

    const toggle = (k: string) => {
        const next = new Set(selected); next.has(k) ? next.delete(k) : next.add(k); setSelected(next)
    }

    const run = async () => {
        if (!chosenId && !transcript.trim()) {
            alert('Pick a sermon or paste a transcript first.')
            return
        }
        setRunning(true); setResults(null); setOpenOutput(null)
        try {
            const r = await aiApi.sermonPipeline({
                sermon_id: chosenId || undefined,
                transcript: transcript.trim() || undefined,
                outputs: [...selected],
            })
            setResults(r.outputs)
            setOpenOutput(Object.keys(r.outputs)[0] || null)
        } catch (e) {
            alert(`Failed: ${(e as Error).message}`)
        } finally {
            setRunning(false)
        }
    }

    const copy = async (k: string, text: string) => {
        try { await navigator.clipboard.writeText(text); setCopied(k); setTimeout(() => setCopied(null), 1500) }
        catch { /* noop */ }
    }

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <Link href="/admin/ai" className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5 mb-4"><ArrowLeft className="w-4 h-4" /> Back to AI Features</Link>

            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><FileVideo className="w-7 h-7 text-[#f5bb00]" /> Sermon-to-Everything</h1>
                <p className="text-gray-500 mt-1 text-sm">Generate 6 reusable content pieces from a single sermon — a week's worth of content in one click.</p>
            </div>

            {aiReady === false && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-bold text-amber-900">AI not configured yet</p>
                        <p className="text-sm text-amber-800 mt-1">Add an OpenAI or Anthropic key at <Link href="/admin/ai" className="underline font-bold">/admin/ai</Link> to enable this pipeline.</p>
                    </div>
                </div>
            )}

            {/* INPUT */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <h2 className="font-bold text-[#140152] mb-3">1. Source material</h2>
                <p className="text-xs text-gray-500 mb-3">Pick one of your existing sermons (preferred — uses its audio if available) OR paste a raw transcript.</p>

                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Pick a sermon</label>
                <select value={chosenId} onChange={e => { setChosenId(e.target.value); if (e.target.value) setTranscript('') }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 bg-white">
                    <option value="">— None (use transcript below) —</option>
                    {sermons.map(s => (
                        <option key={s.id} value={s.id}>{s.title} — {s.preacher} ({s.sermon_date})</option>
                    ))}
                </select>

                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">OR paste transcript</label>
                <textarea value={transcript} onChange={e => { setTranscript(e.target.value); if (e.target.value.trim()) setChosenId('') }} rows={6} placeholder="Paste the full sermon transcript here…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            {/* OUTPUTS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <h2 className="font-bold text-[#140152] mb-3">2. What to generate ({selected.size} of {OUTPUTS.length} selected)</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                    {OUTPUTS.map(o => (
                        <button key={o.key} onClick={() => toggle(o.key)}
                            className={`text-left px-4 py-3 rounded-xl border ${selected.has(o.key) ? 'border-[#140152] bg-[#140152]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <p className="font-bold text-sm text-[#140152]">{o.label}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{o.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* RUN */}
            <button onClick={run} disabled={running || aiReady !== true} className="w-full bg-gradient-to-r from-[#140152] to-[#7c3aed] hover:from-[#1d0175] hover:to-[#8b5cf6] text-white font-black px-6 py-4 rounded-2xl text-lg shadow-xl disabled:opacity-50 inline-flex items-center justify-center gap-3">
                {running ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating ({selected.size} pieces — this may take 30-60 seconds)…</> : <><Sparkles className="w-5 h-5" /> Run the pipeline</>}
            </button>

            {/* RESULTS */}
            {results && (
                <div className="mt-8 space-y-3">
                    <h2 className="font-black text-[#140152] text-xl">3. Your generated content</h2>
                    {Object.entries(results).map(([key, text]) => {
                        const meta = OUTPUTS.find(o => o.key === key)
                        const isOpen = openOutput === key
                        return (
                            <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <button onClick={() => setOpenOutput(isOpen ? null : key)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="text-left">
                                        <p className="font-bold text-[#140152]">{meta?.label || key}</p>
                                        <p className="text-[11px] text-gray-500">{meta?.desc}</p>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-[#140152] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 border-t border-gray-100">
                                        <button onClick={() => copy(key, text)} className="float-right mt-3 text-xs font-bold inline-flex items-center gap-1 text-[#140152] hover:underline">
                                            {copied === key ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                        </button>
                                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed mt-3">{text}</pre>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

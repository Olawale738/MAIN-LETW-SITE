'use client'
import { useEffect, useState } from 'react'
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, FileVideo, Languages } from 'lucide-react'
import { aiApi, type AiStatus } from '@/lib/api'

export default function AdminAiPage() {
    const [status, setStatus] = useState<AiStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [testInput, setTestInput] = useState('God so loved the world that he gave his only Son.')
    const [testOutput, setTestOutput] = useState<string | null>(null)
    const [testing, setTesting] = useState(false)

    useEffect(() => { aiApi.status().then(setStatus).catch(() => {}).finally(() => setLoading(false)) }, [])

    const test = async () => {
        if (!status?.ai_configured) return
        setTesting(true); setTestOutput(null)
        try { const r = await aiApi.translate(testInput, 'yo'); setTestOutput(r.translated_text) }
        catch (e) { setTestOutput(`Error: ${(e as Error).message}`) }
        finally { setTesting(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Sparkles className="w-7 h-7 text-[#f5bb00]" /> AI Features</h1>
                <p className="text-gray-500 mt-1 text-sm">Translation, AI pastoral assistant, sermon-to-everything pipeline. All gated by a single API key.</p>
            </div>

            <div className={`rounded-2xl p-5 mb-6 border ${status?.ai_configured ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-3">
                    {status?.ai_configured ? <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />}
                    <div className="flex-1">
                        {status?.ai_configured ? (
                            <>
                                <p className="font-bold text-green-900">AI features are ACTIVE</p>
                                <p className="text-sm text-green-800 mt-1">
                                    {status.has_openai && <span className="inline-block bg-white px-2 py-0.5 rounded text-xs mr-2">OpenAI ✓</span>}
                                    {status.has_anthropic && <span className="inline-block bg-white px-2 py-0.5 rounded text-xs mr-2">Anthropic ✓</span>}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-bold text-amber-900">AI features are NOT YET CONFIGURED</p>
                                <p className="text-sm text-amber-800 mt-2">Set one of these env vars on Render → backend → Environment, then redeploy:</p>
                                <div className="mt-3 space-y-2">
                                    <div className="bg-white rounded p-3 text-xs">
                                        <p className="font-bold text-amber-900">Option A: OpenAI</p>
                                        <code className="block mt-1 font-mono text-[11px]">OPENAI_API_KEY=sk-...</code>
                                        <p className="text-amber-700 mt-1">Get one at <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">platform.openai.com/api-keys</a> · enables all features including Whisper transcription. ~$10-50/mo at small scale.</p>
                                    </div>
                                    <div className="bg-white rounded p-3 text-xs">
                                        <p className="font-bold text-amber-900">Option B: Anthropic Claude</p>
                                        <code className="block mt-1 font-mono text-[11px]">ANTHROPIC_API_KEY=sk-ant-...</code>
                                        <p className="text-amber-700 mt-1">Get one at <a href="https://console.anthropic.com/" target="_blank" className="underline">console.anthropic.com</a> · enables chat + translation + sermon pipeline. Transcription requires OpenAI.</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <FeatureCard icon={<Languages className="w-5 h-5" />} title="Multi-language Translation" url="/sermons" desc="Translate any text into Yoruba, French, Spanish, Igbo, Hausa via /api/ai/translate" />
                <FeatureCard icon={<FileVideo className="w-5 h-5" />} title="Sermon-to-Everything" url="/admin/sermon-pipeline" desc="One sermon → podcast notes, blog post, social clips, devotional, study guide" />
            </div>

            {status?.ai_configured && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="font-bold text-[#140152] mb-3 flex items-center gap-2"><Languages className="w-5 h-5" /> Test translation (→ Yoruba)</h2>
                    <textarea value={testInput} onChange={e => setTestInput(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
                    <button onClick={test} disabled={testing} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50">
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Translate
                    </button>
                    {testOutput && <div className="mt-4 bg-gray-50 rounded-xl p-4"><p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{testOutput}</p></div>}
                </div>
            )}
        </div>
    )
}

function FeatureCard({ icon, title, url, desc }: { icon: React.ReactNode; title: string; url: string; desc: string }) {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[#140152]/10 text-[#140152] flex items-center justify-center mb-3">{icon}</div>
            <p className="font-bold text-[#140152]">{title}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
        </a>
    )
}

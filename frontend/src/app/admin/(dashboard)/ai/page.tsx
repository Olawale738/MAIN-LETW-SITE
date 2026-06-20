'use client'
import { useEffect, useState } from 'react'
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, FileVideo, Languages, Save, Eye, EyeOff, Key } from 'lucide-react'
import Link from 'next/link'
import { aiApi, type AiStatus, type AiKeys } from '@/lib/api'

export default function AdminAiPage() {
    const [status, setStatus] = useState<AiStatus | null>(null)
    const [keys, setKeys] = useState<AiKeys | null>(null)
    const [openaiInput, setOpenaiInput] = useState('')
    const [anthropicInput, setAnthropicInput] = useState('')
    const [showOpenai, setShowOpenai] = useState(false)
    const [showAnthropic, setShowAnthropic] = useState(false)
    const [savingKeys, setSavingKeys] = useState(false)
    const [keysMsg, setKeysMsg] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [testInput, setTestInput] = useState('God so loved the world that he gave his only Son.')
    const [testOutput, setTestOutput] = useState<string | null>(null)
    const [testing, setTesting] = useState(false)

    const refresh = async () => {
        const [s, k] = await Promise.all([
            aiApi.status().catch(() => null),
            aiApi.getKeys().catch(() => null),
        ])
        setStatus(s); setKeys(k)
    }
    useEffect(() => { refresh().finally(() => setLoading(false)) }, [])

    const saveKeys = async () => {
        setSavingKeys(true); setKeysMsg(null)
        try {
            await aiApi.setKeys({
                openai_api_key: openaiInput.trim() ? openaiInput.trim() : undefined,
                anthropic_api_key: anthropicInput.trim() ? anthropicInput.trim() : undefined,
            })
            setKeysMsg('Keys saved. AI features active.')
            setOpenaiInput(''); setAnthropicInput('')
            await refresh()
        } catch (e) { setKeysMsg(`Error: ${(e as Error).message}`) }
        finally { setSavingKeys(false); setTimeout(() => setKeysMsg(null), 5000) }
    }

    const clearKey = async (which: 'openai' | 'anthropic') => {
        if (!confirm(`Clear ${which === 'openai' ? 'OpenAI' : 'Anthropic'} API key? AI features using this provider will stop working.`)) return
        try {
            await aiApi.setKeys(which === 'openai' ? { openai_api_key: '' } : { anthropic_api_key: '' })
            await refresh()
        } catch (e) { alert((e as Error).message) }
    }

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
                                <p className="text-sm text-amber-800 mt-1">Paste an API key in the "Configure API Keys" section below to activate.</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* API KEY CONFIGURATION — paste keys directly here, no Render restart needed */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
                <h2 className="font-bold text-[#140152] mb-1 flex items-center gap-2"><Key className="w-5 h-5" /> Configure API Keys</h2>
                <p className="text-xs text-gray-500 mb-4">Paste one or both. Saves instantly to the database — no Render restart needed. You can also set OPENAI_API_KEY / ANTHROPIC_API_KEY env vars on Render as a fallback.</p>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                        <p className="font-bold text-sm text-[#140152]">OpenAI</p>
                        <p className="text-[10px] text-gray-500 mb-3">Translation · Sermon Pipeline · Whisper Transcription · <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#140152] underline">Get key</a></p>
                        {keys?.openai_api_key && (
                            <div className="bg-green-50 border border-green-200 rounded p-2 mb-2 text-[11px] flex items-center justify-between">
                                <span className="font-mono text-green-800">{keys.openai_api_key}</span>
                                <button onClick={() => clearKey('openai')} className="text-red-500 hover:underline ml-2 font-bold text-[10px]">Clear</button>
                            </div>
                        )}
                        {!keys?.openai_api_key && keys?.env_fallback_openai && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-[11px] text-blue-800">
                                ℹ️ Using env var fallback on Render
                            </div>
                        )}
                        <div className="relative">
                            <input
                                type={showOpenai ? 'text' : 'password'}
                                value={openaiInput}
                                onChange={e => setOpenaiInput(e.target.value)}
                                placeholder="sk-..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-xs font-mono"
                            />
                            <button onClick={() => setShowOpenai(!showOpenai)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                                {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                        <p className="font-bold text-sm text-[#140152]">Anthropic Claude</p>
                        <p className="text-[10px] text-gray-500 mb-3">Translation · Sermon Pipeline · <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-[#140152] underline">Get key</a></p>
                        {keys?.anthropic_api_key && (
                            <div className="bg-green-50 border border-green-200 rounded p-2 mb-2 text-[11px] flex items-center justify-between">
                                <span className="font-mono text-green-800">{keys.anthropic_api_key}</span>
                                <button onClick={() => clearKey('anthropic')} className="text-red-500 hover:underline ml-2 font-bold text-[10px]">Clear</button>
                            </div>
                        )}
                        {!keys?.anthropic_api_key && keys?.env_fallback_anthropic && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-[11px] text-blue-800">
                                ℹ️ Using env var fallback on Render
                            </div>
                        )}
                        <div className="relative">
                            <input
                                type={showAnthropic ? 'text' : 'password'}
                                value={anthropicInput}
                                onChange={e => setAnthropicInput(e.target.value)}
                                placeholder="sk-ant-..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-xs font-mono"
                            />
                            <button onClick={() => setShowAnthropic(!showAnthropic)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                                {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    {keysMsg && <p className="text-sm text-green-700 font-bold">{keysMsg}</p>}
                    <button onClick={saveKeys} disabled={savingKeys || (!openaiInput.trim() && !anthropicInput.trim())}
                        className="ml-auto bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50">
                        {savingKeys ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save keys
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <FeatureCard icon={<Languages className="w-5 h-5" />} title="Multi-language Translation" url="/admin/ai" desc="Translate any text into Yoruba, French, Spanish, Igbo, Hausa via /api/ai/translate. Use the test playground below." />
                <FeatureCard icon={<FileVideo className="w-5 h-5" />} title="Sermon-to-Everything" url="/admin/sermon-pipeline" desc="One sermon → podcast notes, blog post, social clips, devotional, study guide, memory verses (6 pieces auto-generated)" />
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

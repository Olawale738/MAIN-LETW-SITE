'use client'
import { useState, useEffect } from 'react'
import { MessageSquare, Loader2, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { aiApi } from '@/lib/api'
import { useT } from '@/lib/i18n'

interface QA { q: string; a: string; refs: Array<{ id: string; title: string; preacher: string; date: string }> }

export default function PastorAskPage() {
    const { t } = useT()
    const [question, setQuestion] = useState('')
    const [conversation, setConversation] = useState<QA[]>([])
    const [loading, setLoading] = useState(false)
    const [aiReady, setAiReady] = useState<boolean | null>(null)

    useEffect(() => {
        aiApi.status().then(s => setAiReady(s.ai_configured)).catch(() => setAiReady(false))
    }, [])

    const ask = async () => {
        if (!question.trim() || loading) return
        const q = question.trim()
        setQuestion('')
        setLoading(true)
        try {
            const r = await aiApi.pastorAsk(q)
            setConversation(c => [...c, { q, a: r.answer, refs: r.referenced_sermons }])
        } catch (e) {
            setConversation(c => [...c, { q, a: `Sorry — ${(e as Error).message}`, refs: [] }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-8 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3 inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> AI Pastoral Assistant</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{t('pastor.ask')}</h1>
                <p className="text-gray-600 mt-4 max-w-xl mx-auto">Ask any question of faith, life, or the Word. Trained on LETW's sermons and Statement of Faith.</p>
            </section>

            <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                {aiReady === false && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-900">AI assistant not yet configured</p>
                            <p className="text-sm text-amber-800 mt-1">An admin needs to set <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> or <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> on the backend. Once set, this page activates automatically.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4 mb-6">
                    {conversation.map((qa, i) => (
                        <div key={i} className="space-y-3">
                            <div className="bg-[#140152] text-white rounded-2xl rounded-br-sm p-4 ml-12">
                                <p className="text-sm">{qa.q}</p>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-5 mr-12 shadow-sm">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{qa.a}</p>
                                {qa.refs.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Drawn from these sermons</p>
                                        <ul className="space-y-1">
                                            {qa.refs.map(r => (
                                                <li key={r.id}>
                                                    <Link href={`/sermons/${r.id}`} className="text-xs text-[#140152] hover:underline inline-flex items-center gap-1">
                                                        "{r.title}" by {r.preacher} ({r.date}) <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-4 bg-white border border-gray-200 rounded-3xl shadow-xl p-3 flex gap-2 items-end">
                    <textarea
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
                        placeholder={t('pastor.placeholder')}
                        rows={2}
                        disabled={aiReady === false}
                        className="flex-1 resize-none outline-none px-3 py-2 text-sm disabled:opacity-50"
                    />
                    <button onClick={ask} disabled={!question.trim() || loading || aiReady === false}
                        className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-2xl disabled:opacity-50 inline-flex items-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        Ask
                    </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">AI-generated guidance. For pastoral care decisions, please reach a real pastor.</p>
            </section>
        </main>
    )
}

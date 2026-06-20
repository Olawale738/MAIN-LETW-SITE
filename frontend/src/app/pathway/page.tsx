'use client'
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { discipleshipApi, type DiscipleshipStage } from '@/lib/api'
import { tokenManager } from '@/lib/api'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

export default function PathwayPage() {
    const [stages, setStages] = useState<DiscipleshipStage[]>([])
    const [progress, setProgress] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [signedIn, setSignedIn] = useState(false)

    useEffect(() => {
        const loggedIn = tokenManager.isLoggedIn()
        setSignedIn(loggedIn)
        Promise.all([
            discipleshipApi.publicStages(),
            loggedIn ? discipleshipApi.myProgress().catch(() => []) : Promise.resolve([]),
        ]).then(([s, p]) => {
            setStages(s)
            setProgress(new Set(p.map(x => x.stage_id)))
        }).finally(() => setLoading(false))
    }, [])

    const toggle = async (stageId: string) => {
        if (!signedIn) return
        try {
            if (progress.has(stageId)) {
                await discipleshipApi.unmark(stageId)
                const next = new Set(progress); next.delete(stageId); setProgress(next)
            } else {
                await discipleshipApi.markComplete(stageId)
                setProgress(new Set([...progress, stageId]))
            }
        } catch { /* no-op */ }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    const nextIdx = stages.findIndex(s => !progress.has(s.id))

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <PageCmsOverlay slug="pathway" position="top" />
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-8 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3">Discipleship Pathway</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">Your journey of growing in Christ.</h1>
                <p className="text-gray-600 mt-4 max-w-xl mx-auto">One step at a time. Every step is a step closer to the One who calls you.</p>
                {!signedIn && <p className="mt-4 text-sm text-gray-500">Sign in to track your progress.</p>}
            </section>

            <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                <div className="space-y-4">
                    {stages.length === 0 && <p className="text-center text-gray-400 py-12">The discipleship pathway is being prepared. Check back soon.</p>}
                    {stages.map((s, i) => {
                        const done = progress.has(s.id)
                        const isNext = i === nextIdx
                        const Icon = (LucideIcons as any)[s.icon] || LucideIcons.Sparkles
                        return (
                            <div key={s.id} className={`bg-white rounded-2xl shadow-md border-2 p-5 transition-all ${done ? 'border-green-200 bg-green-50/40' : isNext ? 'border-[#f5bb00] ring-4 ring-[#f5bb00]/10' : 'border-gray-100'}`}>
                                <div className="flex items-start gap-4">
                                    <button onClick={() => toggle(s.id)} disabled={!signedIn}
                                        className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center disabled:cursor-not-allowed">
                                        {done ? <CheckCircle2 className="w-12 h-12 text-green-500" /> :
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isNext ? 'bg-[#f5bb00] text-[#140152]' : 'bg-gray-100 text-gray-400'}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-black text-[#140152] text-lg">{s.title}</p>
                                            {isNext && <span className="text-[10px] font-bold uppercase tracking-wider text-[#140152] bg-[#f5bb00] px-2 py-0.5 rounded-full">Your next step</span>}
                                            {done && <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Completed</span>}
                                        </div>
                                        <p className="text-gray-600 mt-1.5 text-sm leading-relaxed">{s.description}</p>
                                        {s.cta_label && s.cta_href && (
                                            <a href={s.cta_href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#140152] hover:underline">
                                                {s.cta_label} <ArrowRight className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
            <PageCmsOverlay slug="pathway" position="bottom" />
        </main>
    )
}

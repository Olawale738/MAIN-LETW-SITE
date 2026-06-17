'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { BookOpen, Users, TrendingUp, ArrowRight, Heart, CheckCircle, Loader2, CheckCircle2, Sparkles, Flame, Crown, Shield, HandHeart } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent } from '@/components/ui/card'
import { discipleshipApi, tokenManager, type DiscipleshipStage } from '@/lib/api'

export default function DiscipleshipPage() {
    const [enrolled, setEnrolled] = useState(false)
    const [enrollLoading, setEnrollLoading] = useState(false)
    const [enrollError, setEnrollError] = useState('')
    const [stages, setStages] = useState<DiscipleshipStage[]>([])
    const [progress, setProgress] = useState<Set<string>>(new Set())
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
        }).catch(() => {})
    }, [])

    const toggleStage = async (stageId: string) => {
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

    const nextStageIdx = stages.findIndex(s => !progress.has(s.id))

    const handleEnroll = async () => {
        setEnrollLoading(true)
        setEnrollError('')
        try {
            const { serviceRequestApi } = await import('@/lib/api')
            await serviceRequestApi.submitRequests(['Discipleship Training'], 'I would like to join the Discipleship Training program.')
            setEnrolled(true)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Please log in to enroll.'
            setEnrollError(msg)
        } finally {
            setEnrollLoading(false)
        }
    }

    return (
        <>
            {/* Spotlight Hero Section */}
            <div 
                className="relative bg-[#140152] pt-32 pb-24 px-4 md:px-12 overflow-hidden min-h-screen flex flex-col justify-center bg-cover bg-center" 
                style={{ backgroundImage: 'url("/Discipleship.png")' }}
            >
                <div className="absolute inset-0 bg-[#140152]/60 pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-7xl mx-auto relative z-10 text-center"
                >
                    <span className="text-[#f5bb00] font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-4 block">Walk with Christ</span>
                    <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 tracking-tight">
                        Follow. Learn. Lead.
                    </h1>
                    <p className="text-blue-200 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        The journey of a disciple is a lifelong pursuit of knowing Jesus and making Him known.
                    </p>
                </motion.div>
            </div>

            <SectionWrapper>
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] mb-6">What is Discipleship?</h2>
                        <div className="w-24 h-1.5 bg-[#f5bb00] rounded-full mb-8" />
                        <p className="text-lg text-gray-700 leading-relaxed mb-6">
                            Discipleship is more than just learning facts about the Bible; it's about life transformation. It is the process of becoming more like Christ in character, conduct, and calling.
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            At Light Encounter Tabernacle, we believe every believer is called to be a disciple and a disciple-maker. Our pathway is designed to help you grow from a new believer to a mature spiritual leader.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <Card className="bg-[#140152] text-white border-none shadow-xl transform translate-y-8">
                            <CardContent className="p-8 text-center">
                                <BookOpen className="w-12 h-12 text-[#f5bb00] mx-auto mb-4" />
                                <h3 className="font-bold text-xl mb-2">Word</h3>
                                <p className="text-sm text-blue-200">Grounded in Scripture</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white text-[#140152] border-none shadow-xl">
                            <CardContent className="p-8 text-center">
                                <Users className="w-12 h-12 text-[#f5bb00] mx-auto mb-4" />
                                <h3 className="font-bold text-xl mb-2">Community</h3>
                                <p className="text-sm text-gray-500">Living life together</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white text-[#140152] border-none shadow-xl transform translate-y-8">
                            <CardContent className="p-8 text-center">
                                <Heart className="w-12 h-12 text-[#f5bb00] mx-auto mb-4" />
                                <h3 className="font-bold text-xl mb-2">Service</h3>
                                <p className="text-sm text-gray-500">Love in action</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-[#f5bb00] text-[#140152] border-none shadow-xl">
                            <CardContent className="p-8 text-center">
                                <TrendingUp className="w-12 h-12 text-[#140152] mx-auto mb-4" />
                                <h3 className="font-bold text-xl mb-2">Growth</h3>
                                <p className="text-sm text-[#140152]/80">Continuous progress</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper background="gray">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-[#140152] mb-6">The Discipleship Pathway</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">A clear path for your spiritual journey, meeting you where you are and helping you take the next step.</p>
                    </div>

                    <div className="space-y-8">
                        {[
                            { title: "Foundation (New Believers)", desc: "Understanding salvation, baptism, and the basic habits of a Christian.", color: "border-l-4 border-green-500" },
                            { title: "Formation (Growing)", desc: "Deepening your prayer life, bible study skills, and discovering your spiritual gifts.", color: "border-l-4 border-blue-500" },
                            { title: "Ministry (Serving)", desc: "Finding your place in the body of Christ and serving with excellence.", color: "border-l-4 border-purple-500" },
                            { title: "Leadership (Multiplying)", desc: "Mentoring others and leading small groups or ministries.", color: "border-l-4 border-orange-500" }
                        ].map((step, i) => (
                            <div key={i} className={`bg-white p-8 rounded-2xl shadow-md flex flex-col md:flex-row items-center gap-6 ${step.color}`}>
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center font-black text-2xl text-gray-300">
                                    {i + 1}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-bold text-[#140152] mb-2">{step.title}</h3>
                                    <p className="text-gray-600 font-medium">{step.desc}</p>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {stages.length > 0 && (
                <SectionWrapper>
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <span className="text-[#f5bb00] font-bold tracking-[0.2em] uppercase text-xs">Your Journey</span>
                            <h2 className="text-3xl md:text-5xl font-black text-[#140152] mt-2 mb-3">Walk the Pathway, Step by Step</h2>
                            <p className="text-gray-600 max-w-xl mx-auto">{signedIn ? 'Tick each step as you walk it. Your next step is highlighted in gold.' : 'Sign in to track your progress through each stage.'}</p>
                        </div>
                        <div className="space-y-4">
                            {stages.map((s, i) => {
                                const done = progress.has(s.id)
                                const isNext = i === nextStageIdx
                                const Icon = (LucideIcons as any)[s.icon] || Sparkles
                                return (
                                    <div key={s.id} className={`bg-white rounded-2xl shadow-md border-2 p-5 transition-all ${done ? 'border-green-200 bg-green-50/40' : isNext ? 'border-[#f5bb00] ring-4 ring-[#f5bb00]/10' : 'border-gray-100'}`}>
                                        <div className="flex items-start gap-4">
                                            <button onClick={() => toggleStage(s.id)} disabled={!signedIn}
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
                    </div>
                </SectionWrapper>
            )}

            <SectionWrapper>
                <div className="rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5bb00] rounded-full blur-[100px] opacity-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20" />

                    <h2 className="text-4xl md:text-6xl font-black text-black mb-8 relative z-10">Ready to Grow?</h2>
                    <p className="text-xl text-black mb-12 max-w-2xl mx-auto relative z-10">
                        Sign up for our next 'Foundations' class. Your journey starts today.
                    </p>
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        {enrolled ? (
                            <div className="flex items-center gap-3 bg-green-100 text-green-700 px-6 py-3 rounded-full font-semibold">
                                <CheckCircle className="w-5 h-5" />
                                Enrollment request submitted! We'll be in touch.
                            </div>
                        ) : (
                            <>
                                {enrollError && (
                                    <p className="text-red-400 text-sm">{enrollError}</p>
                                )}
                                <Button
                                    onClick={handleEnroll}
                                    disabled={enrollLoading}
                                    className="bg-[#f5bb00] text-[#140152] hover:bg-white font-black text-lg px-10 py-6 rounded-full"
                                >
                                    {enrollLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                    Enroll in Foundations Class
                                </Button>
                                <p className="text-gray-400 text-sm">Must be logged in to enroll</p>
                            </>
                        )}
                    </div>
                </div>
            </SectionWrapper>
        </>
    )
}

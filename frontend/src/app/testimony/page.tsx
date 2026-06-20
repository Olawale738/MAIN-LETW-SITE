'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Heart, Loader2, CheckCircle2 } from 'lucide-react'

import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { decisionsApi, ministryContentApi, type DecisionEntry } from '@/lib/api'

interface Content {
    hero_image: string
    hero_alt: string
    share_eyebrow: string
    share_title: string
    share_body: string
    name_label: string
    email_label: string
    testimony_label: string
    submit_button: string
    submitting_text: string
    success_title: string
    success_body: string
    success_again: string
    wall_eyebrow: string
    wall_title: string
    wall_subtitle: string
    empty_text: string
}

const DEFAULTS: Content = {
    hero_image: '/Testimonies.png',
    hero_alt: 'Testimonies',
    share_eyebrow: 'Testify',
    share_title: 'Share Your Story',
    share_body: 'We would love to hear what GOD has done in your life. Every testimony submitted is reviewed by our team and, once approved, joins the wall of praise below to encourage the body of Christ across the world.',
    name_label: 'Name',
    email_label: 'Email (optional)',
    testimony_label: 'Testimony',
    submit_button: 'Submit Testimony',
    submitting_text: 'Submitting…',
    success_title: 'Thank you!',
    success_body: 'Your testimony has been received. An admin will review and publish it shortly. Glory to God.',
    success_again: 'Share another',
    wall_eyebrow: 'Faith Builders',
    wall_title: 'Wall of Testimonies',
    wall_subtitle: 'What the Lord has done in our midst — salvations, healings, restoration, breakthroughs.',
    empty_text: 'No testimonies yet. Be the first to share!',
}

export default function TestimonyPage() {
    const [content, setContent] = useState<Content>(DEFAULTS)
    const [formData, setFormData] = useState({ name: '', email: '', testimony: '' })
    const [testimonies, setTestimonies] = useState<DecisionEntry[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [submitOk, setSubmitOk] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        ministryContentApi.get('testimony-page')
            .then(r => {
                const c = (r.content || {}) as Partial<Content>
                setContent({ ...DEFAULTS, ...c })
            })
            .catch(() => setContent(DEFAULTS))
    }, [])

    const load = async () => {
        try {
            const data = await decisionsApi.publicTestimonies(60)
            setTestimonies(data)
        } catch { /* graceful empty */ }
    }
    useEffect(() => { load() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.testimony.trim()) return
        setSubmitting(true); setError(null)
        try {
            await decisionsApi.publicSubmitTestimony({
                name: formData.name || 'Anonymous',
                email: formData.email || undefined,
                testimony: formData.testimony,
            })
            setSubmitOk(true)
            setFormData({ name: '', email: '', testimony: '' })
        } catch (err) { setError((err as Error).message || 'Could not submit.') }
        finally { setSubmitting(false) }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    return (
        <>
            <div className="w-full">
                {content.hero_image && <img src={content.hero_image} alt={content.hero_alt} className="w-full h-auto block" />}
            </div>

            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{content.share_eyebrow}</span>
                            <h2 className="text-4xl md:text-5xl font-black text-[#140152]">{content.share_title}</h2>
                        </div>
                        <p className="text-lg text-[#140152]/70 leading-relaxed font-medium whitespace-pre-wrap">
                            {content.share_body}
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <Heart className="w-6 h-6 text-rose-500 fill-current" />
                            <p className="text-sm text-[#140152]/70"><span className="font-bold">{testimonies.length}</span> approved testimon{testimonies.length === 1 ? 'y' : 'ies'} so far.</p>
                        </div>
                    </div>

                    {submitOk ? (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-10 rounded-[2.5rem] text-center">
                            <CheckCircle2 className="w-14 h-14 mx-auto text-green-600 mb-3" />
                            <h3 className="text-2xl font-black text-[#140152]">{content.success_title}</h3>
                            <p className="text-gray-600 mt-2 whitespace-pre-wrap">{content.success_body}</p>
                            <button onClick={() => setSubmitOk(false)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#140152] hover:underline">{content.success_again}</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">{content.name_label}</label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleChange} className="rounded-xl border-gray-100 h-14" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">{content.email_label}</label>
                                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="rounded-xl border-gray-100 h-14" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="testimony" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">{content.testimony_label}</label>
                                <Textarea id="testimony" name="testimony" required value={formData.testimony} onChange={handleChange} rows={8} className="rounded-2xl border-gray-100" />
                            </div>
                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
                            <Button type="submit" disabled={submitting || !formData.testimony.trim()} variant="primary" className="w-full h-14 rounded-full py-0.5 px-1 pl-5 shadow-[0_0_20px_rgba(245,187,0,0.5)] disabled:opacity-60">
                                <div className="flex items-center justify-between w-full px-4">
                                    <p>{submitting ? content.submitting_text : content.submit_button}</p>
                                    {submitting ? <Loader2 className="w-4 h-4 text-[#140152] animate-spin" /> : <ArrowRight className="w-4 h-4 text-[#140152] -rotate-45" />}
                                </div>
                            </Button>
                        </form>
                    )}
                </div>
            </SectionWrapper>

            <SectionWrapper background="gray">
                <div className="text-center mb-16 space-y-4">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{content.wall_eyebrow}</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#140152]">{content.wall_title}</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                    <p className="text-[#140152]/70 max-w-xl mx-auto whitespace-pre-wrap">{content.wall_subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {testimonies.length > 0 ? (
                        testimonies.map((t) => (
                            <Card key={t.id} className="hover:shadow-xl transition-all duration-300 border-none shadow-lg group bg-white">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-[#140152]/5 rounded-xl flex items-center justify-center text-[#140152] text-2xl font-black mb-4 group-hover:bg-[#f5bb00] group-hover:text-[#140152] transition-colors">"</div>
                                    <CardTitle className="text-[#140152] text-base font-bold uppercase tracking-wider">{t.kind.replace('_', ' ')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed font-medium italic line-clamp-6">"{t.testimony}"</p>
                                    <div className="mt-6 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-[#140152] to-[#f5bb00] rounded-full text-white flex items-center justify-center font-black">
                                            {(t.person_name || 'A').slice(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[#140152] font-bold text-sm">{t.person_name}</p>
                                            <p className="text-xs text-[#f5bb00] font-bold uppercase tracking-wider">{new Date(t.decided_on).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}{t.location ? ` · ${t.location}` : ''}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center col-span-full text-gray-500 py-12">{content.empty_text}</p>
                    )}
                </div>
            </SectionWrapper>
        </>
    )
}

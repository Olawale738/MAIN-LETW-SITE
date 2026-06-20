'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
    Heart, ShieldCheck, Cross, HandHeart, Phone, Send, Loader2,
    CheckCircle, AlertCircle, Sparkles, Mail, MessageCircle, Clock
} from 'lucide-react'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { lifeEventApi } from '@/lib/api'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

/**
 * Funeral / memorial pastoral care request.
 *
 * Distinct from the celebratory life-event flow at /life-events — bereavement
 * deserves its own tone, its own emergency channel, and its own intake. Submits
 * to the same backend (lifeEventApi.submit kind='funeral') so admin still
 * receives the request in their /admin/life-events queue.
 */
export default function FuneralServicesPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [relationship, setRelationship] = useState('')
    const [deceasedName, setDeceasedName] = useState('')
    const [preferredDate, setPreferredDate] = useState('')
    const [alternateDate, setAlternateDate] = useState('')
    const [serviceType, setServiceType] = useState('Burial Service')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const submit = async () => {
        if (!name || !email || !preferredDate) return
        setSubmitting(true); setErr(null)
        try {
            const details = {
                relationship_to_deceased: relationship || undefined,
                name_of_deceased: deceasedName || undefined,
                service_type: serviceType,
                notes: notes || undefined,
            }
            await lifeEventApi.submit({
                kind: 'funeral',
                requester_name: name,
                requester_email: email,
                requester_phone: phone || undefined,
                preferred_date: preferredDate,
                alternate_date: alternateDate || undefined,
                details,
            })
            setSubmitted(true)
        } catch (e) { setErr((e as Error).message) }
        finally { setSubmitting(false) }
    }

    if (submitted) {
        return (
            <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h2 className="text-2xl font-black text-[#140152]">We have received your request</h2>
                    <p className="text-gray-600 mt-3">A pastor will reach out within 24 hours to walk this with you. Our prayers are with you and your family.</p>
                    <p className="text-xs text-gray-400 italic mt-6">"Blessed are those who mourn, for they will be comforted." — Matthew 5:4</p>
                    <Link href="/" className="inline-block mt-6 text-sm font-bold text-[#140152] hover:underline">Return home</Link>
                </div>
            </main>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageCmsOverlay slug="services-funeral" position="top" />

            {/* Hero — dignified, restrained */}
            <div className="relative bg-gradient-to-b from-[#0e0035] to-[#140152] py-28 px-4 text-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_30%,#f5bb00,transparent_60%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f5bb00]/50 to-transparent" />
                <div className="relative z-10 max-w-3xl mx-auto">
                    <Cross className="w-10 h-10 mx-auto text-[#f5bb00] mb-5 opacity-80" />
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Pastoral Care &middot; Bereavement</span>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">Funeral &amp; Memorial Services</h1>
                    <p className="text-lg text-blue-200 font-light leading-relaxed max-w-xl mx-auto">
                        Walking with families through loss with dignity, compassion, and the unshakeable hope of the resurrection.
                    </p>
                </div>
            </div>

            {/* Emergency contact strip */}
            <div className="bg-[#140152] border-y border-[#f5bb00]/20">
                <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-white">
                    <div className="inline-flex items-center gap-3">
                        <Phone className="w-5 h-5 text-[#f5bb00]" />
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#f5bb00] font-bold">If the bereavement is recent</p>
                            <p className="text-sm">Call the pastoral care line — we'll respond within hours, day or night.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a href="tel:+2348000000000" className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-4 py-2.5 rounded-full text-sm">
                            <Phone className="w-4 h-4" /> Call now
                        </a>
                        <a href="mailto:care@letw.org" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-full text-sm border border-white/20">
                            <Mail className="w-4 h-4" /> Email care@letw.org
                        </a>
                    </div>
                </div>
            </div>

            <SectionWrapper>
                {/* Pillars */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-5xl mx-auto">
                    {[
                        { icon: HandHeart, color: 'bg-rose-100 text-rose-600', title: 'Compassionate', desc: 'You are not walking this alone.' },
                        { icon: ShieldCheck, color: 'bg-blue-100 text-blue-600', title: 'Dignified', desc: 'A service that honours your loved one.' },
                        { icon: Sparkles, color: 'bg-amber-100 text-amber-600', title: 'Hope-Filled', desc: 'Anchored in the promise of resurrection.' },
                        { icon: Clock, color: 'bg-emerald-100 text-emerald-600', title: 'Responsive', desc: 'A pastor reaches out within 24 hours.' },
                    ].map(({ icon: Icon, color, title, desc }) => (
                        <div key={title} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
                            <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-[#140152] mb-1 text-sm">{title}</h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                    {/* WHAT WE PROVIDE */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-[#140152]">What we provide</h2>
                        <div className="w-16 h-1.5 bg-[#f5bb00] rounded-full" />
                        <p className="text-gray-600 leading-relaxed">
                            Whether it's an immediate need or a service you're planning ahead, our pastoral team is here to coordinate every part of the farewell with you.
                        </p>
                        {[
                            { title: 'Burial Service', desc: 'A full Christian service for interment — eulogies, scripture, pastoral message, and committal at graveside.' },
                            { title: 'Memorial / Wake-Keeping', desc: 'A worshipful gathering in honour of the departed — songs, testimony, and ministry of the Word.' },
                            { title: 'Graveside Service', desc: 'A shorter, intimate committal service for close family at the gravesite.' },
                            { title: 'Pastoral Visitation & Counselling', desc: 'Home visits and grief counselling for the bereaved family before and after the service.' },
                            { title: 'Bereavement Support Group', desc: 'Optional ongoing community to walk through grief alongside others who understand.' },
                        ].map(({ title, desc }) => (
                            <div key={title} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                                <div className="w-10 h-10 bg-[#140152]/5 text-[#140152] rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#140152]">{title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}

                        <div className="bg-[#140152] text-white p-6 rounded-2xl">
                            <h3 className="font-bold flex items-center gap-2 mb-2"><MessageCircle className="w-5 h-5 text-[#f5bb00]" /> Prefer to talk first?</h3>
                            <p className="text-blue-200 text-sm leading-relaxed">We understand. Use the chat at the bottom-right of the screen, or call the pastoral care line above. A real person, not a script.</p>
                        </div>
                    </div>

                    {/* INTAKE FORM */}
                    <div>
                        <Card className="border-none shadow-2xl sticky top-24">
                            <CardHeader className="bg-[#f5bb00] text-[#140152] rounded-t-xl p-6">
                                <CardTitle className="text-2xl font-black">Request a Service</CardTitle>
                                <p className="text-sm font-medium opacity-90 mt-1">A pastor will reach out within 24 hours.</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                {err && (
                                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" /><span className="text-sm">{err}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Your name *</label>
                                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f5bb00] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Relationship</label>
                                            <input value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="Spouse, son, friend…" className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f5bb00] outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email *</label>
                                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f5bb00] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Phone</label>
                                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="So we can reach you fast" className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f5bb00] outline-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Name of the departed</label>
                                        <input value={deceasedName} onChange={e => setDeceasedName(e.target.value)} placeholder="(optional)" className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f5bb00] outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Service requested</label>
                                        <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f5bb00] outline-none">
                                            <option>Burial Service</option>
                                            <option>Memorial / Wake-Keeping</option>
                                            <option>Graveside Service</option>
                                            <option>Pastoral Visitation Only</option>
                                            <option>Not sure yet — please advise</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Preferred date *</label>
                                            <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f5bb00] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Alternate date</label>
                                            <input type="date" value={alternateDate} onChange={e => setAlternateDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f5bb00] outline-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Anything else we should know</label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Location preferences, family situation, special requests, eulogies planned, hymns, etc." className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#f5bb00] outline-none resize-y" />
                                    </div>

                                    <Button onClick={submit} disabled={submitting || !name || !email || !preferredDate}
                                        className="w-full bg-[#140152] hover:bg-[#1d0175] text-white font-black py-6 text-base rounded-xl disabled:opacity-50">
                                        {submitting ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin inline" /> Sending…</>) : (<><Send className="w-5 h-5 mr-2 inline" /> Send request</>)}
                                    </Button>
                                    <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                                        Held in confidence. A pastor will respond within 24 hours by phone or email.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SectionWrapper>

            {/* Scripture closing */}
            <div className="bg-white border-t border-gray-100">
                <div className="max-w-3xl mx-auto px-6 py-16 text-center">
                    <Cross className="w-8 h-8 mx-auto text-[#f5bb00]/70 mb-4" />
                    <p className="text-xl md:text-2xl text-[#140152] font-medium italic leading-relaxed">
                        "I am the resurrection and the life. The one who believes in me will live, even though they die."
                    </p>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-[0.3em] mt-4">John 11:25</p>
                </div>
            </div>

            <PageCmsOverlay slug="services-funeral" position="bottom" />
        </div>
    )
}

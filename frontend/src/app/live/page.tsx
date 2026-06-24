'use client'
import { useEffect, useState } from 'react'
import { Radio, Heart, Hand, Cross, CheckCircle2, Loader2, Calendar, Users, Send } from 'lucide-react'
import { onlineCampusApi, type CurrentService } from '@/lib/api'
import LiveCoExperience from '@/components/live/LiveCoExperience'
import { useT } from '@/lib/i18n'
import { toEmbedUrl } from '@/lib/youtube'

const ALTAR_KINDS = [
    { key: 'salvation',         label: 'I want to give my life to Jesus' },
    { key: 'rededication',      label: 'I want to rededicate my life' },
    { key: 'baptism_request',   label: 'I want to be baptized' },
    { key: 'prayer_for_healing', label: 'I need prayer for healing' },
    { key: 'other',             label: 'Other prayer need' },
]

export default function LivePage() {
    const { t } = useT()
    const [service, setService] = useState<CurrentService | null>(null)
    const [loading, setLoading] = useState(true)
    const [showAltar, setShowAltar] = useState(false)
    const [showRaiseHand, setShowRaiseHand] = useState(false)
    const [showCommunion, setShowCommunion] = useState(false)

    useEffect(() => {
        const load = () => onlineCampusApi.current().then(setService).catch(() => {})
        load()
        const id = setInterval(load, 15000)
        return () => clearInterval(id)
    }, [])

    if (loading && !service) {
        setTimeout(() => setLoading(false), 100)
        return <div className="min-h-screen flex items-center justify-center bg-[#140152]"><Loader2 className="w-10 h-10 animate-spin text-[#f5bb00]" /></div>
    }

    const isLive = service?.status === 'live'
    const upcoming = service?.status === 'upcoming'

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#140152] via-[#1a0270] to-[#140152] text-white">
            <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-12">
                <div className="text-center mb-8">
                    <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3 inline-flex items-center gap-2">
                        {isLive && <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live now</>}
                        {upcoming && <><Calendar className="w-3.5 h-3.5" /> {t('live.upcoming', 'Upcoming')}</>}
                        {!service?.status || service.status === 'none' ? <Radio className="w-3.5 h-3.5" /> : null}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black">{service?.title || t('live.title')}</h1>
                    {service?.description && <p className="text-white/70 mt-3 max-w-2xl mx-auto">{service.description}</p>}
                    {service?.scheduled_at && upcoming && (
                        <p className="text-sm text-white/60 mt-4">Begins {new Date(service.scheduled_at).toLocaleString()}</p>
                    )}
                    {isLive && service?.viewer_count !== undefined && (
                        <p className="text-xs text-white/60 mt-2 inline-flex items-center gap-1.5"><Users className="w-3 h-3" /> {service.viewer_count.toLocaleString()} {t('live.watching')}</p>
                    )}
                </div>

                {isLive && service?.livestream_url && (
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl mb-8">
                        <iframe
                            src={toEmbedUrl(service.livestream_url, { autoplay: true })}
                            className="w-full h-full"
                            allowFullScreen
                            allow="autoplay; encrypted-media; picture-in-picture"
                        />
                    </div>
                )}
                {isLive && !service?.livestream_url && (
                    // Service is marked live but no stream URL is wired up — show a
                    // soft placeholder pointing an admin to the right page.
                    <div className="aspect-video bg-gradient-to-br from-[#1a0270] via-[#140152] to-[#0a0028] rounded-3xl overflow-hidden shadow-2xl mb-8 flex flex-col items-center justify-center text-center p-8">
                        <Radio className="w-12 h-12 text-[#f5bb00] mb-4 animate-pulse" />
                        <p className="text-[#f5bb00] text-xs font-black uppercase tracking-[0.3em] mb-2">Stream URL missing</p>
                        <h3 className="text-white text-2xl font-black mb-2">Live now — video coming soon</h3>
                        <p className="text-white/60 max-w-md text-sm leading-relaxed">
                            An admin can paste the YouTube live URL at <span className="font-mono text-white/80">/admin/online-campus</span> and it&apos;ll appear here within seconds.
                        </p>
                    </div>
                )}

                {(isLive || upcoming) && (
                    <div className="grid sm:grid-cols-3 gap-4">
                        {service?.altar_call_open && (
                            <button onClick={() => setShowAltar(true)} className="bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-[#140152] rounded-3xl p-6 text-left shadow-lg hover:scale-105 transition-all">
                                <Cross className="w-8 h-8 mb-3" />
                                <p className="font-black text-lg">{t('live.altarCall')}</p>
                                <p className="text-xs mt-1 opacity-80">Heaven is rejoicing</p>
                            </button>
                        )}
                        {service?.raise_hand_enabled && (
                            <button onClick={() => setShowRaiseHand(true)} className="bg-gradient-to-br from-[#f5bb00] to-[#ffc820] hover:from-[#ffc820] hover:to-[#ffd64d] text-[#140152] rounded-3xl p-6 text-left shadow-lg hover:scale-105 transition-all">
                                <Hand className="w-8 h-8 mb-3" />
                                <p className="font-black text-lg">{t('live.raiseHand')}</p>
                                <p className="text-xs mt-1 opacity-80">A pastor will message you</p>
                            </button>
                        )}
                        <button onClick={() => setShowCommunion(true)} className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-3xl p-6 text-left shadow-lg hover:scale-105 transition-all">
                            <Heart className="w-8 h-8 mb-3" />
                            <p className="font-black text-lg">{t('live.communion')}</p>
                            <p className="text-xs mt-1 opacity-90">Online ordinance with a pastor</p>
                        </button>
                    </div>
                )}

                {!service || service.status === 'none' ? (
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-10 text-center">
                        <Radio className="w-12 h-12 text-[#f5bb00] mx-auto mb-4 opacity-50" />
                        <p className="text-white/70">No service is currently live. Check back at our next scheduled service time.</p>
                    </div>
                ) : null}
            </section>

            {/* Watch-party chat + live captions — gated by isLive so the panel
                  ONLY appears while a service is actually streaming. When the
                  service ends, the section disappears entirely. */}
            {isLive && service?.id && (
                <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
                    <LiveCoExperience serviceId={service.id} defaultTab="chat" />
                </section>
            )}

            {showAltar && <AltarCallModal serviceId={service?.id} onClose={() => setShowAltar(false)} />}
            {showRaiseHand && <RaiseHandModal serviceId={service?.id} onClose={() => setShowRaiseHand(false)} />}
            {showCommunion && <CommunionModal onClose={() => setShowCommunion(false)} />}
        </main>
    )
}

function AltarCallModal({ serviceId, onClose }: { serviceId?: string; onClose: () => void }) {
    const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('')
    const [kind, setKind] = useState('salvation'); const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false); const [done, setDone] = useState(false)

    const submit = async () => {
        if (!name) return
        setSubmitting(true)
        try {
            await onlineCampusApi.altarCall({ name, email: email || undefined, phone: phone || undefined, kind, note: note || undefined, service_id: serviceId })
            setDone(true)
        } catch (e) { alert((e as Error).message) }
        finally { setSubmitting(false) }
    }

    return (
        <Modal title="Respond to the altar" onClose={onClose}>
            {done ? (
                <div className="text-center py-6">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <h3 className="text-2xl font-black text-[#140152]">Welcome home.</h3>
                    <p className="text-gray-600 mt-3">"There is joy in the presence of the angels of God over one sinner that repenteth." — Luke 15:10</p>
                    <p className="text-sm text-gray-500 mt-4">A pastor will reach out within 24 hours.</p>
                </div>
            ) : (
                <>
                    <p className="text-xs font-bold uppercase text-gray-500 mb-2">What is on your heart?</p>
                    <div className="space-y-2 mb-4">
                        {ALTAR_KINDS.map(k => (
                            <button key={k.key} onClick={() => setKind(k.key)} className={`w-full text-left px-4 py-3 rounded-xl border ${kind === k.key ? 'border-[#140152] bg-[#140152]/5 text-[#140152] font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                                {k.label}
                            </button>
                        ))}
                    </div>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name *" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                    </div>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Optional note for the pastor…" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4" />
                    <button onClick={submit} disabled={!name || submitting} className="w-full bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-3 rounded-xl text-lg disabled:opacity-50 inline-flex items-center justify-center gap-2">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Send response
                    </button>
                </>
            )}
        </Modal>
    )
}

function RaiseHandModal({ serviceId, onClose }: { serviceId?: string; onClose: () => void }) {
    const [name, setName] = useState(''); const [message, setMessage] = useState('')
    const [submitting, setSubmitting] = useState(false); const [done, setDone] = useState(false)

    const submit = async () => {
        setSubmitting(true)
        try {
            await onlineCampusApi.raiseHand({ display_name: name || 'Online attendee', message: message || undefined, service_id: serviceId })
            setDone(true)
        } catch (e) { alert((e as Error).message) }
        finally { setSubmitting(false) }
    }

    return (
        <Modal title="Raise your hand" onClose={onClose}>
            {done ? (
                <div className="text-center py-6">
                    <Hand className="w-14 h-14 text-[#f5bb00] mx-auto mb-3" />
                    <h3 className="text-2xl font-black text-[#140152]">Hand raised.</h3>
                    <p className="text-gray-600 mt-3">A pastor will message you shortly during the service.</p>
                </div>
            ) : (
                <>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (or stay anonymous)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="What do you need? (optional)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4" />
                    <button onClick={submit} disabled={submitting} className="w-full bg-[#f5bb00] hover:bg-[#ffc820] text-[#140152] font-black px-6 py-3 rounded-xl text-lg disabled:opacity-50">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin inline" /> : <Hand className="w-5 h-5 inline mr-2" />} Raise hand
                    </button>
                </>
            )}
        </Modal>
    )
}

function CommunionModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [date, setDate] = useState(''); const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false); const [done, setDone] = useState(false)

    const submit = async () => {
        if (!name || !email || !date) return
        setSubmitting(true)
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
            await onlineCampusApi.requestCommunion({ name, email, requested_date: date, timezone: tz, note: note || undefined })
            setDone(true)
        } catch (e) { alert((e as Error).message) }
        finally { setSubmitting(false) }
    }

    return (
        <Modal title="Online Communion" onClose={onClose}>
            {done ? (
                <div className="text-center py-6">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <h3 className="text-2xl font-black text-[#140152]">Requested.</h3>
                    <p className="text-gray-600 mt-3">An online pastor will email you within 48 hours to confirm your communion appointment.</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-600 mb-4">Prepare bread and a cup of juice. A pastor will lead you through the ordinance one-on-one via video call at the scheduled time.</p>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name *" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email *" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3" />
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Any specific request or testimony…" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4" />
                    <button onClick={submit} disabled={!name || !email || !date || submitting} className="w-full bg-[#140152] hover:bg-[#1d0175] text-white font-black px-6 py-3 rounded-xl text-lg disabled:opacity-50">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin inline" /> : 'Request communion'}
                    </button>
                </>
            )}
        </Modal>
    )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white text-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-[#140152]">{title}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">×</button>
                </div>
                {children}
            </div>
        </div>
    )
}

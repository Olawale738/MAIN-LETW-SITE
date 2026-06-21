'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Mic, Volume2, Pause, Play, Sparkles, Smartphone, Watch, Mail, Copy } from 'lucide-react'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'

/**
 * Voice & smart speaker hub.
 *
 * - Browser-based TTS demo using the Web Speech API: any visitor can hear the
 *   daily verse, a prayer, or a recent sermon excerpt read aloud right in
 *   their browser.
 * - Setup guides + sample commands for Alexa, Google Assistant, Siri Shortcuts.
 * - Quick-copy phrases.
 */

const DEMO_LINES = [
    { id: 'verse',  title: "Today's verse",     text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. Proverbs 3:5." },
    { id: 'prayer', title: 'Morning prayer',    text: "Heavenly Father, thank you for the gift of today. Lead me, guide me, and let your light shine through everything I do. In Jesus' name, amen." },
    { id: 'serm',   title: 'Sermon snippet',    text: "God's purpose for your life doesn't change just because the seasons do. Trust him in the quiet moments. He is working." },
]

const ASSISTANT_COMMANDS = [
    { ass: 'Alexa',          phrase: "Alexa, open LETW and read today's verse." },
    { ass: 'Google Assistant', phrase: "Hey Google, ask Light Encounter Tabernacle for today's verse." },
    { ass: 'Siri',           phrase: "Hey Siri, run Daily Verse." },
]

export default function VoicePage() {
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [voiceURI, setVoiceURI] = useState<string>('')
    const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
        const load = () => {
            const v = window.speechSynthesis.getVoices()
            setVoices(v)
            if (!voiceURI && v.length) setVoiceURI(v.find(x => /en/i.test(x.lang))?.voiceURI || v[0].voiceURI)
        }
        load()
        window.speechSynthesis.onvoiceschanged = load
        return () => { try { window.speechSynthesis.cancel() } catch { /* noop */ } }
    }, [voiceURI])

    const play = (id: string, text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            alert('Your browser does not support speech synthesis.')
            return
        }
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        const v = voices.find(x => x.voiceURI === voiceURI)
        if (v) u.voice = v
        u.rate = 0.95; u.pitch = 1
        u.onend = () => setPlayingId(null)
        u.onerror = () => setPlayingId(null)
        utterRef.current = u
        window.speechSynthesis.speak(u)
        setPlayingId(id)
    }
    const stop = () => {
        try { window.speechSynthesis.cancel() } catch { /* noop */ }
        setPlayingId(null)
    }
    const copy = (text: string) => { try { navigator.clipboard.writeText(text) } catch { /* noop */ } }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <PageCmsOverlay slug="voice" position="top" />

            <section className="max-w-4xl mx-auto px-6 pt-24 pb-12 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.35em] text-[10px] uppercase mb-3 inline-flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Voice & Smart Speakers
                </p>
                <h1 className="font-serif text-4xl md:text-6xl font-black text-[#140152] leading-tight">
                    Hear the Word, <span className="bg-gradient-to-r from-[#f5bb00] via-amber-500 to-[#f5bb00] bg-clip-text text-transparent">anywhere</span>
                </h1>
                <p className="font-sans text-[#140152]/70 mt-4 max-w-xl mx-auto leading-relaxed">
                    From your kitchen speaker to your morning commute — bring scripture, prayer, and sermon snippets to every room of your life.
                </p>
            </section>

            {/* Demo card */}
            <section className="max-w-3xl mx-auto px-6 pb-8">
                <div className="bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#f5bb00]/20 blur-3xl pointer-events-none" />
                    <div className="relative">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-[#f5bb00] font-black mb-2 inline-flex items-center gap-2">
                            <Volume2 className="w-3.5 h-3.5" /> Listen in your browser
                        </p>
                        <h2 className="font-serif text-2xl font-black mb-4">Try the voice demo</h2>

                        {voices.length > 0 && (
                            <div className="mb-5">
                                <label className="text-xs uppercase tracking-wider text-white/60 font-bold block mb-1">Voice</label>
                                <select value={voiceURI} onChange={e => setVoiceURI(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white max-w-full">
                                    {voices.map(v => (
                                        <option key={v.voiceURI} value={v.voiceURI} className="text-black">
                                            {v.name} — {v.lang}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-3">
                            {DEMO_LINES.map(l => (
                                <div key={l.id} className="bg-white/5 backdrop-blur border border-white/15 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => playingId === l.id ? stop() : play(l.id, l.text)}
                                            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${playingId === l.id ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#f5bb00] hover:bg-amber-400 text-[#140152]'}`}>
                                            {playingId === l.id ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 ml-0.5" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-widest text-[#f5bb00] font-bold">{l.title}</p>
                                            <p className="text-sm leading-relaxed mt-1">{l.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Smart speaker setup */}
            <section className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-8">
                    <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-[10px] uppercase">Voice assistants</p>
                    <h2 className="font-serif text-3xl md:text-4xl font-black text-[#140152] mt-2">Try these commands</h2>
                    <p className="text-[#140152]/70 mt-2 text-sm">Skills/Actions are rolling out region by region. Tap to copy any phrase.</p>
                </div>
                <div className="space-y-3">
                    {ASSISTANT_COMMANDS.map(c => (
                        <div key={c.ass} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-[#140152] text-[#f5bb00] rounded-xl flex items-center justify-center flex-shrink-0">
                                <Mic className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-widest font-black text-[#140152]/60">{c.ass}</p>
                                <p className="font-serif italic text-[#140152] text-base md:text-lg leading-snug">"{c.phrase}"</p>
                            </div>
                            <button onClick={() => copy(c.phrase)} title="Copy phrase"
                                className="p-2 text-gray-400 hover:text-[#140152] hover:bg-gray-50 rounded-lg">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Where you can listen */}
            <section className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-8">
                    <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-[10px] uppercase">Listen everywhere</p>
                    <h2 className="font-serif text-3xl md:text-4xl font-black text-[#140152] mt-2">All the places</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Phone',       icon: <Smartphone className="w-5 h-5" />,  hint: 'PWA installs like a native app' },
                        { label: 'Smart speaker', icon: <Volume2 className="w-5 h-5" />, hint: 'Echo, Nest, HomePod' },
                        { label: 'Smart watch', icon: <Watch className="w-5 h-5" />,      hint: 'Verse on your wrist' },
                        { label: 'Podcasts',    icon: <Mail className="w-5 h-5" />,       hint: 'Apple · Spotify · Google' },
                    ].map(p => (
                        <div key={p.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
                            <div className="w-12 h-12 mx-auto bg-[#140152]/5 text-[#140152] rounded-xl flex items-center justify-center mb-2">{p.icon}</div>
                            <p className="font-black text-[#140152] text-sm">{p.label}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{p.hint}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <Link href="/sermons/podcast.xml" className="inline-flex items-center gap-2 text-sm font-bold text-[#140152] hover:underline">
                        Sermon podcast RSS feed →
                    </Link>
                </div>
            </section>

            <PageCmsOverlay slug="voice" position="bottom" />
        </main>
    )
}

'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Loader2, Globe2, Pin, Sparkles } from 'lucide-react'
import { liveExpApi, tokenManager, type LiveChatMessage, type LiveCaption } from '@/lib/api'

const LANG_LABELS: Record<string, string> = {
    // Africa
    yo: 'Yorùbá', ig: 'Igbo', ha: 'Hausa', sw: 'Kiswahili', am: 'አማርኛ (Amharic)',
    zu: 'isiZulu', xh: 'isiXhosa', af: 'Afrikaans', so: 'Soomaali', om: 'Oromoo', ti: 'ትግርኛ (Tigrinya)',
    // Europe + global
    en: 'English', es: 'Español', pt: 'Português', fr: 'Français', de: 'Deutsch',
    it: 'Italiano', nl: 'Nederlands', ru: 'Русский', pl: 'Polski', uk: 'Українська',
    ro: 'Română', el: 'Ελληνικά', tr: 'Türkçe',
    // Middle East
    ar: 'العربية', he: 'עברית', fa: 'فارسی', ur: 'اردو',
    // South Asia
    hi: 'हिन्दी', bn: 'বাংলা', ta: 'தமிழ்', te: 'తెలుగు', ml: 'മലയാളം',
    mr: 'मराठी', pa: 'ਪੰਜਾਬੀ',
    // East / Southeast Asia
    zh: '中文 (简体)', 'zh-TW': '中文 (繁體)', ja: '日本語', ko: '한국어',
    vi: 'Tiếng Việt', th: 'ภาษาไทย', id: 'Bahasa Indonesia', ms: 'Bahasa Melayu', tl: 'Filipino',
}

/**
 * Watch-party chat + multilingual live captions for /live.
 * - Polls chat every 5s for new messages.
 * - Polls captions every 4s and shows the last ~6 lines in the chosen language.
 * - Requires sign-in to post (server enforces).
 */
export default function LiveCoExperience({ serviceId, defaultTab = 'chat' }: { serviceId?: string | null; defaultTab?: 'chat' | 'captions' }) {
    const [tab, setTab] = useState<'chat' | 'captions'>(defaultTab)
    const [messages, setMessages] = useState<LiveChatMessage[]>([])
    const [body, setBody] = useState('')
    const [posting, setPosting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scrollerRef = useRef<HTMLDivElement>(null)

    const [captions, setCaptions] = useState<LiveCaption[]>([])
    const [sourceLang, setSourceLang] = useState<string | null>(null)
    const [isActive, setIsActive] = useState(false)
    // Auto-detect the viewer's preferred language from the browser. If their
    // locale matches one of our supported codes we default to it; otherwise
    // they get English and can change from the dropdown.
    const detectBrowserLang = (): string => {
        if (typeof navigator === 'undefined') return 'en'
        const candidates = [navigator.language, ...(navigator.languages || [])]
        const supported = new Set([
            'en','es','pt','fr','de','it','nl','ru','pl','uk','ro','el','tr',
            'ar','he','fa','ur','hi','bn','ta','te','ml','mr','pa',
            'zh','zh-TW','ja','ko','vi','th','id','ms','tl',
            'yo','ig','ha','sw','am','zu','xh','af','so','om','ti',
        ])
        for (const c of candidates) {
            if (!c) continue
            if (supported.has(c)) return c
            const short = c.split('-')[0]
            if (supported.has(short)) return short
        }
        return 'en'
    }
    const [language, setLanguage] = useState(detectBrowserLang)
    // Frontend fallback so the dropdown shows every language even before the
    // backend redeploys with its expanded CAPTION_LANGUAGES list. Once the API
    // returns its own list (which may be wider or narrower), it overrides this.
    const FALLBACK_LANGS = [
        'en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'ru', 'pl', 'uk', 'ro', 'el', 'tr',
        'ar', 'he', 'fa', 'ur',
        'hi', 'bn', 'ta', 'te', 'ml', 'mr', 'pa',
        'zh', 'zh-TW', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'tl',
        'yo', 'ig', 'ha', 'sw', 'am', 'zu', 'xh', 'af', 'so', 'om', 'ti',
    ]
    const [languages, setLanguages] = useState<string[]>(FALLBACK_LANGS)

    // Load chat
    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const data = await liveExpApi.listChat({ service_id: serviceId || undefined, limit: 200 })
                if (mounted) setMessages(data)
            } catch { /* noop */ }
        }
        load()
        const id = setInterval(load, 5000)
        return () => { mounted = false; clearInterval(id) }
    }, [serviceId])

    // Auto-scroll
    useEffect(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages.length])

    // Load caption languages once. Backend list overrides our fallback when
    // it returns a larger set; if it returns fewer we keep the fallback so
    // users on the public site never see a shrunken dropdown during a deploy.
    useEffect(() => {
        liveExpApi.captionLanguages()
            .then(r => {
                if (Array.isArray(r.languages) && r.languages.length >= FALLBACK_LANGS.length) {
                    setLanguages(r.languages)
                }
            })
            .catch(() => { /* keep fallback */ })
    }, [])

    // Load captions per chosen language
    useEffect(() => {
        if (!serviceId) return
        let mounted = true
        const load = async () => {
            try {
                const data = await liveExpApi.listCaptions({ service_id: serviceId, language })
                if (mounted) setCaptions(data.slice(-8))
            } catch { /* noop */ }
        }
        load()
        const id = setInterval(load, 4000)
        return () => { mounted = false; clearInterval(id) }
    }, [serviceId, language])

    // Poll the "what is the operator broadcasting in" state so we can show
    // "Speaker is in {X}" instead of a hardcoded English label.
    useEffect(() => {
        if (!serviceId) { setSourceLang(null); setIsActive(false); return }
        let mounted = true
        const load = async () => {
            try {
                const s = await liveExpApi.captionState(serviceId)
                if (!mounted) return
                setSourceLang(s.source_language)
                setIsActive(!!s.is_active)
            } catch { /* keep last known */ }
        }
        load()
        const id = setInterval(load, 5000)
        return () => { mounted = false; clearInterval(id) }
    }, [serviceId])

    const submit = async () => {
        if (!body.trim()) return
        if (!tokenManager.isLoggedIn()) { setError('Please sign in to chat.'); return }
        setPosting(true); setError(null)
        try {
            await liveExpApi.post({ service_id: serviceId || undefined, body: body.trim() })
            setBody('')
            // immediate refresh
            const data = await liveExpApi.listChat({ service_id: serviceId || undefined, limit: 200 })
            setMessages(data)
        } catch (e) { setError((e as Error).message) }
        finally { setPosting(false) }
    }

    return (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-w-3xl mx-auto">
            {/* Tab strip */}
            <div className="flex items-center border-b border-gray-100">
                <button onClick={() => setTab('chat')}
                    className={`flex-1 px-5 py-3 text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 ${tab === 'chat' ? 'text-[#140152] border-b-2 border-[#f5bb00] -mb-px bg-[#f5bb00]/5' : 'text-gray-400'}`}>
                    <MessageCircle className="w-4 h-4" /> Watch party
                </button>
                <button onClick={() => setTab('captions')}
                    className={`flex-1 px-5 py-3 text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 ${tab === 'captions' ? 'text-[#140152] border-b-2 border-[#f5bb00] -mb-px bg-[#f5bb00]/5' : 'text-gray-400'}`}>
                    <Globe2 className="w-4 h-4" /> Live captions
                </button>
            </div>

            {tab === 'chat' ? (
                <div className="flex flex-col h-[500px]">
                    <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40">
                        {messages.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-12">Be the first to say hi.</p>
                        ) : messages.map(m => (
                            <div key={m.id} className={`${m.is_pinned ? 'bg-[#f5bb00]/10 border-2 border-[#f5bb00]/40' : 'bg-white border border-gray-100'} rounded-2xl p-3 shadow-sm`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-full bg-[#140152] text-[#f5bb00] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                        {m.display_name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <p className="text-xs font-bold text-[#140152]">{m.display_name}</p>
                                    {m.is_pinned && <Pin className="w-3 h-3 text-[#f5bb00]" />}
                                    <span className="text-[10px] text-gray-400 ml-auto">{new Date(m.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-sm text-gray-800 leading-relaxed">{m.body}</p>
                            </div>
                        ))}
                    </div>
                    {error && <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-t border-red-100">{error}</div>}
                    <div className="border-t border-gray-100 p-3 flex items-center gap-2">
                        <input value={body} onChange={e => setBody(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submit()}
                            placeholder="Share an amen, a prayer, a verse…" maxLength={500}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                        <button onClick={submit} disabled={!body.trim() || posting}
                            className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50">
                            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-[500px] bg-[#06002a] text-white">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
                        <div className="inline-flex items-center gap-2 flex-wrap">
                            <p className="text-[10px] uppercase tracking-widest font-black text-[#f5bb00] inline-flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Live AI translation
                            </p>
                            {isActive && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold uppercase tracking-widest">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300" />
                                    </span>
                                    In sync
                                </span>
                            )}
                        </div>
                        <select value={language} onChange={e => setLanguage(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs text-white">
                            {languages.map(l => <option key={l} value={l} className="text-black">{LANG_LABELS[l] || l.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 flex flex-col-reverse">
                        {captions.length === 0 ? (
                            <div className="m-auto text-center max-w-sm">
                                <div className="w-14 h-14 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center animate-pulse">
                                    <Globe2 className="w-6 h-6 text-[#f5bb00]" />
                                </div>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    Waiting for the speaker to begin…
                                </p>
                                <p className="text-white/40 text-xs mt-2">
                                    Captions in <strong className="text-white/70">{LANG_LABELS[language] || language}</strong> will stream here in real time once they start.
                                </p>
                            </div>
                        ) : captions.slice().reverse().map((c, i) => {
                            // RTL languages get auto-direction for proper rendering.
                            const isRtl = ['ar', 'he', 'fa', 'ur'].includes(language)
                            return (
                                <p key={c.id}
                                    dir={isRtl ? 'rtl' : 'ltr'}
                                    className={`leading-relaxed transition-opacity ${i === 0 ? 'text-white text-xl font-serif font-black' : 'text-white/60 text-base'}`}
                                    style={{ opacity: i === 0 ? 1 : Math.max(0.25, 1 - i * 0.18) }}>
                                    {c.text}
                                </p>
                            )
                        })}
                    </div>
                    <p className="px-4 py-2 text-[10px] text-white/50 text-center border-t border-white/10">
                        {sourceLang
                            ? <>Speaker is in <strong className="text-white/80">{LANG_LABELS[sourceLang] || sourceLang.toUpperCase()}</strong> · You&apos;re reading in <strong className="text-white/80">{LANG_LABELS[language] || language.toUpperCase()}</strong></>
                            : <>You&apos;re set to read in <strong className="text-white/80">{LANG_LABELS[language] || language.toUpperCase()}</strong>. The speaker&apos;s language will appear here once they begin.</>
                        }
                    </p>
                </div>
            )}
        </section>
    )
}

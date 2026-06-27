'use client'
/**
 * /admin/translations — per-locale dictionary editor.
 *
 * Pattern: each i18n key is a simple string. Admin picks a locale, sees every
 * key with the English value on the left and the translated value on the right.
 * Save commits the whole dictionary at once via ministry-content key
 * `translations:<locale>`.
 */
import { useEffect, useMemo, useState } from 'react'
import {
    Loader2, Save, CheckCircle, AlertCircle, Globe, Plus, Search,
} from 'lucide-react'
import { translationsApi } from '@/lib/api'

// Seed keys grouped by surface — admin can add more freely.
const SEED_KEYS: Record<string, string[]> = {
    'nav':       ['nav.home', 'nav.about', 'nav.services', 'nav.events', 'nav.sermons', 'nav.give', 'nav.ministries', 'nav.contact', 'nav.join', 'nav.live'],
    'hero':      ['hero.welcome', 'hero.subtitle', 'hero.cta_primary', 'hero.cta_secondary'],
    'live':      ['live.title', 'live.upcoming', 'live.watching', 'live.altarCall', 'live.raiseHand', 'live.communion'],
    'sermons':   ['sermons.title', 'sermons.subtitle', 'sermons.watch_now'],
    'footer':    ['footer.stay_connected', 'footer.contact_us', 'footer.service_times', 'footer.copyright'],
    'onboarding':['onboarding.welcome', 'onboarding.subtitle', 'onboarding.cta'],
    'common':    ['common.loading', 'common.save', 'common.cancel', 'common.delete', 'common.edit'],
}

const LOCALE_LABELS: Record<string, string> = {
    en: 'English', es: 'Español', pt: 'Português', fr: 'Français', de: 'Deutsch',
    it: 'Italiano', ar: 'العربية', zh: '中文', ja: '日本語', ko: '한국어',
    hi: 'हिन्दी', yo: 'Yorùbá', ig: 'Igbo', ha: 'Hausa', sw: 'Kiswahili', ru: 'Русский',
}

export default function TranslationsAdmin() {
    const [locales, setLocales] = useState<string[]>([])
    const [locale, setLocale] = useState<string>('es')
    const [enDict, setEnDict] = useState<Record<string, string>>({})
    const [dict, setDict] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [filter, setFilter] = useState('')
    const [newKey, setNewKey] = useState('')
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => { translationsApi.locales().then(r => setLocales(r.locales)).catch(() => { /* keep empty */ }) }, [])

    useEffect(() => {
        setLoading(true)
        // Load English (master) + the picked locale in parallel.
        Promise.all([
            translationsApi.get('en').then(r => r.translations).catch(() => ({})),
            translationsApi.get(locale).then(r => r.translations).catch(() => ({})),
        ]).then(([en, mine]) => {
            // Merge seed keys into the English dictionary so they always show.
            const seeded: Record<string, string> = {}
            const enMap = (en || {}) as Record<string, string>
            Object.values(SEED_KEYS).flat().forEach(k => { seeded[k] = enMap[k] || '' })
            setEnDict({ ...seeded, ...enMap })
            setDict(mine)
        }).finally(() => setLoading(false))
    }, [locale])

    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const keys = useMemo(() => {
        const all = Array.from(new Set([...Object.keys(enDict), ...Object.keys(dict)])).sort()
        if (!filter) return all
        const f = filter.toLowerCase()
        return all.filter(k => k.toLowerCase().includes(f) || (enDict[k] || '').toLowerCase().includes(f) || (dict[k] || '').toLowerCase().includes(f))
    }, [enDict, dict, filter])

    const saveEn = async () => {
        setSaving(true)
        try {
            await translationsApi.update('en', enDict)
            setMsg({ kind: 'ok', text: 'English master saved.' })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }
    const saveLocale = async () => {
        setSaving(true)
        try {
            await translationsApi.update(locale, dict)
            setMsg({ kind: 'ok', text: `Saved ${LOCALE_LABELS[locale] || locale}.` })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }
    const addKey = () => {
        const k = newKey.trim()
        if (!k) return
        setEnDict({ ...enDict, [k]: enDict[k] || '' })
        setNewKey('')
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
            <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-1"><Globe className="w-7 h-7 text-[#f5bb00]" /> Translations</h1>
            <p className="text-gray-500 text-sm mb-4">Pick a language, fill the right column. The frontend will use these keys for every visible phrase that opts in via <code className="bg-gray-100 px-1 rounded">useT()</code>.</p>

            <div className="flex flex-wrap gap-3 mb-4 items-center">
                <select value={locale} onChange={e => setLocale(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold">
                    {locales.filter(l => l !== 'en').map(l => <option key={l} value={l}>{LOCALE_LABELS[l] || l}</option>)}
                </select>
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search keys / phrases…" className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <button onClick={saveEn} disabled={saving} className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-[#140152] text-[#140152] font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save EN master
                </button>
                <button onClick={saveLocale} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-xl text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save {LOCALE_LABELS[locale] || locale}
                </button>
            </div>

            <div className="flex gap-2 mb-4">
                <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Add new key e.g. nav.donate" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                <button onClick={addKey} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold px-4 py-2 rounded-xl text-sm"><Plus className="w-4 h-4" /> Add</button>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-[200px_1fr_1fr] gap-3 px-4 py-3 border-b border-gray-100 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                        <div>Key</div>
                        <div>English (master)</div>
                        <div>{LOCALE_LABELS[locale] || locale}</div>
                    </div>
                    {keys.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">No keys match.</p>}
                    {keys.map(k => (
                        <div key={k} className="grid grid-cols-[200px_1fr_1fr] gap-3 px-4 py-2 border-b border-gray-50 items-center">
                            <code className="text-xs text-gray-500 font-mono break-all">{k}</code>
                            <input value={enDict[k] || ''} onChange={e => setEnDict({ ...enDict, [k]: e.target.value })} className="border border-gray-200 rounded px-2 py-1 text-sm" />
                            <input value={dict[k] || ''} onChange={e => setDict({ ...dict, [k]: e.target.value })} className="border border-gray-200 rounded px-2 py-1 text-sm" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

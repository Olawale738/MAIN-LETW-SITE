'use client'
/**
 * Compact language picker for the navbar. Reads + writes the locale via
 * useT(); current dictionary live-updates the whole page through context.
 *
 * Closed: a small flag + 2-letter code button.
 * Open: dropdown of supported locales with native names + flags.
 */
import { useEffect, useRef, useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { useT, LOCALE_NAMES, type Locale } from '@/lib/i18n'

export default function LanguagePicker({ compact = false }: { compact?: boolean }) {
    const { locale, setLocale } = useT()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement | null>(null)

    // Close on outside click + Escape.
    useEffect(() => {
        if (!open) return
        const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const current = LOCALE_NAMES[locale]
    const locales = Object.keys(LOCALE_NAMES) as Locale[]

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Change language"
                title={`Language: ${current.english}`}
                className={`inline-flex items-center gap-1.5 rounded-full transition-colors ${
                    compact
                        ? 'px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#140152] hover:bg-gray-100/50'
                        : 'px-3 py-2 text-sm text-gray-600 hover:text-[#140152] hover:bg-gray-100/50'
                }`}>
                <Globe className="w-3.5 h-3.5" />
                <span className="text-base leading-none">{current.flag}</span>
                <span className="font-bold uppercase tracking-wider text-[10px]">{locale}</span>
            </button>

            {open && (
                <div role="menu"
                    className="absolute right-0 top-full mt-2 z-50 w-56 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden p-1.5 animate-[fadeIn_160ms_ease-out]">
                    {locales.map(l => {
                        const meta = LOCALE_NAMES[l]
                        const active = l === locale
                        return (
                            <button key={l} onClick={() => { setLocale(l); setOpen(false) }}
                                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                                    active ? 'bg-[#f5bb00]/15 text-[#140152]' : 'text-gray-700 hover:bg-gray-50'
                                }`}>
                                <span className="inline-flex items-center gap-2.5">
                                    <span className="text-lg leading-none">{meta.flag}</span>
                                    <span>
                                        <span className="block font-bold">{meta.native}</span>
                                        <span className="block text-[10px] uppercase tracking-widest text-gray-400">{meta.english}</span>
                                    </span>
                                </span>
                                {active && <Check className="w-4 h-4 text-[#f5bb00]" />}
                            </button>
                        )
                    })}
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

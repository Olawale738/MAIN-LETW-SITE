'use client'
import { useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { useT, LOCALE_NAMES, type Locale } from '@/lib/i18n'

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
    const { locale, setLocale } = useT()
    const [open, setOpen] = useState(false)
    const current = LOCALE_NAMES[locale]

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)}
                aria-label="Change language"
                className={`inline-flex items-center gap-1.5 ${compact ? 'p-2' : 'px-3 py-2'} rounded-lg hover:bg-gray-100 text-gray-600 transition-colors`}>
                <Globe className="w-4 h-4" />
                {!compact && <span className="text-sm font-bold">{current.flag} {current.native}</span>}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 min-w-[200px]">
                        {(Object.keys(LOCALE_NAMES) as Locale[]).map(code => {
                            const meta = LOCALE_NAMES[code]
                            const active = locale === code
                            return (
                                <button key={code}
                                    onClick={() => { setLocale(code); setOpen(false) }}
                                    className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-left ${active ? 'bg-[#f5bb00]/10' : ''}`}>
                                    <span className="text-lg">{meta.flag}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#140152]">{meta.native}</p>
                                        <p className="text-[10px] text-gray-400">{meta.english}</p>
                                    </div>
                                    {active && <Check className="w-4 h-4 text-[#140152]" />}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}

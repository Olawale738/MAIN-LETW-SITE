'use client'
/**
 * Lightweight i18n — no external library. Stores language choice in
 * localStorage, exposes useT() hook for components. Add new strings to
 * dictionaries below; missing keys fall back to English.
 *
 * Supported: en (English), yo (Yoruba), fr (French), ig (Igbo), ha (Hausa), es (Spanish).
 *
 * For LIVE sermon translation (driven by GPT/Whisper), use aiApi.translate
 * from lib/api.ts.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Locale = 'en' | 'yo' | 'fr' | 'ig' | 'ha' | 'es'

export const LOCALE_NAMES: Record<Locale, { native: string; english: string; flag: string }> = {
    en: { native: 'English',  english: 'English',  flag: '🇬🇧' },
    yo: { native: 'Yorùbá',   english: 'Yoruba',   flag: '🇳🇬' },
    ig: { native: 'Igbo',     english: 'Igbo',     flag: '🇳🇬' },
    ha: { native: 'Hausa',    english: 'Hausa',    flag: '🇳🇬' },
    fr: { native: 'Français', english: 'French',   flag: '🇫🇷' },
    es: { native: 'Español',  english: 'Spanish',  flag: '🇪🇸' },
}

// Core dictionary — covers nav, buttons, common page strings. Add as you go.
const DICT: Record<Locale, Record<string, string>> = {
    en: {
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.sermons': 'Sermons',
        'nav.events': 'Events',
        'nav.prayer': 'Prayer',
        'nav.give': 'Give',
        'nav.blog': 'Blog',
        'nav.live': 'Live',
        'nav.missions': 'Missions',
        'nav.outcomes': 'Outcomes',
        'common.welcome': 'Welcome',
        'common.signin': 'Sign in',
        'common.signup': 'Sign up',
        'common.search': 'Search',
        'common.submit': 'Submit',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.loading': 'Loading…',
        'live.title': "Today's Service",
        'live.upcoming': 'Upcoming',
        'live.watching': 'watching now',
        'live.altarCall': 'Respond to altar call',
        'live.raiseHand': 'Raise your hand',
        'live.communion': 'Schedule online communion',
        'translate.label': 'Translate this',
    },
    yo: {
        'nav.home': 'Ilé',
        'nav.about': 'Nípa wa',
        'nav.sermons': 'Ìwásù',
        'nav.events': 'Àdéhùn',
        'nav.prayer': 'Àdúrà',
        'nav.give': 'Fún',
        'nav.blog': 'Ìròyìn',
        'nav.live': 'Tààrà',
        'nav.missions': 'Iṣẹ́ Míṣọ̀nrì',
        'nav.outcomes': 'Àbájáde',
        'common.welcome': 'Káàbọ̀',
        'common.signin': 'Wọlé',
        'common.signup': 'Forúkọsílẹ̀',
        'common.search': 'Wá',
        'common.submit': 'Fi ránṣẹ́',
        'common.cancel': 'Fagilé',
        'common.save': 'Pamọ́',
        'common.loading': 'Ń gbé wọlé…',
        'live.title': 'Iṣẹ́ ọjọ́ òní',
        'live.upcoming': 'Tó ń bọ̀',
        'live.watching': 'ń wo nísinsìnyí',
        'live.altarCall': 'Dáhùn pípè Áltà',
        'live.raiseHand': 'Gbe ọwọ́ rẹ sókè',
        'live.communion': 'Pe ìpàdé Ìjẹ́ọ̀rọ̀ lórí Íńtánẹ́ẹ̀tì',
        'translate.label': 'Túmọ̀ èyí',
    },
    fr: {
        'nav.home': 'Accueil',
        'nav.about': 'À propos',
        'nav.sermons': 'Sermons',
        'nav.events': 'Événements',
        'nav.prayer': 'Prière',
        'nav.give': 'Donner',
        'nav.blog': 'Blog',
        'nav.live': 'En direct',
        'nav.missions': 'Missions',
        'nav.outcomes': 'Résultats',
        'common.welcome': 'Bienvenue',
        'common.signin': 'Connexion',
        'common.signup': 'Inscription',
        'common.search': 'Rechercher',
        'common.submit': 'Envoyer',
        'common.cancel': 'Annuler',
        'common.save': 'Enregistrer',
        'common.loading': 'Chargement…',
        'live.title': 'Service du jour',
        'live.upcoming': 'À venir',
        'live.watching': 'spectateurs en ligne',
        'live.altarCall': "Répondre à l'appel d'autel",
        'live.raiseHand': 'Lever la main',
        'live.communion': 'Planifier une communion en ligne',
        'translate.label': 'Traduire ceci',
    },
    ig: {
        'nav.home': 'Ụlọ',
        'nav.about': 'Banyere',
        'nav.sermons': 'Ozizi',
        'nav.events': 'Ihe Omume',
        'nav.prayer': 'Ekpere',
        'nav.give': 'Nye',
        'nav.blog': 'Blog',
        'nav.live': 'Na ndụ',
        'nav.missions': 'Mishonari',
        'nav.outcomes': 'Nsonaazụ',
        'common.welcome': 'Nnọọ',
        'common.signin': 'Banye',
        'common.signup': 'Debanye aha',
        'common.search': 'Chọọ',
        'common.submit': 'Zipu',
        'common.cancel': 'Kagbuo',
        'common.save': 'Chekwaa',
        'common.loading': 'Na-arụ…',
        'live.title': 'Ofufe Taa',
        'live.upcoming': 'Na-abịa',
        'live.watching': 'na-ele ugbu a',
        'live.altarCall': 'Zaa oku ebe ịchụ àjà',
        'live.raiseHand': 'Welie aka gị',
        'live.communion': 'Hazie communion online',
        'translate.label': 'Tụgharịa nke a',
    },
    ha: {
        'nav.home': 'Gida',
        'nav.about': 'Game da mu',
        'nav.sermons': 'Wa\'azi',
        'nav.events': 'Abubuwan da suka faru',
        'nav.prayer': 'Addu\'a',
        'nav.give': 'Bayar',
        'nav.blog': 'Blog',
        'nav.live': 'Kai tsaye',
        'nav.missions': 'Manzanci',
        'nav.outcomes': 'Sakamako',
        'common.welcome': 'Maraba',
        'common.signin': 'Shiga',
        'common.signup': 'Yi rajista',
        'common.search': 'Bincika',
        'common.submit': 'Aika',
        'common.cancel': 'Soke',
        'common.save': 'Adana',
        'common.loading': 'Ana lodawa…',
        'live.title': 'Sabis na yau',
        'live.upcoming': 'Mai zuwa',
        'live.watching': 'suna kallo yanzu',
        'live.altarCall': 'Amsa kiran bagade',
        'live.raiseHand': 'Ɗaga hannunka',
        'live.communion': 'Tsara tarayya ta yanar gizo',
        'translate.label': 'Fassara wannan',
    },
    es: {
        'nav.home': 'Inicio',
        'nav.about': 'Acerca',
        'nav.sermons': 'Sermones',
        'nav.events': 'Eventos',
        'nav.prayer': 'Oración',
        'nav.give': 'Dar',
        'nav.blog': 'Blog',
        'nav.live': 'En vivo',
        'nav.missions': 'Misiones',
        'nav.outcomes': 'Resultados',
        'common.welcome': 'Bienvenido',
        'common.signin': 'Iniciar sesión',
        'common.signup': 'Registrarse',
        'common.search': 'Buscar',
        'common.submit': 'Enviar',
        'common.cancel': 'Cancelar',
        'common.save': 'Guardar',
        'common.loading': 'Cargando…',
        'live.title': 'Servicio de hoy',
        'live.upcoming': 'Próximo',
        'live.watching': 'viendo ahora',
        'live.altarCall': 'Responder al llamado al altar',
        'live.raiseHand': 'Levantar la mano',
        'live.communion': 'Programar comunión en línea',
        'translate.label': 'Traducir esto',
    },
}

interface I18nContextValue {
    locale: Locale
    setLocale: (l: Locale) => void
    t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue>({
    locale: 'en',
    setLocale: () => { },
    t: (key, fallback) => fallback || key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en')
    // Admin-saved overrides per locale, fetched once on mount. Layered ON TOP
    // of the bundled DICT so admins can extend or correct without a redeploy.
    const [overrides, setOverrides] = useState<Record<Locale, Record<string, string>>>(() => ({
        en: {}, yo: {}, ig: {}, ha: {}, fr: {}, es: {},
    }))

    useEffect(() => {
        try {
            const saved = localStorage.getItem('letw-locale') as Locale | null
            if (saved && DICT[saved]) setLocaleState(saved)
            else {
                const browser = (navigator.language || 'en').slice(0, 2) as Locale
                if (DICT[browser]) setLocaleState(browser)
            }
        } catch { /* noop */ }

        // Best-effort load of admin-managed dictionaries. Each locale is its own
        // ministry-content row. We hit /api/translations/<locale> in parallel —
        // missing rows just resolve to an empty override.
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
        const localesToLoad: Locale[] = ['en', 'yo', 'ig', 'ha', 'fr', 'es']
        Promise.all(localesToLoad.map(l =>
            fetch(`${API_BASE}/translations/${l}`, { cache: 'no-store' })
                .then(r => r.ok ? r.json() : { translations: {} })
                .then(j => [l, (j?.translations || {}) as Record<string, string>] as const)
                .catch(() => [l, {} as Record<string, string>] as const),
        )).then(rows => {
            const next: Record<Locale, Record<string, string>> = { en: {}, yo: {}, ig: {}, ha: {}, fr: {}, es: {} }
            rows.forEach(([l, dict]) => { next[l] = dict })
            setOverrides(next)
        }).catch(() => { /* keep empty overrides */ })
    }, [])

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l)
        try { localStorage.setItem('letw-locale', l) } catch { /* noop */ }
        try {
            document.documentElement.lang = l
            // RTL languages — not in current Locale union, but if we extend to
            // ar/he/fa/ur later, this is the hook that flips layout.
            document.documentElement.dir = ['ar', 'he', 'fa', 'ur'].includes(l) ? 'rtl' : 'ltr'
        } catch { /* noop */ }
    }, [])

    const t = useCallback((key: string, fallback?: string): string => {
        // Lookup order: admin override (current locale) > admin override (EN
        // master) > bundled current locale > bundled EN > fallback > key.
        return overrides[locale]?.[key]
            || overrides.en?.[key]
            || DICT[locale]?.[key]
            || DICT.en[key]
            || fallback
            || key
    }, [locale, overrides])

    return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useT() {
    return useContext(I18nContext)
}

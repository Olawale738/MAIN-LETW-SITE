'use client'
import React, { useMemo } from 'react'
import Link from 'next/link'
import { Sparkles, Calendar, Cross, Flame, Sun } from 'lucide-react'

/**
 * Conditionally renders a season-appropriate band on the homepage.
 *
 * Seasons (in priority order):
 *   - Holy Week  (Palm Sunday → Easter Saturday)         — purple / cross
 *   - Easter Day (Easter Sunday only)                    — sunrise gold
 *   - Lent       (Ash Wednesday → Easter Saturday)       — purple
 *   - Christmas  (Dec 25 → Dec 26)                       — green/red sparkle
 *   - Advent     (Dec 1 → Dec 24)                        — countdown
 *   - New Year   (Dec 27 → Jan 5)                        — gold
 *   - Pre-Advent (Nov 15 → Nov 30)                       — "Christmas is coming"
 *
 * Outside these windows, renders nothing.
 */
export default function SeasonalBanner() {
    const today = new Date()
    const season = useMemo(() => detectSeason(today), [today.toDateString()])
    if (!season) return null
    return season.render(today)
}

interface SeasonDef { kind: string; render: (now: Date) => React.ReactElement }

function detectSeason(now: Date): SeasonDef | null {
    const y = now.getFullYear()
    const easter = easterSunday(y)
    const palmSunday = addDays(easter, -7)
    const ashWednesday = addDays(easter, -46)
    const easterSaturday = addDays(easter, -1)

    if (sameDay(now, easter)) return { kind: 'easter', render: easterBanner }
    if (now >= palmSunday && now <= easterSaturday) return { kind: 'holyweek', render: holyWeekBanner }
    if (now >= ashWednesday && now < palmSunday) return { kind: 'lent', render: lentBanner }
    if (sameMonthDay(now, 12, 25) || sameMonthDay(now, 12, 26)) return { kind: 'christmas', render: christmasBanner }
    if (now.getMonth() === 11 && now.getDate() >= 1 && now.getDate() <= 24) return { kind: 'advent', render: adventBanner }
    if ((now.getMonth() === 11 && now.getDate() >= 27) || (now.getMonth() === 0 && now.getDate() <= 5)) return { kind: 'newyear', render: newYearBanner }
    if (now.getMonth() === 10 && now.getDate() >= 15) return { kind: 'preadvent', render: preAdventBanner }
    return null
}

// ─── Renderers ──────────────────────────────────────────────────────────────

function shell(props: { gradient: string; eyebrow: string; title: React.ReactNode; body: React.ReactNode; cta?: { href: string; label: string }; icon: React.ReactNode }) {
    return (
        <section className={`py-12 px-4 ${props.gradient} text-white relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(245,187,0,0.3), transparent 50%)' }} />
            <div className="max-w-4xl mx-auto relative z-10 text-center">
                <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3">{props.icon} {props.eyebrow}</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight">{props.title}</h2>
                <p className="text-white/80 mt-3 max-w-2xl mx-auto">{props.body}</p>
                {props.cta && (
                    <Link href={props.cta.href} className="inline-block mt-5 bg-[#f5bb00] hover:bg-[#ffc820] text-[#140152] font-black px-6 py-3 rounded-xl shadow-xl transition-all hover:scale-105">
                        {props.cta.label}
                    </Link>
                )}
            </div>
        </section>
    )
}

function adventBanner(now: Date): React.ReactElement {
    const xmas = new Date(now.getFullYear(), 11, 25)
    const days = Math.ceil((xmas.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return shell({
        gradient: 'bg-gradient-to-br from-[#0c2440] via-[#140152] to-[#0c2440]',
        eyebrow: 'Advent',
        title: <><span className="text-[#f5bb00]">{days}</span> day{days === 1 ? '' : 's'} until Christmas</>,
        body: 'Prepare your heart. The Light of the world is coming.',
        cta: { href: '/events', label: 'See our Advent schedule' },
        icon: <Sparkles className="w-3.5 h-3.5" />,
    })
}

function preAdventBanner(_: Date): React.ReactElement {
    return shell({
        gradient: 'bg-gradient-to-br from-[#0c2440] via-[#140152] to-[#0c2440]',
        eyebrow: 'Christmas is coming',
        title: 'Advent begins December 1',
        body: 'Join us as we prepare for the most wonderful season of the year.',
        cta: { href: '/events', label: 'Plan your Christmas with us' },
        icon: <Sparkles className="w-3.5 h-3.5" />,
    })
}

function christmasBanner(_: Date): React.ReactElement {
    return shell({
        gradient: 'bg-gradient-to-br from-[#143a1f] via-[#1f5230] to-[#9b2c2c]',
        eyebrow: 'Glory to God',
        title: 'Merry Christmas from LETW',
        body: '"For unto us a Child is born, unto us a Son is given." — Isaiah 9:6',
        cta: { href: '/sermons', label: 'Watch our Christmas message' },
        icon: <Sparkles className="w-3.5 h-3.5" />,
    })
}

function newYearBanner(_: Date): React.ReactElement {
    return shell({
        gradient: 'bg-gradient-to-br from-[#140152] via-[#1a0270] to-[#0c0140]',
        eyebrow: 'New Year Prayer Season',
        title: 'Begin the year on your knees',
        body: 'Join us for our annual prayer schedule — fresh consecration, fresh fire, fresh vision.',
        cta: { href: '/prayer', label: 'See the prayer schedule' },
        icon: <Flame className="w-3.5 h-3.5" />,
    })
}

function lentBanner(now: Date): React.ReactElement {
    const y = now.getFullYear()
    const easter = easterSunday(y)
    const ashWed = addDays(easter, -46)
    const day = Math.floor((now.getTime() - ashWed.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return shell({
        gradient: 'bg-gradient-to-br from-[#3d2860] via-[#2b1a47] to-[#1c0f30]',
        eyebrow: 'Lent · 40-day journey',
        title: <>Day <span className="text-[#f5bb00]">{day}</span> of 40</>,
        body: 'A season of fasting, reflection, and drawing nearer to Christ before Easter.',
        cta: { href: '/lent', label: 'Open the Lent tracker' },
        icon: <Cross className="w-3.5 h-3.5" />,
    })
}

function holyWeekBanner(_: Date): React.ReactElement {
    return shell({
        gradient: 'bg-gradient-to-br from-[#3d2860] via-[#2b1a47] to-[#1c0f30]',
        eyebrow: 'Holy Week',
        title: 'The week that changed the world',
        body: 'Maundy Thursday, Good Friday, Easter Saturday — see our full schedule and join us.',
        cta: { href: '/events', label: 'View Holy Week services' },
        icon: <Cross className="w-3.5 h-3.5" />,
    })
}

function easterBanner(_: Date): React.ReactElement {
    return shell({
        gradient: 'bg-gradient-to-br from-[#f5bb00] via-[#ffc820] to-[#ff9500]',
        eyebrow: 'Resurrection Sunday',
        title: <span className="text-[#140152]">He is risen — He is risen indeed!</span>,
        body: <span className="text-[#140152]/85">"Why seek ye the living among the dead? He is not here, but is risen." — Luke 24:5-6</span>,
        cta: { href: '/sermons', label: 'Watch our Easter message' },
        icon: <Sun className="w-3.5 h-3.5 text-[#140152]" />,
    })
}

// ─── Date utilities ─────────────────────────────────────────────────────────

function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function sameMonthDay(d: Date, month1to12: number, day: number): boolean {
    return d.getMonth() === month1to12 - 1 && d.getDate() === day
}
function addDays(d: Date, n: number): Date {
    const r = new Date(d); r.setDate(r.getDate() + n); return r
}
/** Anonymous Gregorian Easter algorithm. Returns Easter Sunday for the given year. */
function easterSunday(year: number): Date {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const L = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * L) / 451)
    const month = Math.floor((h + L - 7 * m + 114) / 31)  // 3=March, 4=April
    const day = ((h + L - 7 * m + 114) % 31) + 1
    return new Date(year, month - 1, day)
}

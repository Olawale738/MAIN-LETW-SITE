'use client'
/**
 * /admin/analytics — the Analytics Command Center. Cross-domain KPIs, 12-month
 * trends (inline SVG), breakdowns, and an on-demand AI briefing.
 */
import { useCallback, useEffect, useState } from 'react'
import {
    BarChart3, Loader2, RefreshCw, Users, HeartHandshake, HandCoins, Church,
    Megaphone, Mail, CalendarDays, Sparkles, Baby, HandHeart, AlertCircle,
} from 'lucide-react'
import { analyticsApi, type AnalyticsOverview, type SeriesPoint, type LabelValue } from '@/lib/api'
import { AreaLine, BarList, Donut } from '@/components/admin/charts'

type Giving = { currency: string; total: number; count: number }

export default function AnalyticsPage() {
    const [o, setO] = useState<AnalyticsOverview | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [insight, setInsight] = useState<{ source: string; text: string } | null>(null)
    const [insightLoading, setInsightLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true); setErr(null)
        try { setO(await analyticsApi.overview()) }
        catch (e) { setErr((e as Error).message) }
        finally { setLoading(false) }
    }, [])
    useEffect(() => { load() }, [load])

    const genInsight = async () => {
        setInsightLoading(true)
        try { setInsight(await analyticsApi.insight()) }
        catch { setInsight(null) }
        finally { setInsightLoading(false) }
    }

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
    if (err || !o) return <div className="p-6 text-center text-gray-500">{err || 'No data.'}</div>

    const kpi = (k: string): number => (typeof o.kpis[k] === 'number' ? (o.kpis[k] as number) : 0)
    const giving = (o.kpis.giving as Giving[] | undefined) || []
    const givingLabel = giving.length ? giving.map(g => `${g.currency} ${g.total.toLocaleString()}`).join(' · ') : '—'
    const s = (k: string): SeriesPoint[] => o.series[k] || []
    const b = (k: string): LabelValue[] => (o.breakdowns[k] as LabelValue[]) || []

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><BarChart3 className="w-7 h-7 text-[#f5bb00]" /> Analytics Command Center</h1>
                <button onClick={load} className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>
            <p className="text-gray-400 text-xs mb-5">Live across your whole platform · generated {new Date(o.generated_at).toLocaleString()}</p>

            {/* AI / rule-based briefing */}
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#140152] to-[#26026e] text-white p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-black flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#f5bb00]" /> Briefing</p>
                    <button onClick={genInsight} disabled={insightLoading} className="inline-flex items-center gap-1.5 bg-[#f5bb00] text-[#140152] font-bold px-3 py-1.5 rounded-lg text-xs disabled:opacity-60">
                        {insightLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {insight?.source === 'ai' ? 'Regenerate' : 'AI briefing'}
                    </button>
                </div>
                {insight?.source === 'ai' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line text-white/95">{insight.text}</p>
                ) : (
                    <ul className="space-y-1.5">
                        {o.highlights.map((h, i) => <li key={i} className="text-sm text-white/90 flex gap-2"><span className="text-[#f5bb00]">•</span><span>{h}</span></li>)}
                        {!o.highlights.length && <li className="text-sm text-white/70">Not enough data yet — insights appear as members, giving, and activity grow.</li>}
                    </ul>
                )}
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Tile icon={Users} bg="#eef2ff" ic="#4f46e5" label="Members" value={kpi('members_total')} sub={`${kpi('members_active')} active · +${kpi('members_new_this_month')} this month`} />
                <Tile icon={HandCoins} bg="#ecfdf5" ic="#059669" label="Giving (settled)" value={givingLabel} sub={`${kpi('giving_gifts_total')} gifts`} isText />
                <Tile icon={HandHeart} bg="#fdf2f8" ic="#db2777" label="Prayer requests" value={kpi('prayer_total')} sub={`${kpi('prayer_answered')} answered`} />
                <Tile icon={HeartHandshake} bg="#fef3c7" ic="#d97706" label="Couples in prep" value={kpi('couples_total')} sub={`${kpi('couples_completed')} completed`} />
                <Tile icon={Church} bg="#eff6ff" ic="#2563eb" label="Ministries" value={kpi('ministries_active')} sub={`${kpi('ministry_members_active')} members`} />
                <Tile icon={Megaphone} bg="#f0fdf4" ic="#16a34a" label="Evangelism sign-ups" value={kpi('evangelism_signups_total')} sub={`${kpi('leaflets_published')} leaflets`} />
                <Tile icon={Mail} bg="#faf5ff" ic="#7c3aed" label="Subscribers" value={kpi('subscribers_active')} sub="newsletter" />
                <Tile icon={CalendarDays} bg="#fff7ed" ic="#ea580c" label="Upcoming events" value={kpi('events_upcoming')} sub={`${kpi('sermons_total')} sermons`} />
            </div>

            {/* Trends */}
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">12-month trends</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Trend title="New members" series={s('members')} color="#4f46e5" />
                <Trend title="Gifts received" series={s('giving_gifts')} color="#059669" />
                <Trend title="Prayer requests" series={s('prayer')} color="#db2777" />
                <Trend title="Marriage-prep couples" series={s('couples')} color="#d97706" />
                <Trend title="Evangelism sign-ups" series={s('evangelism')} color="#16a34a" />
                <Trend title="Newsletter subscribers" series={s('subscribers')} color="#7c3aed" />
            </div>

            {/* Breakdowns */}
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Breakdowns</h2>
            <div className="grid sm:grid-cols-2 gap-4">
                <Card title="Members by role"><Donut data={b('members_by_role')} /></Card>
                <Card title="Marriage prep by status"><BarList data={b('couples_by_status')} /></Card>
                <Card title="Life events by type"><Donut data={b('life_events_by_kind')} /></Card>
                <Card title="Prayer by status"><BarList data={b('prayer_by_status')} /></Card>
                <Card title="Ministries by category"><BarList data={b('ministries_by_category')} /></Card>
                <Card title="On-site now (children)"><div className="text-4xl font-black text-[#140152]">{kpi('children_on_site_now')}<span className="text-sm font-semibold text-gray-400 ml-2">checked in</span></div><p className="text-xs text-gray-400 mt-2">{kpi('children_checkins_total')} check-ins all-time</p></Card>
            </div>

            {o._errors?.length > 0 && (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Some sections are still warming up: {o._errors.map(e => e.split(':')[0]).join(', ')}. They fill in as those areas get data.</span>
                </div>
            )}
        </div>
    )
}

function Tile({ icon: Icon, bg, ic, label, value, sub, isText }: { icon: React.ElementType; bg: string; ic: string; label: string; value: number | string; sub?: string; isText?: boolean }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}><Icon className="w-4 h-4" style={{ color: ic }} /></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
            </div>
            <p className={`font-black text-[#140152] ${isText ? 'text-lg leading-tight' : 'text-2xl'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
    )
}

function Trend({ title, series, color }: { title: string; series: SeriesPoint[]; color: string }) {
    const total = series.reduce((s, p) => s + p.value, 0)
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-baseline justify-between mb-1">
                <p className="text-xs font-bold text-gray-500">{title}</p>
                <p className="text-xs font-black text-[#140152]">{total.toLocaleString()}<span className="text-gray-400 font-semibold"> / yr</span></p>
            </div>
            <AreaLine data={series} color={color} />
        </div>
    )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">{title}</p>
            {children}
        </div>
    )
}

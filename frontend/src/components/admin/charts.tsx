'use client'
/**
 * Dependency-free inline-SVG charts for the Analytics Command Center.
 * AreaLine (12-month trend), BarList (horizontal breakdown), Donut (composition).
 */
import type { SeriesPoint, LabelValue } from '@/lib/api'

const NAVY = '#140152'
const PALETTE = ['#140152', '#f5bb00', '#0e7a5f', '#b45309', '#9d174d', '#185fa5', '#6d28d9', '#d4537e', '#3b6d11', '#5f5e5a']

export function AreaLine({ data, color = NAVY, height = 90 }: { data: SeriesPoint[]; color?: string; height?: number }) {
    const w = 320, h = height, pad = 6
    const vals = data.map(d => d.value)
    const max = Math.max(1, ...vals)
    const n = data.length || 1
    const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, n - 1)
    const y = (v: number) => h - pad - (v / max) * (h - pad * 2)
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
    const area = `${line} L${x(n - 1).toFixed(1)},${h - pad} L${x(0).toFixed(1)},${h - pad} Z`
    const gid = `g-${color.replace('#', '')}`
    const last = data[data.length - 1]
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {last && <circle cx={x(n - 1)} cy={y(last.value)} r="3" fill={color} />}
        </svg>
    )
}

export function BarList({ data, unit = '' }: { data: LabelValue[]; unit?: string }) {
    const max = Math.max(1, ...data.map(d => d.value))
    if (!data.length) return <p className="text-xs text-gray-400 py-3">No data yet.</p>
    return (
        <div className="space-y-2">
            {data.map((d, i) => (
                <div key={d.label + i} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-600 w-28 shrink-0 truncate capitalize" title={d.label}>{d.label.replace(/_/g, ' ').toLowerCase()}</span>
                    <div className="flex-1 h-3.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                    </div>
                    <span className="text-[11px] font-bold text-[#140152] w-12 text-right tabular-nums">{unit}{d.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
    )
}

export function Donut({ data, size = 120 }: { data: LabelValue[]; size?: number }) {
    const total = data.reduce((s, d) => s + d.value, 0)
    if (!total) return <p className="text-xs text-gray-400 py-3">No data yet.</p>
    const r = size / 2 - 8, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r
    let offset = 0
    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f0ec" strokeWidth="10" />
                {data.map((d, i) => {
                    const frac = d.value / total
                    const dash = frac * circ
                    const el = (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="10"
                            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt" />
                    )
                    offset += dash
                    return el
                })}
                <text x={cx} y={cy - 2} textAnchor="middle" className="fill-[#140152]" style={{ fontSize: 20, fontWeight: 800 }}>{total.toLocaleString()}</text>
                <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 9 }}>total</text>
            </svg>
            <div className="space-y-1">
                {data.slice(0, 8).map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="text-gray-600 capitalize">{d.label.replace(/_/g, ' ').toLowerCase()}</span>
                        <span className="font-bold text-[#140152] tabular-nums">{d.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

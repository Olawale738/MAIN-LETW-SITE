'use client'
import { useState } from 'react'
import { MapPin, Globe2, Users } from 'lucide-react'

interface Branch {
    id: string
    name: string
    city: string
    country: string
    kind: 'hq' | 'branch' | 'mission'
    /** SVG-space coordinates inside the 1000×500 viewBox */
    x: number
    y: number
    blurb?: string
}

// Sensible defaults — admins can later move this into CMS for editability.
const BRANCHES: Branch[] = [
    { id: 'abuja',   name: 'Abuja HQ',           city: 'Abuja',        country: 'Nigeria',         kind: 'hq',     x: 540, y: 290, blurb: 'Main campus & worldwide headquarters.' },
    { id: 'lagos',   name: 'Lagos Branch',       city: 'Lagos',        country: 'Nigeria',         kind: 'branch', x: 520, y: 295 },
    { id: 'london',  name: 'London Fellowship',  city: 'London',       country: 'United Kingdom',  kind: 'branch', x: 488, y: 200 },
    { id: 'newyork', name: 'New York Fellowship', city: 'New York',    country: 'United States',   kind: 'branch', x: 285, y: 215 },
    { id: 'houston', name: 'Houston Mission',    city: 'Houston',      country: 'United States',   kind: 'mission', x: 230, y: 245 },
    { id: 'toronto', name: 'Toronto Mission',    city: 'Toronto',      country: 'Canada',          kind: 'mission', x: 305, y: 195 },
    { id: 'nairobi', name: 'Nairobi Mission',    city: 'Nairobi',      country: 'Kenya',           kind: 'mission', x: 615, y: 320 },
    { id: 'joburg',  name: 'Johannesburg Mission', city: 'Johannesburg', country: 'South Africa',  kind: 'mission', x: 590, y: 395 },
    { id: 'dubai',   name: 'Dubai Mission',      city: 'Dubai',        country: 'UAE',             kind: 'mission', x: 645, y: 270 },
    { id: 'mumbai',  name: 'Mumbai Mission',     city: 'Mumbai',       country: 'India',           kind: 'mission', x: 720, y: 290 },
    { id: 'manila',  name: 'Manila Mission',     city: 'Manila',       country: 'Philippines',     kind: 'mission', x: 830, y: 320 },
    { id: 'sydney',  name: 'Sydney Mission',     city: 'Sydney',       country: 'Australia',       kind: 'mission', x: 880, y: 410 },
]

const KIND_STYLES: Record<Branch['kind'], { ring: string; dot: string; label: string }> = {
    hq:      { ring: 'rgba(245,187,0,0.65)', dot: '#f5bb00', label: 'Headquarters' },
    branch:  { ring: 'rgba(245,187,0,0.45)', dot: '#fbbf24', label: 'Branch' },
    mission: { ring: 'rgba(124,58,237,0.55)', dot: '#a78bfa', label: 'Mission' },
}

export default function WorldMapInteractive() {
    const [active, setActive] = useState<Branch | null>(null)

    const stats = {
        hq: BRANCHES.filter(b => b.kind === 'hq').length,
        branches: BRANCHES.filter(b => b.kind === 'branch').length,
        missions: BRANCHES.filter(b => b.kind === 'mission').length,
    }

    return (
        <section className="relative bg-white py-20 md:py-28 px-4">
            {/* Header */}
            <div className="max-w-4xl mx-auto text-center mb-12">
                <p className="text-[#f5bb00] font-bold tracking-[0.35em] text-[10px] uppercase mb-3 inline-flex items-center gap-2">
                    <Globe2 className="w-3.5 h-3.5" /> Worldwide Reach
                </p>
                <h2 className="font-serif text-4xl md:text-6xl font-black text-[#140152] leading-tight">
                    Light to <span className="bg-gradient-to-r from-[#f5bb00] via-amber-500 to-[#f5bb00] bg-clip-text text-transparent">every nation</span>
                </h2>
                <p className="font-sans text-[#140152]/70 mt-4 max-w-2xl mx-auto leading-relaxed">
                    From our headquarters in Abuja, the LETW family extends across continents — branches, fellowships, and missions carrying the gospel to homes, cities, and hearts.
                </p>

                {/* Stats row */}
                <div className="mt-8 inline-flex items-center gap-6 px-6 py-3 rounded-full bg-[#140152]/5 border border-[#140152]/10">
                    <Stat n={stats.hq} label="Headquarters" color="#f5bb00" />
                    <span className="w-px h-6 bg-[#140152]/10" />
                    <Stat n={stats.branches} label="Branches" color="#fbbf24" />
                    <span className="w-px h-6 bg-[#140152]/10" />
                    <Stat n={stats.missions} label="Missions" color="#a78bfa" />
                </div>
            </div>

            {/* Map */}
            <div className="relative max-w-6xl mx-auto rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#0a0028] via-[#140152] to-[#1d0175] p-2 shadow-2xl shadow-[#140152]/20">
                {/* Subtle inner border */}
                <div className="relative rounded-[1.75rem] overflow-hidden bg-[#06002a]">
                    <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" className="w-full h-auto block">
                        {/* World map base — simplified land shapes */}
                        <SimplifiedWorldShapes />

                        {/* Connection arcs from HQ to each branch */}
                        {BRANCHES.filter(b => b.kind !== 'hq').map((b, i) => {
                            const hq = BRANCHES.find(x => x.kind === 'hq')!
                            const mx = (hq.x + b.x) / 2
                            const my = Math.min(hq.y, b.y) - 60
                            return (
                                <path key={`arc-${i}`} d={`M${hq.x},${hq.y} Q${mx},${my} ${b.x},${b.y}`}
                                    fill="none" stroke="rgba(245,187,0,0.18)" strokeWidth="0.7"
                                    strokeDasharray="2 3" />
                            )
                        })}

                        {/* Branch pins */}
                        {BRANCHES.map(b => {
                            const s = KIND_STYLES[b.kind]
                            const isActive = active?.id === b.id
                            return (
                                <g key={b.id} onMouseEnter={() => setActive(b)} onClick={() => setActive(b)}
                                    style={{ cursor: 'pointer' }}>
                                    {/* Pulse ring */}
                                    <circle cx={b.x} cy={b.y} r={isActive ? 10 : 4} fill="none" stroke={s.ring} strokeWidth="1.5">
                                        <animate attributeName="r" values="4;9;4" dur="2.5s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite" />
                                    </circle>
                                    {/* Outer halo */}
                                    <circle cx={b.x} cy={b.y} r={b.kind === 'hq' ? 7 : 5} fill={s.dot} opacity={isActive ? 0.4 : 0.25} />
                                    {/* Core */}
                                    <circle cx={b.x} cy={b.y} r={b.kind === 'hq' ? 4 : 2.6} fill={s.dot}
                                        style={{ filter: 'drop-shadow(0 0 4px ' + s.dot + ')' }} />
                                </g>
                            )
                        })}
                    </svg>

                    {/* Tooltip card */}
                    {active && (
                        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-[#06002a] to-transparent pointer-events-none">
                            <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/40 pointer-events-auto">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: KIND_STYLES[active.kind].dot, color: '#140152' }}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] uppercase tracking-[0.3em] font-black text-[#f5bb00]">{KIND_STYLES[active.kind].label}</p>
                                        <p className="font-black text-[#140152]">{active.name}</p>
                                        <p className="text-xs text-[#140152]/70">{active.city}, {active.country}</p>
                                        {active.blurb && <p className="text-xs text-[#140152]/60 mt-1 italic">{active.blurb}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-5 flex-wrap text-xs">
                <LegendDot color={KIND_STYLES.hq.dot} label="Headquarters" />
                <LegendDot color={KIND_STYLES.branch.dot} label="Branches" />
                <LegendDot color={KIND_STYLES.mission.dot} label="Missions" />
                <span className="text-[#140152]/50 inline-flex items-center gap-1.5"><Users className="w-3 h-3" /> Click a marker for details</span>
            </div>
        </section>
    )
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
    return (
        <div className="text-left">
            <p className="font-serif text-2xl font-black text-[#140152]" style={{ textShadow: `0 0 12px ${color}40` }}>{n}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#140152]/60 font-bold">{label}</p>
        </div>
    )
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-[#140152]/70 font-bold">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            {label}
        </span>
    )
}

/**
 * Simplified continent outlines — hand-tuned SVG paths in a 1000×500 viewBox.
 * Not geographically perfect; designed to feel like an old-world map without
 * shipping a 200KB GeoJSON.
 */
function SimplifiedWorldShapes() {
    const fill = 'rgba(245,187,0,0.05)'
    const stroke = 'rgba(245,187,0,0.18)'
    const sw = 0.8
    return (
        <g>
            {/* Grid lines (latitudes) */}
            {[100, 200, 300, 400].map(y => (
                <line key={`la${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(245,187,0,0.05)" strokeWidth="0.4" />
            ))}
            {[200, 400, 600, 800].map(x => (
                <line key={`lo${x}`} x1={x} y1="0" x2={x} y2="500" stroke="rgba(245,187,0,0.05)" strokeWidth="0.4" />
            ))}

            {/* North America */}
            <path d="M150,140 L260,130 L320,170 L330,230 L290,260 L240,265 L210,250 L180,225 L160,200 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* Central America */}
            <path d="M240,275 L270,290 L260,310 L230,300 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* South America */}
            <path d="M295,310 L340,320 L355,380 L335,440 L305,450 L275,400 L280,350 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* Greenland */}
            <path d="M380,90 L420,80 L430,120 L395,135 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* Europe */}
            <path d="M460,180 L530,170 L540,200 L520,230 L475,235 L460,210 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* Africa */}
            <path d="M520,260 L600,250 L640,290 L640,360 L600,420 L555,420 L530,370 L515,310 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* Middle East */}
            <path d="M600,235 L650,235 L670,265 L640,275 L605,260 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* Asia */}
            <path d="M550,160 L760,150 L840,200 L860,270 L790,300 L730,290 L670,260 L630,235 L580,210 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* India */}
            <path d="M700,265 L740,265 L745,310 L720,320 L705,295 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* SE Asia */}
            <path d="M790,300 L830,310 L845,340 L805,340 L790,320 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* Australia */}
            <path d="M840,395 L905,395 L920,430 L885,450 L845,440 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* New Zealand */}
            <path d="M935,450 L955,445 L950,470 L935,470 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* Japan */}
            <path d="M860,230 L878,225 L880,250 L862,255 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            {/* UK + Ireland */}
            <path d="M475,180 L495,178 L495,205 L478,205 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
        </g>
    )
}

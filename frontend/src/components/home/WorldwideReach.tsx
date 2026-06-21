'use client'
import { useEffect, useMemo, useState } from 'react'
import { MapPin, Globe2, Users, Phone, Mail, ExternalLink, Sparkles } from 'lucide-react'
import { churchLocationsApi, type ChurchLocation, type ChurchKind } from '@/lib/api'

const KIND_STYLES: Record<ChurchKind, { ring: string; dot: string; label: string }> = {
    hq:         { ring: 'rgba(245,187,0,0.7)', dot: '#f5bb00',  label: 'Headquarters' },
    branch:     { ring: 'rgba(245,187,0,0.45)', dot: '#fbbf24', label: 'Branches' },
    mission:    { ring: 'rgba(124,58,237,0.55)', dot: '#a78bfa', label: 'Missions' },
    fellowship: { ring: 'rgba(56,189,248,0.55)', dot: '#38bdf8', label: 'Fellowships' },
}

/**
 * Public 'Worldwide Reach' section — DB-backed church locations rendered
 * over a simplified continent SVG. Each pin pulses; click for details.
 */
export default function WorldwideReach() {
    const [locations, setLocations] = useState<ChurchLocation[]>([])
    const [active, setActive] = useState<ChurchLocation | null>(null)
    const [continentFilter, setContinentFilter] = useState<string>('All')

    useEffect(() => {
        churchLocationsApi.listPublic().then(setLocations).catch(() => setLocations([]))
    }, [])

    const visible = useMemo(() => {
        if (continentFilter === 'All') return locations
        return locations.filter(l => l.continent === continentFilter)
    }, [locations, continentFilter])

    const stats = useMemo(() => {
        const counts: Record<ChurchKind, number> = { hq: 0, branch: 0, mission: 0, fellowship: 0 }
        const countries = new Set<string>(), continents = new Set<string>()
        for (const l of locations) {
            counts[l.kind] = (counts[l.kind] || 0) + 1
            if (l.country_code) countries.add(l.country_code)
            if (l.continent) continents.add(l.continent)
        }
        return { counts, countries: countries.size, continents: continents.size, total: locations.length }
    }, [locations])

    const continents = useMemo(() => {
        const set = new Set(locations.map(l => l.continent).filter(Boolean))
        return Array.from(set).sort()
    }, [locations])

    if (locations.length === 0) return null

    return (
        <section className="relative bg-white py-20 md:py-28 px-4 overflow-hidden">
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
                <div className="mt-8 inline-flex items-center gap-6 px-6 py-3 rounded-full bg-[#140152]/5 border border-[#140152]/10 flex-wrap justify-center">
                    <Stat n={stats.counts.hq} label="HQ" color="#f5bb00" />
                    <span className="w-px h-6 bg-[#140152]/10" />
                    <Stat n={stats.counts.branch} label="Branches" color="#fbbf24" />
                    <span className="w-px h-6 bg-[#140152]/10" />
                    <Stat n={stats.counts.mission} label="Missions" color="#a78bfa" />
                    <span className="w-px h-6 bg-[#140152]/10" />
                    <Stat n={stats.countries} label="Countries" color="#38bdf8" />
                    <span className="w-px h-6 bg-[#140152]/10" />
                    <Stat n={stats.continents} label="Continents" color="#34d399" />
                </div>

                {/* Continent filter chips */}
                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <button onClick={() => setContinentFilter('All')}
                        className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-full ${continentFilter === 'All' ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                        All
                    </button>
                    {continents.map(c => (
                        <button key={c} onClick={() => setContinentFilter(c)}
                            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-full ${continentFilter === c ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#140152]/40'}`}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Map */}
            <div className="relative max-w-6xl mx-auto rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#0a0028] via-[#140152] to-[#1d0175] p-2 shadow-2xl shadow-[#140152]/20">
                <div className="relative rounded-[1.75rem] overflow-hidden bg-[#06002a]">
                    <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" className="w-full h-auto block">
                        <ContinentShapes />
                        {/* Pins */}
                        {visible.map(l => {
                            const x = l.map_x ?? 500
                            const y = l.map_y ?? 250
                            const s = KIND_STYLES[l.kind]
                            const isActive = active?.id === l.id
                            return (
                                <g key={l.id} onMouseEnter={() => setActive(l)} onClick={() => setActive(l)} style={{ cursor: 'pointer' }}>
                                    <circle cx={x} cy={y} r="4" fill="none" stroke={s.ring} strokeWidth="1.5">
                                        <animate attributeName="r" values="4;10;4" dur="2.6s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.6s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx={x} cy={y} r={l.kind === 'hq' ? 7 : 5} fill={s.dot} opacity={isActive ? 0.45 : 0.28} />
                                    <circle cx={x} cy={y} r={l.kind === 'hq' ? 4.2 : 2.8} fill={s.dot}
                                        style={{ filter: `drop-shadow(0 0 5px ${s.dot})` }} />
                                </g>
                            )
                        })}
                    </svg>

                    {/* Tooltip card */}
                    {active && (
                        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-[#06002a] via-[#06002a]/80 to-transparent pointer-events-none">
                            <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-white/40 pointer-events-auto">
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: KIND_STYLES[active.kind].dot, color: '#140152' }}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] uppercase tracking-[0.3em] font-black text-[#f5bb00]">{KIND_STYLES[active.kind].label}</p>
                                        <p className="font-serif font-black text-[#140152] text-lg leading-tight">{active.name}</p>
                                        <p className="text-xs text-[#140152]/70 mt-0.5">
                                            {active.city ? `${active.city}, ` : ''}{active.country_name} <span className="text-[#140152]/40 ml-1">· {active.continent}</span>
                                        </p>
                                        {active.blurb && <p className="text-xs text-[#140152]/70 mt-2 italic line-clamp-2">{active.blurb}</p>}

                                        {(active.contact_email || active.contact_phone || active.website) && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {active.contact_phone && <a href={`tel:${active.contact_phone}`} className="text-[11px] inline-flex items-center gap-1 bg-[#140152]/5 hover:bg-[#140152]/10 text-[#140152] font-bold px-2.5 py-1 rounded-full"><Phone className="w-3 h-3" /> {active.contact_phone}</a>}
                                                {active.contact_email && <a href={`mailto:${active.contact_email}`} className="text-[11px] inline-flex items-center gap-1 bg-[#140152]/5 hover:bg-[#140152]/10 text-[#140152] font-bold px-2.5 py-1 rounded-full"><Mail className="w-3 h-3" /> Email</a>}
                                                {active.website && <a href={active.website} target="_blank" rel="noopener noreferrer" className="text-[11px] inline-flex items-center gap-1 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold px-2.5 py-1 rounded-full"><ExternalLink className="w-3 h-3" /> Website</a>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-5 flex-wrap text-xs">
                {(['hq', 'branch', 'mission', 'fellowship'] as ChurchKind[]).map(k => (
                    <span key={k} className="inline-flex items-center gap-1.5 text-[#140152]/70 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_STYLES[k].dot, boxShadow: `0 0 8px ${KIND_STYLES[k].dot}` }} />
                        {KIND_STYLES[k].label}
                    </span>
                ))}
                <span className="text-[#140152]/50 inline-flex items-center gap-1.5"><Users className="w-3 h-3" /> Click any marker for details</span>
            </div>

            {/* Country breakdown row */}
            {visible.length > 0 && (
                <div className="max-w-6xl mx-auto mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {visible.slice(0, 20).map(l => (
                        <button key={l.id} onClick={() => setActive(l)}
                            className="text-left p-3 bg-white border border-gray-100 rounded-xl hover:border-[#140152]/30 hover:shadow-md transition-all">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#f5bb00]">{KIND_STYLES[l.kind].label}</p>
                            <p className="font-bold text-[#140152] text-sm truncate">{l.name}</p>
                            <p className="text-[11px] text-gray-500 truncate inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {l.city || l.country_name}</p>
                        </button>
                    ))}
                </div>
            )}
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

function ContinentShapes() {
    const fill = 'rgba(245,187,0,0.05)'
    const stroke = 'rgba(245,187,0,0.18)'
    const sw = 0.8
    return (
        <g>
            {[100, 200, 300, 400].map(y => (
                <line key={`la${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(245,187,0,0.05)" strokeWidth="0.4" />
            ))}
            {[200, 400, 600, 800].map(x => (
                <line key={`lo${x}`} x1={x} y1="0" x2={x} y2="500" stroke="rgba(245,187,0,0.05)" strokeWidth="0.4" />
            ))}
            <path d="M150,140 L260,130 L320,170 L330,230 L290,260 L240,265 L210,250 L180,225 L160,200 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M240,275 L270,290 L260,310 L230,300 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M295,310 L340,320 L355,380 L335,440 L305,450 L275,400 L280,350 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M380,90 L420,80 L430,120 L395,135 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M460,180 L530,170 L540,200 L520,230 L475,235 L460,210 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M520,260 L600,250 L640,290 L640,360 L600,420 L555,420 L530,370 L515,310 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M600,235 L650,235 L670,265 L640,275 L605,260 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M550,160 L760,150 L840,200 L860,270 L790,300 L730,290 L670,260 L630,235 L580,210 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M700,265 L740,265 L745,310 L720,320 L705,295 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M790,300 L830,310 L845,340 L805,340 L790,320 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M840,395 L905,395 L920,430 L885,450 L845,440 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M935,450 L955,445 L950,470 L935,470 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M860,230 L878,225 L880,250 L862,255 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
            <path d="M475,180 L495,178 L495,205 L478,205 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
        </g>
    )
}

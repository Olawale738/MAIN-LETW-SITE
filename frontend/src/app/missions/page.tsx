'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Globe, MapPin, ArrowRight } from 'lucide-react'
import { missionariesApi, type Missionary } from '@/lib/api'
import ScrollReveal from '@/components/effects/ScrollReveal'

export default function MissionsPage() {
    const [missionaries, setMissionaries] = useState<Missionary[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        missionariesApi.list().then(setMissionaries).catch(() => setMissionaries([])).finally(() => setLoading(false))
    }, [])

    const featured = missionaries.filter(m => m.is_featured)
    const others = missionaries.filter(m => !m.is_featured)

    return (
        <main className="min-h-screen bg-[#fbf5e6]">
            <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3 inline-flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Sent into all the world</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">Our Missionary Family</h1>
                <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">Pray for them. Sponsor one of them. Stand with them as they take the Gospel to the nations.</p>
            </section>

            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
                {loading ? <p className="text-center text-gray-400 py-12">Loading…</p> : missionaries.length === 0 ? (
                    <p className="text-center text-gray-400 py-12">Missionary profiles coming soon.</p>
                ) : (
                    <>
                        {featured.length > 0 && (
                            <div className="mb-12">
                                <p className="text-xs font-bold uppercase tracking-wider text-[#f5bb00] mb-4">Featured this season</p>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {featured.map((m, i) => (
                                        <ScrollReveal key={m.id} delay={i * 60}>
                                            <MissionaryCard m={m} featured />
                                        </ScrollReveal>
                                    ))}
                                </div>
                            </div>
                        )}
                        {others.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">All our missionaries</p>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {others.map((m, i) => (
                                        <ScrollReveal key={m.id} delay={i * 40}>
                                            <MissionaryCard m={m} />
                                        </ScrollReveal>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    )
}

function MissionaryCard({ m, featured }: { m: Missionary; featured?: boolean }) {
    return (
        <Link href={`/missions/${m.slug}`} className={`block bg-white rounded-3xl shadow-md hover:shadow-2xl transition-shadow overflow-hidden group ${featured ? '' : ''}`}>
            <div className="aspect-[4/3] bg-gradient-to-br from-[#140152] to-[#1a0270] overflow-hidden relative">
                {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#f5bb00]/30 text-6xl font-black">{m.name.slice(0, 1)}</div>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[#140152] px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {m.country}
                </div>
            </div>
            <div className="p-5">
                <p className="text-lg font-black text-[#140152]">{m.name}</p>
                {m.organisation && <p className="text-xs text-gray-500">{m.organisation}</p>}
                <p className="text-sm text-gray-700 mt-2">{m.ministry_focus}</p>
                <p className="mt-4 text-xs font-bold text-[#140152] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    View profile & sponsor <ArrowRight className="w-3 h-3" />
                </p>
            </div>
        </Link>
    )
}

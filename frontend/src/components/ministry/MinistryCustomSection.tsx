'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Sparkles } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

const getIcon = (name?: string) => {
    if (!name) return Sparkles
    const I = (LucideIcons as any)[name]
    return I || Sparkles
}

export type CustomSectionPosition =
    | 'after_hero'
    | 'after_carousel'
    | 'after_pillars'
    | 'after_programs'
    | 'after_scripture'
    | 'after_join'
    | 'before_footer'

export type CustomSectionKind = 'text' | 'scripture' | 'cards' | 'cta'

export interface CustomSection {
    id?: string
    position: CustomSectionPosition
    kind: CustomSectionKind
    bg?: 'white' | 'tint' | 'dark'   // background palette
    eyebrow?: string
    heading?: string
    subtitle?: string
    body?: string
    reference?: string                // for scripture kind
    button_text?: string              // for cta kind
    button_link?: string
    items?: Array<{ icon?: string; title?: string; desc?: string }>  // for cards kind
}

interface Props {
    section: CustomSection
    primary: string   // brand primary color hex (e.g. blue for women / steel for men)
    accent: string    // gold / gradient stop
    navy: string
}

export default function MinistryCustomSection({ section, primary, accent, navy }: Props) {
    const bgStyle =
        section.bg === 'dark'
            ? { background: `linear-gradient(135deg, ${navy} 0%, ${primary} 100%)`, color: 'white' }
            : section.bg === 'tint'
                ? { background: `linear-gradient(180deg, ${primary}11 0%, white 100%)` }
                : { background: 'white' }
    const isDark = section.bg === 'dark'

    if (section.kind === 'text') {
        return (
            <section className="relative py-20 md:py-24" style={bgStyle}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {section.eyebrow && (
                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${isDark ? 'text-[#f5bb00]' : ''}`} style={isDark ? {} : { color: primary }}>
                            {section.eyebrow}
                        </p>
                    )}
                    {section.heading && (
                        <h2 className={`text-3xl md:text-5xl font-black leading-tight mb-5 ${isDark ? 'text-white' : 'text-[#140152]'}`}>
                            {section.heading}
                        </h2>
                    )}
                    <div className="w-24 h-1.5 mx-auto rounded-full mb-7" style={{ background: `linear-gradient(to right, ${primary}, ${accent})` }} />
                    {section.subtitle && (
                        <p className={`text-lg italic mb-5 ${isDark ? 'text-white/85' : 'text-[#140152]'}`} style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
                            {section.subtitle}
                        </p>
                    )}
                    {section.body && (
                        <p className={`text-base leading-relaxed max-w-2xl mx-auto whitespace-pre-line ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                            {section.body}
                        </p>
                    )}
                </div>
            </section>
        )
    }

    if (section.kind === 'scripture') {
        return (
            <section className="relative overflow-hidden py-20 md:py-24" style={{ background: navy }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full blur-[140px]" style={{ background: `${primary}26` }} />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <Sparkles className="w-10 h-10 mx-auto mb-6" style={{ color: accent }} />
                    {section.eyebrow && (
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f5bb00] mb-4">{section.eyebrow}</p>
                    )}
                    {section.body && (
                        <p className="text-2xl md:text-4xl leading-snug font-bold italic text-white" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
                            &ldquo;{section.body}&rdquo;
                        </p>
                    )}
                    {section.reference && (
                        <p className="mt-7 text-xs font-bold uppercase tracking-[0.4em] text-[#f5bb00]">{section.reference}</p>
                    )}
                </div>
            </section>
        )
    }

    if (section.kind === 'cards') {
        const items = section.items || []
        if (items.length === 0) return null
        return (
            <section className="relative py-20 md:py-28" style={bgStyle}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14 space-y-4">
                        {section.eyebrow && (
                            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-[#f5bb00]' : ''}`} style={isDark ? {} : { color: primary }}>
                                {section.eyebrow}
                            </p>
                        )}
                        {section.heading && (
                            <h2 className={`text-3xl md:text-5xl font-black leading-tight ${isDark ? 'text-white' : 'text-[#140152]'}`}>
                                {section.heading}
                            </h2>
                        )}
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${primary}, ${accent})` }} />
                        {section.subtitle && (
                            <p className={`max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-white/80' : 'text-gray-600'}`}>{section.subtitle}</p>
                        )}
                    </div>
                    <div className={`grid gap-6 ${
                        items.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                        items.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                        items.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                    }`}>
                        {items.map((it, i) => {
                            const Icon = getIcon(it.icon)
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.07 }}
                                >
                                    <Card className="h-full border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group bg-white relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(to right, ${primary}, ${accent})` }} />
                                        <CardContent className="p-7">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform"
                                                 style={{ background: `linear-gradient(135deg, ${primary}, ${navy})` }}>
                                                <Icon className="w-7 h-7 text-[#f5bb00]" />
                                            </div>
                                            <h3 className="text-xl font-black text-[#140152] mb-3 leading-tight">{it.title || ''}</h3>
                                            {it.desc && <p className="text-gray-600 leading-relaxed text-[15px]">{it.desc}</p>}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>
        )
    }

    if (section.kind === 'cta') {
        return (
            <section className="relative overflow-hidden py-20" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${navy} 100%)` }}>
                <div className="max-w-3xl mx-auto px-4 text-center text-white">
                    {section.eyebrow && (
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f5bb00] mb-4">{section.eyebrow}</p>
                    )}
                    {section.heading && (
                        <h3 className="text-3xl md:text-4xl font-black mb-4">{section.heading}</h3>
                    )}
                    {section.body && (
                        <p className="text-white/80 leading-relaxed mb-8 whitespace-pre-line">{section.body}</p>
                    )}
                    {section.button_text && section.button_link && (
                        <a
                            href={section.button_link}
                            className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-white text-[#140152] font-bold px-7 py-3.5 rounded-full transition-all hover:scale-105 shadow-2xl"
                        >
                            {section.button_text} <ArrowRight className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </section>
        )
    }

    return null
}


export function CustomSectionsAt({ sections, position, primary, accent, navy }: {
    sections?: CustomSection[]
    position: CustomSectionPosition
    primary: string
    accent: string
    navy: string
}) {
    if (!Array.isArray(sections) || sections.length === 0) return null
    const filtered = sections.filter(s => s && s.position === position)
    if (filtered.length === 0) return null
    return (
        <>
            {filtered.map((s, i) => (
                <MinistryCustomSection key={s.id || `${position}-${i}`} section={s} primary={primary} accent={accent} navy={navy} />
            ))}
        </>
    )
}

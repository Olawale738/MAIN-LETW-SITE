'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PremiumButton from '@/components/ui/PremiumButton'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Globe, Heart, Users, ExternalLink } from 'lucide-react'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import { cmsApi, CMSPageContent } from '@/lib/api'

const DEFAULT_CONTENT: CMSPageContent = {
    hero: { title: "Making Jesus<br /><span class=\"text-[#f5bb00]\">Known</span>", subtitle: "Extending the love of Christ beyond the four walls of the church through service, missions, and community transformation.", bg_image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2670", label: "Kingdom Impact" },
    stats: [
        { label: "Lives Touched", value: "10,000+", icon: "Users" },
        { label: "Communities Served", value: "15", icon: "Globe" },
        { label: "Missions", value: "50+", icon: "ExternalLink" },
        { label: "Volunteers", value: "500+", icon: "Heart" },
    ],
    grid: {
        outreach: { title: "Community Outreach", description: "Providing food, clothing, and essential supplies to families in need within our local community.", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800", icon: "Heart" },
        missions: { title: "Global Missions", description: "Partnering with churches and organizations worldwide to spread the Gospel.", image: "https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=800", icon: "Globe" },
        youth: { title: "Youth Empowerment", description: "Mentoring the next generation through education, skill acquisition, and leadership training.", image: "https://images.unsplash.com/photo-1529390003875-5fd77b6580f5?w=800", icon: "Users" },
        medical: { title: "Medical Missions", description: "Providing free medical checkups and basic healthcare support to underserved areas.", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800", icon: "Heart" }
    },
    partner: {
        title: "Partner With Us",
        content: "Your generosity fuels these initiatives. When you give, you are not just donating; you are feeding the hungry, healing the sick, and equipping the next generation. Join us in making a tangible difference.",
        image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800",
        button_text: "Give to Missions",
        button_link: "/giving"
    }
}

export default function ImpactPage() {
    const [content, setContent] = useState<CMSPageContent>(DEFAULT_CONTENT)

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await cmsApi.getPage('impact')
                if (data && data.content) {
                    setContent(prev => ({
                        ...prev,
                        ...data.content,
                        hero: { ...prev.hero, ...(data.content.hero || {}) },
                        stats: data.content.stats || prev.stats,
                        grid: { ...prev.grid, ...(data.content.grid || {}) },
                        partner: { ...prev.partner, ...(data.content.partner || {}) }
                    }))
                }
            } catch {
                console.log("Using default impact content")
            }
        }
        fetchContent()
    }, [])

    const getImageUrl = (img?: string) => {
        if (!img) return ''
        if (img.startsWith('/') || img.startsWith('http')) return img
        return cmsApi.getImageUrl(img)
    }

    const getIcon = (name: string) => {
        switch (name) {
            case 'Globe': return <Globe className="h-4 w-4 p-2 text-neutral-500" />
            case 'Heart': return <Heart className="h-4 w-4 p-2 text-neutral-500" />
            case 'Users': return <Users className="h-4 w-4 p-2 text-neutral-500" />
            case 'ExternalLink': return <ExternalLink className="h-4 w-4 p-2 text-neutral-500" />
            default: return <Heart className="h-4 w-4 p-2 text-neutral-500" />
        }
    }

    const getStatIcon = (name: string) => {
        switch (name) {
            case 'Globe': return Globe
            case 'Heart': return Heart
            case 'Users': return Users
            case 'ExternalLink': return ExternalLink
            default: return Heart
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Hero */}
            <div className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center bg-[#140152] pt-24">
                <img
                    src={getImageUrl(content.hero?.bg_image)}
                    alt="Impact"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto"
                >
                    <div className="text-[#f5bb00] font-bold tracking-widest uppercase mb-2 text-sm md:text-base">{content.hero?.label}</div>
                    <h1 className="text-4xl md:text-6xl font-black mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: content.hero?.title || "" }} />
                    <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto font-light">
                        {content.hero?.subtitle}
                    </p>
                </motion.div>
            </div>

            {/* Impact Stats */}
            <SectionWrapper>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-20 text-center">
                    {content.stats?.map((stat: { label?: string, value?: string, icon?: string }, i: number) => {
                        const Icon = getStatIcon(stat.icon || 'Heart')
                        return (
                            <div key={i} className="p-6">
                                <Icon className="w-8 h-8 mx-auto text-[#f5bb00] mb-4" />
                                <div className="text-4xl md:text-5xl font-black text-[#140152] dark:text-white mb-2">{stat.value}</div>
                                <div className="text-gray-500 font-bold uppercase tracking-wider text-sm">{stat.label}</div>
                            </div>
                        )
                    })}
                </div>

                <BentoGrid className="max-w-6xl mx-auto">
                    {content.grid && ['outreach', 'missions', 'youth', 'medical'].map((key) => {
                        const item = content.grid?.[key];
                        if (!item) return null;
                        return (
                            <BentoGridItem
                                key={key}
                                title={item.title}
                                description={item.description}
                                header={<div
                                    className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 bg-cover bg-center opacity-80"
                                    style={{ backgroundImage: `url('${getImageUrl(item.image)}')` }}
                                />}
                                className={key === 'outreach' || key === 'medical' ? "md:col-span-2" : "md:col-span-1"}
                                icon={getIcon(item.icon || 'Heart')}
                            />
                        )
                    })}
                </BentoGrid>
            </SectionWrapper>

            <SectionWrapper background="gray">
                <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    <div className="space-y-6">
                        <h2 className="text-4xl font-black text-[#140152] mb-4">{content.partner?.title}</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            {content.partner?.content}
                        </p>
                        <div className="flex gap-4">
                            <PremiumButton href={content.partner?.button_link || "/giving"}>{content.partner?.button_text}</PremiumButton>
                        </div>
                    </div>
                    <div className="relative h-[500px] rounded-[2rem] overflow-hidden shadow-2xl">
                        <img src={getImageUrl(content.partner?.image)} alt="Partner" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                </div>
            </SectionWrapper>
        </div>
    )
}

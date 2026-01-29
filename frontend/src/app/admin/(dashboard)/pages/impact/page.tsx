'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImagePicker from '@/components/admin/cms/ImagePicker'
import { cmsApi, CMSPageContent } from '@/lib/api'
import { Loader2, Save } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const DEFAULT_CONTENT: CMSPageContent = {
    hero: { title: "Making Jesus Known", subtitle: "Extending the love of Christ beyond the four walls of the church through service, missions, and community transformation.", bg_image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2670", label: "Kingdom Impact" },
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

export default function ImpactPageEditor() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [content, setContent] = useState<CMSPageContent>(DEFAULT_CONTENT)
    const { showToast, ToastComponent } = useToast()

    useEffect(() => {
        loadContent()
    }, [])

    const loadContent = async () => {
        setLoading(true)
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
            console.log("No existing content, using default")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await cmsApi.updatePage('impact', 'Impact Page', content)
            showToast("Impact page updated successfully.", "success")
        } catch {
            showToast("Failed to save changes.", "error")
        } finally {
            setSaving(false)
        }
    }

    const updateNested = (section: string, field: string, value: string) => {
        setContent(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }))
    }

    const updateStat = (index: number, field: string, value: string) => {
        setContent(prev => {
            const newStats = [...(prev.stats || [])]
            newStats[index] = { ...newStats[index], [field]: value }
            return { ...prev, stats: newStats }
        })
    }

    const updateGrid = (key: string, field: string, value: string) => {
        setContent(prev => ({
            ...prev,
            grid: {
                ...prev.grid,
                [key]: {
                    ...prev.grid[key],
                    [field]: value
                }
            }
        }))
    }

    if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-900" /></div>

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <ToastComponent />
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 py-4 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Impact Page Editor</h1>
                    <p className="text-gray-500">Edit the Impact and Missions content.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-[#140152] text-white">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            {/* HERO SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 1</span>
                    <h2 className="text-xl font-bold text-[#140152]">Hero Configuration</h2>
                </div>
                <Card>
                    <CardHeader><CardTitle>Hero Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Label</Label>
                            <Input value={content.hero?.label || ""} onChange={e => updateNested('hero', 'label', e.target.value)} placeholder="KINGDOM IMPACT" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={content.hero?.title || ""} onChange={e => updateNested('hero', 'title', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Subtitle</Label>
                            <Textarea value={content.hero?.subtitle || ""} onChange={e => updateNested('hero', 'subtitle', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Background Image</Label>
                            <ImagePicker value={content.hero?.bg_image} onChange={url => updateNested('hero', 'bg_image', url)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* STATS SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 2</span>
                    <h2 className="text-xl font-bold text-[#140152]">Impact Stats</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {content.stats?.map((stat: { label?: string, value?: string, icon?: string }, i: number) => (
                        <Card key={i}>
                            <CardHeader><CardTitle>Stat {i + 1}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Label</Label>
                                    <Input value={stat.label || ""} onChange={e => updateStat(i, 'label', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Value</Label>
                                    <Input value={stat.value || ""} onChange={e => updateStat(i, 'value', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Icon Name</Label>
                                    <Input value={stat.icon || ""} onChange={e => updateStat(i, 'icon', e.target.value)} placeholder="Lucide icon name" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* BENTO GRID SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 3</span>
                    <h2 className="text-xl font-bold text-[#140152]">Impact Areas</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {content.grid && ['outreach', 'missions', 'youth', 'medical'].map((key) => (
                        <Card key={key}>
                            <CardHeader><CardTitle className="capitalize">{key}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input value={content.grid?.[key]?.title || ""} onChange={e => updateGrid(key, 'title', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea value={content.grid?.[key]?.description || ""} onChange={e => updateGrid(key, 'description', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Image</Label>
                                    <ImagePicker value={content.grid?.[key]?.image} onChange={url => updateGrid(key, 'image', url)} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* PARTNER SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 4</span>
                    <h2 className="text-xl font-bold text-[#140152]">Partner Section</h2>
                </div>
                <Card>
                    <CardHeader><CardTitle>Partner Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={content.partner?.title || ""} onChange={e => updateNested('partner', 'title', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Content</Label>
                            <Textarea value={content.partner?.content || ""} onChange={e => updateNested('partner', 'content', e.target.value)} rows={4} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Image</Label>
                            <ImagePicker value={content.partner?.image} onChange={url => updateNested('partner', 'image', url)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Button Text</Label>
                            <Input value={content.partner?.button_text || ""} onChange={e => updateNested('partner', 'button_text', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Button Link</Label>
                            <Input value={content.partner?.button_link || ""} onChange={e => updateNested('partner', 'button_link', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

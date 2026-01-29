'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImagePicker from '@/components/admin/cms/ImagePicker'
import { cmsApi, CMSPageContent } from '@/lib/api'
import { Loader2, Save, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const DEFAULT_CONTENT: CMSPageContent = {
    hero: {
        title: "Light Encounter <br /> Tabernacle",
        subtitle: "Engage. Empower. Uplift. Experience the divine presence in a sanctuary of faith and love.",
        bg_image: "/9.png"
    },
    about: {
        label: "About Us",
        founder_image: "/Founder.png",
        founder_name: "Apostle. Olawale N. Sanni",
        founder_role: "Founder/President",
        founder_email: "president@letw.org",
        title: "A Vision for <br />Community Transformation",
        content_1: "Founded on the principles of faith, love, and service, Light Encounter Tabernacle is dedicated to being a beacon of hope. Our mission is to empower individuals to live purposeful lives through the transformative power of God's Word.",
        content_2: `"You are the light of the world. A town built on a hill cannot be hidden... In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven." - Matthew 5:14-16`
    },
    essence: {
        label: "Our Essence",
        title: "More Than A Church",
        cards: [
            {
                title: "Divine Worship",
                description: "Experience powerful, spirit-filled worship that connects you directly to the heart of God.",
                image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800",
                icon: "Sparkles"
            },
            {
                title: "Community",
                description: "A place where everyone belongs. We foster strong relationships and genuine care.",
                image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
                icon: "Users"
            },
            {
                title: "Pastoral Care",
                description: "Guidance and support for every season of your life.",
                image: "https://images.unsplash.com/photo-1544427928-c49cdfebf494?w=800",
                icon: "Shield"
            },
            {
                title: "Outreach",
                description: "Extending God's love beyond our walls to those in need.",
                image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800",
                icon: "Heart"
            }
        ]
    }
}

export default function HomePageEditor() {
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
            const data = await cmsApi.getPage('home')
            if (data && data.content) {
                // Handle potential migration if essence was previously an array
                let essenceData = data.content.essence;
                if (Array.isArray(essenceData)) {
                    essenceData = {
                        label: "Our Essence",
                        title: "More Than A Church",
                        cards: essenceData
                    };
                }

                setContent(prev => ({
                    ...prev,
                    ...data.content,
                    essence: essenceData || DEFAULT_CONTENT.essence
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
            await cmsApi.updatePage('home', 'Home Page', content)
            showToast("Home page updated successfully.", "success")
        } catch {
            showToast("Failed to save changes.", "error")
        } finally {
            setSaving(false)
        }
    }

    const updateField = (section: string, field: string, value: string) => {
        setContent(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }))
    }

    const updateEssenceField = (field: string, value: string) => {
        setContent(prev => ({
            ...prev,
            essence: {
                ...prev.essence,
                [field]: value
            }
        }))
    }

    const updateEssenceCard = (index: number, field: string, value: string) => {
        const newCards = [...(content.essence.cards || [])]
        newCards[index] = { ...newCards[index], [field]: value }
        setContent(prev => ({
            ...prev,
            essence: { ...prev.essence, cards: newCards }
        }))
    }

    const addEssenceCard = () => {
        const newCards = [...(content.essence.cards || []), { title: "New Card", description: "", icon: "Sparkles", image: "" }]
        setContent(prev => ({
            ...prev,
            essence: { ...prev.essence, cards: newCards }
        }))
    }

    const removeEssenceCard = (index: number) => {
        const newCards = [...(content.essence.cards || [])]
        newCards.splice(index, 1)
        setContent(prev => ({
            ...prev,
            essence: { ...prev.essence, cards: newCards }
        }))
    }

    if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-900" /></div>

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <ToastComponent />
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 py-4 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Home Page Editor</h1>
                    <p className="text-gray-500">Customize the content and look of the landing page.</p>
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
                    <CardHeader>
                        <CardTitle>Hero Configuration</CardTitle>
                        <CardDescription>Top section with background image and main headline.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label>Headline (HTML allowed)</Label>
                            <Input
                                value={content.hero?.title || ""}
                                onChange={e => updateField('hero', 'title', e.target.value)}
                                placeholder="<br/> tags allowed for line breaks"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Subtitle</Label>
                            <Textarea
                                value={content.hero?.subtitle || ""}
                                onChange={e => updateField('hero', 'subtitle', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Background Image</Label>
                            <ImagePicker
                                value={content.hero?.bg_image}
                                onChange={url => updateField('hero', 'bg_image', url)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ABOUT SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 2</span>
                    <h2 className="text-xl font-bold text-[#140152]">About Section</h2>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Founder & Vision</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label>Section Label</Label>
                                <Input value={content.about?.label || "About Us"} onChange={e => updateField('about', 'label', e.target.value)} placeholder="e.g. ABOUT US" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Founder Name</Label>
                                <Input value={content.about?.founder_name || ""} onChange={e => updateField('about', 'founder_name', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Founder Role</Label>
                                <Input value={content.about?.founder_role || ""} onChange={e => updateField('about', 'founder_role', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Founder Email</Label>
                                <Input value={content.about?.founder_email || ""} onChange={e => updateField('about', 'founder_email', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Founder Image</Label>
                                <ImagePicker value={content.about?.founder_image} onChange={url => updateField('about', 'founder_image', url)} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label>Section Title (HTML)</Label>
                                <Input value={content.about?.title || ""} onChange={e => updateField('about', 'title', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Paragraph 1</Label>
                                <Textarea value={content.about?.content_1 || ""} onChange={e => updateField('about', 'content_1', e.target.value)} rows={4} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Paragraph 2</Label>
                                <Textarea value={content.about?.content_2 || ""} onChange={e => updateField('about', 'content_2', e.target.value)} rows={4} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ESSENCE SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 3</span>
                    <h2 className="text-xl font-bold text-[#140152]">Essence Cards</h2>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Section Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label>Section Label</Label>
                            <Input
                                value={content.essence?.label || "Our Essence"}
                                onChange={e => updateEssenceField('label', e.target.value)}
                                placeholder="e.g. OUR ESSENCE"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Section Title</Label>
                            <Input
                                value={content.essence?.title || "More Than A Church"}
                                onChange={e => updateEssenceField('title', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Cards</h3>
                    <Button onClick={addEssenceCard} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Add Card
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {content.essence?.cards?.map((item: { title?: string, description?: string, icon?: string, image?: string }, i: number) => (
                        <Card key={i} className="relative group">
                            <Button
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white border-none p-0"
                                onClick={() => removeEssenceCard(i)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                            <CardHeader>
                                <CardTitle className="text-base">Card {i + 1}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={item.title || ""}
                                        onChange={e => updateEssenceCard(i, 'title', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={item.description || ""}
                                        onChange={e => updateEssenceCard(i, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Icon Name</Label>
                                    <Input
                                        value={item.icon || ""}
                                        placeholder="Sparkles, Users, Shield, Heart"
                                        onChange={e => updateEssenceCard(i, 'icon', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Card Image</Label>
                                    <ImagePicker
                                        value={item.image}
                                        onChange={url => updateEssenceCard(i, 'image', url)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

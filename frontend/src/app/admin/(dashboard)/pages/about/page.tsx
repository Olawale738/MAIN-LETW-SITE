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
    hero: { title: "About LETW", subtitle: "Spreading God's Love, Transforming Lives", bg_image: "/9.png" },
    identity: {
        title: "Who We Are",
        description: "Light Encounter Tabernacle Worldwide is dedicated to spreading the Word of GOD, empowering individuals, and engaging in charitable activities to uplift our community and beyond."
    },
    grid: {
        mission: { title: "Our Mission", description: "To spread the love of Christ through worship, discipleship, and community service, transforming lives and building a stronger faith community." },
        vision: { title: "Our Vision", description: "To be a beacon of hope and light in our community, empowering individuals to live purposeful lives rooted in faith and service." },
        values: { title: "Our Values", description: "Faith, Love, Service, Integrity, and Community. We believe in living out these values daily through our actions and ministry. Walking in the light of God's word.", image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800" },
        reach: { title: "Our Reach", description: "From local community outreach to global missions, we're committed to making a difference wherever God calls us to serve.", image: "https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=800" }
    },
    founder: {
        image: "/Founder.png",
        name: "Apostle. Olawale N. Sanni",
        role: "Founder/President",
        email: "president@letw.org",
        title: "Our Story of Faith",
        content_1: "Founded with a vision to bring light to those in darkness, LETW has grown into a vibrant community of believers committed to making a difference. Through worship, teaching, and service, we continue to fulfill our calling to be salt and light in the world.",
        content_2: "Our journey has been marked by God's faithfulness, and we look forward to continued growth and impact as we serve our community and beyond."
    }
}

export default function AboutPageEditor() {
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
            const data = await cmsApi.getPage('about')
            if (data && data.content) {
                setContent(prev => ({
                    ...prev,
                    ...data.content,
                    hero: { ...prev.hero, ...(data.content.hero || {}) },
                    identity: { ...prev.identity, ...(data.content.identity || {}) },
                    grid: { ...prev.grid, ...(data.content.grid || {}) },
                    founder: { ...prev.founder, ...(data.content.founder || {}) }
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
            await cmsApi.updatePage('about', 'About Page', content)
            showToast("About page updated successfully.", "success")
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
                    <h1 className="text-3xl font-bold text-[#140152]">About Page Editor</h1>
                    <p className="text-gray-500">Edit the About Us page content.</p>
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
                    <h2 className="text-xl font-bold text-[#140152]">Hero Section</h2>
                </div>
                <Card>
                    <CardHeader><CardTitle>Hero Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={content.hero?.title || ""} onChange={e => updateNested('hero', 'title', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Subtitle</Label>
                            <Input value={content.hero?.subtitle || ""} onChange={e => updateNested('hero', 'subtitle', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Background Image</Label>
                            <ImagePicker value={content.hero?.bg_image} onChange={url => updateNested('hero', 'bg_image', url)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* IDENTITY SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 2</span>
                    <h2 className="text-xl font-bold text-[#140152]">Identity Section</h2>
                </div>
                <Card>
                    <CardHeader><CardTitle>Identity Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={content.identity?.title || ""} onChange={e => updateNested('identity', 'title', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={content.identity?.description || ""} onChange={e => updateNested('identity', 'description', e.target.value)} rows={4} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* BENTO GRID SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 3</span>
                    <h2 className="text-xl font-bold text-[#140152]">Bento Grid</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {content.grid && ['mission', 'vision'].map((key) => (
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
                            </CardContent>
                        </Card>
                    ))}
                    {content.grid && ['values', 'reach'].map((key) => (
                        <Card key={key}>
                            <CardHeader><CardTitle className="capitalize">{key} (With Image)</CardTitle></CardHeader>
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
                                    <Label>Background Image</Label>
                                    <ImagePicker value={content.grid?.[key]?.image} onChange={url => updateGrid(key, 'image', url)} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* FOUNDER SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="bg-[#140152] text-white text-xs font-bold px-2 py-1 rounded">SECTION 4</span>
                    <h2 className="text-xl font-bold text-[#140152]">Founder & Story</h2>
                </div>
                <Card>
                    <CardHeader><CardTitle>Founder Configuration</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Founder Name</Label>
                                <Input value={content.founder?.name || ""} onChange={e => updateNested('founder', 'name', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Input value={content.founder?.role || ""} onChange={e => updateNested('founder', 'role', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input value={content.founder?.email || ""} onChange={e => updateNested('founder', 'email', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Image</Label>
                                <ImagePicker value={content.founder?.image} onChange={url => updateNested('founder', 'image', url)} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Story Title</Label>
                                <Input value={content.founder?.title || ""} onChange={e => updateNested('founder', 'title', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Content Part 1</Label>
                                <Textarea value={content.founder?.content_1 || ""} onChange={e => updateNested('founder', 'content_1', e.target.value)} rows={4} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Content Part 2</Label>
                                <Textarea value={content.founder?.content_2 || ""} onChange={e => updateNested('founder', 'content_2', e.target.value)} rows={4} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

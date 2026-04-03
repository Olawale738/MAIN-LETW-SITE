'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { alterSoundApi, AlterSoundPageSettings } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export default function AlterSoundSettingsPage() {
    const [settings, setSettings] = useState<AlterSoundPageSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { showToast, ToastComponent } = useToast()

    const [formData, setFormData] = useState({
        hero_title: '',
        hero_subtitle: '',
        hero_description: '',
        hero_background_url: '',
        featured_section_title: '',
        categories_section_title: '',
        cta_text: '',
        cta_button_text: '',
        cta_button_link: '',
    })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await alterSoundApi.getSettings()
                setSettings(data)
                setFormData({
                    hero_title: data.hero_title,
                    hero_subtitle: data.hero_subtitle,
                    hero_description: data.hero_description,
                    hero_background_url: data.hero_background_url || '',
                    featured_section_title: data.featured_section_title,
                    categories_section_title: data.categories_section_title,
                    cta_text: data.cta_text || '',
                    cta_button_text: data.cta_button_text || '',
                    cta_button_link: data.cta_button_link || '',
                })
            } catch (error) {
                console.error('Failed to load settings:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const updated = await alterSoundApi.updateSettings(formData)
            setSettings(updated)
            showToast('Settings updated successfully!', 'success')
        } catch (error) {
            console.error('Failed to update settings:', error)
            showToast('Failed to update settings', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-20">
                    <p className="text-gray-600">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <ToastComponent />
            <div className="mb-8 flex items-center gap-4">
                <Link href="/admin/alter-sound">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Alter Sound Settings</h1>
                    <p className="text-gray-600">Customize the Alter Sound page content</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Hero Section */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-[#140152] mb-4">Hero Section</h2>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="hero_subtitle" className="text-gray-900">Subtitle</Label>
                                <Input
                                    id="hero_subtitle"
                                    value={formData.hero_subtitle}
                                    onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                                    placeholder="Alter Sound"
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <Label htmlFor="hero_title" className="text-gray-900">Title</Label>
                                <Input
                                    id="hero_title"
                                    value={formData.hero_title}
                                    onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                                    placeholder="Raising Sound That|Carries Heaven's Intention"
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <Label htmlFor="hero_description" className="text-gray-900">Description</Label>
                                <Textarea
                                    id="hero_description"
                                    value={formData.hero_description}
                                    onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                                    placeholder="Not entertainment. A consecrated space..."
                                    rows={3}
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <Label htmlFor="hero_background_url" className="text-gray-900">Background Image URL</Label>
                                <Input
                                    id="hero_background_url"
                                    value={formData.hero_background_url}
                                    onChange={(e) => setFormData({ ...formData, hero_background_url: e.target.value })}
                                    placeholder="https://images.unsplash.com/..."
                                    className="text-gray-900"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Section Titles */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-[#140152] mb-4">Section Titles</h2>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="featured_section_title" className="text-gray-900">Featured Section Title</Label>
                                <Input
                                    id="featured_section_title"
                                    value={formData.featured_section_title}
                                    onChange={(e) => setFormData({ ...formData, featured_section_title: e.target.value })}
                                    placeholder="Featured Tracks"
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <Label htmlFor="categories_section_title" className="text-gray-900">Categories Section Title</Label>
                                <Input
                                    id="categories_section_title"
                                    value={formData.categories_section_title}
                                    onChange={(e) => setFormData({ ...formData, categories_section_title: e.target.value })}
                                    placeholder="Browse by Category"
                                    className="text-gray-900"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-[#140152] text-white hover:bg-[#140152]/90"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}


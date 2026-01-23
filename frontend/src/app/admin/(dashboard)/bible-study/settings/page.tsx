'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Settings, ArrowLeft, Save } from 'lucide-react'
import { 
    bibleStudyApi, BibleStudyPageSettings, BibleStudyPageSettingsUpdate
} from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

export default function BibleStudySettingsAdmin() {
    const { showToast, ToastComponent } = useToast()
    const [settings, setSettings] = useState<BibleStudyPageSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<BibleStudyPageSettingsUpdate>({
        hero_title: '',
        hero_subtitle: '',
        hero_description: '',
        hero_background_url: ''
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const data = await bibleStudyApi.getSettings()
            setSettings(data)
            setFormData({
                hero_title: data.hero_title,
                hero_subtitle: data.hero_subtitle,
                hero_description: data.hero_description,
                hero_background_url: data.hero_background_url || ''
            })
        } catch (error) {
            console.error('Failed to fetch settings:', error)
            showToast('Failed to load settings', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            await bibleStudyApi.updateSettings(formData)
            showToast('Settings updated successfully!', 'success')
            await fetchSettings()
        } catch (error: any) {
            console.error('Failed to update settings:', error)
            showToast(error.message || 'Failed to update settings', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Settings className="w-12 h-12 animate-pulse text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            {ToastComponent}
            
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin">
                    <Button variant="ghost" className="mb-4 text-[#140152] hover:text-[#f5bb00]">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to Admin
                    </Button>
                </Link>
                
                <div>
                    <h1 className="text-4xl font-black text-[#140152] mb-2">Bible Study Settings</h1>
                    <p className="text-gray-600">Customize the Bible Study page appearance</p>
                </div>
            </div>

            {/* Settings Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="p-8 max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-[#140152] mb-6">Hero Section</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hero Title *
                                    </label>
                                    <Input
                                        value={formData.hero_title}
                                        onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                                        required
                                        placeholder="e.g., Weekly Bible Reading Plan"
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Main heading displayed on the page</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hero Subtitle *
                                    </label>
                                    <Input
                                        value={formData.hero_subtitle}
                                        onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                                        required
                                        placeholder="e.g., Grow in Faith Through Daily Scripture"
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Subheading below the main title</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hero Description *
                                    </label>
                                    <Textarea
                                        value={formData.hero_description}
                                        onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                                        required
                                        placeholder="Describe the Bible study program..."
                                        rows={4}
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Brief description of the Bible study program</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hero Background Image URL
                                    </label>
                                    <Input
                                        type="url"
                                        value={formData.hero_background_url}
                                        onChange={(e) => setFormData({ ...formData, hero_background_url: e.target.value })}
                                        placeholder="https://..."
                                        className="text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Optional background image for the hero section</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                            >
                                <Save className="mr-2 w-5 h-5" />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>

            {/* Preview */}
            {settings && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8"
                >
                    <Card className="p-8 max-w-3xl">
                        <h2 className="text-2xl font-bold text-[#140152] mb-6">Preview</h2>
                        <div 
                            className="relative bg-gradient-to-br from-[#140152] via-purple-900 to-[#140152] text-white p-12 rounded-lg overflow-hidden"
                            style={{
                                backgroundImage: formData.hero_background_url 
                                    ? `linear-gradient(rgba(20, 1, 82, 0.85), rgba(20, 1, 82, 0.85)), url(${formData.hero_background_url})`
                                    : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="relative z-10 text-center">
                                <h1 className="text-4xl md:text-5xl font-black mb-4">
                                    {formData.hero_title || 'Hero Title'}
                                </h1>
                                <p className="text-2xl text-[#f5bb00] font-bold mb-3">
                                    {formData.hero_subtitle || 'Hero Subtitle'}
                                </p>
                                <p className="text-lg text-gray-200">
                                    {formData.hero_description || 'Hero description will appear here...'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}


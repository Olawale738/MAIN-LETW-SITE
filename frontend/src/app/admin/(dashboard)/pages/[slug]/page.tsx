'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cmsApi, Block } from '@/lib/api'
import { Loader2, Save, LayoutTemplate, Eye, Upload, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import PageBuilder from '@/components/admin/cms/PageBuilder'
import { DEFAULT_HOME_BLOCKS, DEFAULT_ABOUT_BLOCKS, DEFAULT_IMPACT_BLOCKS, DEFAULT_SUNDAY_SERVICE_BLOCKS, DEFAULT_EVANGELISM_BLOCKS, DEFAULT_DOWNLOAD_BLOCKS, DEFAULT_ONBOARDING_BLOCKS, DEFAULT_LENT_BLOCKS } from '@/lib/cmsDefaults'

export default function GenericPageEditor() {
    const params = useParams()
    const slug = params.slug as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [title, setTitle] = useState('')
    const [blocks, setBlocks] = useState<Block[]>([])

    const { showToast, ToastComponent } = useToast()

    useEffect(() => {
        if (slug) {
            loadContent()
        }
    }, [slug])

    const getDefaultsForSlug = (slug: string) => {
        switch (slug) {
            case 'home': return DEFAULT_HOME_BLOCKS;
            case 'about': return DEFAULT_ABOUT_BLOCKS;
            case 'impact': return DEFAULT_IMPACT_BLOCKS;
            case 'sunday-service': return DEFAULT_SUNDAY_SERVICE_BLOCKS;
            case 'evangelism': return DEFAULT_EVANGELISM_BLOCKS;
            case 'download': return DEFAULT_DOWNLOAD_BLOCKS;
            case 'onboarding': return DEFAULT_ONBOARDING_BLOCKS;
            case 'lent': return DEFAULT_LENT_BLOCKS;
            default: return [];
        }
    }

    const loadContent = async () => {
        setLoading(true)
        try {
            const data = await cmsApi.getPage(slug)
            if (data) {
                setTitle(data.title)
                if (data.content && data.content.blocks && data.content.blocks.length > 0) {
                    setBlocks(data.content.blocks)
                } else {
                    console.log("No block content found, using defaults")
                    setBlocks(getDefaultsForSlug(slug))
                }
            }
        } catch (error) {
            console.error("Error loading page:", error)
            setTitle(slug.charAt(0).toUpperCase() + slug.slice(1)) // Default title from slug
            // If page doesn't exist in DB yet, load defaults
            setBlocks(getDefaultsForSlug(slug))
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await cmsApi.updatePage(slug, title, {
                blocks: blocks
            })
            showToast("Page updated successfully.", "success")
        } catch (error) {
            showToast("Failed to save changes.", "error")
        } finally {
            setSaving(false)
        }
    }

    // Public preview path for known CMS-driven pages
    const PREVIEW_PATHS: Record<string, string> = {
        home: '/',
        about: '/about',
        impact: '/impact',
        'sunday-service': '/services/sunday-service',
        evangelism: '/services/evangelism',
        download: '/download',
        onboarding: '/onboarding',
        lent: '/lent',
    }
    const previewPath = PREVIEW_PATHS[slug] || `/${slug}`

    const loadDefaultTemplate = () => {
        const defaults = getDefaultsForSlug(slug)
        if (!defaults || defaults.length === 0) {
            showToast("No default template is available for this page.", "error")
            return
        }
        const hasContent = blocks.length > 0
        if (hasContent && !window.confirm(
            "Replace the current sections with the full default template? Your unsaved changes will be lost (this won't be saved until you click Save Changes)."
        )) {
            return
        }
        // Clone so each block gets a fresh id and is fully editable/removable
        setBlocks(defaults.map(b => ({ ...b, id: `${b.id}-${Math.floor(Math.random() * 100000)}` })))
        showToast("Default template loaded. Edit any section, then click Save Changes.", "success")
    }

    if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-900" /></div>

    // If the slug has a separate dedicated editor for content of a different
    // kind (files, sermons, events, etc.), surface a banner pointing there so
    // admins don't get stuck on the wrong page.
    const COMPANION_EDITOR: Record<string, { href: string; label: string; hint: string }> = {
        download: { href: '/admin/downloads', label: 'Upload files & links', hint: 'This is the layout/section editor. To upload PDFs, audio, video, or paste external links, use the dedicated Downloads admin.' },
        sermons: { href: '/admin/sermons', label: 'Manage sermons', hint: 'Add/edit individual sermons here.' },
        events: { href: '/admin/events', label: 'Manage events', hint: 'Add/edit calendar events here.' },
        blog: { href: '/admin/blog', label: 'Manage posts', hint: 'Add/edit individual blog posts here.' },
    }
    const companion = COMPANION_EDITOR[slug]

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <ToastComponent />

            {companion && (
                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 flex items-start gap-3 mt-2">
                    <Upload className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-blue-900 text-sm">Looking to upload? You&apos;re on the wrong page.</p>
                        <p className="text-xs text-blue-800/80 leading-relaxed mt-1">{companion.hint}</p>
                    </div>
                    <Link href={companion.href} className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 flex-shrink-0">
                        {companion.label} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 py-4 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Edit Page: {title || slug}</h1>
                    <p className="text-gray-500">Add and rearrange content sections.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                    <a href={previewPath} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-gray-300">
                            <Eye className="w-4 h-4 mr-2" /> Preview
                        </Button>
                    </a>
                    <Button variant="outline" onClick={loadDefaultTemplate} className="border-gray-300" title="Insert the full polished default layout for this page">
                        <LayoutTemplate className="w-4 h-4 mr-2" /> Load Template
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-[#140152] text-white">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <PageBuilder blocks={blocks} onChange={setBlocks} />
        </div>
    )
}

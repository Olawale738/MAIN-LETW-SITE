'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cmsApi, Block } from '@/lib/api'
import { Loader2, Save } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import PageBuilder from '@/components/admin/cms/PageBuilder'
import { DEFAULT_HOME_BLOCKS, DEFAULT_ABOUT_BLOCKS, DEFAULT_IMPACT_BLOCKS } from '@/lib/cmsDefaults'

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

    if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-900" /></div>

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <ToastComponent />
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 py-4 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Edit Page: {title || slug}</h1>
                    <p className="text-gray-500">Add and rearrange content sections.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* <Button variant="outline" onClick={loadContent}>Reset</Button> */}
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

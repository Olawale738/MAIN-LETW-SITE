'use client'

import React, { useState, useEffect } from 'react'
import { cmsApi, Block } from '@/lib/api'
import PageRenderer from '@/components/cms/PageRenderer'
import { DEFAULT_ALTER_SOUND_BLOCKS } from '@/lib/cmsDefaults'
import { Loader2 } from 'lucide-react'

export default function SoundAltarPage() {
    const [blocks, setBlocks] = useState<Block[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await cmsApi.getPage('alter-sound')
                if (data && data.content && data.content.blocks && data.content.blocks.length > 0) {
                    setBlocks(data.content.blocks)
                } else {
                    console.log("Using default alter sound blocks")
                    setBlocks(DEFAULT_ALTER_SOUND_BLOCKS)
                }
            } catch (e) {
                console.log("Failed to fetch alter sound content, using defaults", e)
                setBlocks(DEFAULT_ALTER_SOUND_BLOCKS)
            } finally {
                setLoading(false)
            }
        }
        fetchContent()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
                <Loader2 className="w-12 h-12 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-black min-h-screen">
            <PageRenderer blocks={blocks} />
        </div>
    )
}

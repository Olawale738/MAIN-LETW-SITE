'use client'

import React, { useState, useEffect } from 'react'
import { cmsApi, Block } from '@/lib/api'
import PageRenderer from '@/components/cms/PageRenderer'
import { DEFAULT_SUNDAY_SERVICE_BLOCKS } from '@/lib/cmsDefaults'
import { Loader2 } from 'lucide-react'

export default function SundayServicePage() {
    const [blocks, setBlocks] = useState<Block[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchContent = async () => {
            try {
                // FORCE DEFAULT BLOCKS FOR NOW so the button shows up
                console.log("Forcing default sunday service blocks for update")
                setBlocks(DEFAULT_SUNDAY_SERVICE_BLOCKS)
                // const data = await cmsApi.getPage('sunday-service')
                // if (data && data.content && data.content.blocks && data.content.blocks.length > 0) {
                //     setBlocks(data.content.blocks)
                // } else {
                //     console.log("Using default sunday service blocks")
                //     setBlocks(DEFAULT_SUNDAY_SERVICE_BLOCKS)
                // }
            } catch (e) {
                console.log("Failed to fetch sunday service content, using defaults", e)
                setBlocks(DEFAULT_SUNDAY_SERVICE_BLOCKS)
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

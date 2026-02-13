'use client'

import React, { useState, useEffect } from 'react'
import { cmsApi, Block, serviceResourceApi, ServiceResourceItem } from '@/lib/api'
import PageRenderer from '@/components/cms/PageRenderer'
import { DEFAULT_SUNDAY_SERVICE_BLOCKS } from '@/lib/cmsDefaults'
import { Loader2 } from 'lucide-react'

export default function SundayServicePage() {
    const [blocks, setBlocks] = useState<Block[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchContent = async () => {
            try {
                // Start with default blocks
                let pageBlocks = [...DEFAULT_SUNDAY_SERVICE_BLOCKS]

                // Fetch admin-managed resources and replace the hardcoded service-resources block
                try {
                    const resourceData = await serviceResourceApi.getByService('sunday-service')
                    if (resourceData.resources.length > 0) {
                        const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '')

                        // Build dynamic features from API data
                        const dynamicFeatures = resourceData.resources.map((r: ServiceResourceItem) => {
                            let link = '#'
                            if (r.resource_type === 'file' && r.file_url) {
                                link = `${API_BASE}${r.file_url}`
                            } else if (r.external_url) {
                                link = r.external_url
                            }

                            return {
                                title: r.title,
                                description: r.description || '',
                                icon: r.icon || 'FileText',
                                link,
                                _resourceType: r.resource_type,
                            }
                        })

                        // Replace the hardcoded service-resources block
                        pageBlocks = pageBlocks.map(block => {
                            if (block.id === 'service-resources') {
                                return {
                                    ...block,
                                    data: {
                                        ...block.data,
                                        features: dynamicFeatures,
                                    },
                                }
                            }
                            return block
                        })
                    }
                } catch (e) {
                    console.log("Could not fetch service resources, using defaults", e)
                }

                setBlocks(pageBlocks)
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

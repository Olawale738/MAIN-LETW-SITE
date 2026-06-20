'use client'
import { useEffect, useState } from 'react'
import { cmsApi, type Block } from '@/lib/api'
import PageRenderer from './PageRenderer'

/**
 * Universal "extra blocks" slot.
 *
 * Drop this at the TOP or BOTTOM of any hardcoded page; admins can then add
 * CMS blocks (heroes, callouts, scripture, gallery, etc.) above or below the
 * existing page content via /admin/pages/{slug-position}.
 *
 *   <PageCmsOverlay slug="contact" position="top" />
 *   ...your hardcoded page...
 *   <PageCmsOverlay slug="contact" position="bottom" />
 *
 * If no blocks are saved for that slot, the component renders nothing.
 */
export default function PageCmsOverlay({ slug, position }: { slug: string; position: 'top' | 'bottom' }) {
    const [blocks, setBlocks] = useState<Block[]>([])
    const compositeSlug = `${slug}-${position}`

    useEffect(() => {
        cmsApi.getPage(compositeSlug)
            .then(data => {
                if (data && data.content && Array.isArray(data.content.blocks)) {
                    setBlocks(data.content.blocks)
                }
            })
            .catch(() => { /* 404 = nothing saved yet, render nothing */ })
    }, [compositeSlug])

    if (blocks.length === 0) return null
    return <PageRenderer blocks={blocks} />
}

'use client'

import { useState, useEffect } from 'react'
import { cmsApi, Block } from '@/lib/api'
import PageRenderer from '@/components/cms/PageRenderer'
import { DEFAULT_HOME_BLOCKS } from '@/lib/cmsDefaults'
import { Loader2 } from 'lucide-react'
import LiveStreamPlayer from '@/components/LiveStreamPlayer' // [NEW]

export default function HomePage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await cmsApi.getPage('home')
        if (data && data.content && data.content.blocks && data.content.blocks.length > 0) {
          setBlocks(data.content.blocks)
        } else {
          console.log("Using default home blocks")
          setBlocks(DEFAULT_HOME_BLOCKS)
        }
      } catch (e) {
        console.log("Failed to fetch home content, using defaults", e)
        setBlocks(DEFAULT_HOME_BLOCKS)
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

  // During render, ensure the button-group block is forcefully mapped from defaults to support seamless HMR UI updates.
  const displayBlocks = blocks.filter(b => b.type !== 'button-group')
  const defaultActionsIndex = DEFAULT_HOME_BLOCKS.findIndex(b => b.type === 'button-group')
  
  if (defaultActionsIndex !== -1) {
      displayBlocks.splice(defaultActionsIndex, 0, DEFAULT_HOME_BLOCKS[defaultActionsIndex])
  }

  return (
    <div className="bg-white dark:bg-black overflow-x-hidden min-h-screen">
      <LiveStreamPlayer />
      <PageRenderer blocks={displayBlocks} />
    </div>
  )
}

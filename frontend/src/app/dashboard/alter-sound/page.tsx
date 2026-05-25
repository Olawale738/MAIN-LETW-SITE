'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Loader2 } from 'lucide-react'

/**
 * This route is kept for backward-compatibility only.
 * All Alter Sound member-portal features live at /services/alter-sound/dashboard.
 */
export default function AlterSoundLegacyRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/services/alter-sound/dashboard')
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#0d0035 0%,#1e0050 45%,#2a006b 100%)' }}
    >
      <div className="text-center">
        <div className="w-20 h-20 bg-[#f5bb00] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(245,187,0,0.4)]">
          <Flame className="w-10 h-10 text-[#140152]" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-[#f5bb00] mx-auto" />
        <p className="text-white/50 text-sm mt-3">Loading your portal…</p>
      </div>
    </div>
  )
}

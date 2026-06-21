'use client'
import Link from 'next/link'
import { AlertTriangle, ExternalLink, RefreshCw, Activity } from 'lucide-react'
import { wakeBackend } from '@/lib/api'

/**
 * Shows up on admin pages whose backend endpoints are not yet on the
 * running Render deploy. Explains the issue in plain words and gives
 * the admin three actions: wake the server, run diagnostics, or open
 * the Render dashboard to trigger a manual deploy.
 *
 * Render auto-deploy sometimes pauses on free tier — this card means
 * admins don't get stuck wondering why pages return 'Not Found'.
 */
export default function BackendNotDeployedCard({ errorText, onRetry }: { errorText?: string; onRetry?: () => void }) {
    const wake = async () => {
        const ok = await wakeBackend(75_000)
        if (ok && onRetry) onRetry()
        else if (!ok) alert('Backend still not responding after 75 seconds. Try Render dashboard → Manual Deploy.')
    }

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 mb-5">
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="font-black text-amber-900 text-sm">Backend endpoint not deployed yet</p>
                    <p className="text-xs text-amber-800/80 leading-relaxed mt-1">
                        This admin page works, but the backend is running an older version that doesn't recognise this endpoint.
                        Trigger a manual redeploy on Render and try again. The error we got back was:
                        {' '}<code className="bg-white border border-amber-300 rounded px-1.5 py-0.5 text-[11px]">{errorText || 'Not Found'}</code>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={wake} className="text-xs font-bold inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg">
                            <RefreshCw className="w-3.5 h-3.5" /> Wake server &amp; retry
                        </button>
                        <Link href="/admin/diagnostics" className="text-xs font-bold inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-3 py-1.5 rounded-lg">
                            <Activity className="w-3.5 h-3.5" /> Run probe
                        </Link>
                        <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer"
                            className="text-xs font-bold inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-3 py-1.5 rounded-lg">
                            Open Render <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

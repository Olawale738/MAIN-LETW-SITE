'use client'
import { X, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Action {
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onClick: () => void | Promise<void>
    destructive?: boolean
    confirm?: string
}

interface Props {
    count: number
    onClear: () => void
    actions: Action[]
    label?: string  // e.g. "subscribers"
}

/**
 * Floating sticky bar at the bottom of an admin list when multiple rows are selected.
 * Fade-in entry honours prefers-reduced-motion via tailwind utilities.
 */
export default function BulkActionBar({ count, onClear, actions, label = 'items' }: Props) {
    const [busy, setBusy] = useState<string | null>(null)
    if (count === 0) return null

    const run = async (a: Action) => {
        if (a.confirm && !confirm(a.confirm.replace('{count}', String(count)))) return
        setBusy(a.label)
        try { await a.onClick() }
        finally { setBusy(null) }
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            <div className="bg-[#140152] text-white rounded-2xl shadow-2xl shadow-[#140152]/30 flex items-center gap-2 px-4 py-2 border border-[#1d0175]">
                <button onClick={onClear} className="p-1 rounded-lg hover:bg-white/10" title="Clear selection"><X className="w-4 h-4" /></button>
                <span className="text-sm font-bold pr-2 border-r border-white/15">{count} {label} selected</span>
                {actions.map(a => {
                    const Icon = a.icon
                    return (
                        <button key={a.label} onClick={() => run(a)} disabled={!!busy}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50 ${a.destructive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'}`}>
                            {busy === a.label ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (Icon ? <Icon className="w-3.5 h-3.5" /> : null)}
                            {a.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

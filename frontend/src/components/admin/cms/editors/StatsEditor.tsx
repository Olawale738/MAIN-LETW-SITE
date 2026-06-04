import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StatItem { label: string; value: string; icon?: string }
interface Props { data: any; onChange: (d: any) => void }

export default function StatsEditor({ data, onChange }: Props) {
    const stats: StatItem[] = data.stats || []

    const update = (field: string, val: any) => onChange({ ...data, [field]: val })
    const updateStat = (i: number, field: string, val: string) => {
        const next = stats.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
        onChange({ ...data, stats: next })
    }
    const addStat = () => onChange({ ...data, stats: [...stats, { label: 'New Stat', value: '0+', icon: '⭐' }] })
    const removeStat = (i: number) => onChange({ ...data, stats: stats.filter((_, idx) => idx !== i) })

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Section Title</label>
                    <input value={data.title || ''} onChange={e => update('title', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Subtitle (eyebrow)</label>
                    <input value={data.subtitle || ''} onChange={e => update('subtitle', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Background</label>
                <select value={data.bg || 'brand'} onChange={e => update('bg', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full">
                    <option value="brand">Brand (dark purple)</option>
                    <option value="dark">Dark (black)</option>
                    <option value="light">Light (grey)</option>
                </select>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Stats ({stats.length})</span>
                    <Button type="button" size="sm" onClick={addStat} className="bg-[#140152] text-white h-8 text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Stat
                    </Button>
                </div>
                {stats.map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 items-end">
                        <div>
                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Label</label>
                            <input value={s.label} onChange={e => updateStat(i, 'label', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Value (e.g. 5,000+)</label>
                            <input value={s.value} onChange={e => updateStat(i, 'value', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Icon (emoji)</label>
                                <input value={s.icon || ''} onChange={e => updateStat(i, 'icon', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                            </div>
                            <button onClick={() => removeStat(i)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 mb-0.5">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

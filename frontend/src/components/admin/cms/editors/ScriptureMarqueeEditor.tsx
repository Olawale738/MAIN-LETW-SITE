import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface V { text: string; reference?: string }
interface Props { data: any; onChange: (d: any) => void }

export default function ScriptureMarqueeEditor({ data, onChange }: Props) {
    const verses: V[] = data.verses || []
    const update = (f: string, v: any) => onChange({ ...data, [f]: v })
    const updateV = (idx: number, f: string, v: string) => {
        const next = verses.map((x, i) => i === idx ? { ...x, [f]: v } : x)
        onChange({ ...data, verses: next })
    }
    const add = () => onChange({ ...data, verses: [...verses, { text: 'New scripture...', reference: '' }] })
    const remove = (idx: number) => onChange({ ...data, verses: verses.filter((_, i) => i !== idx) })

    const i = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
    const l = "block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Background</label>
                    <select value={data.bg || 'brand'} onChange={e => update('bg', e.target.value)} className={i}>
                        <option value="brand">Brand Purple</option>
                        <option value="gold">Gold</option>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>
                <div><label className={l}>Seconds per Verse</label>
                    <input type="number" min={3} value={data.speed || 8} onChange={e => update('speed', parseInt(e.target.value) || 8)} className={i} />
                </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold text-gray-700">Verses ({verses.length})</span>
                <Button type="button" size="sm" onClick={add} className="bg-[#140152] text-white h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Add Verse</Button>
            </div>

            {verses.map((v, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Verse {idx + 1}</span>
                        <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div><label className={l}>Verse Text</label><input value={v.text} onChange={e => updateV(idx, 'text', e.target.value)} className={i} /></div>
                    <div><label className={l}>Reference</label><input value={v.reference || ''} onChange={e => updateV(idx, 'reference', e.target.value)} className={i} placeholder="e.g. Psalm 36:9" /></div>
                </div>
            ))}
        </div>
    )
}

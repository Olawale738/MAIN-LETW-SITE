import React from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImagePicker from '../ImagePicker'

interface M { year: string; title: string; description?: string; image?: string }
interface Props { data: any; onChange: (d: any) => void }

export default function TimelineEditor({ data, onChange }: Props) {
    const items: M[] = data.milestones || []
    const update = (f: string, v: any) => onChange({ ...data, [f]: v })
    const updateItem = (i: number, f: string, v: any) => {
        const next = items.map((x, idx) => idx === i ? { ...x, [f]: v } : x)
        onChange({ ...data, milestones: next })
    }
    const add = () => onChange({
        ...data,
        milestones: [...items, { year: 'YEAR', title: 'A milestone in our story', description: '', image: '' }]
    })
    const remove = (i: number) => onChange({ ...data, milestones: items.filter((_, idx) => idx !== i) })
    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir
        if (j < 0 || j >= items.length) return
        const next = [...items]
        ;[next[i], next[j]] = [next[j], next[i]]
        onChange({ ...data, milestones: next })
    }

    const inp = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
    const lbl = "block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Eyebrow</label><input value={data.eyebrow || ''} onChange={e => update('eyebrow', e.target.value)} className={inp} placeholder="A Journey of Faith" /></div>
                <div><label className={lbl}>Background</label>
                    <select value={data.bg || 'brand'} onChange={e => update('bg', e.target.value)} className={inp}>
                        <option value="brand">Brand purple gradient</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Title</label><input value={data.title || ''} onChange={e => update('title', e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Subtitle (optional)</label><input value={data.subtitle || ''} onChange={e => update('subtitle', e.target.value)} className={inp} /></div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold text-gray-700">Milestones ({items.length})</span>
                <Button type="button" size="sm" onClick={add} className="bg-[#140152] text-white h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Add Milestone</Button>
            </div>

            {items.map((m, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Milestone {i + 1}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-1 rounded hover:bg-gray-100"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-1 rounded hover:bg-gray-100"><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div><label className={lbl}>Year / Label</label><input value={m.year} onChange={e => updateItem(i, 'year', e.target.value)} className={inp} placeholder="2021" /></div>
                        <div className="col-span-2"><label className={lbl}>Title</label><input value={m.title} onChange={e => updateItem(i, 'title', e.target.value)} className={inp} /></div>
                    </div>
                    <div><label className={lbl}>Description (optional)</label><textarea value={m.description || ''} onChange={e => updateItem(i, 'description', e.target.value)} rows={2} className={inp + ' resize-none'} /></div>
                    <div>
                        <label className={lbl}>Photo (optional)</label>
                        <ImagePicker value={m.image} onChange={(url) => updateItem(i, 'image', url)} />
                    </div>
                </div>
            ))}
        </div>
    )
}

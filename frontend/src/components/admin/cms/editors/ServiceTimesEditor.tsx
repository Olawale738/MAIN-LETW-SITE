import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImagePicker from '../ImagePicker'

interface Item { day: string; time: string; title: string; description?: string; image?: string; blend?: number }
interface Props { data: any; onChange: (d: any) => void }

export default function ServiceTimesEditor({ data, onChange }: Props) {
    const services: Item[] = data.services || []
    const update = (f: string, v: any) => onChange({ ...data, [f]: v })
    const updateItem = (i: number, f: string, v: string) => {
        const next = services.map((s, idx) => idx === i ? { ...s, [f]: v } : s)
        onChange({ ...data, services: next })
    }
    const add = () => onChange({ ...data, services: [...services, { day: 'Sunday', time: '9:00 AM', title: 'Sunday Service', description: '' }] })
    const remove = (i: number) => onChange({ ...data, services: services.filter((_, idx) => idx !== i) })

    const i = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
    const l = "block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Section Title</label><input value={data.title || ''} onChange={e => update('title', e.target.value)} className={i} /></div>
                <div><label className={l}>Background</label>
                    <select value={data.bg || 'brand'} onChange={e => update('bg', e.target.value)} className={i}>
                        <option value="brand">Brand (purple gradient)</option>
                        <option value="light">Light</option>
                    </select>
                </div>
            </div>
            <div><label className={l}>Subtitle</label><input value={data.subtitle || ''} onChange={e => update('subtitle', e.target.value)} className={i} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Location</label><input value={data.location || ''} onChange={e => update('location', e.target.value)} className={i} placeholder="123 Main St, City" /></div>
                <div><label className={l}>Map Link (optional)</label><input value={data.map_link || ''} onChange={e => update('map_link', e.target.value)} className={i} placeholder="https://maps.google.com/..." /></div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold text-gray-700">Services ({services.length})</span>
                <Button type="button" size="sm" onClick={add} className="bg-[#140152] text-white h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Add Service</Button>
            </div>

            {services.map((s, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Service {idx + 1}</span>
                        <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div><label className={l}>Day</label><input value={s.day} onChange={e => updateItem(idx, 'day', e.target.value)} className={i} /></div>
                        <div><label className={l}>Time</label><input value={s.time} onChange={e => updateItem(idx, 'time', e.target.value)} className={i} /></div>
                        <div><label className={l}>Title</label><input value={s.title} onChange={e => updateItem(idx, 'title', e.target.value)} className={i} /></div>
                    </div>
                    <div><label className={l}>Description (optional)</label><input value={s.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} className={i} /></div>

                    {/* NEW — blended background image */}
                    <div className="rounded-lg border border-dashed border-[#140152]/25 bg-white p-2.5 mt-1">
                        <label className={l + " text-[#140152]"}>🖼️ Card Background Image (optional — blends with the brand color)</label>
                        <ImagePicker value={s.image} onChange={(url) => updateItem(idx, 'image', url)} />
                        {s.image && (
                            <div className="mt-2">
                                <label className={l}>Photo show-through: <span className="text-[#140152] font-bold">{Math.round(((s.blend ?? 0.45) as number) * 100)}%</span></label>
                                <input type="range" min={15} max={85} step={5}
                                    value={Math.round(((s.blend ?? 0.45) as number) * 100)}
                                    onChange={e => updateItem(idx, 'blend', String(parseInt(e.target.value) / 100))}
                                    className="w-full accent-[#140152]" />
                                <p className="text-[10px] text-gray-500 mt-1">15% = mostly the brand color, photo barely visible · 85% = photo dominates with a thin tint.</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

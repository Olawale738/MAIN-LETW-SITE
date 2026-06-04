import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Testimony { quote: string; name: string; location?: string; avatar?: string }
interface Props { data: any; onChange: (d: any) => void }

export default function TestimoniesEditor({ data, onChange }: Props) {
    const testimonies: Testimony[] = data.testimonies || []

    const update = (field: string, val: any) => onChange({ ...data, [field]: val })
    const updateT = (i: number, field: string, val: string) => {
        const next = testimonies.map((t, idx) => idx === i ? { ...t, [field]: val } : t)
        onChange({ ...data, testimonies: next })
    }
    const addT = () => onChange({ ...data, testimonies: [...testimonies, { quote: 'Enter testimony here...', name: 'Name', location: 'Location' }] })
    const removeT = (i: number) => onChange({ ...data, testimonies: testimonies.filter((_, idx) => idx !== i) })

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Section Title</label>
                    <input value={data.title || ''} onChange={e => update('title', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Subtitle</label>
                    <input value={data.subtitle || ''} onChange={e => update('subtitle', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Style</label>
                    <select value={data.style || 'grid'} onChange={e => update('style', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full">
                        <option value="grid">Grid</option>
                        <option value="slider">Slider / Carousel</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Background</label>
                    <select value={data.bg || 'light'} onChange={e => update('bg', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full">
                        <option value="light">Light</option>
                        <option value="brand">Brand Purple</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Testimonies ({testimonies.length})</span>
                    <Button type="button" size="sm" onClick={addT} className="bg-[#140152] text-white h-8 text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Testimony
                    </Button>
                </div>
                {testimonies.map((t, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Testimony {i + 1}</span>
                            <button onClick={() => removeT(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-gray-400 mb-1">Quote / Story</label>
                            <textarea value={t.quote} onChange={e => updateT(i, 'quote', e.target.value)} rows={3}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Name</label>
                                <input value={t.name} onChange={e => updateT(i, 'name', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Location</label>
                                <input value={t.location || ''} onChange={e => updateT(i, 'location', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Avatar (emoji)</label>
                                <input value={t.avatar || ''} onChange={e => updateT(i, 'avatar', e.target.value)}
                                    placeholder="😊"
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

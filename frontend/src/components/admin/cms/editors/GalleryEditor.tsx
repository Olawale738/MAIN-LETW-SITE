import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImagePicker from '../ImagePicker'

interface Img { src: string; caption?: string }
interface Props { data: any; onChange: (d: any) => void }

export default function GalleryEditor({ data, onChange }: Props) {
    const images: Img[] = data.images || []
    const update = (f: string, v: any) => onChange({ ...data, [f]: v })
    const updateImg = (idx: number, f: string, v: string) => {
        const next = images.map((x, i) => i === idx ? { ...x, [f]: v } : x)
        onChange({ ...data, images: next })
    }
    const add = () => onChange({ ...data, images: [...images, { src: '', caption: '' }] })
    const remove = (idx: number) => onChange({ ...data, images: images.filter((_, i) => i !== idx) })

    const i = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
    const l = "block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Title</label><input value={data.title || ''} onChange={e => update('title', e.target.value)} className={i} /></div>
                <div><label className={l}>Subtitle</label><input value={data.subtitle || ''} onChange={e => update('subtitle', e.target.value)} className={i} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Layout</label>
                    <select value={data.layout || 'masonry'} onChange={e => update('layout', e.target.value)} className={i}>
                        <option value="masonry">Masonry (varied heights)</option>
                        <option value="grid">Grid (square tiles)</option>
                        <option value="marquee">Marquee (scrolling row)</option>
                    </select>
                </div>
                <div><label className={l}>Background</label>
                    <select value={data.bg || 'white'} onChange={e => update('bg', e.target.value)} className={i}>
                        <option value="white">White</option>
                        <option value="gray">Gray</option>
                        <option value="brand">Brand Purple</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold text-gray-700">Images ({images.length})</span>
                <Button type="button" size="sm" onClick={add} className="bg-[#140152] text-white h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Add Image</Button>
            </div>

            {images.map((img, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Image {idx + 1}</span>
                        <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <ImagePicker value={img.src} onChange={(url) => updateImg(idx, 'src', url)} />
                    <div><label className={l}>Caption (optional)</label><input value={img.caption || ''} onChange={e => updateImg(idx, 'caption', e.target.value)} className={i} /></div>
                </div>
            ))}
        </div>
    )
}

import React from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImagePicker from '../ImagePicker'

interface Slide {
    eyebrow?: string
    title: string
    subtitle?: string
    bg_image?: string
    cta_text?: string
    cta_link?: string
    cta2_text?: string
    cta2_link?: string
    align?: 'left' | 'center'
}
interface Props { data: any; onChange: (d: any) => void }

export default function HeroSliderEditor({ data, onChange }: Props) {
    const slides: Slide[] = data.slides || []

    const update = (field: string, val: any) => onChange({ ...data, [field]: val })
    const updateSlide = (i: number, field: string, val: any) => {
        const next = slides.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
        onChange({ ...data, slides: next })
    }
    const addSlide = () => onChange({
        ...data,
        slides: [...slides, { eyebrow: '', title: 'New Slide Headline', subtitle: '', bg_image: '', cta_text: '', cta_link: '/join', cta2_text: '', cta2_link: '', align: 'center' }]
    })
    const removeSlide = (i: number) => onChange({ ...data, slides: slides.filter((_, idx) => idx !== i) })
    const moveSlide = (i: number, dir: -1 | 1) => {
        const j = i + dir
        if (j < 0 || j >= slides.length) return
        const next = [...slides]
        ;[next[i], next[j]] = [next[j], next[i]]
        onChange({ ...data, slides: next })
    }

    const inputCls = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
    const labelCls = "block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"

    return (
        <div className="space-y-4">
            {/* Global slider settings */}
            <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mt-5">
                    <input type="checkbox" checked={data.autoplay !== false}
                        onChange={e => update('autoplay', e.target.checked)} className="w-4 h-4" />
                    Auto-advance
                </label>
                <div>
                    <label className={labelCls}>Interval (seconds)</label>
                    <input type="number" min={2} value={data.interval ?? 6}
                        onChange={e => update('interval', parseInt(e.target.value) || 6)} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Height</label>
                    <select value={data.height || 'tall'} onChange={e => update('height', e.target.value)} className={inputCls}>
                        <option value="medium">Medium</option>
                        <option value="tall">Tall</option>
                        <option value="full">Full Screen</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold text-gray-700">Slides ({slides.length})</span>
                <Button type="button" size="sm" onClick={addSlide} className="bg-[#140152] text-white h-8 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Slide
                </Button>
            </div>

            {slides.map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Slide {i + 1}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => moveSlide(i, -1)} disabled={i === 0}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-1 rounded hover:bg-gray-100">
                                <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-1 rounded hover:bg-gray-100">
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => removeSlide(i)}
                                className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={labelCls}>Eyebrow (small label)</label>
                            <input value={s.eyebrow || ''} onChange={e => updateSlide(i, 'eyebrow', e.target.value)}
                                placeholder="Welcome Home" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Text Alignment</label>
                            <select value={s.align || 'center'} onChange={e => updateSlide(i, 'align', e.target.value)} className={inputCls}>
                                <option value="center">Center</option>
                                <option value="left">Left</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Headline (HTML allowed)</label>
                        <textarea value={s.title} onChange={e => updateSlide(i, 'title', e.target.value)} rows={2}
                            className={inputCls + " resize-none"} />
                    </div>
                    <div>
                        <label className={labelCls}>Subtitle</label>
                        <textarea value={s.subtitle || ''} onChange={e => updateSlide(i, 'subtitle', e.target.value)} rows={2}
                            className={inputCls + " resize-none"} />
                    </div>
                    <div>
                        <label className={labelCls}>Background Image — upload from your device</label>
                        <ImagePicker value={s.bg_image} onChange={(url) => updateSlide(i, 'bg_image', url)} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={labelCls}>Primary Button Text</label>
                            <input value={s.cta_text || ''} onChange={e => updateSlide(i, 'cta_text', e.target.value)}
                                placeholder="Plan to Become Our Member" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Primary Button Link</label>
                            <input value={s.cta_link || ''} onChange={e => updateSlide(i, 'cta_link', e.target.value)}
                                placeholder="/join" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Secondary Button Text</label>
                            <input value={s.cta2_text || ''} onChange={e => updateSlide(i, 'cta2_text', e.target.value)}
                                placeholder="Watch Live" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Secondary Button Link</label>
                            <input value={s.cta2_link || ''} onChange={e => updateSlide(i, 'cta2_link', e.target.value)}
                                placeholder="/sermons" className={inputCls} />
                        </div>
                    </div>
                </div>
            ))}

            {slides.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-xl">
                    No slides yet. Click "Add Slide" to build your hero carousel.
                </p>
            )}
        </div>
    )
}

import React from 'react'
import ImagePicker from '../ImagePicker'

interface Props { data: any; onChange: (d: any) => void }

export default function FounderCardEditor({ data, onChange }: Props) {
    const update = (f: string, v: any) => onChange({ ...data, [f]: v })

    const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
    const lbl = "block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide"

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={lbl}>Eyebrow</label>
                    <input value={data.eyebrow || ''} onChange={e => update('eyebrow', e.target.value)} className={inp} placeholder="The Heart Behind the House" />
                </div>
                <div>
                    <label className={lbl}>Background</label>
                    <select value={data.bg || 'white'} onChange={e => update('bg', e.target.value)} className={inp}>
                        <option value="white">White</option>
                        <option value="gray">Soft gray</option>
                        <option value="brand">Brand (dark purple)</option>
                    </select>
                </div>
            </div>

            <div>
                <label className={lbl}>Name / Title</label>
                <input value={data.name || ''} onChange={e => update('name', e.target.value)} className={inp} placeholder="Apostle Olawale N. Sanni" />
            </div>

            <div>
                <label className={lbl}>Pull quote (italic, gold left bar)</label>
                <textarea value={data.quote || ''} onChange={e => update('quote', e.target.value)} className={inp + ' min-h-[80px]'} placeholder="My burden is to see lives radically transformed by the unfiltered Word of God." />
            </div>

            <div>
                <label className={lbl}>Bio paragraph</label>
                <textarea value={data.bio || ''} onChange={e => update('bio', e.target.value)} className={inp + ' min-h-[100px]'} placeholder="Carrying a deep mandate..." />
            </div>

            <div>
                <label className={lbl}>Founder photo</label>
                <ImagePicker value={data.image || ''} onChange={(v) => update('image', v)} />
            </div>

            <div>
                <label className={lbl}>Corner badge text (optional, e.g. "FOUNDER\n& PRESIDENT")</label>
                <input value={data.badge || ''} onChange={e => update('badge', e.target.value)} className={inp} placeholder="FOUNDER & PRESIDENT" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={lbl}>Button text (optional)</label>
                    <input value={data.button_text || ''} onChange={e => update('button_text', e.target.value)} className={inp} placeholder="Read Our Story" />
                </div>
                <div>
                    <label className={lbl}>Button link</label>
                    <input value={data.button_link || ''} onChange={e => update('button_link', e.target.value)} className={inp} placeholder="/about" />
                </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!data.reverse} onChange={e => update('reverse', e.target.checked)} />
                <span>Reverse layout (photo on LEFT, text on RIGHT)</span>
            </label>

            <div className="mt-6 pt-6 border-t border-dashed border-gray-300">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#140152] mb-1">Mission &amp; Vision (inside this card)</p>
                <p className="text-xs text-gray-500 mb-4">Leave any field blank to hide its card. Both shown side-by-side below the founder photo.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#f5bb00]">Mission</p>
                        <div>
                            <label className={lbl}>Mission headline</label>
                            <input value={data.mission_title || ''} onChange={e => update('mission_title', e.target.value)} className={inp} placeholder="Awaken. Restore. Release." />
                        </div>
                        <div>
                            <label className={lbl}>Mission description</label>
                            <textarea value={data.mission_text || ''} onChange={e => update('mission_text', e.target.value)} className={inp + ' min-h-[90px]'} placeholder="What we do every day - in one short paragraph." />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#f5bb00]">Vision</p>
                        <div>
                            <label className={lbl}>Vision headline</label>
                            <input value={data.vision_title || ''} onChange={e => update('vision_title', e.target.value)} className={inp} placeholder="A people of light, sent into every darkness." />
                        </div>
                        <div>
                            <label className={lbl}>Vision description</label>
                            <textarea value={data.vision_text || ''} onChange={e => update('vision_text', e.target.value)} className={inp + ' min-h-[90px]'} placeholder="Where we are headed - in one short paragraph." />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

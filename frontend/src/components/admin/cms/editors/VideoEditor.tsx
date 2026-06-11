import React from 'react'

interface Props { data: any; onChange: (d: any) => void }

export default function VideoEditor({ data, onChange }: Props) {
    const update = (f: string, v: any) => onChange({ ...data, [f]: v })
    const i = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
    const l = "block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Section Title</label><input value={data.title || ''} onChange={e => update('title', e.target.value)} className={i} /></div>
                <div><label className={l}>Background</label>
                    <select value={data.bg || 'white'} onChange={e => update('bg', e.target.value)} className={i}>
                        <option value="white">White</option>
                        <option value="gray">Gray</option>
                        <option value="brand">Brand Purple</option>
                    </select>
                </div>
            </div>
            <div><label className={l}>Subtitle</label><input value={data.subtitle || ''} onChange={e => update('subtitle', e.target.value)} className={i} /></div>
            <div>
                <label className={l}>Video URL (YouTube or Vimeo)</label>
                <input value={data.url || ''} onChange={e => update('url', e.target.value)} className={i}
                    placeholder="https://www.youtube.com/watch?v=..." />
                <p className="text-[10px] text-gray-400 mt-1">YouTube watch links, youtu.be short links, and Vimeo all work.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Caption (optional)</label><input value={data.caption || ''} onChange={e => update('caption', e.target.value)} className={i} /></div>
                <div><label className={l}>Aspect Ratio</label>
                    <select value={data.aspect || '16:9'} onChange={e => update('aspect', e.target.value)} className={i}>
                        <option value="16:9">16:9 (widescreen)</option>
                        <option value="4:3">4:3</option>
                        <option value="1:1">1:1 (square)</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

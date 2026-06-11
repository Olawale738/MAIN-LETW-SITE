import React from 'react'

interface Props { data: any; onChange: (d: any) => void }

export default function NewsletterEditor({ data, onChange }: Props) {
    const update = (f: string, v: any) => onChange({ ...data, [f]: v })
    const i = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
    const l = "block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Title</label><input value={data.title || ''} onChange={e => update('title', e.target.value)} className={i} /></div>
                <div><label className={l}>Background</label>
                    <select value={data.bg || 'brand'} onChange={e => update('bg', e.target.value)} className={i}>
                        <option value="brand">Brand Purple</option>
                        <option value="light">Light</option>
                    </select>
                </div>
            </div>
            <div><label className={l}>Subtitle</label><input value={data.subtitle || ''} onChange={e => update('subtitle', e.target.value)} className={i} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={l}>Button Text</label><input value={data.button_text || ''} onChange={e => update('button_text', e.target.value)} className={i} placeholder="Subscribe" /></div>
                <div><label className={l}>Endpoint (optional)</label><input value={data.endpoint || ''} onChange={e => update('endpoint', e.target.value)} className={i} placeholder="default: /api/newsletter/subscribe" /></div>
            </div>
            <p className="text-[10px] text-gray-400">Submissions are sent to the endpoint as JSON {`{ email }`}. Until the API is wired up, the form still shows a friendly success message.</p>
        </div>
    )
}

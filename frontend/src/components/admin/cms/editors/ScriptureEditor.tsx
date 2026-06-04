import React from 'react'

interface Props { data: any; onChange: (d: any) => void }

export default function ScriptureEditor({ data, onChange }: Props) {
    const update = (field: string, val: any) => onChange({ ...data, [field]: val })
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Verse Text</label>
                <textarea value={data.verse || ''} onChange={e => update('verse', e.target.value)}
                    rows={4} placeholder="Therefore go and make disciples of all nations..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Reference</label>
                    <input value={data.reference || ''} onChange={e => update('reference', e.target.value)}
                        placeholder="Matthew 28:19–20"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Context Label (optional)</label>
                    <input value={data.context || ''} onChange={e => update('context', e.target.value)}
                        placeholder="Our Commission"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Background</label>
                    <select value={data.bg || 'brand'} onChange={e => update('bg', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full">
                        <option value="brand">Brand Purple</option>
                        <option value="dark">Dark</option>
                        <option value="gold">Gold</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Alignment</label>
                    <select value={data.align || 'center'} onChange={e => update('align', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full">
                        <option value="center">Center</option>
                        <option value="left">Left</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

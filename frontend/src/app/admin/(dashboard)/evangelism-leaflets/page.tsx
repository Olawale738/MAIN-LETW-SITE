'use client'
/**
 * /admin/evangelism-leaflets — build ministry-branded gospel tracts / flyers.
 * Admin writes all the content, picks an accent colour + logo, sees a live
 * print-ready preview, and prints or saves as PDF. Leaflets are saved so they
 * can be re-opened and edited any time.
 */
import { useCallback, useEffect, useState } from 'react'
import {
    Loader2, Plus, Save, Trash2, Printer, FileText, CheckCircle,
    AlertCircle, Image as ImageIcon, Megaphone,
} from 'lucide-react'
import { leafletsApi, type Leaflet } from '@/lib/api'
import LeafletDocument from '@/components/leaflet/LeafletDocument'

const DEFAULT_LOGO = '/NewLETWlogo.png'

function blank(): Partial<Leaflet> {
    return {
        title: 'Untitled leaflet',
        headline: 'God Loves You',
        subheadline: 'And has a wonderful plan for your life',
        body_html:
            'No matter what you have done or where you have been, God loves you with an everlasting love. He sent His Son, Jesus Christ, to die for your sins so that you could be forgiven and have eternal life.\n\nToday, He is calling you home. Will you answer?',
        scripture_ref: 'John 3:16',
        scripture_text:
            'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.',
        cta_text: 'Give your life to Christ today',
        cta_detail:
            'Pray: "Lord Jesus, I believe You died for me and rose again. Forgive my sins and come into my heart. I receive You as my Lord and Saviour. Amen."',
        accent_color: '#f5bb00',
        logo_url: '',
        image_url: '',
        qr_url: 'https://letw.org',
        qr_caption: 'Scan to connect with us',
        layout: 'flyer',
        church_name: 'Light Encounter Tabernacle Worldwide',
        contact_phone: '',
        contact_website: 'letw.org',
        contact_address: '',
        service_times: 'Sundays 9:00 AM · Wednesdays 6:00 PM',
        footer_note: 'You are welcome to worship with us. Come as you are.',
        status: 'draft',
        is_public: false,
    }
}

export default function LeafletsPage() {
    const [list, setList] = useState<Leaflet[]>([])
    const [cur, setCur] = useState<Partial<Leaflet>>(blank())
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const refresh = useCallback(() => {
        return leafletsApi.adminList()
            .then(setList)
            .catch(() => setList([]))
            .finally(() => setLoading(false))
    }, [])
    useEffect(() => { refresh() }, [refresh])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const set = (patch: Partial<Leaflet>) => setCur(c => ({ ...c, ...patch }))

    const newLeaflet = () => { setCur(blank()); setSelectedId(null); setMsg(null) }

    const open = async (id: string) => {
        setMsg(null)
        try { const lf = await leafletsApi.adminGet(id); setCur(lf); setSelectedId(id) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const save = async () => {
        setSaving(true)
        try {
            const saved = selectedId
                ? await leafletsApi.update(selectedId, cur)
                : await leafletsApi.create(cur)
            setSelectedId(saved.id)
            setCur(saved)
            setMsg({ kind: 'ok', text: 'Saved.' })
            refresh()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    const del = async (id: string) => {
        if (!confirm('Delete this leaflet? This cannot be undone.')) return
        try {
            await leafletsApi.delete(id)
            if (selectedId === id) newLeaflet()
            refresh()
            setMsg({ kind: 'ok', text: 'Deleted.' })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    // Downscale an uploaded image to a data-URL. Logos keep transparency (PNG);
    // photos compress as JPEG.
    const downscale = (file: File, max: number, mime: 'image/png' | 'image/jpeg', done: (url: string) => void) => {
        const reader = new FileReader()
        reader.onload = () => {
            const img = new window.Image()
            img.onload = () => {
                const scale = Math.min(1, max / Math.max(img.width, img.height))
                const canvas = document.createElement('canvas')
                canvas.width = Math.round(img.width * scale)
                canvas.height = Math.round(img.height * scale)
                const ctx = canvas.getContext('2d')
                if (ctx) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); done(mime === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.82)) }
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    }
    const onImage = (file: File) => downscale(file, 1000, 'image/jpeg', url => set({ image_url: url }))
    const onLogo = (file: File) => downscale(file, 400, 'image/png', url => set({ logo_url: url }))

    const accent = cur.accent_color || '#f5bb00'

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-32">
            <div className="print:hidden">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-1">
                    <Megaphone className="w-7 h-7 text-[#f5bb00]" /> Evangelism Leaflets
                </h1>
                <p className="text-gray-500 text-sm mb-4">Design ministry-branded gospel tracts — you write every word, pick the colours, then print or save as PDF.</p>

                {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span>{msg.text}</span></div>}

                {/* Saved leaflets strip */}
                <div className="mb-5 flex flex-wrap items-center gap-2">
                    <button onClick={newLeaflet} className="inline-flex items-center gap-1.5 bg-[#140152] text-white font-bold px-3 py-2 rounded-lg text-sm"><Plus className="w-4 h-4" /> New leaflet</button>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : list.map(l => (
                        <span key={l.id} className={`inline-flex items-center gap-1 rounded-lg border pl-3 pr-1 py-1 text-xs ${selectedId === l.id ? 'border-[#140152] bg-[#140152]/5' : 'border-gray-200 bg-white'}`}>
                            <button onClick={() => open(l.id)} className="font-semibold text-[#140152] max-w-[160px] truncate">{l.title || 'Untitled'}</button>
                            <span className={`text-[9px] font-bold uppercase px-1 rounded ${l.status === 'published' ? 'text-emerald-600' : 'text-gray-400'}`}>{l.status}</span>
                            <button onClick={() => del(l.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </span>
                    ))}
                    {!loading && list.length === 0 && <span className="text-xs text-gray-400">No leaflets yet — start with “New leaflet”.</span>}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* ── Editor ─────────────────────────────────────────────── */}
                <div className="print:hidden space-y-4">
                    <Card title="Leaflet name (private)">
                        <Text value={cur.title || ''} onChange={v => set({ title: v })} placeholder="e.g. Christmas outreach tract" />
                    </Card>

                    <Card title="Headline & message">
                        <Label>Headline</Label>
                        <Text value={cur.headline || ''} onChange={v => set({ headline: v })} placeholder="God Loves You" />
                        <Label>Subheadline</Label>
                        <Text value={cur.subheadline || ''} onChange={v => set({ subheadline: v })} placeholder="And has a plan for your life" />
                        <Label>Main message</Label>
                        <textarea value={cur.body_html || ''} onChange={e => set({ body_html: e.target.value })} rows={6} placeholder="Write your gospel message here. Leave a blank line between paragraphs." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <p className="text-[11px] text-gray-400 mt-1">Plain text is fine — blank lines become paragraphs. Basic HTML also works.</p>
                    </Card>

                    <Card title="Scripture">
                        <Label>Reference</Label>
                        <Text value={cur.scripture_ref || ''} onChange={v => set({ scripture_ref: v })} placeholder="John 3:16" />
                        <Label>Verse text</Label>
                        <textarea value={cur.scripture_text || ''} onChange={e => set({ scripture_text: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </Card>

                    <Card title="Call to action">
                        <Label>Heading</Label>
                        <Text value={cur.cta_text || ''} onChange={v => set({ cta_text: v })} placeholder="Give your life to Christ today" />
                        <Label>Detail / prayer</Label>
                        <textarea value={cur.cta_detail || ''} onChange={e => set({ cta_detail: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </Card>

                    <Card title="Branding">
                        <Label>Accent colour</Label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={accent} onChange={e => set({ accent_color: e.target.value })} className="h-9 w-12 rounded border border-gray-200 p-0.5" />
                            <input value={accent} onChange={e => set({ accent_color: e.target.value })} className="w-28 border border-gray-200 rounded-lg px-2 py-2 text-sm font-mono" />
                            <div className="flex gap-1">
                                {['#f5bb00', '#140152', '#0e7a5f', '#9d174d', '#b45309'].map(c => (
                                    <button key={c} onClick={() => set({ accent_color: c })} style={{ background: c }} className="w-6 h-6 rounded-full border border-white shadow" />
                                ))}
                            </div>
                        </div>
                        <Label>Logo (leave blank for the ministry logo)</Label>
                        <div className="flex items-center gap-2 mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={cur.logo_url || DEFAULT_LOGO} alt="" className="h-9 w-9 object-contain rounded bg-[#140152] p-0.5" />
                            <label className="inline-flex items-center gap-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg text-xs">
                                <ImageIcon className="w-4 h-4" /> Upload logo
                                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onLogo(e.target.files[0])} />
                            </label>
                            {cur.logo_url && <button onClick={() => set({ logo_url: '' })} className="text-xs text-red-500 font-semibold">Reset</button>}
                        </div>
                        <Text value={cur.logo_url && cur.logo_url.startsWith('data:') ? '' : (cur.logo_url || '')} onChange={v => set({ logo_url: v })} placeholder={`or paste a URL — default ${DEFAULT_LOGO}`} />
                        <Label>Illustration image (optional)</Label>
                        <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg text-xs">
                                <ImageIcon className="w-4 h-4" /> Upload
                                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onImage(e.target.files[0])} />
                            </label>
                            {cur.image_url && <button onClick={() => set({ image_url: '' })} className="text-xs text-red-500 font-semibold">Remove</button>}
                        </div>
                    </Card>

                    <Card title="QR code (scan to connect)">
                        <p className="text-[11px] text-gray-500 mb-2">People who take the leaflet can scan this to reach you instantly. Leave the link blank to hide the QR.</p>
                        <Label>Link the QR opens</Label>
                        <Text value={cur.qr_url || ''} onChange={v => set({ qr_url: v })} placeholder="https://letw.org" />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            <button onClick={() => set({ qr_url: 'https://letw.org' })} className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">Church website</button>
                            <button onClick={() => set({ qr_url: 'https://letw.org/give' })} className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">Give / donate</button>
                            <button onClick={() => set({ qr_url: 'https://letw.org/evangelism' })} className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">I want to know Jesus</button>
                            <button onClick={() => set({ qr_url: '' })} className="text-[11px] font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded">No QR</button>
                        </div>
                        <Label>Caption beside the QR</Label>
                        <Text value={cur.qr_caption || ''} onChange={v => set({ qr_caption: v })} placeholder="Scan to connect with us" />
                    </Card>

                    <Card title="Church & contact (footer)">
                        <Label>Church name</Label>
                        <Text value={cur.church_name || ''} onChange={v => set({ church_name: v })} />
                        <div className="grid grid-cols-2 gap-2">
                            <div><Label>Phone</Label><Text value={cur.contact_phone || ''} onChange={v => set({ contact_phone: v })} placeholder="+234 …" /></div>
                            <div><Label>Website</Label><Text value={cur.contact_website || ''} onChange={v => set({ contact_website: v })} placeholder="letw.org" /></div>
                        </div>
                        <Label>Address</Label>
                        <Text value={cur.contact_address || ''} onChange={v => set({ contact_address: v })} />
                        <Label>Service times</Label>
                        <Text value={cur.service_times || ''} onChange={v => set({ service_times: v })} />
                        <Label>Footer note</Label>
                        <Text value={cur.footer_note || ''} onChange={v => set({ footer_note: v })} />
                    </Card>

                    <Card title="Publish">
                        <div className="flex flex-wrap items-center gap-4">
                            <select value={cur.status || 'draft'} onChange={e => set({ status: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={!!cur.is_public} onChange={e => set({ is_public: e.target.checked })} />
                                Shareable public link
                            </label>
                        </div>
                        {selectedId && cur.is_public && cur.status === 'published' && (
                            <p className="text-[11px] text-gray-500 mt-2">Public link: <code className="bg-gray-100 px-1 rounded">letw.org/leaflet/{selectedId}</code></p>
                        )}
                    </Card>

                    <div className="flex flex-wrap gap-2 sticky bottom-4">
                        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-lg text-sm disabled:opacity-50 shadow-lg">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {selectedId ? 'Save changes' : 'Save leaflet'}
                        </button>
                        <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold px-5 py-2.5 rounded-lg text-sm shadow-lg">
                            <Printer className="w-4 h-4" /> Print / Save as PDF
                        </button>
                    </div>
                </div>

                {/* ── Live preview / printed leaflet ─────────────────────── */}
                <div className="lg:sticky lg:top-4 self-start w-full">
                    <p className="print:hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Live preview</p>
                    <div id="leaflet" className="mx-auto shadow-2xl overflow-hidden" style={{ maxWidth: 420 }}>
                        <LeafletDocument data={cur} />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    body * { visibility: hidden !important; }
                    #leaflet, #leaflet * { visibility: visible !important; }
                    #leaflet { position: absolute !important; left: 0; top: 0; width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
                    @page { size: A5 portrait; margin: 0; }
                }
            `}</style>
        </div>
    )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <h2 className="font-black text-[#140152] text-sm mb-2">{title}</h2>
            {children}
        </div>
    )
}
function Label({ children }: { children: React.ReactNode }) {
    return <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 mt-2 first:mt-0">{children}</label>
}
function Text({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
}

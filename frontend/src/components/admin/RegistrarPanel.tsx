'use client'
/**
 * Who signs admission letters.
 *
 * The Registrar is the office holder. A deputy may be named to sign in their
 * absence, and whichever is marked active is the name and signature that
 * prints on every letter issued from that moment on — previously issued
 * letters keep the signature they were printed with.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Save, PenLine, Trash2, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { theologyApi, type TheologyRegistrar } from '@/lib/api'

/** Downscale an uploaded signature so it stays small enough to store inline. */
function readSignature(file: File, onDone: (dataUrl: string) => void) {
    const reader = new FileReader()
    reader.onload = () => {
        const img = new window.Image()
        img.onload = () => {
            const max = 520
            const scale = Math.min(1, max / Math.max(img.width, img.height))
            const canvas = document.createElement('canvas')
            canvas.width = Math.round(img.width * scale)
            canvas.height = Math.round(img.height * scale)
            const ctx = canvas.getContext('2d')
            if (ctx) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); onDone(canvas.toDataURL('image/png')) }
        }
        img.src = reader.result as string
    }
    reader.readAsDataURL(file)
}

export default function RegistrarPanel() {
    const [data, setData] = useState<TheologyRegistrar | null>(null)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const regFile = useRef<HTMLInputElement>(null)
    const depFile = useRef<HTMLInputElement>(null)

    const load = useCallback(() => {
        theologyApi.getRegistrar().then(setData).catch(e => setMsg({ kind: 'err', text: (e as Error).message }))
    }, [])
    useEffect(() => { load() }, [load])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(t) } }, [msg])

    const set = (patch: Partial<TheologyRegistrar>) => setData(d => (d ? { ...d, ...patch } : d))

    const save = async () => {
        if (!data) return
        setSaving(true)
        try {
            setData(await theologyApi.saveRegistrar({
                registrar_name: data.registrar_name,
                registrar_title: data.registrar_title,
                registrar_signature_url: data.registrar_signature_url,
                deputy_registrar_name: data.deputy_registrar_name,
                deputy_registrar_title: data.deputy_registrar_title,
                deputy_registrar_signature_url: data.deputy_registrar_signature_url,
                deputy_registrar_user_id: data.deputy_registrar_user_id,
                active_signatory: data.active_signatory,
            }))
            setMsg({ kind: 'ok', text: 'Saved. New admission letters carry this signature.' })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    if (!data) {
        return <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#140152]" /></div>
    }

    const deputyReady = !!data.deputy_registrar_name.trim()

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h2 className="font-black text-[#140152] flex items-center gap-2"><PenLine className="w-4 h-4 text-[#f5bb00]" /> Who signs admission letters</h2>
            <p className="text-xs text-gray-500 mt-1">
                Letters already issued keep the signature they were printed with. This sets what prints from now on.
            </p>

            {msg && (
                <div className={`mt-3 p-2.5 rounded-lg border flex items-start gap-2 text-xs ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}<span>{msg.text}</span>
                </div>
            )}

            {/* Who is signing right now */}
            <div className="mt-4 grid sm:grid-cols-2 gap-2">
                {([
                    ['registrar', 'The Registrar', data.registrar_name || 'Not named yet', true],
                    ['deputy', 'The Deputy Registrar', data.deputy_registrar_name || 'Name a deputy first', deputyReady],
                ] as const).map(([value, label, who, enabled]) => (
                    <button key={value} type="button" disabled={!enabled}
                        onClick={() => set({ active_signatory: value })}
                        className={`text-left p-3 rounded-xl border-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${data.active_signatory === value ? 'border-[#140152] bg-[#140152]/[0.04]' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${data.active_signatory === value ? 'border-[#140152] bg-[#140152]' : 'border-gray-300'}`} />
                            <span className="font-bold text-[#140152] text-sm">{label}</span>
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5 pl-[1.375rem] truncate">{who}</span>
                    </button>
                ))}
            </div>

            {/* Registrar */}
            <Block
                title="Registrar"
                name={data.registrar_name} onName={v => set({ registrar_name: v })}
                role={data.registrar_title} onRole={v => set({ registrar_title: v })}
                rolePlaceholder="Registrar"
                sig={data.registrar_signature_url} onSig={v => set({ registrar_signature_url: v })}
                fileRef={regFile}
            />

            {/* Deputy */}
            <Block
                title="Deputy Registrar"
                name={data.deputy_registrar_name} onName={v => set({ deputy_registrar_name: v })}
                role={data.deputy_registrar_title} onRole={v => set({ deputy_registrar_title: v })}
                rolePlaceholder="Deputy Registrar"
                sig={data.deputy_registrar_signature_url} onSig={v => set({ deputy_registrar_signature_url: v })}
                fileRef={depFile}
            >
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 mt-3">
                    Link to an admin account <span className="font-normal normal-case tracking-normal text-gray-400">(optional)</span>
                </label>
                <select value={data.deputy_registrar_user_id}
                    onChange={e => {
                        const picked = data.eligible_deputies.find(d => d.id === e.target.value)
                        set({
                            deputy_registrar_user_id: e.target.value,
                            ...(picked && !data.deputy_registrar_name.trim() ? { deputy_registrar_name: picked.name } : {}),
                        })
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Not linked — name typed by hand</option>
                    {data.eligible_deputies.map(d => (
                        <option key={d.id} value={d.id}>{d.name} · {d.email}</option>
                    ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                    Linking records which administrator holds the deputy role. Only admins and deputy admins are listed.
                </p>
            </Block>

            <button onClick={save} disabled={saving}
                className="mt-5 inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save signatories
            </button>
        </div>
    )
}

function Block({
    title, name, onName, role, onRole, rolePlaceholder, sig, onSig, fileRef, children,
}: {
    title: string
    name: string; onName: (v: string) => void
    role: string; onRole: (v: string) => void
    rolePlaceholder: string
    sig: string; onSig: (v: string) => void
    fileRef: React.RefObject<HTMLInputElement | null>
    children?: React.ReactNode
}) {
    return (
        <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#140152] mb-2.5">{title}</p>
            <div className="grid sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Full name</label>
                    <input value={name} onChange={e => onName(e.target.value)} placeholder="e.g. Rev. Dr. A. B. Sanni"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Title printed</label>
                    <input value={role} onChange={e => onRole(e.target.value)} placeholder={rolePlaceholder}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
            </div>

            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 mt-3">Signature image</label>
            <div className="flex items-center gap-3">
                <div className="h-14 flex-1 min-w-0 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center px-2">
                    {sig
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={sig} alt="Signature" className="max-h-12 max-w-full object-contain" />
                        : <span className="text-[11px] text-gray-400">No signature uploaded</span>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                    <button type="button" onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-1.5 border border-gray-300 text-[#140152] font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">
                        <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                    {sig && (
                        <button type="button" onClick={() => onSig('')}
                            className="inline-flex items-center gap-1.5 text-red-500 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                    )}
                </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) readSignature(f, onSig); e.target.value = '' }} />
            <p className="text-[11px] text-gray-400 mt-1">
                A PNG with a transparent background prints best. It is stored with the settings, not on a public URL.
            </p>

            {children}
        </div>
    )
}

'use client'
/**
 * CertPhotoUpload — small inline uploader for the couple/candidate photo that
 * travels with the certificate handshake to sharepoints. Downscales to a
 * data-URL (JPEG) and calls onChange; shows the current photo as a thumbnail.
 */
import { useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'

export default function CertPhotoUpload({ value, onChange, label = 'Photo' }: {
    value: string | null | undefined
    onChange: (dataUrl: string | null) => void | Promise<void>
    label?: string
}) {
    const [busy, setBusy] = useState(false)

    const pick = (file: File) => {
        setBusy(true)
        const reader = new FileReader()
        reader.onload = () => {
            const img = new window.Image()
            img.onload = async () => {
                const max = 700
                const scale = Math.min(1, max / Math.max(img.width, img.height))
                const canvas = document.createElement('canvas')
                canvas.width = Math.round(img.width * scale)
                canvas.height = Math.round(img.height * scale)
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    try { await onChange(canvas.toDataURL('image/jpeg', 0.85)) } finally { setBusy(false) }
                } else setBusy(false)
            }
            img.onerror = () => setBusy(false)
            img.src = reader.result as string
        }
        reader.onerror = () => setBusy(false)
        reader.readAsDataURL(file)
    }

    return (
        <div className="flex items-center gap-2">
            {value ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value} alt="" className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
            ) : (
                <div className="h-12 w-12 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300"><Camera className="w-5 h-5" /></div>
            )}
            <label className="inline-flex items-center gap-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg text-xs">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />} {value ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && pick(e.target.files[0])} />
            </label>
            {value && !busy && (
                <button onClick={() => onChange(null)} className="text-gray-400 hover:text-red-500" title="Remove photo"><X className="w-4 h-4" /></button>
            )}
        </div>
    )
}

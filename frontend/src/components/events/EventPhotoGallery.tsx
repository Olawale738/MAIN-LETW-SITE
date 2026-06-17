'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader2, Upload, X, Trash2, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { eventPhotoApi, type EventPhoto, resolveBrandingUrl } from '@/lib/api'

interface Props {
    eventId: string
    canEdit?: boolean
}

export default function EventPhotoGallery({ eventId, canEdit = false }: Props) {
    const [photos, setPhotos] = useState<EventPhoto[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const load = async () => {
        try { setPhotos(await eventPhotoApi.list(eventId)) }
        catch { /* no-op */ }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [eventId])

    const handleFiles = async (files: FileList | File[]) => {
        if (!files || files.length === 0) return
        setUploading(true)
        try {
            for (const f of Array.from(files)) {
                if (!f.type.startsWith('image/')) continue
                await eventPhotoApi.upload(eventId, f)
            }
            await load()
        } catch (e) { alert((e as Error).message) }
        finally { setUploading(false) }
    }

    const remove = async (id: string) => {
        if (!confirm('Delete this photo?')) return
        try { await eventPhotoApi.delete(eventId, id); await load() }
        catch (e) { alert((e as Error).message) }
    }

    const resolved = (url: string) => resolveBrandingUrl(url) || url
    const close = () => setLightboxIdx(null)
    const prev = () => setLightboxIdx(i => (i === null ? 0 : (i - 1 + photos.length) % photos.length))
    const next = () => setLightboxIdx(i => (i === null ? 0 : (i + 1) % photos.length))

    useEffect(() => {
        if (lightboxIdx === null) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close()
            else if (e.key === 'ArrowLeft') prev()
            else if (e.key === 'ArrowRight') next()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [lightboxIdx, photos.length])

    if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>

    return (
        <div>
            {canEdit && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                    className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${dragOver ? 'border-[#140152] bg-[#140152]/5' : 'border-gray-200'}`}>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={e => e.target.files && handleFiles(e.target.files)} />
                    {uploading ? <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#140152]" /> : <Upload className="w-8 h-8 mx-auto text-gray-400" />}
                    <p className="mt-3 text-sm text-gray-600">Drag &amp; drop photos here, or <button onClick={() => fileInputRef.current?.click()} className="text-[#140152] font-bold hover:underline">browse</button></p>
                    <p className="text-xs text-gray-400 mt-1">JPG / PNG / WebP · max 10 MB each</p>
                </div>
            )}

            {photos.length === 0 ? (
                <div className="py-12 text-center text-gray-400"><ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No photos yet.</p></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map((p, i) => (
                        <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                            <img src={resolved(p.image_url)} alt={p.caption || ''} loading="lazy"
                                onClick={() => setLightboxIdx(i)}
                                className="w-full h-full object-cover cursor-zoom-in transition-transform group-hover:scale-105" />
                            {canEdit && (
                                <button onClick={() => remove(p.id)} className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                            {p.caption && <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">{p.caption}</p>}
                        </div>
                    ))}
                </div>
            )}

            {lightboxIdx !== null && photos[lightboxIdx] && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={close}>
                    <button onClick={(e) => { e.stopPropagation(); close() }} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"><X className="w-6 h-6" /></button>
                    <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"><ChevronRight className="w-6 h-6" /></button>
                    <img src={resolved(photos[lightboxIdx].image_url)} alt={photos[lightboxIdx].caption || ''}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[88vh] max-w-[92vw] object-contain rounded-lg shadow-2xl" />
                    {photos[lightboxIdx].caption && (
                        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-[80vw] text-center">{photos[lightboxIdx].caption}</p>
                    )}
                </div>
            )}
        </div>
    )
}

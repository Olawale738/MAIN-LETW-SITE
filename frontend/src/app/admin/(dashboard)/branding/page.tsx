'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Image as ImageIcon, Upload, RotateCcw, Sparkles, Globe } from 'lucide-react'
import { siteBrandingApi, resolveBrandingUrl, type SiteBranding } from '@/lib/api'
import { announceBrandingUpdate } from '@/components/BrandingApplier'

const LOGO_FALLBACK = '/headerNewLETWlogo.png'
const FAVICON_FALLBACK = '/NewLETWlogo.png'

export default function AdminBrandingPage() {
    const [branding, setBranding] = useState<SiteBranding>({ logo_url: null, favicon_url: null })
    const [loading, setLoading] = useState(true)
    const [logoUploading, setLogoUploading] = useState(false)
    const [faviconUploading, setFaviconUploading] = useState(false)
    const logoInputRef = useRef<HTMLInputElement>(null)
    const faviconInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        siteBrandingApi.get()
            .then((b) => setBranding(b))
            .catch(() => { /* defaults stay */ })
            .finally(() => setLoading(false))
    }, [])

    const handleLogoUpload = async (file: File) => {
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Max 5 MB.')
            return
        }
        setLogoUploading(true)
        try {
            const updated = await siteBrandingApi.uploadLogo(file)
            const next = { ...branding, logo_url: updated.logo_url }
            setBranding(next)
            announceBrandingUpdate(next)
            toast.success('Logo updated — change is now live')
        } catch (err: any) {
            toast.error(err?.message || 'Logo upload failed')
        } finally {
            setLogoUploading(false)
            if (logoInputRef.current) logoInputRef.current.value = ''
        }
    }

    const handleFaviconUpload = async (file: File) => {
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Max 5 MB.')
            return
        }
        setFaviconUploading(true)
        try {
            const updated = await siteBrandingApi.uploadFavicon(file)
            const next = { ...branding, favicon_url: updated.favicon_url }
            setBranding(next)
            announceBrandingUpdate(next)
            toast.success('Favicon updated — refresh tab to see it')
        } catch (err: any) {
            toast.error(err?.message || 'Favicon upload failed')
        } finally {
            setFaviconUploading(false)
            if (faviconInputRef.current) faviconInputRef.current.value = ''
        }
    }

    const resetLogo = async () => {
        if (!confirm('Reset the logo back to the built-in default?')) return
        try {
            const updated = await siteBrandingApi.clearLogo()
            const next = { ...branding, logo_url: updated.logo_url }
            setBranding(next)
            announceBrandingUpdate(next)
            toast.success('Logo reset to default')
        } catch (err: any) {
            toast.error(err?.message || 'Reset failed')
        }
    }

    const resetFavicon = async () => {
        if (!confirm('Reset the favicon back to the built-in default?')) return
        try {
            const updated = await siteBrandingApi.clearFavicon()
            const next = { ...branding, favicon_url: updated.favicon_url }
            setBranding(next)
            announceBrandingUpdate(next)
            toast.success('Favicon reset to default')
        } catch (err: any) {
            toast.error(err?.message || 'Reset failed')
        }
    }

    const logoPreview = resolveBrandingUrl(branding.logo_url) || LOGO_FALLBACK
    const faviconPreview = resolveBrandingUrl(branding.favicon_url) || FAVICON_FALLBACK

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-3xl font-black flex items-center gap-3 text-[#140152]">
                    <ImageIcon className="w-7 h-7 text-[#f5bb00]" /> Site Branding
                </h1>
                <p className="text-gray-600 mt-1 max-w-2xl">
                    Change the logo shown in the site header and the favicon shown in browser tabs.
                    Changes go live the moment you upload — no redeploy needed.
                </p>
            </div>

            <Card className="border-l-4 border-l-[#140152]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#f5bb00]" /> Header Logo
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        The mark shown next to "LETW" in the top navigation bar. Recommended square PNG/SVG, 256×256 or larger.
                    </p>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-40 h-40 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-3 shrink-0">
                            {loading ? (
                                <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />
                            ) : (
                                <img src={logoPreview} alt="Current logo" className="max-w-full max-h-full object-contain" />
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold ${branding.logo_url ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {branding.logo_url ? 'Custom upload' : 'Using built-in default'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    disabled={logoUploading}
                                    className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition"
                                >
                                    <Upload className="w-4 h-4" />
                                    {logoUploading ? 'Uploading…' : (branding.logo_url ? 'Replace Logo' : 'Upload Logo')}
                                </button>
                                {branding.logo_url && (
                                    <button
                                        onClick={resetLogo}
                                        disabled={logoUploading}
                                        className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-lg text-sm"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Reset to default
                                    </button>
                                )}
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
                                    className="hidden"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, WEBP or SVG · Max 5 MB · Updates the header instantly across all pages.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#f5bb00]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-[#140152]" /> Browser Tab Favicon
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        The tiny icon shown in browser tabs, bookmarks, and the address bar.
                        Recommended square PNG or ICO, 256×256 (browsers auto-shrink).
                    </p>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-40 h-40 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-3 shrink-0">
                            {loading ? (
                                <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />
                            ) : (
                                <img src={faviconPreview} alt="Current favicon" className="max-w-full max-h-full object-contain" />
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold ${branding.favicon_url ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {branding.favicon_url ? 'Custom upload' : 'Using built-in default'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => faviconInputRef.current?.click()}
                                    disabled={faviconUploading}
                                    className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-[#dba500] disabled:opacity-60 text-[#140152] font-black px-5 py-2.5 rounded-lg text-sm transition"
                                >
                                    <Upload className="w-4 h-4" />
                                    {faviconUploading ? 'Uploading…' : (branding.favicon_url ? 'Replace Favicon' : 'Upload Favicon')}
                                </button>
                                {branding.favicon_url && (
                                    <button
                                        onClick={resetFavicon}
                                        disabled={faviconUploading}
                                        className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-lg text-sm"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Reset to default
                                    </button>
                                )}
                                <input
                                    ref={faviconInputRef}
                                    type="file"
                                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/jpeg"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFaviconUpload(f) }}
                                    className="hidden"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                PNG, ICO, SVG, or JPG · Max 5 MB · Returning visitors may still see the old icon until their browser cache refreshes.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">How it works</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-2">
                    <p>· Uploads are saved to the backend and served via <code className="bg-gray-100 px-1 rounded text-xs">/uploads/branding/</code>.</p>
                    <p>· The header logo updates instantly on every page — no redeploy required.</p>
                    <p>· The favicon updates instantly for new visitors. Existing visitors may need to hard-refresh (Ctrl+Shift+R) once.</p>
                    <p>· Resetting falls back to the built-in default that ships with the deployed build.</p>
                </CardContent>
            </Card>
        </div>
    )
}

'use client'
import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { cmsApi } from '@/lib/api'

interface ImagePickerProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
}

export default function ImagePicker({ value, onChange, label }: ImagePickerProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError(null)
        try {
            const response = await cmsApi.uploadImage(file)
            // Store the ID (or specific internal URL format)
            onChange(response.id)
        } catch (err: any) {
            setError(err.message || "Upload failed")
        } finally {
            setUploading(false)
        }
    }

    // Resolve display URL
    const displayUrl = value ? (value.startsWith('/') || value.startsWith('http') ? value : cmsApi.getImageUrl(value)) : null

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors border-gray-300">
                {displayUrl ? (
                    <div className="relative group">
                        <img
                            src={displayUrl}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary" className="bg-red-500 text-white hover:bg-red-600 border-none" onClick={() => onChange('')}>
                                <X className="w-4 h-4 mr-1" /> Remove
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-1" /> Replace
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="h-32 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-purple-600"
                        onClick={() => inputRef.current?.click()}
                    >
                        {uploading ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                            <>
                                <ImageIcon className="w-8 h-8 mb-2" />
                                <span className="text-sm">Click to upload image</span>
                            </>
                        )}
                    </div>
                )}
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    )
}

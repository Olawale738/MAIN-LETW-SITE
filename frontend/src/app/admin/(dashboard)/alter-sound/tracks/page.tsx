'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, ArrowLeft, Music, Upload, Star } from 'lucide-react'
import Link from 'next/link'
import { alterSoundApi, AudioTrack, AudioCategory } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export default function AlterSoundTracksPage() {
    const [tracks, setTracks] = useState<AudioTrack[]>([])
    const [categories, setCategories] = useState<AudioCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null)
    const [uploading, setUploading] = useState(false)
    const { showToast, ToastComponent } = useToast()

    const [formData, setFormData] = useState({
        category_id: '',
        title: '',
        description: '',
        artist: '',
        duration: '',
        is_featured: false,
        is_active: true,
        order_index: 0,
    })

    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [tracksData, categoriesData] = await Promise.all([
                alterSoundApi.getAllTracks(),
                alterSoundApi.getAllCategories()
            ])
            setTracks(tracksData.sort((a, b) => a.order_index - b.order_index))
            setCategories(categoriesData.filter(c => c.is_active))
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (track?: AudioTrack) => {
        if (track) {
            setEditingTrack(track)
            setFormData({
                category_id: track.category_id,
                title: track.title,
                description: track.description || '',
                artist: track.artist || '',
                duration: track.duration || '',
                is_featured: track.is_featured,
                is_active: track.is_active,
                order_index: track.order_index,
            })
        } else {
            setEditingTrack(null)
            setFormData({
                category_id: categories[0]?.id || '',
                title: '',
                description: '',
                artist: '',
                duration: '',
                is_featured: false,
                is_active: true,
                order_index: tracks.length,
            })
        }
        setAudioFile(null)
        setCoverFile(null)
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingTrack(null)
        setAudioFile(null)
        setCoverFile(null)
    }



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setUploading(true)

        try {
            // Validate that audio file is provided for new tracks
            if (!editingTrack && !audioFile) {
                showToast('Please upload an audio file', 'error')
                setUploading(false)
                return
            }

            // Save track
            if (editingTrack) {
                await alterSoundApi.updateTrack(editingTrack.id, formData)
                showToast('Track updated successfully!', 'success')
            } else {
                await alterSoundApi.createTrack({ ...formData, audioFile: audioFile!, coverFile: coverFile || undefined })
                showToast('Track created successfully!', 'success')
            }

            await fetchData()
            handleCloseModal()
        } catch (error) {
            console.error('Failed to save track:', error)
            showToast('Failed to save track', 'error')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this track?')) return
        try {
            await alterSoundApi.deleteTrack(id)
            showToast('Track deleted successfully!', 'success')
            await fetchData()
        } catch (error) {
            console.error('Failed to delete track:', error)
            showToast('Failed to delete track', 'error')
        }
    }

    return (
        <div className="p-8">
            <ToastComponent />
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/alter-sound">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-[#140152]">Audio Tracks</h1>
                        <p className="text-gray-600">Upload and manage audio worship tracks</p>
                    </div>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="bg-[#140152] text-white hover:bg-[#140152]/90"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Track
                </Button>
            </div>

            {/* Tracks List */}
            <div className="space-y-4">
                {tracks.map((track) => (
                    <Card key={track.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#140152] to-purple-900 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img
                                    src={alterSoundApi.getCoverUrl(track.id)}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                        if (fallback) fallback.style.display = 'flex'
                                    }}
                                />
                                <div className="w-full h-full hidden items-center justify-center absolute">
                                    <Music className="w-8 h-8 text-[#f5bb00]" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-[#140152]">{track.title}</h3>
                                    {track.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                </div>
                                <p className="text-sm text-gray-600">{track.artist || 'Unknown Artist'} • {track.category.name}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>{track.play_count} plays</span>
                                    {track.duration && <span>{track.duration}</span>}
                                    <span className={`px-2 py-1 rounded-full ${track.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {track.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenModal(track)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(track.id)}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-2xl font-bold text-[#140152] mb-4">
                                {editingTrack ? 'Edit Track' : 'Add Track'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="title" className="text-gray-900">Track Title</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                            className="text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="artist" className="text-gray-900">Artist</Label>
                                        <Input
                                            id="artist"
                                            value={formData.artist}
                                            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                            className="text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="description" className="text-gray-900">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="text-gray-900"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="category_id" className="text-gray-900">Category</Label>
                                        <select
                                            id="category_id"
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            required
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="duration" className="text-gray-900">Duration (e.g., 3:45)</Label>
                                        <Input
                                            id="duration"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            placeholder="3:45"
                                            className="text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="audio_file" className="text-gray-900">Audio File (mp3, wav, m4a, ogg, flac - max 50MB)</Label>
                                    <Input
                                        id="audio_file"
                                        type="file"
                                        accept=".mp3,.wav,.m4a,.ogg,.flac"
                                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                                        className="text-gray-900"
                                    />
                                    {formData.audio_url && <p className="text-xs text-green-600 mt-1">✓ Audio file uploaded</p>}
                                </div>

                                <div>
                                    <Label htmlFor="cover_file" className="text-gray-900">Cover Image (jpg, png, webp - max 5MB)</Label>
                                    <Input
                                        id="cover_file"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                        className="text-gray-900"
                                    />
                                    {coverFile && <p className="text-xs text-green-600 mt-1">✓ Cover image selected: {coverFile.name}</p>}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="order_index" className="text-gray-900">Order Index</Label>
                                        <Input
                                            id="order_index"
                                            type="number"
                                            value={formData.order_index}
                                            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                            required
                                            className="text-gray-900"
                                        />
                                    </div>

                                    <div className="flex items-center gap-4 pt-6">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_featured"
                                                checked={formData.is_featured}
                                                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="is_featured" className="text-gray-900">Featured</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="is_active" className="text-gray-900">Active</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseModal}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-1 bg-[#140152] text-white hover:bg-[#140152]/90"
                                    >
                                        {uploading ? 'Uploading...' : editingTrack ? 'Update' : 'Create'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}


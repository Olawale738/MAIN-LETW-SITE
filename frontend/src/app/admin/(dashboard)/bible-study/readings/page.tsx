'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
    BookOpen, Plus, Edit, Trash2, X, ArrowLeft, Book
} from 'lucide-react'
import { 
    bibleStudyApi, BibleReadingPlan, DailyReading, DailyReadingCreate
} from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

export default function BibleStudyReadingsAdmin() {
    const { showToast, ToastComponent } = useToast()
    const [plans, setPlans] = useState<BibleReadingPlan[]>([])
    const [selectedPlanId, setSelectedPlanId] = useState<string>('')
    const [readings, setReadings] = useState<DailyReading[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingReading, setEditingReading] = useState<DailyReading | null>(null)
    const [formData, setFormData] = useState<DailyReadingCreate>({
        plan_id: '',
        day_number: 1,
        title: '',
        scripture_reference: '',
        reflection: '',
        key_verse: ''
    })

    useEffect(() => {
        fetchPlans()
    }, [])

    useEffect(() => {
        if (selectedPlanId) {
            fetchReadings()
        }
    }, [selectedPlanId])

    const fetchPlans = async () => {
        try {
            const data = await bibleStudyApi.getAllPlans()
            setPlans(data.filter(p => p.is_active))
            if (data.length > 0 && !selectedPlanId) {
                setSelectedPlanId(data[0].id)
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error)
            showToast('Failed to load reading plans', 'error')
        } finally {
            setLoading(false)
        }
    }

    const fetchReadings = async () => {
        if (!selectedPlanId) return
        
        try {
            const data = await bibleStudyApi.getPlanReadings(selectedPlanId)
            setReadings(data.sort((a, b) => a.day_number - b.day_number))
        } catch (error) {
            console.error('Failed to fetch readings:', error)
            showToast('Failed to load readings', 'error')
        }
    }

    const handleOpenModal = (reading?: DailyReading) => {
        if (reading) {
            setEditingReading(reading)
            setFormData({
                plan_id: reading.plan_id,
                day_number: reading.day_number,
                title: reading.title,
                scripture_reference: reading.scripture_reference,
                reflection: reading.reflection || '',
                key_verse: reading.key_verse || ''
            })
        } else {
            setEditingReading(null)
            const nextDayNumber = readings.length > 0 
                ? Math.max(...readings.map(r => r.day_number)) + 1 
                : 1
            setFormData({
                plan_id: selectedPlanId,
                day_number: nextDayNumber,
                title: '',
                scripture_reference: '',
                reflection: '',
                key_verse: ''
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingReading(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!selectedPlanId) {
            showToast('Please select a reading plan first', 'error')
            return
        }

        try {
            if (editingReading) {
                await bibleStudyApi.updateReading(editingReading.id, formData)
                showToast('Daily reading updated successfully!', 'success')
            } else {
                await bibleStudyApi.createReading(formData)
                showToast('Daily reading created successfully!', 'success')
            }
            handleCloseModal()
            await fetchReadings()
        } catch (error: any) {
            console.error('Failed to save reading:', error)
            showToast(error.message || 'Failed to save daily reading', 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this daily reading?')) {
            return
        }

        try {
            await bibleStudyApi.deleteReading(id)
            showToast('Daily reading deleted successfully!', 'success')
            await fetchReadings()
        } catch (error: any) {
            console.error('Failed to delete reading:', error)
            showToast(error.message || 'Failed to delete daily reading', 'error')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <BookOpen className="w-12 h-12 animate-pulse text-[#140152]" />
            </div>
        )
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId)

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            {ToastComponent()}
            
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin">
                    <Button variant="ghost" className="mb-4 text-[#140152] hover:text-[#f5bb00]">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to Admin
                    </Button>
                </Link>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-[#140152] mb-2">Daily Readings</h1>
                        <p className="text-gray-600">Manage daily readings for each plan</p>
                    </div>
                    <Button
                        onClick={() => handleOpenModal()}
                        disabled={!selectedPlanId}
                        className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152] disabled:opacity-50"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        Add Daily Reading
                    </Button>
                </div>

                {/* Plan Selector */}
                <Card className="p-4 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Reading Plan
                    </label>
                    <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
                    >
                        <option value="">-- Select a Plan --</option>
                        {plans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                                {plan.title} ({plan.duration_days} days)
                            </option>
                        ))}
                    </select>
                    {selectedPlan && (
                        <p className="text-sm text-gray-600 mt-2">
                            {readings.length} of {selectedPlan.duration_days} readings created
                        </p>
                    )}
                </Card>
            </div>

            {/* Readings List */}
            {selectedPlanId ? (
                <div className="grid gap-4">
                    {readings.map((reading, index) => (
                        <motion.div
                            key={reading.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-6 hover:shadow-lg transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#140152] to-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-[#f5bb00] font-bold">{reading.day_number}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-[#140152] mb-2">{reading.title}</h3>
                                            <p className="text-gray-600 mb-2">
                                                <Book className="inline w-4 h-4 mr-1" />
                                                {reading.scripture_reference}
                                            </p>
                                            {reading.key_verse && (
                                                <div className="bg-[#f5bb00]/10 border-l-4 border-[#f5bb00] p-3 mb-2">
                                                    <p className="text-sm italic text-gray-700">"{reading.key_verse}"</p>
                                                </div>
                                            )}
                                            {reading.reflection && (
                                                <p className="text-sm text-gray-600 line-clamp-2">{reading.reflection}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleOpenModal(reading)}
                                            variant="outline"
                                            size="sm"
                                            className="border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(reading.id)}
                                            variant="outline"
                                            size="sm"
                                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {readings.length === 0 && (
                        <Card className="p-12 text-center">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">No Readings Yet</h3>
                            <p className="text-gray-600 mb-6">Add daily readings for this plan</p>
                            <Button
                                onClick={() => handleOpenModal()}
                                className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                            >
                                <Plus className="mr-2 w-5 h-5" />
                                Add First Reading
                            </Button>
                        </Card>
                    )}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Book className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Reading Plan</h3>
                    <p className="text-gray-600">Choose a plan above to manage its daily readings</p>
                </Card>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-2xl font-bold text-[#140152]">
                                {editingReading ? 'Edit Daily Reading' : 'Add Daily Reading'}
                            </h2>
                            <Button
                                onClick={handleCloseModal}
                                variant="ghost"
                                size="sm"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Day Number *
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.day_number}
                                        onChange={(e) => setFormData({ ...formData, day_number: parseInt(e.target.value) })}
                                        required
                                        min="1"
                                        className="text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scripture Reference *
                                    </label>
                                    <Input
                                        value={formData.scripture_reference}
                                        onChange={(e) => setFormData({ ...formData, scripture_reference: e.target.value })}
                                        required
                                        placeholder="e.g., John 3:16-21"
                                        className="text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="e.g., God's Love for the World"
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Key Verse
                                </label>
                                <Input
                                    value={formData.key_verse}
                                    onChange={(e) => setFormData({ ...formData, key_verse: e.target.value })}
                                    placeholder="e.g., For God so loved the world..."
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reflection
                                </label>
                                <Textarea
                                    value={formData.reflection}
                                    onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                                    placeholder="Add a reflection or devotional thought..."
                                    rows={5}
                                    className="text-gray-900"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                                >
                                    {editingReading ? 'Update Reading' : 'Create Reading'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCloseModal}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}


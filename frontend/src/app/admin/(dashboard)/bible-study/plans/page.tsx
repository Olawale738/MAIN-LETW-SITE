'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
    Book, Plus, Edit, Trash2, X, ArrowLeft, Star, Eye, EyeOff
} from 'lucide-react'
import { 
    bibleStudyApi, BibleReadingPlan, BibleReadingPlanCreate, ReadingPlanType
} from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

export default function BibleStudyPlansAdmin() {
    const { showToast, ToastComponent } = useToast()
    const [plans, setPlans] = useState<BibleReadingPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingPlan, setEditingPlan] = useState<BibleReadingPlan | null>(null)
    const [formData, setFormData] = useState<BibleReadingPlanCreate>({
        title: '',
        description: '',
        plan_type: ReadingPlanType.WEEKLY,
        duration_days: 7,
        target_audience: '',
        is_featured: false,
        is_active: true,
        order_index: 0
    })

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const data = await bibleStudyApi.getAllPlans()
            setPlans(data.sort((a, b) => a.order_index - b.order_index))
        } catch (error) {
            console.error('Failed to fetch plans:', error)
            showToast('Failed to load reading plans', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (plan?: BibleReadingPlan) => {
        if (plan) {
            setEditingPlan(plan)
            setFormData({
                title: plan.title,
                description: plan.description || '',
                plan_type: plan.plan_type,
                duration_days: plan.duration_days,
                target_audience: plan.target_audience || '',
                is_featured: plan.is_featured,
                is_active: plan.is_active,
                order_index: plan.order_index
            })
        } else {
            setEditingPlan(null)
            setFormData({
                title: '',
                description: '',
                plan_type: ReadingPlanType.WEEKLY,
                duration_days: 7,
                target_audience: '',
                is_featured: false,
                is_active: true,
                order_index: plans.length
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingPlan(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        try {
            if (editingPlan) {
                await bibleStudyApi.updatePlan(editingPlan.id, formData)
                showToast('Reading plan updated successfully!', 'success')
            } else {
                await bibleStudyApi.createPlan(formData)
                showToast('Reading plan created successfully!', 'success')
            }
            handleCloseModal()
            await fetchPlans()
        } catch (error: any) {
            console.error('Failed to save plan:', error)
            showToast(error.message || 'Failed to save reading plan', 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this reading plan? This will also delete all associated daily readings.')) {
            return
        }

        try {
            await bibleStudyApi.deletePlan(id)
            showToast('Reading plan deleted successfully!', 'success')
            await fetchPlans()
        } catch (error: any) {
            console.error('Failed to delete plan:', error)
            showToast(error.message || 'Failed to delete reading plan', 'error')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Book className="w-12 h-12 animate-pulse text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            {ToastComponent}
            
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin">
                    <Button variant="ghost" className="mb-4 text-[#140152] hover:text-[#f5bb00]">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to Admin
                    </Button>
                </Link>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-[#140152] mb-2">Bible Reading Plans</h1>
                        <p className="text-gray-600">Manage reading plans for your congregation</p>
                    </div>
                    <Button 
                        onClick={() => handleOpenModal()}
                        className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        Add New Plan
                    </Button>
                </div>
            </div>

            {/* Plans List */}
            <div className="grid gap-4">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#140152] to-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Book className="w-6 h-6 text-[#f5bb00]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-xl font-bold text-[#140152]">{plan.title}</h3>
                                            {plan.is_featured && (
                                                <Star className="w-5 h-5 text-[#f5bb00] fill-[#f5bb00]" />
                                            )}
                                            {!plan.is_active && (
                                                <EyeOff className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <p className="text-gray-600 mb-2">{plan.description}</p>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span>{plan.duration_days} days</span>
                                            <span>•</span>
                                            <span>{plan.plan_type}</span>
                                            {plan.target_audience && (
                                                <>
                                                    <span>•</span>
                                                    <span>{plan.target_audience}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleOpenModal(plan)}
                                        variant="outline"
                                        size="sm"
                                        className="border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(plan.id)}
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
            </div>

            {plans.length === 0 && (
                <Card className="p-12 text-center">
                    <Book className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Reading Plans Yet</h3>
                    <p className="text-gray-600 mb-6">Create your first reading plan to get started</p>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        Add New Plan
                    </Button>
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
                                {editingPlan ? 'Edit Reading Plan' : 'Add New Reading Plan'}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="e.g., 30-Day Gospel Reading Plan"
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the reading plan..."
                                    rows={3}
                                    className="text-gray-900"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Plan Type *
                                    </label>
                                    <select
                                        value={formData.plan_type}
                                        onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as ReadingPlanType })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                        required
                                    >
                                        <option value={ReadingPlanType.WEEKLY}>Weekly</option>
                                        <option value={ReadingPlanType.MONTHLY}>Monthly</option>
                                        <option value={ReadingPlanType.YEARLY}>Yearly</option>
                                        <option value={ReadingPlanType.CUSTOM}>Custom</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duration (Days) *
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.duration_days}
                                        onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                                        required
                                        min="1"
                                        className="text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Audience
                                </label>
                                <Input
                                    value={formData.target_audience}
                                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                                    placeholder="e.g., New Believers, Youth, Everyone"
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order Index
                                </label>
                                <Input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                    min="0"
                                    className="text-gray-900"
                                />
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        className="w-4 h-4 text-[#140152] rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Featured Plan</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-[#140152] rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                                >
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
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


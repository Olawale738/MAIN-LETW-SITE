'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { serviceRequestApi, ServiceRequest } from '@/lib/api'
import { Camera, Coffee, Users, Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface VolunteerDept {
    id: string
    name: string
    emoji: string
    description: string
    dashboardUrl: string
    color: string
}

const DEPARTMENTS: Record<string, VolunteerDept> = {
    media: {
        id: 'media',
        name: 'Media & Creative',
        emoji: '🎬',
        description: 'Capture, create, and share content that tells the church\'s story.',
        dashboardUrl: '/services/media',
        color: '#7c3aed',
    },
    hospitality: {
        id: 'hospitality',
        name: 'Hospitality Team',
        emoji: '☕',
        description: 'Welcome, serve, and create a warm environment for our community.',
        dashboardUrl: '/services/hospitality',
        color: '#b45309',
    },
    ushering: {
        id: 'ushering',
        name: 'Ushering & Welcome',
        emoji: '🤝',
        description: 'Guide members and visitors with warmth, professionalism, and care.',
        dashboardUrl: '/services/ushering',
        color: '#0369a1',
    },
    security: {
        id: 'security',
        name: 'Security & Safety',
        emoji: '🛡️',
        description: 'Protect and ensure the safety of our church family.',
        dashboardUrl: '/services/security',
        color: '#374151',
    },
}

export default function VolunteerDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [approvedDepts, setApprovedDepts] = useState<ServiceRequest[]>([])
    const [userName, setUserName] = useState('')

    useEffect(() => {
        const init = async () => {
            try {
                const loggedIn = localStorage.getItem('isLoggedIn')
                if (!loggedIn) {
                    router.push('/auth/login')
                    return
                }
                setUserName(localStorage.getItem('userName') || 'Volunteer')
                const requests = await serviceRequestApi.getMyRequests()
                const volunteerReqs = requests.approved.filter(r => r.service_name === 'Volunteer')
                setApprovedDepts(volunteerReqs)
                if (volunteerReqs.length === 0) setError('No departments assigned yet.')
            } catch (err) {
                console.error('Load error:', err)
                setError('Failed to load assignments.')
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#140152] to-[#220263]">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#140152] to-[#220263]">
            <div className="px-4 md:px-12 pt-12 pb-16 text-center">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Volunteer Dashboard</h1>
                <p className="text-white/70 text-lg">
                    {approvedDepts.length > 0
                        ? `Welcome, ${userName}! Serving in ${approvedDepts.length} department${approvedDepts.length !== 1 ? 's' : ''}.`
                        : `Hi ${userName}, no departments assigned yet.`}
                </p>
            </div>

            <main className="max-w-6xl mx-auto px-4 md:px-12 pb-20">
                {error && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-dashed border-gray-200">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-semibold mb-6">{error}</p>
                    </div>
                )}

                {approvedDepts.length > 0 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {approvedDepts.map((req, i) => {
                                const deptKey = req.message?.toLowerCase().split(' ')[0] || 'media'
                                const dept = DEPARTMENTS[deptKey] || DEPARTMENTS.media
                                return (
                                    <motion.div
                                        key={req.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Link href={dept.dashboardUrl}>
                                            <Card className="bg-white hover:shadow-2xl transition-all cursor-pointer overflow-hidden group h-full">
                                                <div className="h-1" style={{ backgroundColor: dept.color }} />
                                                <div className="p-8">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <p className="text-3xl">{dept.emoji}</p>
                                                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-[#140152] mb-2">{dept.name}</h3>
                                                    <p className="text-gray-600 text-sm mb-6">{dept.description}</p>
                                                    <Button className="w-full bg-[#140152] text-white hover:bg-[#1a0270] rounded-xl">
                                                        Open Dashboard
                                                    </Button>
                                                </div>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

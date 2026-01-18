'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { userApi, serviceRequestApi, tokenManager } from '@/lib/api'
import { Loader2, Check, ArrowRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServiceSelectionPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [services, setServices] = useState<string[]>([])
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [pendingServices, setPendingServices] = useState<string[]>([])
    const [approvedServices, setApprovedServices] = useState<string[]>([])
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        const init = async () => {
            if (!tokenManager.isLoggedIn()) {
                router.push('/auth/login')
                return
            }

            try {
                // Get available services
                const servicesList = await userApi.getAvailableServices()
                setServices(servicesList)

                // Get user's existing requests
                const myRequests = await serviceRequestApi.getMyRequests()
                const pending = myRequests.pending.map(r => r.service_name)
                const approved = myRequests.approved.map(r => r.service_name)

                setPendingServices(pending)
                setApprovedServices(approved)
            } catch (err) {
                setError('Failed to load services. Please try again.')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    const toggleService = (service: string) => {
        // Can't select services that are already pending or approved
        if (pendingServices.includes(service) || approvedServices.includes(service)) {
            return
        }

        setSelectedServices(prev =>
            prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]
        )
    }

    const handleSubmit = async () => {
        if (selectedServices.length === 0) return

        setSubmitting(true)
        setError('')
        setSuccessMessage('')

        try {
            const response = await serviceRequestApi.submitRequests(selectedServices)
            setSuccessMessage(response.message)

            // Update pending services list
            setPendingServices(prev => [...prev, ...selectedServices])
            setSelectedServices([])

            // Redirect to dashboard after a short delay to show success message
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        } catch (err) {
            setError('Failed to submit request. Please try again.')
            console.error(err)
            setSubmitting(false)
        }
    }

    const getServiceStatus = (service: string) => {
        if (approvedServices.includes(service)) return 'approved'
        if (pendingServices.includes(service)) return 'pending'
        if (selectedServices.includes(service)) return 'selected'
        return 'available'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full space-y-8 bg-white p-8 md:p-12 rounded-2xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-[#140152] mb-4">
                        Join Our Ministries
                    </h1>
                    <p className="text-xl text-gray-500 mb-4">
                        Select the ministries and services you'd like to be part of.
                    </p>
                    <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg inline-block">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Requests require admin approval before becoming active
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 text-green-600 p-4 rounded-lg text-center">
                        {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => {
                        const status = getServiceStatus(service)
                        const isDisabled = status === 'approved' || status === 'pending'

                        return (
                            <button
                                key={service}
                                onClick={() => toggleService(service)}
                                disabled={isDisabled}
                                className={cn(
                                    "relative p-6 rounded-xl border-2 text-left transition-all duration-200 group",
                                    status === 'approved' && "border-green-300 bg-green-50 cursor-not-allowed",
                                    status === 'pending' && "border-amber-300 bg-amber-50 cursor-not-allowed",
                                    status === 'selected' && "border-[#140152] bg-[#140152]/5 hover:border-[#140152]",
                                    status === 'available' && "border-gray-100 bg-white hover:border-[#140152]/30"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <span className={cn(
                                            "font-semibold text-lg",
                                            status === 'approved' && "text-green-700",
                                            status === 'pending' && "text-amber-700",
                                            status === 'selected' && "text-[#140152]",
                                            status === 'available' && "text-gray-700"
                                        )}>
                                            {service}
                                        </span>
                                        {status === 'pending' && (
                                            <span className="block text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Awaiting approval
                                            </span>
                                        )}
                                        {status === 'approved' && (
                                            <span className="block text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                Already joined
                                            </span>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                        status === 'approved' && "border-green-500 bg-green-500 text-white",
                                        status === 'pending' && "border-amber-500 bg-amber-500 text-white",
                                        status === 'selected' && "border-[#140152] bg-[#140152] text-white",
                                        status === 'available' && "border-gray-200 text-transparent"
                                    )}>
                                        {status === 'pending' ? (
                                            <Clock className="w-3 h-3" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100">
                    <Button
                        onClick={() => router.push('/dashboard')}
                        variant="ghost"
                        className="text-gray-500 hover:text-[#140152]"
                    >
                        Skip for now
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || selectedServices.length === 0}
                        className="w-full md:w-auto text-lg py-6 px-8 bg-[#140152] hover:bg-[#1d0175] text-white disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Submitting Request...
                            </>
                        ) : (
                            <>
                                Submit Request ({selectedServices.length})
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </Button>
                </div>

                {selectedServices.length === 0 && !successMessage && (
                    <p className="text-center text-sm text-gray-400 mt-4">
                        {approvedServices.length > 0 || pendingServices.length > 0
                            ? "Select additional services to request, or skip to continue"
                            : "Please select at least one service to continue"}
                    </p>
                )}
            </div>
        </div>
    )
}

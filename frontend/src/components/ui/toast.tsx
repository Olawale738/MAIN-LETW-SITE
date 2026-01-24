'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
    message: string
    type?: ToastType
    isVisible: boolean
    onClose: () => void
    duration?: number
}

const toastIcons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
}

const toastStyles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
}

const iconStyles = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
}

export function Toast({ message, type = 'info', isVisible, onClose, duration = 3000 }: ToastProps) {
    const Icon = toastIcons[type]

    // Auto-close after duration
    React.useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(onClose, duration)
            return () => clearTimeout(timer)
        }
    }, [isVisible, duration, onClose])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="fixed top-4 right-4 z-[9999] max-w-md"
                >
                    <div className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 shadow-lg backdrop-blur-sm',
                        toastStyles[type]
                    )}>
                        <Icon className={cn('w-5 h-5 flex-shrink-0', iconStyles[type])} />
                        <p className="flex-1 text-sm font-medium">{message}</p>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Hook for using toast
import React, { useState, useCallback } from 'react'

interface ToastState {
    message: string
    type: ToastType
    isVisible: boolean
}

export function useToast() {
    const [toast, setToast] = useState<ToastState>({
        message: '',
        type: 'info',
        isVisible: false,
    })

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true })
    }, [])

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, isVisible: false }))
    }, [])

    const ToastComponent = useCallback(() => (
        <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={hideToast}
        />
    ), [toast, hideToast])

    return {
        showToast,
        hideToast,
        ToastComponent,
    }
}


'use client'
import React from 'react'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4">
            <div className="max-w-md w-full">
                <RegisterForm />
            </div>
        </div>
    )
}

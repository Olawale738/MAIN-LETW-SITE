'use client'
import React from 'react'
import RegisterForm from '@/components/auth/RegisterForm'
import AuthLayout from '@/components/auth/AuthLayout'

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Join The Community"
            subtitle="Create your account to get started."
        >
            <React.Suspense fallback={<div className="flex justify-center p-4">Loading...</div>}>
                <RegisterForm />
            </React.Suspense>
        </AuthLayout>
    )
}

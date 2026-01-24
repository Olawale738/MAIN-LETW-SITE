'use client'
import React from 'react'
import LoginForm from '@/components/auth/LoginForm'
import AuthLayout from '@/components/auth/AuthLayout'

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Please sign in to your account."
        >
            <React.Suspense fallback={<div className="flex justify-center p-4">Loading...</div>}>
                <LoginForm />
            </React.Suspense>
        </AuthLayout>
    )
}

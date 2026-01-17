'use client'
import React from 'react'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4">
            <div className="max-w-md w-full">
                <LoginForm />
            </div>
        </div>
    )
}

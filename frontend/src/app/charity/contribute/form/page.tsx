'use client'
import React, { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function ContributionForm() {
    const searchParams = useSearchParams()
    const type = searchParams.get('type') || 'one-time'

    const [amount, setAmount] = useState('')
    const [customAmount, setCustomAmount] = useState('')

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-2 text-center text-neutral-900 dark:text-white">
                    {type === 'monthly' ? 'Monthly Partnership' : 'One-time Contribution'}
                </h1>
                <p className="text-center text-neutral-500 mb-8">Thank you for your generosity.</p>

                <form className="space-y-6">
                    {/* Amount Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Select Amount</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['1000', '5000', '10000'].map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => { setAmount(val); setCustomAmount('') }}
                                    className={`py-2 px-4 rounded-lg border ${amount === val ? 'bg-blue-600 text-white border-blue-600' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                                >
                                    ₦{val}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-500">₦</span>
                            <input
                                type="number"
                                placeholder="Other Amount"
                                value={customAmount}
                                onChange={(e) => { setCustomAmount(e.target.value); setAmount('custom') }}
                                className="w-full pl-8 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Purpose (Optional)</label>
                        <select className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent">
                            <option>General Charity Fund</option>
                            <option>Food Drive</option>
                            <option>Emergency Relief</option>
                            <option>Widows & Orphans</option>
                        </select>
                    </div>

                    {/* Details */}
                    <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Full Name</label>
                            <input type="text" className="w-full mt-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent" placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Address</label>
                            <input type="email" className="w-full mt-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent" placeholder="john@example.com" />
                        </div>
                    </div>

                    <Button className="w-full py-6 text-lg mt-4 bg-green-600 hover:bg-green-700">
                        Proceed to Payment
                    </Button>

                    <p className="text-xs text-center text-neutral-400 mt-4">
                        Secure payment processing via Paystack/Flutterwave
                    </p>
                </form>
            </div>
        </div>
    )
}

export default function ContributionFormPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-20 px-4">
            <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="animate-spin" /></div>}>
                <ContributionForm />
            </Suspense>
        </div>
    )
}

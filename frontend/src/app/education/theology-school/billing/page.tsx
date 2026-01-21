'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { CheckCircle, CreditCard, Building2, Smartphone } from 'lucide-react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'

function BillingContent() {
    const searchParams = useSearchParams()
    const level = searchParams.get('level') || '1'
    const [selectedMethod, setSelectedMethod] = useState<string>('')

    const levelPricing = {
        '1': { name: 'Certificate in Theology', price: 20000, duration: '6 months' },
        '2': { name: 'Diploma in Theology & Ministry', price: 25000, duration: '12 months' },
        '3': { name: 'Advanced Ministerial Training', price: 30000, duration: '18 months' }
    }

    const currentLevel = levelPricing[level as keyof typeof levelPricing]

    const paymentMethods = [
        {
            id: 'bank',
            name: 'Bank Transfer',
            icon: Building2,
            details: [
                'Bank: Access Bank',
                'Account Name: Light Encounter Tabernacle',
                'Account Number: 0123456789'
            ]
        },
        {
            id: 'card',
            name: 'Debit/Credit Card',
            icon: CreditCard,
            details: ['Secure payment via Paystack', 'Instant confirmation']
        },
        {
            id: 'mobile',
            name: 'Mobile Money',
            icon: Smartphone,
            details: ['USSD Transfer', 'Mobile Banking Apps']
        }
    ]

    return (
        <div className="min-h-screen bg-neutral-50">
            <Hero
                title="Course Payment"
                subtitle="Invest in your theological education"
                height="small"
            />

            <SectionWrapper>
                <div className="max-w-5xl mx-auto">
                    {/* Selected Course Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-[#140152] to-[#1d0175] text-white p-8 rounded-3xl mb-12 shadow-2xl"
                    >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <span className="text-[#f5bb00] font-bold uppercase text-sm tracking-wider mb-2 block">
                                    Level {level}
                                </span>
                                <h2 className="text-3xl md:text-4xl font-black mb-2">{currentLevel.name}</h2>
                                <p className="text-white/70">Duration: {currentLevel.duration}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[#f5bb00] text-sm font-semibold mb-1">Total Amount</div>
                                <div className="text-5xl font-black">₦{currentLevel.price.toLocaleString()}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Payment Methods */}
                    <div className="mb-12">
                        <h3 className="text-2xl font-bold text-[#140152] mb-6 text-center">
                            Select Payment Method
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {paymentMethods.map((method) => (
                                <motion.div
                                    key={method.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Card
                                        className={`cursor-pointer transition-all border-2 ${selectedMethod === method.id
                                                ? 'border-[#f5bb00] shadow-xl bg-[#f5bb00]/5'
                                                : 'border-gray-200 hover:border-[#140152]/30'
                                            }`}
                                        onClick={() => setSelectedMethod(method.id)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod === method.id
                                                            ? 'bg-[#f5bb00] text-[#140152]'
                                                            : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    <method.icon className="w-6 h-6" />
                                                </div>
                                                <CardTitle className="text-[#140152]">{method.name}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {method.details.map((detail, idx) => (
                                                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                        {detail}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Instructions */}
                    {selectedMethod && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 mb-8"
                        >
                            <h4 className="text-xl font-bold text-[#140152] mb-6">Payment Instructions</h4>

                            {selectedMethod === 'bank' && (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <p className="font-semibold text-[#140152] mb-4">Bank Transfer Details:</p>
                                        <div className="space-y-2 text-gray-700">
                                            <p><strong>Bank:</strong> Access Bank</p>
                                            <p><strong>Account Name:</strong> Light Encounter Tabernacle</p>
                                            <p><strong>Account Number:</strong> 0123456789</p>
                                            <p><strong>Amount:</strong> ₦{currentLevel.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        After making the transfer, please send proof of payment to{' '}
                                        <a href="mailto:payments@lightencounter.org" className="text-[#f5bb00] font-semibold">
                                            payments@lightencounter.org
                                        </a>
                                    </p>
                                </div>
                            )}

                            {selectedMethod === 'card' && (
                                <div className="text-center py-8">
                                    <PremiumButton className="px-12 py-6 text-lg">
                                        Proceed to Secure Payment
                                    </PremiumButton>
                                    <p className="text-sm text-gray-500 mt-4">You will be redirected to Paystack</p>
                                </div>
                            )}

                            {selectedMethod === 'mobile' && (
                                <div className="space-y-4">
                                    <p className="text-gray-700">
                                        Use your mobile banking app or USSD code to transfer ₦{currentLevel.price.toLocaleString()} to:
                                    </p>
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <p><strong>Account Number:</strong> 0123456789</p>
                                        <p><strong>Bank:</strong> Access Bank</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Help Section */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                        <p className="text-gray-700 mb-4">
                            <strong>Need Help?</strong> Contact our admissions team
                        </p>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <a
                                href="mailto:admissions@lightencounter.org"
                                className="text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors"
                            >
                                admissions@lightencounter.org
                            </a>
                            <span className="text-gray-400">|</span>
                            <a
                                href="tel:+2341234567890"
                                className="text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors"
                            >
                                +234 123 456 7890
                            </a>
                        </div>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    )
}

export default function TheologyBillingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
            <BillingContent />
        </Suspense>
    )
}

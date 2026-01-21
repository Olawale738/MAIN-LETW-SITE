'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Building, Smartphone, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Billing() {
    const [copied, setCopied] = useState(false)

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-[#140152] mb-2">Ways to Give</h2>
                <p className="text-gray-600">Choose your preferred method of support</p>
            </div>

            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <Tabs defaultValue="card" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-gray-100 rounded-xl">
                            <TabsTrigger value="card" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <CreditCard className="w-4 h-4 mr-2" /> Card
                            </TabsTrigger>
                            <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Building className="w-4 h-4 mr-2" /> Bank
                            </TabsTrigger>
                            <TabsTrigger value="paypal" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Smartphone className="w-4 h-4 mr-2" /> PayPal
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="card" className="space-y-4">
                            <div className="bg-gray-50 p-8 rounded-2xl text-center border-2 border-dashed border-gray-200">
                                <CreditCard className="w-12 h-12 text-[#140152] mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-[#140152] mb-2">Secure Online Giving</h3>
                                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                    Support the ministry securely using your debit or credit card through our payment processor.
                                </p>
                                <Button className="bg-[#140152] hover:bg-[#2a0a6e] text-white font-bold py-6 px-8 rounded-xl text-lg w-full sm:w-auto">
                                    Give Online Now
                                </Button>
                                <div className="mt-4 flex justify-center gap-4 opacity-50 grayscale">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-4" />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="bank" className="space-y-4">
                            <div className="bg-[#140152] text-white p-8 rounded-2xl">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Bank Transfer</h3>
                                        <p className="text-white/60 text-sm">Direct deposit details</p>
                                    </div>
                                    <Building className="w-8 h-8 text-[#f5bb00]" />
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-widest text-[#f5bb00] font-bold">Bank Name</p>
                                        <p className="text-lg font-medium">First Bank</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-widest text-[#f5bb00] font-bold">Account Name</p>
                                        <p className="text-lg font-medium">Light Encounter Tabernacle</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-widest text-[#f5bb00] font-bold">Account Number</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-2xl font-mono font-bold tracking-wider">2039485762</p>
                                            <button
                                                onClick={() => handleCopy('2039485762')}
                                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                                title="Copy Account Number"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="paypal" className="space-y-4">
                            <div className="bg-[#003087] text-white p-8 rounded-2xl text-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <Smartphone className="w-12 h-12 text-white mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2">Give via PayPal</h3>
                                    <p className="text-blue-100 mb-6">
                                        Fast, safe, and secure international giving.
                                    </p>
                                    <Button className="bg-[#f5bb00] hover:bg-white text-[#003087] font-bold py-6 px-8 rounded-full text-lg w-full sm:w-auto">
                                        Donate with PayPal
                                    </Button>
                                </div>
                                {/* Decoration */}
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#009cde] rounded-full blur-[60px] opacity-50" />
                                <div className="absolute -left-10 -top-10 w-40 h-40 bg-[#009cde] rounded-full blur-[60px] opacity-50" />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

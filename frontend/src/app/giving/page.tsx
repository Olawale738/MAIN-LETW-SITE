'use client'

import { useState } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Heart, Building, Users, BookOpen, CreditCard, Landmark, Bitcoin, CheckCircle2, ChevronRight, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function GivingPage() {
  const [activeMethod, setActiveMethod] = useState<'card' | 'bank' | 'crypto'>('card')
  const [amount, setAmount] = useState('100')
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const paymentMethods = [
    { id: 'card', name: 'Card Payment', icon: CreditCard },
    { id: 'bank', name: 'Bank Transfer', icon: Landmark },
    { id: 'crypto', name: 'Crypto', icon: Bitcoin },
  ]

  return (
    <>
      <Hero
        title="Give Online"
        subtitle="Supporting God's Work Through Your Generosity"
        height="medium"
      />

      <SectionWrapper>
        <div className="max-w-6xl mx-auto">
          {/* Intro Section */}
          <div className="text-center mb-16 space-y-4">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Sacrifice & Honor</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Support the Vision</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
            <p className="text-xl text-[#140152]/70 leading-relaxed max-w-3xl mx-auto pt-4 font-medium">
              Your generous giving helps us continue spreading the Gospel, supporting our community outreach programs, and maintaining our ministry operations.
            </p>
          </div>

          {/* Giving Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            <Card className="p-2 group text-center border-none shadow-xl shadow-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                  <Heart className="w-8 h-8" />
                </div>
                <CardTitle className="text-[#140152] text-xl font-black">Tithes & Offerings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 font-medium text-sm mb-6">
                  Support the general ministry operations and outreach programs.
                </p>
                <Button
                  onClick={() => document.getElementById('payment-portal')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  className="w-full border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                >
                  Give Now
                </Button>
              </CardContent>
            </Card>

            <Card className="p-2 group text-center border-none shadow-xl shadow-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                  <Building className="w-8 h-8" />
                </div>
                <CardTitle className="text-[#140152] text-xl font-black">Building Fund</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 font-medium text-sm mb-6">
                  Contribute to our building expansion project for growth.
                </p>
                <Button
                  onClick={() => document.getElementById('payment-portal')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  className="w-full border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                >
                  Contribute
                </Button>
              </CardContent>
            </Card>

            <Card className="p-2 group text-center border-none shadow-xl shadow-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                  <Users className="w-8 h-8" />
                </div>
                <CardTitle className="text-[#140152] text-xl font-black">Missions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 font-medium text-sm mb-6">
                  Support our local and international mission efforts globally.
                </p>
                <Button
                  onClick={() => document.getElementById('payment-portal')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  className="w-full border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                >
                  Support Missions
                </Button>
              </CardContent>
            </Card>

            <Card className="p-2 group text-center border-none shadow-xl shadow-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                  <BookOpen className="w-8 h-8" />
                </div>
                <CardTitle className="text-[#140152] text-xl font-black">Education Fund</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 font-medium text-sm mb-6">
                  Help provide quality Christian education through our schools.
                </p>
                <Button
                  onClick={() => document.getElementById('payment-portal')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  className="w-full border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                >
                  Support Education
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Portal */}
          <div id="payment-portal" className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
            <div className="grid md:grid-cols-12 min-h-[600px]">
              {/* Sidebar / Tabs */}
              <div className="md:col-span-4 bg-[#140152] p-8 text-white flex flex-col">
                <h3 className="text-2xl font-bold mb-8">Choose Payment Method</h3>
                <div className="space-y-4 flex-grow">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setActiveMethod(method.id as any)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 text-left",
                        activeMethod === method.id
                          ? "bg-[#f5bb00] text-[#140152] shadow-lg translate-x-2"
                          : "bg-white/5 hover:bg-white/10 text-white"
                      )}
                    >
                      <method.icon className="w-6 h-6" />
                      <span className="font-bold">{method.name}</span>
                      {activeMethod === method.id && <ChevronRight className="ml-auto w-5 h-5" />}
                    </button>
                  ))}
                </div>

                <div className="bg-white/5 p-6 rounded-xl mt-8">
                  <p className="text-sm text-gray-300 italic">
                    "God loves a cheerful giver."
                    <br />
                    <span className="text-[#f5bb00] font-bold not-italic mt-2 block">- 2 Corinthians 9:7</span>
                  </p>
                </div>
              </div>

              {/* Content Area */}
              <div className="md:col-span-8 p-8 md:p-12 bg-gray-50/50">
                <AnimatePresence mode="wait">
                  {activeMethod === 'card' && (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 max-w-lg mx-auto"
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-black text-[#140152]">Secure Card Donation</h3>
                        <p className="text-gray-500">Encrypted and secure payment processing.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {['50', '100', '200', '500'].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => setAmount(amt)}
                              className={cn(
                                "py-3 rounded-xl border-2 font-bold transition-all",
                                amount === amt ? "border-[#140152] bg-[#140152] text-white" : "border-gray-200 text-gray-500 hover:border-[#140152]"
                              )}
                            >
                              ${amt}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-[#140152]">Custom Amount</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#140152] focus:ring-1 focus:ring-[#140152] outline-none font-bold text-lg"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-[#140152]">Card Information</label>
                          <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#140152] outline-none" />
                          <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#140152] outline-none" />
                            <input type="text" placeholder="CVC" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#140152] outline-none" />
                          </div>
                        </div>

                        <PremiumButton className="w-full py-4 text-lg shadow-xl shadow-blue-900/20">
                          Give ${amount} Now
                        </PremiumButton>

                        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Secure SSL Encrypted Transaction
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeMethod === 'bank' && (
                    <motion.div
                      key="bank"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8 max-w-lg mx-auto"
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-black text-[#140152]">Bank Transfer</h3>
                        <p className="text-gray-500">Direct transfer details for local and international donations.</p>
                      </div>

                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h4 className="font-bold text-[#f5bb00] uppercase text-xs tracking-widest mb-4">Naira Account</h4>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                          <span className="text-gray-500 text-sm">Bank Name</span>
                          <span className="font-bold text-[#140152]">GTBank</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                          <span className="text-gray-500 text-sm">Account Name</span>
                          <span className="font-bold text-[#140152]">Light Encounter Tabernacle</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-gray-500 text-sm">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xl text-[#140152]">0123456789</span>
                            <button onClick={() => handleCopy('0123456789')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#140152]">
                              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#140152] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5bb00]/10 rounded-full -translate-y-16 translate-x-16" />
                        <h4 className="font-bold text-[#f5bb00] uppercase text-xs tracking-widest mb-4 relative z-10">USD / Domiciliary</h4>
                        <div className="flex justify-between border-b border-white/10 pb-3 relative z-10">
                          <span className="text-gray-300 text-sm">Bank Name</span>
                          <span className="font-bold">Zenith Bank</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 relative z-10">
                          <span className="text-gray-300 text-sm">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xl">5040302010</span>
                            <button onClick={() => handleCopy('5040302010')} className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeMethod === 'crypto' && (
                    <motion.div
                      key="crypto"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8 max-w-lg mx-auto text-center"
                    >
                      <div className="mb-8">
                        <div className="w-16 h-16 bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#f5bb00]">
                          <Bitcoin className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-[#140152]">Crypto Offering</h3>
                        <p className="text-gray-500">Give using Bitcoin, Ethereum, or USDT.</p>
                      </div>

                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 text-left">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold uppercase text-gray-400">Bitcoin (BTC)</span>
                          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                            <code className="text-xs text-[#140152] font-mono break-all line-clamp-1">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                            <button onClick={() => handleCopy('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')} className="flex-shrink-0 ml-auto p-2 hover:bg-white rounded-lg">
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold uppercase text-gray-400">USDT (TRC20)</span>
                          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                            <code className="text-xs text-[#140152] font-mono break-all line-clamp-1">T9yD14Nj9j7xAB4dbGeiX9h8bAyWC3RZkz</code>
                            <button onClick={() => handleCopy('T9yD14Nj9j7xAB4dbGeiX9h8bAyWC3RZkz')} className="flex-shrink-0 ml-auto p-2 hover:bg-white rounded-lg">
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mt-4">
                        Please ensure you select the correct network. Transactions are non-reversible.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
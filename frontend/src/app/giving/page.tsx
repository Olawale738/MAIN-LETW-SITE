'use client'

import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Building, Users, BookOpen, CreditCard, Landmark, Bitcoin, CheckCircle2, ChevronRight, Copy, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PaystackButton = dynamic(
  () => import('react-paystack').then((mod) => mod.PaystackButton),
  { ssr: false }
)

export default function GivingPage() {
  const [activeMethod, setActiveMethod] = useState<'card' | 'bank' | 'crypto'>('card')
  const [amount, setAmount] = useState('5000')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [fund, setFund] = useState('tithe')

  // Debug key presence (masked)
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PAYSTACK_KEY;
    console.log('Paystack Key Loaded:', key ? `${key.substring(0, 8)}...` : 'MISSING');
  }, []);

  // Use the environment variable, fallback to empty string (component should handle error or we check before render)
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY || ''

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  const paymentMethods = [
    { id: 'card', name: 'Card', icon: CreditCard },
    { id: 'bank', name: 'Transfer', icon: Landmark },
    { id: 'crypto', name: 'Crypto', icon: Bitcoin },
  ]

  const funds = [
    { id: 'tithe', name: 'Tithes & Offerings', icon: Heart },
    { id: 'building', name: 'Building Fund', icon: Building },
    { id: 'missions', name: 'Missions', icon: Users },
    { id: 'education', name: 'Education', icon: BookOpen },
  ]

  // Basic validation check
  const isValidAmount = amount && !isNaN(parseInt(amount)) && parseInt(amount) > 0;
  const isValidEmail = email && email.includes('@');
  const isValid = isValidAmount && isValidEmail;

  const getFundName = (id: string) => funds.find(f => f.id === id)?.name || 'Donation';

  const componentProps = {
    email,
    amount: isValidAmount ? parseInt(amount) * 100 : 0, // Paystack expects amount in kobos/cents
    currency: 'NGN',
    metadata: {
      name: 'Light Encounter Tabernacle',
      custom_fields: [
        { display_name: "Fund", variable_name: "fund", value: getFundName(fund) }
      ]
    },
    publicKey,
    text: `Give ₦${parseInt(amount || '0').toLocaleString()}`,
    onSuccess: () => toast.success('Payment successful! Thank you for your generosity.'),
    onClose: () => toast.info("Payment cancelled. You can try again anytime."),
  }

  return (
    <div className="min-h-screen relative bg-[#140152] overflow-hidden flex flex-col justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f5bb00]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8 md:pt-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Inspiring Text */}
          <div className="text-white space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#f5bb00] animate-pulse" />
              <span className="text-[#f5bb00] font-bold text-xs uppercase tracking-widest">Secure Giving</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              Sow Into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5bb00] to-yellow-200">
                Good Ground
              </span>
            </h1>

            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap."
              <span className="block mt-2 text-[#f5bb00] font-bold">— Luke 6:38</span>
            </p>

            <div className="hidden lg:flex gap-8 pt-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-[#140152] bg-white/10 backdrop-blur flex items-center justify-center text-xs font-bold">
                    Letw
                  </div>
                ))}
              </div>
              <div>
                <p className="font-bold text-lg">Join 500+ Givers</p>
                <p className="text-sm text-gray-400">Supporting the vision weekly</p>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Giving Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <div className="flex bg-[#140152]/5 p-1.5 m-2 rounded-xl">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setActiveMethod(method.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all",
                      activeMethod === method.id
                        ? "bg-white text-[#140152] shadow-sm"
                        : "text-gray-500 hover:text-[#140152]"
                    )}
                  >
                    <method.icon className="w-4 h-4" />
                    {method.name}
                  </button>
                ))}
              </div>

              <CardContent className="p-6 md:p-8 space-y-6">

                <AnimatePresence mode="wait">
                  {activeMethod === 'card' && (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Fund Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-[#140152] uppercase tracking-wider ml-1">Select Fund</label>
                        <Select onValueChange={setFund} defaultValue={fund}>
                          <SelectTrigger className="w-full h-14 rounded-xl border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-colors focus:ring-1 focus:ring-[#140152] focus:border-[#140152]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#f5bb00]/10 flex items-center justify-center text-[#f5bb00]">
                                {funds.map(f => f.id === fund && <f.icon key={f.id} className="w-4 h-4" />)}
                              </div>
                              <SelectValue placeholder="Select Fund" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {funds.map(f => (
                              <SelectItem key={f.id} value={f.id} className="font-medium">
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Amount Presets */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-[#140152] uppercase tracking-wider ml-1">Or Choose Amount</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['1000', '5000', '10000', '50000'].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => setAmount(amt)}
                              className={cn(
                                "py-2.5 rounded-xl border font-bold text-xs transition-all",
                                amount === amt
                                  ? "border-[#140152] bg-[#140152] text-white shadow-lg shadow-[#140152]/30"
                                  : "border-gray-200 text-gray-500 hover:border-[#140152] bg-white"
                              )}
                            >
                              ₦{parseInt(amt).toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Amount */}
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#140152] font-black text-lg">₦</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Custom Amount"
                            className="w-full h-14 pl-10 pr-4 rounded-xl border-gray-200 bg-gray-50/50 hover:bg-gray-100 focus:bg-white transition-all focus:ring-2 focus:ring-[#140152] focus:border-transparent outline-none font-bold text-xl text-[#140152]"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full h-14 px-4 rounded-xl border-gray-200 bg-gray-50/50 hover:bg-gray-100 focus:bg-white transition-all focus:ring-2 focus:ring-[#140152] focus:border-transparent outline-none font-medium text-[#140152]"
                        />
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {!isValid ? (
                          <Button
                            disabled
                            className="w-full h-14 text-base shadow-none bg-gray-100 text-gray-400 font-bold rounded-xl"
                          >
                            {!isValidAmount ? 'Enter Valid Amount' : 'Enter Email to Give'}
                          </Button>
                        ) : (
                          <PaystackButton
                            className="w-full h-14 text-base shadow-xl shadow-[#f5bb00]/20 bg-[#f5bb00] text-[#140152] font-bold rounded-xl hover:bg-[#ffc820] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            {...componentProps}
                            amount={parseInt(amount) * 100}
                          />
                        )}
                        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          Secure SSL Encrypted
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeMethod === 'bank' && (
                    <motion.div
                      key="bank"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                        <h4 className="font-extrabold text-[#f5bb00] text-xs uppercase tracking-widest">Naira Account</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Bank</span>
                            <span className="font-bold text-[#140152]">GTBank</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Account</span>
                            <span className="font-bold text-[#140152]">Light Encounter Tabernacle</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between items-center">
                            <span className="font-mono font-bold text-lg text-[#140152] tracking-widest">0123456789</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopy('0123456789')}>
                              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#140152] p-6 rounded-2xl border border-white/10 space-y-4 relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5bb00]/10 rounded-full -translate-y-16 translate-x-16" />
                        <h4 className="font-extrabold text-[#f5bb00] text-xs uppercase tracking-widest relative z-10">Domiciliary (USD)</h4>
                        <div className="space-y-3 relative z-10">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">Bank</span>
                            <span className="font-bold">Zenith Bank</span>
                          </div>
                          <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex justify-between items-center">
                            <span className="font-mono font-bold text-lg tracking-widest">5040302010</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 text-white" onClick={() => handleCopy('5040302010')}>
                              <Copy className="w-4 h-4" />
                            </Button>
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
                      className="space-y-6 pt-4 text-center"
                    >
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-[#f5bb00]/10 flex items-center justify-center text-[#f5bb00] mb-4">
                        <Bitcoin className="w-8 h-8" />
                      </div>

                      <div className="space-y-4">
                        {[
                          { label: 'Bitcoin (BTC)', addr: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
                          { label: 'USDT (TRC20)', addr: 'T9yD14Nj9j7xAB4dbGeiX9h8bAyWC3RZkz' }
                        ].map((crypto, i) => (
                          <div key={i} className="text-left space-y-2">
                            <span className="text-xs font-bold uppercase text-gray-400 ml-1">{crypto.label}</span>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <code className="text-xs text-[#140152] font-mono flex-1 break-all">{crypto.addr}</code>
                              <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => handleCopy(crypto.addr)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400">Transactions are inevitable and non-reversible.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
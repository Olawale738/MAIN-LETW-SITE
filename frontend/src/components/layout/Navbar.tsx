'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import PremiumButton from '@/components/ui/PremiumButton'
import { Menu, X, ChevronDown, GraduationCap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Events', href: '/events' },
  { name: 'Sermons', href: '/sermons' },
  { name: 'Impact', href: '/impact' },
  { name: 'Give', href: '/giving' },
]

const educationLinks = [
  { name: 'Overview', href: '/education' },
  { name: 'Primary School', href: '/education/primary-school' },
  { name: 'Secondary School', href: '/education/secondary-school' },
  { name: 'University', href: '/education/university' },
  { name: 'Theology School', href: '/education/theology-school' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isEducationHovered, setIsEducationHovered] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)

    // Check login status
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Hide Navbar on Admin pages
  if (pathname?.startsWith('/admin')) return null

  // Animation Variants
  const menuVariants = {
    closed: {
      opacity: 0,
      y: "-100%",
      transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] as const }
    },
    open: {
      opacity: 1,
      y: "0%",
      transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] as const }
    }
  }

  const linkVariants = {
    closed: { y: 20, opacity: 0 },
    open: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: 0.1 + i * 0.1, duration: 0.4, ease: "easeOut" as const }
    })
  }

  const dropdownVariants = {
    closed: { opacity: 0, y: 10, scale: 0.95, display: "none" },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      display: "block",
      transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-300 pointer-events-none px-4",
          scrolled ? "pt-2" : "pt-6"
        )}
      >
        <motion.div
          layout
          className={cn(
            "w-full max-w-6xl rounded-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg pointer-events-auto px-6 py-3 flex items-center justify-between transition-all duration-300",
            scrolled ? "max-w-full rounded-none md:rounded-full md:max-w-6xl shadow-xl py-2" : ""
          )}
        >
          {/* LOGO */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group z-50 relative">
            <motion.div whileHover={{ rotate: 10 }} className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center">
              <img src="/NewLETWlogo.png" alt="LETWlogo" className="w-full h-full object-cover" />
            </motion.div>
            <span className="font-black text-sm md:text-xs tracking-tight text-[#140152] leading-tight">
              LETW
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 hover:text-[#140152]",
                  pathname === link.href ? "text-[#140152] bg-[#140152]/5" : "text-gray-600 hover:bg-gray-100/50"
                )}
              >
                {link.name}
                {pathname === link.href && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#f5bb00]/10 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}

            {/* CUSTOM DROPDOWN */}
            <div
              className="relative px-2"
              onMouseEnter={() => setIsEducationHovered(true)}
              onMouseLeave={() => setIsEducationHovered(false)}
            >
              <button className={cn(
                "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-colors outline-none",
                isEducationHovered || pathname?.startsWith('/education') ? "text-[#140152] bg-[#140152]/5" : "text-gray-600 hover:bg-gray-100/50"
              )}>
                Education <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isEducationHovered && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isEducationHovered && (
                  <motion.div
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={dropdownVariants}
                    className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden p-2"
                    style={{ transformOrigin: "top right" }}
                  >
                    {educationLinks.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-[#140152] hover:bg-gray-50 rounded-xl transition-colors group"
                      >
                        <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-[#f5bb00] transition-colors" />
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* ACTIONS & MOBILE TOGGLE */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              {isLoggedIn ? (
                <PremiumButton href="/dashboard" className="text-sm">
                  My Dashboard
                </PremiumButton>
              ) : (
                <PremiumButton href="/join" className="text-sm">Join Us</PremiumButton>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden relative z-50 p-1 text-[#140152] hover:opacity-80 transition-opacity"
              aria-label="Toggle Menu"
            >
              {isOpen ? (
                <X className="w-8 h-8" strokeWidth={2.5} />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M4 12H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M4 17H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* MOBILE MENU FULLSCREEN OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed top-0 left-0 w-full h-[100dvh] z-40 bg-white/95 backdrop-blur-3xl lg:hidden flex flex-col pt-32 px-6 pb-8 overflow-y-auto overscroll-contain no-scrollbar"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div key={link.name} custom={i} variants={linkVariants}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block text-3xl font-bold tracking-tight py-2 border-b border-gray-100",
                      pathname === link.href ? "text-[#140152]" : "text-gray-400"
                    )}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Dropdown Section */}
              <motion.div custom={navLinks.length} variants={linkVariants} className="pt-4">
                <p className="text-sm font-bold text-[#f5bb00] uppercase tracking-widest mb-4">Education</p>
                <div className="grid grid-cols-1 gap-3 pl-4 border-l-2 border-gray-100">
                  {educationLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium text-gray-600 hover:text-[#140152]"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </motion.div>

              <motion.div custom={navLinks.length + 1} variants={linkVariants} className="mt-auto">
                {isLoggedIn ? (
                  <PremiumButton href="/dashboard" className="text-center justify-center text-lg mb-4">
                    My Dashboard
                  </PremiumButton>
                ) : (
                  <>
                    <PremiumButton href="/join" className="text-center justify-center text-lg">
                      Join The Family
                    </PremiumButton>
                    <div className="mt-4 text-center">
                      <p className="text-gray-500 text-sm">
                        Already a member? <Link href="/auth/login" className="text-[#140152] hover:underline font-semibold">Click here to login</Link>
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
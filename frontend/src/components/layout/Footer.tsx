'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Footer() {
  const pathname = usePathname()

  // Hide Footer on Admin pages
  if (pathname?.startsWith('/admin')) return null

  return (
    <footer className="bg-[#140152] text-white pt-24 pb-12 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#f5bb00]/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#f5bb00]/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-18 h-18 flex items-center justify-center">
                <img src="/NewLETWlogo.png" alt="LETWlogo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-[12px] tracking-tight text-[#fff] block leading-tight">
                Light<span><br />Encounter</span> <br /> Tabernacle <span> Worldwide</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              A bible believing church where the word of God is taught with simplicity and clarity. Join us to experience the divine presence.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://facebook.com/LightEncounterTabernacle"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f5bb00] hover:text-[#140152] transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://twitter.com/LightEncounterTabernacle"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f5bb00] hover:text-[#140152] transition-all duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="https://instagram.com/LightEncounterTabernacle"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f5bb00] hover:text-[#140152] transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.youtube.com/@LightEncounterTabernacle"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f5bb00] hover:text-[#140152] transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-[#f5bb00]" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { name: 'About Us', href: '/about' },
                { name: 'Sermons', href: '/sermons' },
                { name: 'Events', href: '/events' },
                { name: 'Give', href: '/giving' },
                { name: 'Contact', href: '/contact' }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#f5bb00] hover:translate-x-1 transition-all duration-300 flex items-center gap-2 text-sm">
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Education */}
          <div>
            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-[#f5bb00]" />
              Education
            </h4>
            <ul className="space-y-3">
              {[
                { name: 'Primary School', href: '/education/primary-school' },
                { name: 'Secondary School', href: '/education/secondary-school' },
                { name: 'University', href: '/education/university' },
                { name: 'Theology School', href: '/education/theology-school' }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#f5bb00] hover:translate-x-1 transition-all duration-300 flex items-center gap-2 text-sm">
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-[#f5bb00]" />
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="w-5 h-5 text-[#f5bb00] shrink-0 mt-0.5" />
                <span>123 Faith Avenue, Grace City, Divine State, 10101</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone className="w-5 h-5 text-[#f5bb00] shrink-0" />
                <span>+1 (234) 567-8901</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="w-5 h-5 text-[#f5bb00] shrink-0" />
                <span>contact@lightencounter.org</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Light Encounter Tabernacle. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-[#f5bb00] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#f5bb00] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
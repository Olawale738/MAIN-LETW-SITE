'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, ExternalLink, BookOpen, Radio } from 'lucide-react'

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <footer className="bg-[#0d0138] text-white overflow-hidden relative">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#f5bb00]/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#f5bb00]/6 rounded-full blur-[100px]" />
      </div>

      {/* CTA Strip */}
      <div className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-white">Stay connected with LETW</h3>
            <p className="text-gray-400 text-sm mt-1">Join thousands of believers walking in faith.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Join Our Family */}
            <Link
              href="/join"
              className="inline-flex items-center justify-center gap-2 bg-[#f5bb00] text-[#140152] font-black px-6 py-3 rounded-full text-sm hover:bg-yellow-300 transition-all hover:scale-105 shadow-lg shadow-[#f5bb00]/20 whitespace-nowrap"
            >
              Join Our Family
            </Link>
            {/* Devotion App */}
            <a
              href="https://devotion.letw.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/10 transition-all whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-[#f5bb00]" /> Devotion App
            </a>
            {/* Radio — Listen Live */}
            <a
              href="https://radio.letw.org/listen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/10 transition-all whitespace-nowrap"
            >
              <Radio className="w-4 h-4 text-[#f5bb00]" />
              Listen Live
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
            {/* Radio — Stream */}
            <a
              href="https://radio.letw.org/stream"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/10 transition-all whitespace-nowrap"
            >
              <Radio className="w-4 h-4 text-[#f5bb00]" />
              Stream
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/NewLETWlogo1.jpg" alt="LETW logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <span className="font-black text-sm tracking-tight text-white leading-tight">
                Light<br />Encounter<br />Tabernacle<br />Worldwide
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              A bible believing church where the word of God is taught with simplicity and clarity. Experience the divine presence.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {[
                { href: 'https://facebook.com/LightEncounterTabernacle', Icon: Facebook, label: 'Facebook' },
                { href: 'https://twitter.com/LightEncounterTabernacle', Icon: Twitter, label: 'Twitter' },
                { href: 'https://instagram.com/LightEncounterTabernacle', Icon: Instagram, label: 'Instagram' },
                { href: 'https://www.youtube.com/@LightEncounterTabernacle', Icon: Youtube, label: 'YouTube' },
              ].map(({ href, Icon, label }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center hover:bg-[#f5bb00] hover:border-[#f5bb00] hover:text-[#140152] transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Connect — links NOT already in the navbar */}
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-6 text-[#f5bb00]">Connect</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Pastor's Blog", href: '/blog' },
                { name: 'Church Apps', href: '/apps' },
                { name: 'Give', href: '/giving' },
                { name: 'Volunteer', href: '/volunteer' },
                { name: 'New here? Start here', href: '/onboarding' },
                { name: 'Free Resources & Downloads', href: '/download' },
                { name: 'Small Groups', href: '/groups' },
                { name: 'Member Directory', href: '/family' },
                { name: 'Grow — Verses & Habits', href: '/grow' },
                { name: 'Virtual Church Tour', href: '/tour' },
                { name: 'Voice & Smart Speakers', href: '/voice' },
                { name: 'Sermon Podcast (RSS)', href: '/sermons/podcast.xml' },
                { name: 'Lent · 40 Days', href: '/lent' },
                { name: 'Contact', href: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 text-sm group">
                    <span className="w-1 h-1 rounded-full bg-[#f5bb00]/40 group-hover:bg-[#f5bb00] transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ministries */}
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-6 text-[#f5bb00]">Ministries</h4>
            <ul className="space-y-2.5">
              {[
                { name: 'Alter Sound', href: '/services/alter-sound' },
                { name: 'Counselling', href: '/services/counselling' },
                { name: 'Bible Study', href: '/bible-study' },
                { name: 'Prayer', href: '/prayer' },
                { name: 'Weddings · Baptism · Dedication', href: '/life-events' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2 text-sm group">
                    <span className="w-1 h-1 rounded-full bg-[#f5bb00]/40 group-hover:bg-[#f5bb00] transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest mb-6 text-[#f5bb00]">Contact Us</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#f5bb00]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#f5bb00]" />
                </div>
                <span className="leading-relaxed">Abuja, FCT, Nigeria</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#f5bb00]/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#f5bb00]" />
                </div>
                <span>+234 123 456 7890</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#f5bb00]/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#f5bb00]" />
                </div>
                <span>info@letw.org</span>
              </li>
            </ul>

            {/* Service times */}
            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-widest text-[#f5bb00] mb-3">Service Times</p>
              <ul className="space-y-1.5 text-sm text-gray-300">
                <li className="flex justify-between"><span>Sunday</span><span className="font-semibold">9:00 AM</span></li>
                <li className="flex justify-between"><span>Tuesday</span><span className="font-semibold">6:00 PM</span></li>
                <li className="flex justify-between"><span>Friday</span><span className="font-semibold">8:00 PM</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Light Encounter Tabernacle Worldwide. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-[#f5bb00] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#f5bb00] transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-[#f5bb00] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

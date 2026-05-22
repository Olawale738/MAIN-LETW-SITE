'use client'
import React, { useState } from 'react'
import { Bell, LayoutDashboard, Menu, X } from 'lucide-react'
import ServiceAnnouncementsList from '@/components/shared/ServiceAnnouncementsList'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
}

interface ServicePageLayoutProps {
  serviceName: string          // matches the admin "Target Service" value
  brandTitle: string           // e.g. "Prayer Meeting"
  brandColor?: string          // accent colour for active nav item highlight
  extraNav?: NavItem[]         // extra nav items beyond Dashboard & Announcements
  children: React.ReactNode    // the page's main content
}

export default function ServicePageLayout({
  serviceName,
  brandTitle,
  brandColor = '#f5bb00',
  extraNav = [],
  children,
}: ServicePageLayoutProps) {
  const [activeView, setActiveView] = useState<string>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...extraNav,
    { id: 'announcements', label: 'Announcements', icon: Bell },
  ]

  return (
    <div className="flex min-h-screen bg-neutral-50 relative">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-[#140152] text-white z-40 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ paddingTop: '80px' }} /* below DashboardNavbar */
      >
        {/* Brand */}
        <div className="px-5 pb-6 border-b border-white/10">
          <div className="font-black text-sm tracking-widest uppercase leading-tight">
            {brandTitle}
          </div>
          <div className="text-xs text-white/40 mt-0.5">Member Portal</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeView === id
            return (
              <button
                key={id}
                onClick={() => { setActiveView(id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${isActive
                    ? 'text-[#140152]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                style={isActive ? { background: brandColor, color: '#140152' } : {}}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
                {id === 'announcements' && isActive && (
                  <Bell size={12} className="ml-auto opacity-60" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Close button (mobile) */}
        <button
          className="md:hidden absolute top-4 right-3 p-1.5 text-white/60 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </aside>

      {/* ── Mobile hamburger ── */}
      <button
        className="md:hidden fixed top-5 left-4 z-50 p-2 bg-[#140152] text-white rounded-lg shadow"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-56 min-h-screen">
        {activeView === 'announcements' ? (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pt-24 md:pt-10">
            <ServiceAnnouncementsList serviceName={serviceName} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

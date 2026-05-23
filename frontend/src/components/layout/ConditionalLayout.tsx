'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DashboardNavbar from '@/components/layout/DashboardNavbar'
import ChatWidget from '@/components/chat/ChatWidget'

/**
 * Conditionally renders Navbar and Footer based on the current route.
 * Uses DashboardNavbar for internal routes and public Navbar for landing pages.
 */
export default function ConditionalLayout({
    children
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Routes that should show the DashboardNavbar (logged-in user pages)
    const dashboardRoutes = [
        '/dashboard',
        '/onboarding',
        '/career-guidance',
        '/skill-development',
        '/leadership',
        '/bible-reading',
        '/theology-school',
    ]

    // Routes that should NOT show any navbar/footer
    const excludedRoutes = [
        '/admin',
        '/auth',
        '/services/alter-sound/dashboard',
        '/dashboard/alter-sound',
        '/children/dashboard',
        '/youth/dashboard',
    ]

    // Check if current path matches dashboard routes
    const isDashboardRoute = dashboardRoutes.some(route => pathname?.startsWith(route))

    // Check if current path matches excluded routes
    const isExcluded = excludedRoutes.some(route => pathname?.startsWith(route))

    if (isExcluded) {
        // Auth/Admin routes - no navbar/footer, no chat widget
        return <main>{children}</main>
    }

    if (isDashboardRoute) {
        // Dashboard routes - use DashboardNavbar, no footer
        return (
            <>
                <DashboardNavbar />
                <main>{children}</main>
                <ChatWidget />
            </>
        )
    }

    // Landing/public routes - include public navbar and footer
    return (
        <>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <ChatWidget />
        </>
    )
}

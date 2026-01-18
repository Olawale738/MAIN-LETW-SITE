'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DashboardNavbar from '@/components/layout/DashboardNavbar'

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
        '/career-guidance/dashboard',
        '/skill-development/dashboard',
        '/leadership/dashboard',
        '/bible-reading',
        '/prayer',
        '/evangelism',
        '/services/counselling',
        '/services/sound-altar',
    ]

    // Routes that should NOT show any navbar/footer
    const excludedRoutes = [
        '/admin',
        '/auth',
    ]

    // Check if current path matches dashboard routes
    const isDashboardRoute = dashboardRoutes.some(route => pathname?.startsWith(route))

    // Check if current path matches excluded routes
    const isExcluded = excludedRoutes.some(route => pathname?.startsWith(route))

    if (isExcluded) {
        // Auth/Admin routes - no navbar/footer
        return <main>{children}</main>
    }

    if (isDashboardRoute) {
        // Dashboard routes - use DashboardNavbar, no footer
        return (
            <>
                <DashboardNavbar />
                <main>{children}</main>
            </>
        )
    }

    // Landing/public routes - include public navbar and footer
    return (
        <>
            <Navbar />
            <main>{children}</main>
            <Footer />
        </>
    )
}

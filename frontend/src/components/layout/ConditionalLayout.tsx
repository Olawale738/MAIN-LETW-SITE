'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

/**
 * Conditionally renders Navbar and Footer based on the current route.
 * Excludes navbar/footer from dashboard and other app-specific routes.
 */
export default function ConditionalLayout({
    children
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Routes that should NOT show the main navbar and footer
    const excludedRoutes = [
        '/dashboard',
        '/career-guidance/dashboard',
        '/skill-development/dashboard',
        '/leadership/dashboard',
        '/admin',
        '/auth',
    ]

    // Check if current path starts with any excluded route
    const isExcluded = excludedRoutes.some(route => pathname.startsWith(route))

    if (isExcluded) {
        // Dashboard routes - no navbar/footer
        return <main>{children}</main>
    }

    // Landing/public routes - include navbar and footer
    return (
        <>
            <Navbar />
            <main>{children}</main>
            <Footer />
        </>
    )
}

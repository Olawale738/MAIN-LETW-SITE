'use client'

/**
 * Dashboard layout - excludes the main landing page Navbar and Footer.
 * The dashboard has its own header built into the page.
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {/* This empty layout prevents the root layout's Navbar/Footer from showing */}
            {/* The dashboard page has its own header component */}
            {children}
        </>
    )
}

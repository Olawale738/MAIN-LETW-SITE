import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Sermons | Light Encounter Tabernacle',
    description: 'Watch the latest sermons and messages from Light Encounter Tabernacle. Dive deeper into the Word of God.',
}

export default function SermonsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}

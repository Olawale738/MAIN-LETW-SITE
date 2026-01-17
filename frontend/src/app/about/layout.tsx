import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'About Us | Light Encounter Tabernacle',
    description: 'Learn about the Light Encounter Tabernacle, our mission, vision, and the leadership dedicated to community transformation.',
}

export default function AboutMetadata({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}

import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Contact Us | Light Encounter Tabernacle',
    description: 'Get in touch with Light Encounter Tabernacle. We are here to pray with you and answer your questions.',
}

export default function ContactMetadata({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}

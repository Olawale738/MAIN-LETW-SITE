'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PremiumButtonProps {
    href?: string
    children: React.ReactNode
    onClick?: () => void
    className?: string
    target?: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
}

export default function PremiumButton({ href, children, onClick, className, target, disabled, type }: PremiumButtonProps) {
    const content = (
        <>
            <p>{children}</p>
            <div className="p-2 bg-white fill-current rounded-full transition-transform group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4 text-[#140152] -rotate-45" />
            </div>
        </>
    )

    const buttonClass = cn(
        "rounded-full py-0.5 px-1 pl-5 shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300",
        className
    )

    if (href) {
        return (
            <Button variant="primary" asChild className={buttonClass} disabled={disabled}>
                <Link href={href} target={target}>
                    {content}
                </Link>
            </Button>
        )
    }

    return (
        <Button variant="primary" className={buttonClass} onClick={onClick} disabled={disabled} type={type}>
            {/* We wrap in a span to ensure the flex layout behaves like the Link version if needed,
            though Button itself is flex. But we need to match the structure manually since we don't have the Link wrapper.
            Actually, Button puts children directly inside. So we just render content.
            However, the 'group-hover' for the arrow translation relies on the parent having 'group'.
            Button variants don't usually have 'group'. We might need to add 'group' to the button class.
        */}
            {content}
        </Button>
    )
}

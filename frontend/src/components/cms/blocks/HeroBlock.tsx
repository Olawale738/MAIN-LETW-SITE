import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PremiumButton from '@/components/ui/PremiumButton';
import { cmsApi } from '@/lib/api';

interface HeroBlockProps {
    data: {
        title: string;
        subtitle?: string;
        bg_image?: string;
        cta_text?: string;
        cta_link?: string;
        align?: 'left' | 'center' | 'right';
    };
}

export default function HeroBlock({ data }: HeroBlockProps) {
    const {
        title,
        subtitle,
        bg_image,
        cta_text,
        cta_link,
        align = 'center'
    } = data;

    // Resolve image ID to full URL (handles both raw UUIDs from DB and already-resolved URLs)
    const resolvedBgImage = bg_image
        ? (bg_image.startsWith('http') || bg_image.startsWith('/') ? bg_image : cmsApi.getImageUrl(bg_image))
        : null;

    const alignmentClasses = {
        left: 'text-left items-start',
        center: 'text-center items-center',
        right: 'text-right items-end',
    };

    return (
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            {resolvedBgImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                    style={{ backgroundImage: `url(${resolvedBgImage})` }}
                >
                    <div className="absolute inset-0 bg-black/50" />
                </div>
            )}

            {/* Content */}
            <div className={cn(
                "relative z-10 container mx-auto px-4 flex flex-col gap-6",
                alignmentClasses[align]
            )}>
                <h1
                    className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
                    dangerouslySetInnerHTML={{ __html: title }}
                />

                {subtitle && (
                    <p className="text-xl md:text-2xl text-gray-200 max-w-3xl">
                        {subtitle}
                    </p>
                )}

                {cta_text && cta_link && (
                    <Button
                        asChild
                        size="lg"
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg px-8 h-12 mt-4"
                    >
                        <Link href={cta_link}>
                            {cta_text}
                        </Link>
                    </Button>
                )}
            </div>
        </section>
    );
}

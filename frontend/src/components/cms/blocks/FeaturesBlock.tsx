import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import PremiumButton from '@/components/ui/PremiumButton';
import { cmsApi } from '@/lib/api';
import FaithCinemaBlock from './FaithCinemaBlock';

interface FeatureItem {
    title: string;
    description: string;
    icon?: string;
    image?: string;
    link?: string;
}

interface FeaturesBlockProps {
    data: {
        title?: string;
        subtitle?: string;
        features: FeatureItem[];
        columns?: 2 | 3 | 4;
        style?: 'cards' | 'icons' | 'minimal' | 'pillars' | 'cinema';
    };
}

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    // @ts-ignore
    const Icon = LucideIcons[name];
    if (!Icon) return <LucideIcons.Star className={className} />;
    return <Icon className={className} />;
};

export default function FeaturesBlock({ data }: FeaturesBlockProps) {
    const {
        title,
        subtitle,
        features,
        columns = 3,
        style = 'cards'
    } = data;

    const gridCols = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-2 lg:grid-cols-4',
    };

    // ── Cinematic rendering — opt-in only by setting style: 'cinema'.
    // No more auto-hijack of "What We Believe" / "Statement of Faith" blocks.
    // The cinematic experience now lives on its own dedicated page (/believe).
    if (style === 'cinema') {
        return <FaithCinemaBlock title={title} subtitle={subtitle} features={features} />
    }

    // ── Premium "pillars" style: animated, dynamic value cards ──────────────
    if (style === 'pillars') {
        return (
            <section className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-[#f8f7ff] to-white">
                {/* Decorative gradient orbs */}
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#f5bb00]/10 blur-3xl pointer-events-none" />

                <div className="relative container mx-auto px-4">
                    {(title || subtitle) && (
                        <div className="text-center mb-16 max-w-2xl mx-auto">
                            {subtitle && (
                                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#f5bb00] mb-3">
                                    {subtitle}
                                </p>
                            )}
                            {title && (
                                <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">
                                    {title}
                                </h2>
                            )}
                            <div className="mt-6 mx-auto h-1.5 w-24 rounded-full bg-gradient-to-r from-[#140152] to-[#f5bb00]" />
                        </div>
                    )}

                    <div className={cn("grid gap-6", gridCols[columns])}>
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${idx * 110}ms`, animationDuration: '600ms', animationFillMode: 'both' }}
                            >
                                {/* Ghost number */}
                                <span className="absolute -top-3 right-4 text-7xl font-black text-[#140152]/[0.05] group-hover:text-[#f5bb00]/20 transition-colors duration-300 select-none pointer-events-none">
                                    {String(idx + 1).padStart(2, '0')}
                                </span>

                                {/* Gradient icon badge */}
                                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#140152] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#140152]/25 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <DynamicIcon name={feature.icon || 'Star'} className="w-8 h-8 text-white" />
                                </div>

                                <h3 className="relative text-xl font-black text-[#140152] mb-3">
                                    {feature.title}
                                </h3>
                                <p className="relative text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Accent bar grows on hover */}
                                <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-[#140152] to-[#f5bb00] group-hover:w-full transition-all duration-500 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                {(title || subtitle) && (
                    <div className="text-center mb-12 max-w-3xl mx-auto">
                        {title && (
                            <h2 className="text-3xl font-bold mb-4 text-[#140152]">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-xl text-gray-600">
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}

                <div className={cn("grid gap-8", gridCols[columns])}>
                    {features.map((feature, idx) => {
                        const content = (
                            <div
                                className={cn(
                                    "flex flex-col h-full",
                                    style === 'cards' && "bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow",
                                    style === 'icons' && "items-center text-center",
                                    style === 'minimal' && "border-l-4 border-yellow-500 pl-6"
                                )}
                            >
                                {feature.image ? (
                                    <div className="mb-6 relative h-48 w-full rounded-lg overflow-hidden flex-shrink-0">
                                        <Image
                                            src={feature.image.startsWith('http') || feature.image.startsWith('/') ? feature.image : cmsApi.getImageUrl(feature.image)}
                                            alt={feature.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : feature.icon ? (
                                    <div className={cn(
                                        "mb-4 text-[#140152]",
                                        style === 'cards' && "p-3 bg-blue-50 rounded-lg w-fit",
                                        style === 'icons' && "p-4 bg-white rounded-full shadow-sm"
                                    )}>
                                        <DynamicIcon name={feature.icon} className="w-8 h-8" />
                                    </div>
                                ) : null}

                                <h3 className="text-xl font-bold mb-2 text-[#140152]">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed flex-grow">
                                    {feature.description}
                                </p>
                                {feature.link && (
                                    <span className="text-[#140152] font-semibold mt-4 block text-sm group-hover:underline">
                                        View Resource &rarr;
                                    </span>
                                )}
                            </div>
                        );

                        if (feature.link) {
                            return (
                                <Link href={feature.link} key={idx} className="block group h-full">
                                    {content}
                                </Link>
                            );
                        }

                        return <div key={idx} className="h-full">{content}</div>;
                    })}
                </div>
            </div>
        </section>
    );
}

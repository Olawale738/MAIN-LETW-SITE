import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import PremiumButton from '@/components/ui/PremiumButton';
import { cmsApi } from '@/lib/api';

interface FeatureItem {
    title: string;
    description: string;
    icon?: string;
    image?: string;
    link?: string;
    button_text?: string;
}

interface FeaturesBlockProps {
    data: {
        title?: string;
        subtitle?: string;
        features: FeatureItem[];
        columns?: 2 | 3 | 4;
        style?: 'cards' | 'icons' | 'minimal';
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
                                    feature.button_text ? (
                                        <div className="mt-6">
                                            <PremiumButton>{feature.button_text}</PremiumButton>
                                        </div>
                                    ) : (
                                        <span className="text-[#140152] font-semibold mt-4 block text-sm group-hover:underline">
                                            View Resource &rarr;
                                        </span>
                                    )
                                )}
                            </div>
                        );

                        if (feature.link) {
                            const isExternal = feature.link.startsWith('http') || feature.link.startsWith('/uploads') || (feature as any)._resourceType === 'file' || (feature as any)._resourceType === 'link';
                            if (isExternal) {
                                return (
                                    <a
                                        href={feature.link}
                                        key={idx}
                                        className="block group h-full"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {content}
                                    </a>
                                );
                            }
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

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageBlockProps {
    data: {
        image: string;
        alt?: string;
        caption?: string;
        width?: 'full' | 'wide' | 'standard';
        aspect_ratio?: 'auto' | '16:9' | '4:3' | 'square';
    };
}

export default function ImageBlock({ data }: ImageBlockProps) {
    const {
        image,
        alt = "Image",
        caption,
        width = 'standard',
        aspect_ratio = '16:9'
    } = data;

    const widthClasses = {
        full: 'max-w-full w-full',
        wide: 'max-w-6xl w-full',
        standard: 'max-w-4xl w-full',
    };

    const aspectRatioClasses = {
        auto: '',
        '16:9': 'aspect-video',
        '4:3': 'aspect-[4/3]',
        square: 'aspect-square',
    };

    return (
        <section className="py-12 px-4">
            <div className={cn("mx-auto", widthClasses[width])}>
                <div className={cn(
                    "relative overflow-hidden rounded-xl bg-gray-100",
                    aspectRatioClasses[aspect_ratio]
                )}>
                    {aspect_ratio === 'auto' ? (
                        <img
                            src={image}
                            alt={alt}
                            className="w-full h-auto"
                        />
                    ) : (
                        <Image
                            src={image}
                            alt={alt}
                            fill
                            className="object-cover"
                        />
                    )}
                </div>
                {caption && (
                    <p className="mt-4 text-center text-gray-500 italic text-sm">
                        {caption}
                    </p>
                )}
            </div>
        </section>
    );
}

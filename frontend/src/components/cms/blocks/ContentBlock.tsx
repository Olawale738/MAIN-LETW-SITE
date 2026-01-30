import React from 'react';
import { cn } from '@/lib/utils';

interface ContentBlockProps {
    data: {
        content: string; // HTML or rich text
        title?: string;
        width?: 'full' | 'standard' | 'narrow';
        bg_color?: 'white' | 'gray' | 'dark' | 'blue';
        padding?: 'none' | 'small' | 'medium' | 'large';
    };
}

export default function ContentBlock({ data }: ContentBlockProps) {
    const {
        content,
        title,
        width = 'standard',
        bg_color = 'white',
        padding = 'medium'
    } = data;

    const widthClasses = {
        full: 'max-w-full',
        standard: 'max-w-5xl',
        narrow: 'max-w-3xl',
    };

    const bgClasses = {
        white: 'bg-white text-gray-800',
        gray: 'bg-gray-50 text-gray-800',
        dark: 'bg-gray-900 text-white',
        blue: 'bg-[#140152] text-white',
    };

    const paddingClasses = {
        none: 'py-0',
        small: 'py-8',
        medium: 'py-16',
        large: 'py-24',
    };

    return (
        <section className={cn(bgClasses[bg_color], paddingClasses[padding])}>
            <div className={cn("container mx-auto px-4", widthClasses[width])}>
                {title && (
                    <h2 className="text-3xl font-bold mb-8 text-center">
                        {title}
                    </h2>
                )}

                <div
                    className="prose prose-lg max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        </section>
    );
}

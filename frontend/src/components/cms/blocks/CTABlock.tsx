import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CTABlockProps {
    data: {
        title: string;
        text?: string;
        button_text: string;
        button_link: string;
        bg_image?: string;
        style?: 'simple' | 'card' | 'banner';
    };
}

export default function CTABlock({ data }: CTABlockProps) {
    const {
        title,
        text,
        button_text,
        button_link,
        bg_image,
        style = 'banner'
    } = data;

    if (style === 'simple') {
        return (
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6 text-[#140152]">{title}</h2>
                    {text && <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">{text}</p>}
                    <Button asChild size="lg" className="bg-[#140152] hover:bg-blue-900">
                        <Link href={button_link}>{button_text}</Link>
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="relative rounded-2xl overflow-hidden bg-[#140152] text-white p-12 text-center md:text-left md:flex items-center justify-between gap-8">
                    {bg_image && (
                        <div
                            className="absolute inset-0 z-0 opacity-20 bg-cover bg-center"
                            style={{ backgroundImage: `url(${bg_image})` }}
                        />
                    )}

                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
                        {text && <p className="text-lg text-blue-100">{text}</p>}
                    </div>

                    <div className="relative z-10 mt-8 md:mt-0 flex-shrink-0">
                        <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 px-8">
                            <Link href={button_link}>{button_text}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

import React from 'react';
import { Block } from '@/lib/api';

// Block Components
import HeroBlock from './blocks/HeroBlock';
import HeroSliderBlock from './blocks/HeroSliderBlock';
import ContentBlock from './blocks/ContentBlock';
import FeaturesBlock from './blocks/FeaturesBlock';
import CTABlock from './blocks/CTABlock';
import ImageBlock from './blocks/ImageBlock';
import SermonListBlock from './blocks/SermonListBlock';
import UpcomingEventsBlock from './blocks/UpcomingEventsBlock';
import ButtonGroupBlock from './blocks/ButtonGroupBlock';
import StatsBlock from './blocks/StatsBlock';
import TestimoniesBlock from './blocks/TestimoniesBlock';
import ScriptureBlock from './blocks/ScriptureBlock';
import ServiceTimesBlock from './blocks/ServiceTimesBlock';
import VideoBlock from './blocks/VideoBlock';
import GalleryBlock from './blocks/GalleryBlock';
import NewsletterBlock from './blocks/NewsletterBlock';
import ScriptureMarqueeBlock from './blocks/ScriptureMarqueeBlock';
import TimelineBlock from './blocks/TimelineBlock';
import FounderCardBlock from './blocks/FounderCardBlock';

interface PageRendererProps {
    blocks: Block[];
}

const BLOCK_COMPONENTS: Record<string, React.FC<any>> = {
    hero: HeroBlock,
    'hero-slider': HeroSliderBlock,
    content: ContentBlock,
    features: FeaturesBlock,
    cta: CTABlock,
    image: ImageBlock,
    'sermon-list': SermonListBlock,
    'upcoming-events': UpcomingEventsBlock,
    'button-group': ButtonGroupBlock,
    stats: StatsBlock,
    testimonies: TestimoniesBlock,
    scripture: ScriptureBlock,
    'service-times': ServiceTimesBlock,
    video: VideoBlock,
    gallery: GalleryBlock,
    newsletter: NewsletterBlock,
    'scripture-marquee': ScriptureMarqueeBlock,
    timeline: TimelineBlock,
    'founder-card': FounderCardBlock,
};

export default function PageRenderer({ blocks }: PageRendererProps) {
    if (!blocks || blocks.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col w-full">
            {blocks.map((block) => {
                const Component = BLOCK_COMPONENTS[block.type];

                if (!Component) {
                    console.warn(`No component found for block type: ${block.type}`);
                    return null;
                }

                return <Component key={block.id} data={block.data} />;
            })}
        </div>
    );
}

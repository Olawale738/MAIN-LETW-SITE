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

                // Suppress the deprecated 'How Can We Help You Today?' block
                // regardless of how it was saved.
                const d = (block.data || {}) as { title?: string; subtitle?: string; buttons?: { text?: string }[]; slides?: { title?: string; eyebrow?: string }[] };
                const title = String(d.title || '').toLowerCase();
                const subtitle = String(d.subtitle || '').toLowerCase();
                if (title.includes('how can we help') || subtitle.includes('take your next step with us')) return null;
                if (Array.isArray(d.buttons)) {
                    const labels = d.buttons.map(b => String(b?.text || '').toLowerCase().trim());
                    const signature = ['become a member', 'prayer request', 'watch sermons', 'give'];
                    const matches = signature.filter(s => labels.includes(s)).length;
                    if (matches >= 3) return null;
                }
                // Suppress the legacy 'Encounter the Light of God' hero-slider
                // saved before PremiumHero replaced it. PremiumHero is now THE
                // homepage hero — the slider would duplicate the message.
                if (block.type === 'hero-slider' && Array.isArray(d.slides)) {
                    const heroTitles = d.slides.map(s => String(s?.title || s?.eyebrow || '').toLowerCase()).join(' ');
                    if (heroTitles.includes('encounter the light') || heroTitles.includes('welcome to letw')) return null;
                }

                return <Component key={block.id} data={block.data} />;
            })}
        </div>
    );
}

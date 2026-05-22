import React from 'react';
import { Block } from '@/lib/api';

// Block Components
import HeroBlock from './blocks/HeroBlock';
import ContentBlock from './blocks/ContentBlock';
import FeaturesBlock from './blocks/FeaturesBlock';
import CTABlock from './blocks/CTABlock';
import ImageBlock from './blocks/ImageBlock';
import SermonListBlock from './blocks/SermonListBlock';
import UpcomingEventsBlock from './blocks/UpcomingEventsBlock';
import ButtonGroupBlock from './blocks/ButtonGroupBlock';

interface PageRendererProps {
    blocks: Block[];
}

const BLOCK_COMPONENTS: Record<string, React.FC<any>> = {
    hero: HeroBlock,
    content: ContentBlock,
    features: FeaturesBlock,
    cta: CTABlock,
    image: ImageBlock,
    'sermon-list': SermonListBlock,
    'upcoming-events': UpcomingEventsBlock,
    'button-group': ButtonGroupBlock,
    // Add placeholders for others if needed
    video: () => null,
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

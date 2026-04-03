import React from 'react';
import { Block, BlockType } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BlockEditor from './BlockEditor';
import { cn } from '@/lib/utils';

interface PageBuilderProps {
    blocks: Block[];
    onChange: (blocks: Block[]) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string }[] = [
    { type: 'hero', label: 'Hero Section' },
    { type: 'content', label: 'Content (Text/HTML)' },
    { type: 'features', label: 'Features (Grid)' },
    { type: 'image', label: 'Image' },
    { type: 'cta', label: 'Call to Action' },
    // { type: 'video', label: 'Video' },
];

export default function PageBuilder({ blocks, onChange }: PageBuilderProps) {

    const addBlock = (type: BlockType) => {
        const newBlock: Block = {
            id: crypto.randomUUID(),
            type,
            data: getDefaultData(type),
        };
        onChange([...blocks, newBlock]);
    };

    const updateBlock = (id: string, data: any) => {
        const newBlocks = blocks.map(b => b.id === id ? { ...b, data } : b);
        onChange(newBlocks);
    };

    const removeBlock = (id: string) => {
        onChange(blocks.filter(b => b.id !== id));
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) {
            return;
        }
        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
        onChange(newBlocks);
    };

    const getDefaultData = (type: BlockType) => {
        switch (type) {
            case 'hero': return { title: 'New Hero Section', align: 'center', bg_image: '', cta_text: '', cta_link: '' };
            case 'content': return { content: '<p>Enter content here...</p>', width: 'standard', padding: 'medium' };
            case 'features': return { features: [{ title: 'Feature 1', description: 'Description' }], columns: 3, style: 'cards' };
            case 'image': return { image: '', width: 'standard', aspect_ratio: '16:9' };
            case 'cta': return { title: 'Ready to get started?', button_text: 'Click Here', button_link: '#', style: 'banner' };
            default: return {};
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Page Content</h2>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="bg-[#140152]">
                            <Plus className="w-4 h-4 mr-2" /> Add Section
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {BLOCK_TYPES.map(bt => (
                            <DropdownMenuItem key={bt.type} onClick={() => addBlock(bt.type)}>
                                {bt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-4">
                {blocks.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                        <p>No content sections yet. Click "Add Section" to start building.</p>
                    </div>
                )}

                {blocks.map((block, index) => (
                    <BlockEditor
                        key={block.id}
                        block={block}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === blocks.length - 1}
                        onUpdate={(data) => updateBlock(block.id, data)}
                        onRemove={() => removeBlock(block.id)}
                        onMove={(dir) => moveBlock(index, dir)}
                    />
                ))}
            </div>

            <div className="flex justify-center pt-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-dashed">
                            <Plus className="w-4 h-4 mr-2" /> Add Section at Bottom
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {BLOCK_TYPES.map(bt => (
                            <DropdownMenuItem key={bt.type} onClick={() => addBlock(bt.type)}>
                                {bt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

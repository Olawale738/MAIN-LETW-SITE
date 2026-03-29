import React, { useState } from 'react';
import { Block } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Trash2, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Editors
import HeroEditor from './editors/HeroEditor';
import ContentEditor from './editors/ContentEditor';
import ImageEditor from './editors/ImageEditor';
import FeaturesEditor from './editors/FeaturesEditor';
import CTAEditor from './editors/CTAEditor';
import KidsRegistrationEditor from './editors/KidsRegistrationEditor';

interface BlockEditorProps {
    block: Block;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onUpdate: (data: any) => void;
    onRemove: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

const EDITOR_COMPONENTS: Record<string, React.FC<any>> = {
    hero: HeroEditor,
    content: ContentEditor,
    image: ImageEditor,
    features: FeaturesEditor,
    cta: CTAEditor,
    'kids-registration': KidsRegistrationEditor,
};

export default function BlockEditor({
    block,
    index,
    isFirst,
    isLast,
    onUpdate,
    onRemove,
    onMove
}: BlockEditorProps) {
    const [expanded, setExpanded] = useState(false); // Default collapsed for better overview

    const EditorComponent = EDITOR_COMPONENTS[block.type];

    return (
        <Card className={cn("border-l-4 transition-all", expanded ? "border-l-[#140152] ring-1 ring-blue-100" : "border-l-gray-300 hover:border-l-gray-400")}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-gray-50/50 rounded-t-xl">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                    <div className="bg-white p-1.5 rounded-md border shadow-sm">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm uppercase text-gray-500">Section {index + 1}</span>
                            <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{block.type}</Badge>
                        </div>
                        {/* Preview of content if collapsed */}
                        {!expanded && (block.data.title || block.data.content) && (
                            <p className="text-xs text-gray-400 truncate max-w-[300px] mt-0.5">
                                {block.data.title || block.data.content?.replace(/<[^>]*>?/gm, '').substring(0, 50)}...
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove('up')} disabled={isFirst}>
                        <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove('down')} disabled={isLast}>
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onRemove}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="p-6 border-t bg-white rounded-b-xl animate-in slide-in-from-top-2 duration-200">
                    {EditorComponent ? (
                        <EditorComponent
                            data={block.data}
                            onChange={onUpdate}
                        />
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            Editor for {block.type} not implemented yet.
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

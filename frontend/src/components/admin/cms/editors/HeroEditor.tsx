import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImagePicker from '../ImagePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeroEditorProps {
    data: any;
    onChange: (data: any) => void;
}

export default function HeroEditor({ data, onChange }: HeroEditorProps) {
    const updateField = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label>Title (HTML allowed)</Label>
                <Input
                    value={data.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Welcome to <br/> Our Church"
                />
            </div>

            <div className="grid gap-2">
                <Label>Subtitle</Label>
                <Textarea
                    value={data.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    rows={2}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Alignment</Label>
                    <Select
                        value={data.align || 'center'}
                        onValueChange={(val) => updateField('align', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Alignment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Background Image</Label>
                    <ImagePicker
                        value={data.bg_image}
                        onChange={(url) => updateField('bg_image', url)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="grid gap-2">
                    <Label>CTA Text</Label>
                    <Input
                        value={data.cta_text || ''}
                        onChange={(e) => updateField('cta_text', e.target.value)}
                        placeholder="e.g. Join Us"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>CTA Link</Label>
                    <Input
                        value={data.cta_link || ''}
                        onChange={(e) => updateField('cta_link', e.target.value)}
                        placeholder="e.g. /about"
                    />
                </div>
            </div>
        </div>
    );
}

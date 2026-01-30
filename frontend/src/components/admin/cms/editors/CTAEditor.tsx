import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImagePicker from '../ImagePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CTAEditorProps {
    data: any;
    onChange: (data: any) => void;
}

export default function CTAEditor({ data, onChange }: CTAEditorProps) {
    const updateField = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                    value={data.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Join Our Community"
                />
            </div>

            <div className="grid gap-2">
                <Label>Text (Optional)</Label>
                <Textarea
                    value={data.text || ''}
                    onChange={(e) => updateField('text', e.target.value)}
                    rows={2}
                />
            </div>

            <div className="grid gap-2">
                <Label>Style</Label>
                <Select value={data.style || 'banner'} onValueChange={(val) => updateField('style', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="banner">Banner (Blue Background)</SelectItem>
                        <SelectItem value="simple">Simple (White Background)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label>Background Image (Banner Style Only)</Label>
                <ImagePicker
                    value={data.bg_image}
                    onChange={(url) => updateField('bg_image', url)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="grid gap-2">
                    <Label>Button Text</Label>
                    <Input
                        value={data.button_text || ''}
                        onChange={(e) => updateField('button_text', e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Button Link</Label>
                    <Input
                        value={data.button_link || ''}
                        onChange={(e) => updateField('button_link', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImagePicker from '../ImagePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImageEditorProps {
    data: any;
    onChange: (data: any) => void;
}

export default function ImageEditor({ data, onChange }: ImageEditorProps) {
    const updateField = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label>Image</Label>
                <ImagePicker
                    value={data.image}
                    onChange={(url) => updateField('image', url)}
                />
            </div>

            <div className="grid gap-2">
                <Label>Alt Text</Label>
                <Input
                    value={data.alt || ''}
                    onChange={(e) => updateField('alt', e.target.value)}
                    placeholder="Description for screen readers"
                />
            </div>

            <div className="grid gap-2">
                <Label>Caption (Optional)</Label>
                <Input
                    value={data.caption || ''}
                    onChange={(e) => updateField('caption', e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Width</Label>
                    <Select value={data.width || 'standard'} onValueChange={(val) => updateField('width', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="wide">Wide</SelectItem>
                            <SelectItem value="full">Full Width</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Aspect Ratio</Label>
                    <Select value={data.aspect_ratio || '16:9'} onValueChange={(val) => updateField('aspect_ratio', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">Auto (Original)</SelectItem>
                            <SelectItem value="16:9">16:9 (Video)</SelectItem>
                            <SelectItem value="4:3">4:3</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

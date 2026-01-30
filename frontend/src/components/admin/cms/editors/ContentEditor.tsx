import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ContentEditorProps {
    data: any;
    onChange: (data: any) => void;
}

export default function ContentEditor({ data, onChange }: ContentEditorProps) {
    const updateField = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label>Section Title (Optional)</Label>
                <Input
                    value={data.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                />
            </div>

            <div className="grid gap-2">
                <Label>Content (HTML Supported)</Label>
                <Textarea
                    value={data.content || ''}
                    onChange={(e) => updateField('content', e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label>Width</Label>
                    <Select value={data.width || 'standard'} onValueChange={(val) => updateField('width', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="narrow">Narrow</SelectItem>
                            <SelectItem value="full">Full Width</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Background</Label>
                    <Select value={data.bg_color || 'white'} onValueChange={(val) => updateField('bg_color', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="white">White</SelectItem>
                            <SelectItem value="gray">Light Gray</SelectItem>
                            <SelectItem value="dark">Dark Gray</SelectItem>
                            <SelectItem value="blue">Brand Blue</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Padding</Label>
                    <Select value={data.padding || 'medium'} onValueChange={(val) => updateField('padding', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

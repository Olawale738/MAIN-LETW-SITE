import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ImagePicker from '../ImagePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeaturesEditorProps {
    data: any;
    onChange: (data: any) => void;
}

export default function FeaturesEditor({ data, onChange }: FeaturesEditorProps) {
    const updateField = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const updateFeature = (index: number, field: string, value: any) => {
        const newFeatures = [...(data.features || [])];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        updateField('features', newFeatures);
    };

    const addFeature = () => {
        const newFeatures = [...(data.features || []), { title: 'New Feature', description: '' }];
        updateField('features', newFeatures);
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(data.features || [])];
        newFeatures.splice(index, 1);
        updateField('features', newFeatures);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label>Section Title</Label>
                    <Input
                        value={data.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
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
                        <Label>Columns</Label>
                        <Select value={String(data.columns || 3)} onValueChange={(val) => updateField('columns', parseInt(val))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2">2 Columns</SelectItem>
                                <SelectItem value="3">3 Columns</SelectItem>
                                <SelectItem value="4">4 Columns</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Style</Label>
                        <Select value={data.style || 'cards'} onValueChange={(val) => updateField('style', val)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cards">Cards (White Box)</SelectItem>
                                <SelectItem value="icons">Centered Icons</SelectItem>
                                <SelectItem value="minimal">Minimal (Left Border)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label>Features ({data.features?.length || 0})</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                        <Plus className="w-4 h-4 mr-2" /> Add Feature
                    </Button>
                </div>

                <div className="grid gap-4">
                    {data.features?.map((feature: any, index: number) => (
                        <Card key={index} className="relative group">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFeature(index)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={feature.title || ''}
                                        onChange={(e) => updateFeature(index, 'title', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={feature.description || ''}
                                        onChange={(e) => updateFeature(index, 'description', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Icon Name (Lucide)</Label>
                                        <Input
                                            value={feature.icon || ''}
                                            onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                                            placeholder="e.g. Shield, Star, Users"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Or Image</Label>
                                        <ImagePicker
                                            value={feature.image}
                                            onChange={(url) => updateFeature(index, 'image', url)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

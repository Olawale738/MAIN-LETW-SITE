import React from 'react';

interface KidsRegistrationEditorProps {
    data: {
        title?: string;
        subtitle?: string;
    };
    onChange: (data: any) => void;
}

export default function KidsRegistrationEditor({ data, onChange }: KidsRegistrationEditorProps) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                This block renders the Kids Ministry registration form. You can customize the title and subtitle displayed above the form.
            </p>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                    type="text"
                    value={data.title || ''}
                    onChange={(e) => onChange({ ...data, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                    placeholder="Register Your Child"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <textarea
                    value={data.subtitle || ''}
                    onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent resize-none"
                    placeholder="Join our ministry family!"
                />
            </div>
        </div>
    );
}

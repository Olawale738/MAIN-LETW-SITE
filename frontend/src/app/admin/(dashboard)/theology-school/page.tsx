'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, ExternalLink, Edit, Sparkles } from 'lucide-react'

export default function AdminTheologySchoolPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-[#140152]">
                        <GraduationCap className="w-7 h-7 text-[#f5bb00]" /> Theology School
                    </h1>
                    <p className="text-gray-600 mt-1">Admin overview of <code className="bg-gray-100 px-1 rounded text-xs">/education/theology-school</code>.</p>
                </div>
                <div className="flex gap-2">
                    <a href="/education/theology-school" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm">
                        View live <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Link href="/admin/theology-school/edit"
                        className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm">
                        <Edit className="w-3.5 h-3.5" /> Edit Page Content
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-[#140152]">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Programs</p>
                        <p className="text-3xl font-black text-[#140152] mt-1">3</p>
                        <p className="text-xs text-gray-500 mt-0.5">Certificate · Diploma · Advanced</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#f5bb00]">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Pillars</p>
                        <p className="text-3xl font-black text-[#f5bb00] mt-1">6</p>
                        <p className="text-xs text-gray-500 mt-0.5">formation values</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-[#7c3aed]">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Journey</p>
                        <p className="text-3xl font-black text-[#7c3aed] mt-1">3</p>
                        <p className="text-xs text-gray-500 mt-0.5">progressive years</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-400">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Editable</p>
                        <p className="text-3xl font-black text-emerald-500 mt-1">All</p>
                        <p className="text-xs text-gray-500 mt-0.5">text / pillars / gains / images</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#f5bb00]" /> What you can edit
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
                        <ul className="space-y-1.5">
                            <li>• Hero (eyebrow, title, scripture, description, CTAs)</li>
                            <li>• Stats Band (any number of stats)</li>
                            <li>• Identity Carousel slides</li>
                            <li>• Six Pillars (icon + title + description)</li>
                            <li>• Image Carousel sources</li>
                        </ul>
                        <ul className="space-y-1.5">
                            <li>• All section headings (programs, journey, gains)</li>
                            <li>• Journey steps (number + title + description)</li>
                            <li>• Gains list</li>
                            <li>• Final CTA (eyebrow, title, body, buttons, quote)</li>
                            <li>· Programs (Certificate/Diploma/Advanced) — code-defined</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

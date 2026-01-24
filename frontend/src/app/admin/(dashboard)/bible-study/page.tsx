'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileText, Library, Settings, ArrowRight } from 'lucide-react'

export default function BibleStudyAdminPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[#140152]">Bible Study Management</h1>
                <p className="text-gray-500 mt-2">Manage reading plans, daily readings, and study resources</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/admin/bible-study/plans">
                    <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group h-full">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-[#140152] flex items-center justify-center mb-3">
                                <BookOpen className="w-6 h-6 text-[#f5bb00]" />
                            </div>
                            <CardTitle className="text-lg text-[#140152]">Reading Plans</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Create and manage Bible reading plans for your community</p>
                            <div className="flex items-center text-[#140152] font-medium text-sm group-hover:text-[#f5bb00] transition-colors">
                                Manage Plans
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/bible-study/readings">
                    <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group h-full">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-[#140152] flex items-center justify-center mb-3">
                                <FileText className="w-6 h-6 text-[#f5bb00]" />
                            </div>
                            <CardTitle className="text-lg text-[#140152]">Daily Readings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Add daily scripture readings and reflections to plans</p>
                            <div className="flex items-center text-[#140152] font-medium text-sm group-hover:text-[#f5bb00] transition-colors">
                                Manage Readings
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/bible-study/resources">
                    <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group h-full">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-[#140152] flex items-center justify-center mb-3">
                                <Library className="w-6 h-6 text-[#f5bb00]" />
                            </div>
                            <CardTitle className="text-lg text-[#140152]">Study Resources</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Upload videos, PDFs, and other study materials</p>
                            <div className="flex items-center text-[#140152] font-medium text-sm group-hover:text-[#f5bb00] transition-colors">
                                Manage Resources
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/bible-study/settings">
                    <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group h-full">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-[#140152] flex items-center justify-center mb-3">
                                <Settings className="w-6 h-6 text-[#f5bb00]" />
                            </div>
                            <CardTitle className="text-lg text-[#140152]">Page Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Configure the Bible Study page hero section</p>
                            <div className="flex items-center text-[#140152] font-medium text-sm group-hover:text-[#f5bb00] transition-colors">
                                Configure Settings
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Info Section */}
            <Card className="border-none shadow-md bg-gradient-to-br from-[#140152] to-[#1e0275] text-white">
                <CardHeader>
                    <CardTitle className="text-white">Getting Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-[#f5bb00] text-[#140152] flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                        <div>
                            <p className="font-medium">Create a Reading Plan</p>
                            <p className="text-sm text-white/70">Set up a weekly, monthly, or custom reading plan</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-[#f5bb00] text-[#140152] flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                        <div>
                            <p className="font-medium">Add Daily Readings</p>
                            <p className="text-sm text-white/70">Add scripture references, key verses, and reflections</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-[#f5bb00] text-[#140152] flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                        <div>
                            <p className="font-medium">Upload Resources (Optional)</p>
                            <p className="text-sm text-white/70">Add supplementary study materials</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-[#f5bb00] text-[#140152] flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                        <div>
                            <p className="font-medium">Customize Page Settings</p>
                            <p className="text-sm text-white/70">Update the hero section to match your branding</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


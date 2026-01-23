'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, FileText, Download, Clock, BookOpen, GraduationCap } from 'lucide-react'
import SectionWrapper from '@/components/shared/SectionWrapper'

// Mock Data for Resources
const RESOURCES = {
    audio: [
        { id: 1, title: 'Introduction to Systematic Theology', duration: '45:20', date: '2024-01-20' },
        { id: 2, title: 'The History of the Early Church', duration: '52:15', date: '2024-01-22' },
        { id: 3, title: 'Hermeneutics: Interpreting Scripture', duration: '48:10', date: '2024-01-25' },
    ],
    pdf: [
        { id: 1, title: 'Course Syllabus - Level 1', size: '2.4 MB', date: '2024-01-15' },
        { id: 2, title: 'Week 1 Reading Material', size: '1.1 MB', date: '2024-01-20' },
        { id: 3, title: 'Assignment 1 Guidelines', size: '0.5 MB', date: '2024-01-22' },
    ]
}

export default function TheologyDashboardPage() {
    const [activeTab, setActiveTab] = useState<'audio' | 'pdf'>('audio')

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Hero */}
            <div className="bg-[#140152] text-white pt-24 pb-12 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5bb00] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2" />
                <div className="max-w-7xl mx-auto relative z-10 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#f5bb00] text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                                <GraduationCap className="w-3 h-3" />
                                Student Portal
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black mb-4">Theology School</h1>
                            <p className="text-white/70 max-w-2xl text-lg">
                                Access your course materials, lectures, and assignments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <SectionWrapper>
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    {/* Welcome / Info Box */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 md:p-8 flex items-start gap-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#140152] flex-shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#140152] mb-2">Welcome to your Learning Hub</h3>
                            <p className="text-gray-700 leading-relaxed">
                                This dashboard is your central hub for the Theology School. Here you will find all resources uploaded by the administration, including audio lectures, PDF study guides, and assignment details. Please check back regularly for new content.
                            </p>
                        </div>
                    </motion.div>

                    {/* Resources Section */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content - Resource List */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-[#140152]">Course Materials</h2>
                                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                                    <button 
                                        onClick={() => setActiveTab('audio')}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                            activeTab === 'audio' 
                                            ? 'bg-[#140152] text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-[#140152] hover:bg-gray-50'
                                        }`}
                                    >
                                        Audio Lectures
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('pdf')}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                            activeTab === 'pdf' 
                                            ? 'bg-[#140152] text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-[#140152] hover:bg-gray-50'
                                        }`}
                                    >
                                        Documents (PDF)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {activeTab === 'audio' ? (
                                    RESOURCES.audio.map((resource) => (
                                        <motion.div 
                                            key={resource.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                                                <Play className="w-5 h-5 fill-current" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-[#140152] group-hover:text-blue-700 transition-colors">{resource.title}</h4>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {resource.duration}</span>
                                                    <span>{resource.date}</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="hidden sm:flex border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                                                Listen
                                            </Button>
                                        </motion.div>
                                    ))
                                ) : (
                                    RESOURCES.pdf.map((resource) => (
                                        <motion.div 
                                            key={resource.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-[#140152] group-hover:text-blue-700 transition-colors">{resource.title}</h4>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1">{resource.size}</span>
                                                    <span>{resource.date}</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="hidden sm:flex border-gray-200 text-gray-600 hover:bg-gray-50">
                                                <Download className="w-4 h-4 mr-2" /> Download
                                            </Button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                             {/* Progress Card (Mock) */}
                             <Card className="border-none shadow-lg bg-[#140152] text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg">Your Progress</CardTitle>
                                    <CardDescription className="text-blue-200">Certificate in Theology (Level 1)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Overall Completion</span>
                                                <span className="font-bold text-[#f5bb00]">15%</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div className="bg-[#f5bb00] h-2 rounded-full w-[15%]" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-[#140152] mb-4">Upcoming Live Sessions</h4>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-1 rounded text-center min-w-[3rem]">
                                            <span className="block text-lg">24</span>
                                            jan
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#140152]">Q&A with Pastor</p>
                                            <p className="text-xs text-gray-500 mt-0.5">10:00 AM • Zoom</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    )
}

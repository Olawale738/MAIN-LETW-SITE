'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Loader2, GripVertical, Video, FileText, HelpCircle, Save, Trash, Image as ImageIcon, Pencil } from 'lucide-react'
import { skillsApi, Course, CourseModule, QuizCreate } from '@/lib/api'
import QuizCreationDialog from '@/components/admin/QuizCreationDialog'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import RichTextEditor from '@/components/ui/rich-text-editor'

export default function CourseEditorPage() {
    const router = useRouter()
    const params = useParams()
    const courseId = params?.id as string

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)

    // Dialog states
    const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
    const [moduleTitle, setModuleTitle] = useState('')

    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
    const [lessonData, setLessonData] = useState({
        title: '',
        moduleId: '',
        videoUrls: [''],
        htmlContent: '',
    })

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null)

    const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
    const [quizCreationModuleId, setQuizCreationModuleId] = useState<string>('')

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    })

    useEffect(() => {
        if (courseId) {
            loadCourse()
        }
    }, [courseId])

    const handleCreateQuiz = async (data: QuizCreate) => {
        try {
            await skillsApi.createQuiz(quizCreationModuleId, data)
            await loadCourse()
        } catch (error) {
            console.error('Failed to create quiz:', error)
            setAlertConfig({
                isOpen: true,
                title: 'Error Creating Quiz',
                message: 'Something went wrong while creating the quiz. Please try again.',
                type: 'error'
            })
        }
    }

    const loadCourse = async () => {
        try {
            const data = await skillsApi.getCourse(courseId)
            setCourse(data)
        } catch (err) {
            console.error('Failed to load course', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateModule = async () => {
        if (!moduleTitle.trim()) return
        setSubmitting(true)
        try {
            await skillsApi.createModule(courseId, { title: moduleTitle })
            setModuleTitle('')
            setIsModuleDialogOpen(false)
            await loadCourse() // Refresh
        } catch (err) {
            console.error('Failed to create module', err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleCreateLesson = async () => {
        setError(null)
        if (!lessonData.title.trim() || !lessonData.moduleId) {
            setError('Lesson title is required.')
            return
        }

        // Filter out empty video URLs
        const validVideoUrls = lessonData.videoUrls.filter(url => url.trim() !== '')

        // Check if there is some content
        if (validVideoUrls.length === 0 && (!lessonData.htmlContent || !lessonData.htmlContent.trim() || lessonData.htmlContent === '<p></p>')) {
            setError('Please add at least one video or some text content.')
            return
        }

        setSubmitting(true)
        try {
            if (editingLessonId) {
                // Update implementation
                await skillsApi.updateLesson(editingLessonId, {
                    title: lessonData.title,
                    content_type: 'mixed',
                    video_urls: validVideoUrls,
                    text_content: lessonData.htmlContent,
                    // images: [], // Assuming images are part of content for now
                })
            } else {
                // Create implementation
                await skillsApi.createLesson(lessonData.moduleId, {
                    title: lessonData.title,
                    content_type: 'mixed',
                    video_urls: validVideoUrls,
                    text_content: lessonData.htmlContent,
                    images: [],
                })
            }

            setLessonData({
                title: '',
                moduleId: '',
                videoUrls: [''],
                htmlContent: ''
            })
            setIsLessonDialogOpen(false)
            setEditingLessonId(null)
            await loadCourse() // Refresh
        } catch (err: any) {
            console.error('Failed to save lesson', err)
            setError(err.message || 'Failed to save lesson. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteLesson = async (id: string) => {
        try {
            await skillsApi.deleteLesson(id)
            await loadCourse()
        } catch (err) {
            console.error('Failed to delete lesson', err)
        }
    }

    const addVideoField = () => {
        setLessonData({
            ...lessonData,
            videoUrls: [...lessonData.videoUrls, '']
        })
    }

    const updateVideoUrl = (index: number, value: string) => {
        const newUrls = [...lessonData.videoUrls]
        newUrls[index] = value
        setLessonData({
            ...lessonData,
            videoUrls: newUrls
        })
    }

    const removeVideoField = (index: number) => {
        if (lessonData.videoUrls.length === 1) return
        const newUrls = [...lessonData.videoUrls]
        newUrls.splice(index, 1)
        setLessonData({
            ...lessonData,
            videoUrls: newUrls
        })
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
    if (!course) return <div className="p-12 text-center">Course not found</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="p-0">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#140152]">{course.title}</h1>
                        <p className="text-gray-500 text-sm">Course Curriculum Editor</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/skill-development/${courseId}`)}>Preview</Button>
                    <Button
                        className="bg-[#140152] text-white"
                        onClick={async () => {
                            try {
                                const newStatus = !course.is_published
                                await skillsApi.updateCourse(courseId, { is_published: newStatus })
                                await loadCourse()
                            } catch (err) {
                                console.error('Failed to update course status', err)
                            }
                        }}
                    >
                        {course.is_published ? 'Unpublish Course' : 'Publish Course'}
                    </Button>
                </div>
            </div>

            {/* Modules List */}
            <div className="space-y-6">
                {course.modules?.map((module, index) => (
                    <Card key={module.id} className="border border-gray-200 shadow-sm">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <GripVertical className="text-gray-400 w-5 h-5 cursor-move" />
                                <h3 className="font-bold text-gray-800">Module {index + 1}: {module.title}</h3>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-[#140152]"
                                    onClick={() => {
                                        setLessonData(prev => ({ ...prev, moduleId: module.id, title: '', videoUrls: [''], htmlContent: '' }))
                                        setEditingLessonId(null)
                                        setIsLessonDialogOpen(true)
                                        setError(null)
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Lesson
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-[#140152]"
                                    onClick={() => {
                                        setQuizCreationModuleId(module.id)
                                        setIsQuizDialogOpen(true)
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Quiz
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-0">
                            {module.lessons.length === 0 && module.quizzes.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No content in this module yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {module.lessons.map((lesson) => (
                                        <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <span className="text-gray-700 font-medium">{lesson.title}</span>
                                                {(lesson.video_urls && lesson.video_urls.length > 0) && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                        {lesson.video_urls.length} Video{lesson.video_urls.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2"> {/* Edit/Delete Buttons */}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="w-8 h-8 text-gray-400 hover:text-blue-600"
                                                    onClick={() => {
                                                        setEditingLessonId(lesson.id)
                                                        setLessonData({
                                                            title: lesson.title,
                                                            moduleId: module.id,
                                                            videoUrls: (lesson.video_urls && lesson.video_urls.length > 0) ? lesson.video_urls : [''],
                                                            htmlContent: lesson.text_content || ''
                                                        })
                                                        setIsLessonDialogOpen(true)
                                                        setError(null)
                                                    }}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="w-8 h-8 text-gray-400 hover:text-red-600"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this lesson?')) {
                                                            handleDeleteLesson(lesson.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {module.quizzes.map((quiz) => (
                                        <div key={quiz.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-600">
                                                    <HelpCircle className="w-4 h-4" />
                                                </div>
                                                <span className="text-gray-700 font-medium">{quiz.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* Add Module Button */}
                <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full py-8 border-dashed border-2 text-gray-500 hover:text-white hover:border-[#140152]">
                            <Plus className="w-5 h-5 mr-2" /> Add New Module
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-gray-900">Add New Module</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label className="text-gray-700">Module Title</Label>
                            <Input
                                value={moduleTitle}
                                onChange={(e) => setModuleTitle(e.target.value)}
                                placeholder="e.g. Introduction"
                                className="text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateModule} disabled={submitting}>
                                {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Create Module'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <QuizCreationDialog
                isOpen={isQuizDialogOpen}
                onClose={() => setIsQuizDialogOpen(false)}
                onSubmit={handleCreateQuiz}
                moduleId={quizCreationModuleId}
            />

            {/* Add Lesson Dialog (Enhanced) */}
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">{editingLessonId ? 'Edit Lesson' : 'Add Lesson Content'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-gray-700">Lesson Title</Label>
                            <Input
                                value={lessonData.title}
                                onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                                placeholder="e.g. Chapter 1: The Beginning"
                                className="text-gray-900 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Video Section */}
                        <div className="space-y-3">
                            <Label className="text-gray-700">Video Content</Label>
                            {lessonData.videoUrls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={url}
                                        onChange={(e) => updateVideoUrl(index, e.target.value)}
                                        placeholder="Paste YouTube or Vimeo URL"
                                        className="text-gray-900 placeholder:text-gray-400"
                                    />
                                    {lessonData.videoUrls.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeVideoField(index)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addVideoField}
                                className="text-[#140152] border-[#140152] hover:bg-blue-50"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Another Video
                            </Button>
                        </div>

                        {/* Rich Text Editor */}
                        <div className="space-y-2">
                            <Label className="text-gray-700">Lesson Content</Label>
                            <p className="text-xs text-gray-500 mb-2">Write formatted text, insert images, tables, and more.</p>
                            <RichTextEditor
                                content={lessonData.htmlContent}
                                onChange={(html) => setLessonData({ ...lessonData, htmlContent: html })}
                                className="min-h-[300px]"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col items-end gap-2 sm:flex-col sm:items-end">
                        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
                        <Button onClick={handleCreateLesson} disabled={submitting}>
                            {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : (editingLessonId ? 'Update Lesson' : 'Create Lesson')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Custom Alert Dialog */}
            <Dialog open={alertConfig.isOpen} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent className="sm:max-w-[425px] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 text-xl ${alertConfig.type === 'error' ? 'text-red-600' : 'text-[#140152]'}`}>
                            {alertConfig.type === 'error' ? (
                                <div className="p-2 bg-red-100 rounded-full">
                                    <HelpCircle className="w-5 h-5 text-red-600" />
                                </div>
                            ) : (
                                <div className="p-2 bg-green-100 rounded-full">
                                    <div className="w-5 h-5 bg-green-600 rounded-full" />
                                </div>
                            )}
                            {alertConfig.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-gray-600">
                        {alertConfig.message}
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                            className={alertConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#140152] hover:bg-[#20027a] text-white'}
                        >
                            Okay, Got it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

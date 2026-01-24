'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, PlayCircle, FileText, ChevronLeft, ChevronRight, Menu, X, Loader2, Award, BookOpen, Clock } from 'lucide-react'
import { skillsApi, Course, Lesson, Quiz, CourseModule } from '@/lib/api'
import { cn } from '@/lib/utils'
import QuizPlayer from '@/components/QuizPlayer'

type ContentType = 'lesson' | 'quiz'

interface ActiveContent {
    type: ContentType
    data: Lesson | Quiz
    moduleId?: string
}

export default function CoursePlayerPage() {
    const router = useRouter()
    const params = useParams()
    const courseId = params?.courseId as string

    const [course, setCourse] = useState<Course | null>(null)
    const [activeContent, setActiveContent] = useState<ActiveContent | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [enrolling, setEnrolling] = useState(false)

    useEffect(() => {
        if (courseId) {
            loadCourse()
        }
    }, [courseId])

    const loadCourse = async () => {
        try {
            const data = await skillsApi.getCourse(courseId)
            setCourse(data)

            // Set first lesson as active if enrolled
            if (data.is_enrolled && data.modules?.[0]?.lessons?.[0]) {
                setActiveContent({
                    type: 'lesson',
                    data: data.modules[0].lessons[0],
                    moduleId: data.modules[0].id
                })
            }
        } catch (err) {
            console.error('Failed to load course', err)
        } finally {
            setLoading(false)
        }
    }

    const handleEnroll = async () => {
        setEnrolling(true)
        try {
            await skillsApi.enroll(courseId)
            await loadCourse()
        } catch (err) {
            console.error('Enrollment failed', err)
        } finally {
            setEnrolling(false)
        }
    }

    const handleLessonComplete = async () => {
        if (!activeContent || activeContent.type !== 'lesson') return
        const lesson = activeContent.data as Lesson

        try {
            // Optimistic update
            setCourse(prev => {
                if (!prev) return prev
                const updated = { ...prev }
                updated.modules = prev.modules?.map(m => ({
                    ...m,
                    lessons: m.lessons?.map(l =>
                        l.id === lesson.id ? { ...l, is_completed: true } : l
                    )
                }))

                // Recalculate progress
                const totalLessons = updated.modules?.flatMap(m => m.lessons || []).length || 0
                const completedLessons = updated.modules?.flatMap(m => m.lessons || []).filter(l => l.is_completed).length || 0
                updated.progress_percent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

                return updated
            })

            await skillsApi.completeLesson(lesson.id)

            // Check if module has quiz and all lessons are complete
            const currentModule = course?.modules?.find(m => m.id === activeContent.moduleId)
            if (currentModule) {
                const allLessonsComplete = currentModule.lessons?.every(l =>
                    l.id === lesson.id || l.is_completed
                )

                if (allLessonsComplete && currentModule.quizzes && currentModule.quizzes.length > 0) {
                    // Show quiz
                    setActiveContent({
                        type: 'quiz',
                        data: currentModule.quizzes[0],
                        moduleId: currentModule.id
                    })
                    return
                }
            }

            // Move to next lesson
            goToNextContent()

        } catch (err) {
            console.error('Completion failed', err)
            await loadCourse() // Revert on error
        }
    }

    const goToNextContent = () => {
        if (!course || !activeContent) return

        const allItems: Array<{ type: ContentType; data: Lesson | Quiz; moduleId: string }> = []

        course.modules?.forEach(module => {
            module.lessons?.forEach(lesson => {
                allItems.push({ type: 'lesson', data: lesson, moduleId: module.id })
            })
            // Add quiz after all lessons in module
            module.quizzes?.forEach(quiz => {
                allItems.push({ type: 'quiz', data: quiz, moduleId: module.id })
            })
        })

        const currentIndex = allItems.findIndex(item =>
            item.type === activeContent.type && item.data.id === activeContent.data.id
        )

        if (currentIndex >= 0 && currentIndex < allItems.length - 1) {
            setActiveContent(allItems[currentIndex + 1])
        }
    }

    const goToPreviousContent = () => {
        if (!course || !activeContent) return

        const allItems: Array<{ type: ContentType; data: Lesson | Quiz; moduleId: string }> = []

        course.modules?.forEach(module => {
            module.lessons?.forEach(lesson => {
                allItems.push({ type: 'lesson', data: lesson, moduleId: module.id })
            })
            module.quizzes?.forEach(quiz => {
                allItems.push({ type: 'quiz', data: quiz, moduleId: module.id })
            })
        })

        const currentIndex = allItems.findIndex(item =>
            item.type === activeContent.type && item.data.id === activeContent.data.id
        )

        if (currentIndex > 0) {
            setActiveContent(allItems[currentIndex - 1])
        }
    }

    const handleQuizComplete = (passed: boolean) => {
        if (passed) {
            setTimeout(() => goToNextContent(), 2000)
        }
    }

    const getYoutubeEmbedUrl = (url?: string) => {
        if (!url) return ''
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        const id = (match && match[2].length === 11) ? match[2] : null
        return id ? `https://www.youtube.com/embed/${id}` : url
    }

    const isContentCompleted = (type: ContentType, id: string): boolean => {
        if (type === 'lesson') {
            return course?.modules?.some(m =>
                m.lessons?.some(l => l.id === id && l.is_completed)
            ) || false
        }
        // For quizzes, check if user has passed attempt
        return false // TODO: implement quiz completion check
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/90">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
                    <p className="text-white text-lg">Loading course...</p>
                </div>
            </div>
        )
    }

    if (!course) return <div className="min-h-screen flex items-center justify-center bg-primary text-white">Course not found</div>

    // Not Enrolled View
    if (!course.is_enrolled) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white flex flex-col items-center justify-center p-4 md:p-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/skill-development')}
                    className="absolute top-4 left-4 md:top-8 md:left-8 text-white/80 hover:text-white hover:bg-white/10"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                    <div className="h-72 bg-gradient-to-br from-accent/30 to-primary/50 relative">
                        {course.thumbnail && (
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-40" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-8">
                                <BookOpen className="w-20 h-20 text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-12 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">{course.description}</p>

                        <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                            <div className="bg-white/10 rounded-xl p-4">
                                <BookOpen className="w-6 h-6 text-accent mx-auto mb-2" />
                                <p className="text-sm text-white/70">Modules</p>
                                <p className="text-xl font-bold">{course.modules?.length || 0}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <PlayCircle className="w-6 h-6 text-accent mx-auto mb-2" />
                                <p className="text-sm text-white/70">Lessons</p>
                                <p className="text-xl font-bold">
                                    {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0}
                                </p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <Award className="w-6 h-6 text-accent mx-auto mb-2" />
                                <p className="text-sm text-white/70">Quizzes</p>
                                <p className="text-xl font-bold">
                                    {course.modules?.reduce((acc, m) => acc + (m.quizzes?.length || 0), 0) || 0}
                                </p>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="bg-accent hover:bg-accent/90 text-primary font-bold px-12 py-6 text-lg rounded-full shadow-lg"
                            onClick={handleEnroll}
                            disabled={enrolling}
                        >
                            {enrolling ? (
                                <><Loader2 className="animate-spin mr-2" /> Enrolling...</>
                            ) : (
                                'Start Learning Now'
                            )}
                        </Button>
                        <p className="text-sm text-white/60 mt-4">Free access for church members</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden"
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/skill-development')}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Exit Course
                            </Button>
                        </div>

                        <div className="flex-1 max-w-md mx-4 hidden md:block">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        <span className="font-medium">Progress</span>
                                        <span className="font-bold">{Math.round(course.progress_percent || 0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-accent to-accent/80 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${course.progress_percent || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                                {course.title}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex max-w-7xl mx-auto">
                {/* Collapsible Sidebar */}
                <div className={cn(
                    "fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] z-30 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 overflow-hidden",
                    sidebarOpen ? "w-80" : "w-0 lg:w-16"
                )}>
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        {sidebarOpen ? (
                            <div className="p-4 space-y-1">
                                {course.modules?.map((module, moduleIndex) => (
                                    <div key={module.id} className="mb-6">
                                        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-primary/5 dark:bg-primary/10 rounded-lg">
                                            <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                                Module {moduleIndex + 1}: {module.title}
                                            </h4>
                                        </div>
                                        <div className="space-y-1">
                                            {module.lessons?.map((lesson, lessonIndex) => {
                                                const isActive = activeContent?.type === 'lesson' && activeContent.data.id === lesson.id
                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => {
                                                            setActiveContent({ type: 'lesson', data: lesson, moduleId: module.id })
                                                            if (window.innerWidth < 1024) setSidebarOpen(false)
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all",
                                                            isActive
                                                                ? "bg-accent text-primary font-semibold shadow-sm"
                                                                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                                        )}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            {lesson.is_completed ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                                                            ) : (
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                                                                    isActive ? "border-primary bg-primary text-white" : "border-gray-300 dark:border-gray-600 text-gray-400"
                                                                )}>
                                                                    {lessonIndex + 1}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm flex-1 line-clamp-2">{lesson.title}</span>
                                                    </button>
                                                )
                                            })}

                                            {/* Quiz items */}
                                            {module.quizzes?.map((quiz) => {
                                                const isActive = activeContent?.type === 'quiz' && activeContent.data.id === quiz.id
                                                return (
                                                    <button
                                                        key={quiz.id}
                                                        onClick={() => {
                                                            setActiveContent({ type: 'quiz', data: quiz, moduleId: module.id })
                                                            if (window.innerWidth < 1024) setSidebarOpen(false)
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all",
                                                            isActive
                                                                ? "bg-accent text-primary font-semibold shadow-sm"
                                                                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                                        )}
                                                    >
                                                        <Award className={cn("w-5 h-5", isActive ? "text-primary" : "text-purple-500")} />
                                                        <span className="text-sm flex-1">{quiz.title}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="hidden lg:flex flex-col items-center py-4 gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSidebarOpen(true)}
                                    className="text-gray-600 dark:text-gray-400"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-[calc(100vh-4rem)]">
                    {activeContent ? (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            {activeContent.type === 'lesson' ? (
                                <>
                                    {(() => {
                                        const lesson = activeContent.data as Lesson
                                        return (
                                            <>
                                                {/* Video Section */}
                                                {(lesson.video_urls && lesson.video_urls.length > 0) ? (
                                                    <div className="space-y-4 mb-8">
                                                        {lesson.video_urls.map((url, index) => (
                                                            url ? (
                                                                <div key={index} className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-xl">
                                                                    <iframe
                                                                        src={getYoutubeEmbedUrl(url)}
                                                                        className="w-full h-full"
                                                                        allowFullScreen
                                                                        title={`${lesson.title} - Part ${index + 1}`}
                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    />
                                                                </div>
                                                            ) : null
                                                        ))}
                                                    </div>
                                                ) : (lesson.content_type === 'video' && lesson.content_url) && (
                                                    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-xl mb-8">
                                                        <iframe
                                                            src={getYoutubeEmbedUrl(lesson.content_url)}
                                                            className="w-full h-full"
                                                            allowFullScreen
                                                            title={lesson.title}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        />
                                                    </div>
                                                )}

                                                {/* Lesson Header */}
                                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                                                {lesson.title}
                                                            </h1>
                                                            {lesson.duration && (
                                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span className="text-sm">{lesson.duration} min</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            onClick={handleLessonComplete}
                                                            className={cn(
                                                                "flex-shrink-0",
                                                                lesson.is_completed
                                                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                                                    : "bg-accent hover:bg-accent/90 text-primary font-semibold"
                                                            )}
                                                        >
                                                            {lesson.is_completed ? (
                                                                <><CheckCircle className="w-4 h-4 mr-2" /> Completed</>
                                                            ) : (
                                                                'Mark as Complete'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Text Content */}
                                                {lesson.text_content && (
                                                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-6">
                                                        <div
                                                            className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-primary prose-strong:text-gray-900 dark:prose-strong:text-white"
                                                            dangerouslySetInnerHTML={{ __html: lesson.text_content }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Images */}
                                                {lesson.images && lesson.images.length > 0 && (
                                                    <div className="grid gap-4 mb-6">
                                                        {lesson.images.map((img, idx) => (
                                                            <div key={idx} className="rounded-2xl overflow-hidden shadow-lg">
                                                                <img src={img} alt={`Lesson content ${idx + 1}`} className="w-full" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Navigation */}
                                                <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-800">
                                                    <Button
                                                        variant="outline"
                                                        onClick={goToPreviousContent}
                                                        className="text-gray-700 dark:text-gray-300"
                                                    >
                                                        <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                                                    </Button>
                                                    <Button
                                                        onClick={lesson.is_completed ? goToNextContent : handleLessonComplete}
                                                        className="bg-primary hover:bg-primary/90 text-white"
                                                    >
                                                        {lesson.is_completed ? (
                                                            <>Next <ChevronRight className="w-4 h-4 ml-2" /></>
                                                        ) : (
                                                            <>Complete & Continue <ChevronRight className="w-4 h-4 ml-2" /></>
                                                        )}
                                                    </Button>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </>
                            ) : (
                                <QuizPlayer
                                    quiz={activeContent.data as Quiz}
                                    onComplete={handleQuizComplete}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400 text-lg">Select a lesson to start learning</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

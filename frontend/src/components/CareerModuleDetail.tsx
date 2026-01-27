'use client'

import { CareerModule, CareerResource, careerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { 
    FileDown, PlayCircle, FileText, Link as LinkIcon, 
    CheckCircle, Loader2, ArrowLeft, ExternalLink 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface CareerModuleDetailProps {
    module: CareerModule
    onBack: () => void
    onTaskComplete: (taskId: string) => Promise<void>
}

export default function CareerModuleDetail({ module, onBack, onTaskComplete }: CareerModuleDetailProps) {
    const [completingTask, setCompletingTask] = useState<string | null>(null)

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'pdf': return FileDown
            case 'video': return PlayCircle
            case 'article': return FileText
            case 'link': return LinkIcon
            default: return FileText
        }
    }

    const getResourceColor = (type: string) => {
        switch (type) {
            case 'pdf': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
            case 'video': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
            case 'article': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
            case 'link': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
        }
    }

    const handleResourceClick = (resource: CareerResource) => {
        if (resource.resource_type === 'video' && resource.video_url) {
            window.open(resource.video_url, '_blank')
        } else if (resource.resource_type === 'pdf' && resource.file_url) {
            window.open(resource.file_url, '_blank')
        } else if (resource.resource_type === 'link' && resource.external_link) {
            window.open(resource.external_link, '_blank')
        }
    }

    const handleCompleteTask = async (taskId: string) => {
        try {
            setCompletingTask(taskId)
            await onTaskComplete(taskId)
        } finally {
            setCompletingTask(null)
        }
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="mb-4 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
                
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-2xl p-8 border-2 border-primary/20">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{module.title}</h1>
                    {module.description && (
                        <p className="text-gray-700 dark:text-gray-300">{module.description}</p>
                    )}
                    {(module.progress_percent ?? 0) > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-700 dark:text-gray-300">Your Progress</span>
                                <span className="text-primary font-bold">{module.progress_percent ?? 0}%</span>
                            </div>
                            <div className="h-3 bg-white/50 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${module.progress_percent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Resources */}
            {module.resources && module.resources.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Learning Resources</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {module.resources.map((resource) => {
                            const Icon = getResourceIcon(resource.resource_type)
                            return (
                                <div
                                    key={resource.id}
                                    onClick={() => handleResourceClick(resource)}
                                    className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn("p-3 rounded-xl", getResourceColor(resource.resource_type))}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                                {resource.title}
                                            </h3>
                                            {resource.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {resource.description}
                                                </p>
                                            )}
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                                    {resource.resource_type}
                                                </span>
                                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Tasks */}
            {module.tasks && module.tasks.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Action Items</h2>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {module.tasks.map((task, index) => (
                            <div
                                key={task.id}
                                className={cn(
                                    "p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                                    index !== (module.tasks?.length ?? 0) - 1 && "border-b border-gray-100 dark:border-gray-800"
                                )}
                            >
                                <button
                                    onClick={() => handleCompleteTask(task.id)}
                                    disabled={completingTask === task.id || task.is_completed}
                                    className={cn(
                                        "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                        task.is_completed 
                                            ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                                            : "border-gray-300 dark:border-gray-600 hover:border-primary"
                                    )}
                                >
                                    {completingTask === task.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    ) : task.is_completed ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : null}
                                </button>
                                <div className="flex-1">
                                    <h3 className={cn(
                                        "font-semibold text-gray-900 dark:text-white",
                                        task.is_completed && "line-through text-gray-400 dark:text-gray-600"
                                    )}>
                                        {task.title}
                                    </h3>
                                    {task.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {task.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}


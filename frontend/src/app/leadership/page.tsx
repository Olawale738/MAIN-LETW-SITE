'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Crown, Book, Users, ChevronDown, ChevronRight, Play, Download, FileText,
  Youtube, X, Loader2, CheckCircle2, Circle, Trophy, ArrowLeft, Home
} from 'lucide-react'
import { leadershipApi, LeadershipModule, LeadershipContent } from '@/lib/api'

export default function LeadershipPage() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const [modules, setModules] = useState<LeadershipModule[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [completedContentIds, setCompletedContentIds] = useState<Set<string>>(new Set())
  const [markingComplete, setMarkingComplete] = useState<string | null>(null)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userName = localStorage.getItem('userName')

    if (!isLoggedIn) {
      router.push('/auth/register?redirect=/leadership')
    } else {
      setUser(userName || 'User')
      loadData()
    }
  }, [router])

  const loadData = async () => {
    try {
      const [modulesData, progressData] = await Promise.all([
        leadershipApi.getModules(),
        leadershipApi.getProgress()
      ])
      setModules(modulesData.modules)
      setCompletedContentIds(new Set(progressData.completed_content_ids))
      // Auto-expand first module
      if (modulesData.modules.length > 0) {
        setExpandedModules(new Set([modulesData.modules[0].id]))
      }
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  const handleToggleComplete = async (contentId: string) => {
    setMarkingComplete(contentId)
    try {
      if (completedContentIds.has(contentId)) {
        await leadershipApi.unmarkContentComplete(contentId)
        const newSet = new Set(completedContentIds)
        newSet.delete(contentId)
        setCompletedContentIds(newSet)
      } else {
        await leadershipApi.markContentComplete(contentId)
        const newSet = new Set(completedContentIds)
        newSet.add(contentId)
        setCompletedContentIds(newSet)
      }
    } catch (err) {
      console.error('Failed to update progress', err)
    } finally {
      setMarkingComplete(null)
    }
  }

  const handleDownload = async (content: LeadershipContent) => {
    const url = leadershipApi.getDownloadUrl(content.id)
    const token = localStorage.getItem('access_token')

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = content.file_name || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Download failed', err)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Calculate progress stats
  const totalContent = modules.reduce((acc, m) => acc + m.contents.length, 0)
  const completedCount = completedContentIds.size
  const progressPercent = totalContent > 0 ? Math.round((completedCount / totalContent) * 100) : 0

  const getModuleProgress = (module: LeadershipModule) => {
    const completed = module.contents.filter(c => completedContentIds.has(c.id)).length
    return { completed, total: module.contents.length }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome & Progress Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#140152] mb-2">Welcome back, {user}!</h2>
          <p className="text-gray-600">Continue your journey to becoming an effective servant leader.</p>
        </div>

        {/* Progress Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {/* Overall Progress Card */}
          <div className="bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm font-medium">Overall Progress</p>
                <p className="text-4xl font-bold text-white">{progressPercent}%</p>
              </div>
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-white/20"
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${progressPercent * 1.76} 176`}
                    className="text-[#f5bb00]"
                    strokeLinecap="round"
                  />
                </svg>
                <Trophy className="absolute inset-0 m-auto w-6 h-6 text-[#f5bb00]" />
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f5bb00] rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Modules Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <Book className="w-10 h-10 text-[#140152] mb-3" />
            <p className="text-gray-500 text-sm">Available Modules</p>
            <p className="text-3xl font-bold text-[#140152]">{modules.length}</p>
            <p className="text-[#f5bb00] text-sm font-medium mt-1">
              {modules.filter(m => getModuleProgress(m).completed === getModuleProgress(m).total && getModuleProgress(m).total > 0).length} completed
            </p>
          </div>

          {/* Content Completed Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
            <p className="text-gray-500 text-sm">Content Completed</p>
            <p className="text-3xl font-bold text-[#140152]">{completedCount} / {totalContent}</p>
            <p className="text-green-600 text-sm font-medium mt-1">Videos & Documents</p>
          </div>
        </div>

        {/* Modules Section */}
        <h3 className="text-xl font-bold text-[#140152] mb-6 flex items-center gap-2">
          <Book className="w-5 h-5" /> Training Modules
        </h3>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Book className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg font-medium">No modules available yet</p>
            <p className="text-gray-400 text-sm">Check back soon for new training content!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module, index) => {
              const { completed, total } = getModuleProgress(module)
              const isComplete = completed === total && total > 0
              const moduleProgress = total > 0 ? (completed / total) * 100 : 0

              return (
                <div
                  key={module.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${isComplete ? 'border-green-300' : 'border-gray-100'
                    }`}
                >
                  {/* Module Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-4"
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isComplete
                      ? 'bg-green-100 text-green-600'
                      : 'bg-[#140152]/10 text-[#140152]'
                      }`}>
                      {isComplete ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-[#140152] truncate">{module.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">{total} items</span>
                        <div className="flex-1 max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-[#f5bb00]'
                              }`}
                            style={{ width: `${moduleProgress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{completed}/{total}</span>
                      </div>
                    </div>
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Module Content */}
                  {expandedModules.has(module.id) && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50">
                      {module.description && (
                        <p className="text-gray-600 mb-5 text-sm leading-relaxed">{module.description}</p>
                      )}

                      {module.contents.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No content in this module yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {module.contents.map(content => {
                            const isContentComplete = completedContentIds.has(content.id)
                            return (
                              <div
                                key={content.id}
                                className={`flex items-start gap-4 p-4 rounded-xl transition-all bg-white border ${isContentComplete
                                  ? 'border-green-200 bg-green-50/50'
                                  : 'border-gray-100 hover:border-gray-200'
                                  }`}
                              >
                                {/* Completion Toggle */}
                                <button
                                  onClick={() => handleToggleComplete(content.id)}
                                  disabled={markingComplete === content.id}
                                  className="mt-1 flex-shrink-0"
                                >
                                  {markingComplete === content.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-[#140152]" />
                                  ) : isContentComplete ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-300 hover:text-[#140152] transition-colors" />
                                  )}
                                </button>

                                {content.content_type === 'video' ? (
                                  <>
                                    {content.youtube_thumbnail && (
                                      <div
                                        className="relative w-32 h-20 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 group"
                                        onClick={() => setPlayingVideo(content.youtube_url || null)}
                                      >
                                        <img
                                          src={content.youtube_thumbnail}
                                          alt={content.title}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                                          <Play className="w-8 h-8 text-white fill-white" />
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Youtube className="w-4 h-4 text-red-500" />
                                        <span className="text-xs text-red-500 font-medium">Video</span>
                                      </div>
                                      <h5 className={`font-semibold ${isContentComplete ? 'text-green-700' : 'text-[#140152]'}`}>
                                        {content.title}
                                      </h5>
                                      {content.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{content.description}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPlayingVideo(content.youtube_url || null)}
                                      className="border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                                    >
                                      <Play className="w-4 h-4 mr-1" /> Watch
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-blue-500 font-medium">Document</span>
                                      </div>
                                      <h5 className={`font-semibold ${isContentComplete ? 'text-green-700' : 'text-[#140152]'}`}>
                                        {content.title}
                                      </h5>
                                      <p className="text-xs text-gray-400">
                                        {content.file_name} {content.file_size && `(${formatFileSize(content.file_size)})`}
                                      </p>
                                      {content.description && (
                                        <p className="text-sm text-gray-500 mt-1">{content.description}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownload(content)}
                                      className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                    >
                                      <Download className="w-4 h-4 mr-1" /> Download
                                    </Button>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Motivation Footer */}
        <div className="mt-12 bg-[#140152] rounded-2xl p-8 text-center text-white">
          <p className="text-white/80 text-lg italic">
            "But whoever would be great among you must be your servant"
          </p>
          <p className="text-[#f5bb00] font-semibold mt-2">— Matthew 20:26</p>
        </div>
      </div>

      {/* Video Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2"
              onClick={() => setPlayingVideo(null)}
            >
              <span className="text-sm">Close</span>
              <X className="w-6 h-6" />
            </button>
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeId(playingVideo)}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
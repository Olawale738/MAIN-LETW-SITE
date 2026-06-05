'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    BookOpen, Users, MessageCircle, Calendar, Plus, ArrowRight,
    TrendingUp, Award, Clock, CheckCircle2, Lock, Home,
    AlertCircle, Loader2, PenSquare, Eye, FileText, Share2
} from 'lucide-react'

export default function FacilitatorDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')
    const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'resources'>('overview')

    useEffect(() => {
        const init = async () => {
            const loggedIn = localStorage.getItem('isLoggedIn')
            if (!loggedIn) {
                router.push('/auth/login?next=/bible-study/facilitator')
                return
            }
            setUserName(localStorage.getItem('userName') || 'Facilitator')
            setLoading(false)
        }
        init()
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#140152] to-[#7c3aed]">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#140152] to-[#220263]">
            {/* Header */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-[#7c3aed]" />
                            Bible Study Facilitator
                        </h1>
                        <p className="text-white/60 mt-1">Welcome back, {userName}! Lead your group with excellence.</p>
                    </div>
                    <Link href="/dashboard">
                        <button className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                            <Home className="w-5 h-5" />
                        </button>
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* Navigation Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
                    {[
                        { id: 'overview', label: 'Overview', icon: Eye },
                        { id: 'groups', label: 'My Groups', icon: Users },
                        { id: 'resources', label: 'Resources', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-[#7c3aed] text-white'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/60 text-sm font-semibold">Active Groups</p>
                                        <p className="text-3xl font-black text-white mt-2">1</p>
                                    </div>
                                    <Users className="w-8 h-8 text-[#7c3aed] opacity-40" />
                                </div>
                            </div>
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/60 text-sm font-semibold">Total Members</p>
                                        <p className="text-3xl font-black text-white mt-2">0</p>
                                    </div>
                                    <Award className="w-8 h-8 text-blue-400 opacity-40" />
                                </div>
                            </div>
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/60 text-sm font-semibold">Discussions</p>
                                        <p className="text-3xl font-black text-white mt-2">0</p>
                                    </div>
                                    <MessageCircle className="w-8 h-8 text-purple-400 opacity-40" />
                                </div>
                            </div>
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/60 text-sm font-semibold">Next Meeting</p>
                                        <p className="text-sm font-black text-white mt-2">No scheduled</p>
                                    </div>
                                    <Calendar className="w-8 h-8 text-amber-400 opacity-40" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-sm">
                            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-[#7c3aed]" />
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button className="bg-gradient-to-br from-[#7c3aed] to-[#0284c7] hover:shadow-lg transition-all rounded-xl p-6 text-white font-semibold flex items-center justify-between group">
                                    <span className="flex flex-col items-start">
                                        <span className="text-sm opacity-80">Create New</span>
                                        <span>Group Meeting</span>
                                    </span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="bg-gradient-to-br from-[#059669] to-[#0891b2] hover:shadow-lg transition-all rounded-xl p-6 text-white font-semibold flex items-center justify-between group">
                                    <span className="flex flex-col items-start">
                                        <span className="text-sm opacity-80">Start A</span>
                                        <span>Discussion</span>
                                    </span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="bg-gradient-to-br from-[#d97706] to-[#f59e0b] hover:shadow-lg transition-all rounded-xl p-6 text-white font-semibold flex items-center justify-between group">
                                    <span className="flex flex-col items-start">
                                        <span className="text-sm opacity-80">Share</span>
                                        <span>Resources</span>
                                    </span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Getting Started */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8">
                            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                                Getting Started as a Facilitator
                            </h2>
                            <div className="space-y-3 text-white/80 text-sm">
                                <div className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <p><strong>Review the facilitator guide</strong> — Learn best practices for leading Bible study discussions</p>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <p><strong>Create your first group</strong> — Set a name, description, and meeting schedule</p>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <p><strong>Invite members</strong> — Build your group by inviting church members</p>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <p><strong>Host your first meeting</strong> — Use the discussion tools to guide meaningful conversations</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white">My Study Groups</h2>
                            <button className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                                <Plus className="w-5 h-5" />
                                Create Group
                            </button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                            <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <p className="text-white/60 text-lg">No groups yet</p>
                            <p className="text-white/40 text-sm mt-1">Create your first Bible study group to get started</p>
                        </div>
                    </div>
                )}

                {/* Resources Tab */}
                {activeTab === 'resources' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-white">Facilitator Resources</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    title: 'Facilitator Guide',
                                    desc: 'Learn how to lead effective Bible study discussions',
                                    icon: BookOpen
                                },
                                {
                                    title: 'Discussion Templates',
                                    desc: 'Pre-made discussion questions and outlines',
                                    icon: FileText
                                },
                                {
                                    title: 'Scripture Resources',
                                    desc: 'Commentary, maps, and study materials',
                                    icon: BookOpen
                                },
                                {
                                    title: 'Share with Your Group',
                                    desc: 'Export and share resources with members',
                                    icon: Share2
                                }
                            ].map((resource, i) => {
                                const Icon = resource.icon
                                return (
                                    <button
                                        key={i}
                                        className="bg-white/10 border border-white/20 hover:bg-white/15 rounded-2xl p-6 text-left transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <Icon className="w-8 h-8 text-[#7c3aed]" />
                                            <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <h3 className="font-bold text-white text-lg">{resource.title}</h3>
                                        <p className="text-white/60 text-sm mt-1">{resource.desc}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Calendar, Users, Activity, TrendingUp } from 'lucide-react'

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[#140152]">Overview</h1>
                <p className="text-gray-500 mt-2">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Sermons</CardTitle>
                        <Video className="w-4 h-4 text-[#f5bb00]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#140152]">124</div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+4</span> this month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Upcoming Events</CardTitle>
                        <Calendar className="w-4 h-4 text-[#f5bb00]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#140152]">8</div>
                        <p className="text-xs text-gray-500 mt-1">Next: Worship Night (Oct 12)</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Users</CardTitle>
                        <Users className="w-4 h-4 text-[#f5bb00]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#140152]">1,203</div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+12%</span> vs last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg. Views</CardTitle>
                        <Activity className="w-4 h-4 text-[#f5bb00]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#140152]">845</div>
                        <p className="text-xs text-gray-500 mt-1">Per sermon</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Quick Actions Placeholders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-[#140152]">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 rounded-full bg-[#f5bb00]" />
                                        <div>
                                            <p className="text-sm font-medium text-[#140152]">New Sermon Uploaded</p>
                                            <p className="text-xs text-gray-500">2 hours ago</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-[#140152] to-[#1e0275] text-white">
                    <CardHeader>
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left group">
                            <Video className="w-6 h-6 mb-2 text-[#f5bb00]" />
                            <span className="block font-bold">Add Sermon</span>
                            <span className="text-xs text-white/60 group-hover:text-white/80">Upload or link new content</span>
                        </button>
                        <button className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left group">
                            <Calendar className="w-6 h-6 mb-2 text-[#f5bb00]" />
                            <span className="block font-bold">Create Event</span>
                            <span className="text-xs text-white/60 group-hover:text-white/80">Schedule upcoming service</span>
                        </button>
                    </CardContent>
                </Card>
            </div>
            {/* Sermon Upload Section */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-[#140152] mb-6">Content Management</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <SermonUpload />
                    <div className="space-y-6">
                        <h3 className="font-bold text-[#140152]">Pending Approvals</h3>
                        <PendingTestimonies />
                    </div>
                </div>
            </div>
        </div>
    )
}

function SermonUpload() {
    const [formData, setFormData] = React.useState({
        title: '',
        preacher: '',
        series: '',
        videoUrl: '', // In real app, this would be file upload
        description: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newSermon = {
            id: Date.now(),
            ...formData,
            date: new Date().toLocaleDateString(),
            type: 'upload',
            thumbnail: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800&q=80', // Default placeholder
        }

        const storedSermons = localStorage.getItem('sermons')
        const sermons = storedSermons ? JSON.parse(storedSermons) : []
        localStorage.setItem('sermons', JSON.stringify([newSermon, ...sermons]))

        alert('Sermon Uploaded Successfully!')
        setFormData({ title: '', preacher: '', series: '', videoUrl: '', description: '' })
    }

    return (
        <Card className="border-none shadow-md">
            <CardHeader>
                <CardTitle className="text-[#140152]">Upload Sermon</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        required
                        placeholder="Sermon Title"
                        className="w-full p-2 border rounded"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <input
                        required
                        placeholder="Preacher Name"
                        className="w-full p-2 border rounded"
                        value={formData.preacher}
                        onChange={e => setFormData({ ...formData, preacher: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            placeholder="Series (Optional)"
                            className="w-full p-2 border rounded"
                            value={formData.series}
                            onChange={e => setFormData({ ...formData, series: e.target.value })}
                        />
                        <input
                            required
                            placeholder="Video/YouTube URL"
                            className="w-full p-2 border rounded"
                            value={formData.videoUrl}
                            onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                        />
                    </div>
                    <textarea
                        required
                        placeholder="Description"
                        className="w-full p-2 border rounded h-24"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <button type="submit" className="w-full py-2 bg-[#140152] text-white rounded font-bold hover:bg-blue-900">
                        Upload Sermon
                    </button>
                </form>
            </CardContent>
        </Card>
    )
}

function PendingTestimonies() {
    const [testimonies, setTestimonies] = React.useState<any[]>([])

    React.useEffect(() => {
        const stored = localStorage.getItem('testimonies')
        if (stored) {
            setTestimonies(JSON.parse(stored).filter((t: any) => t.status === 'pending'))
        }
    }, [])

    const handleAction = (id: string, action: 'approved' | 'rejected') => {
        const stored = localStorage.getItem('testimonies')
        if (stored) {
            const all = JSON.parse(stored)
            const updated = all.map((t: any) => t.id === id ? { ...t, status: action } : t)
            localStorage.setItem('testimonies', JSON.stringify(updated))
            setTestimonies(updated.filter((t: any) => t.status === 'pending'))
        }
    }

    if (testimonies.length === 0) {
        return <div className="p-8 bg-white rounded-lg text-center text-gray-500 border border-gray-100">No pending approvals.</div>
    }

    return (
        <div className="grid gap-4">
            {testimonies.map((t) => (
                <Card key={t.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-[#140152]">{t.name} <span className="text-xs text-gray-400 font-normal">({t.date})</span></h3>
                        <p className="text-sm text-gray-600 mt-1">"{t.testimony}"</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction(t.id, 'approved')}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleAction(t.id, 'rejected')}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                        >
                            Reject
                        </button>
                    </div>
                </Card>
            ))}
        </div>
    )
}

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Edit, Trash2, Video } from 'lucide-react'
import Link from 'next/link'

// Mock Data
const sermons = [
    { id: 1, title: 'God Approved Faith', preacher: 'Ps. Johnson O.', date: '2023-10-01', series: 'Faith Series', type: 'YouTube' },
    { id: 2, title: 'Be the Example', preacher: 'Apostle Olawale', date: '2023-10-08', series: 'Leadership', type: 'Uploaded' },
    { id: 3, title: 'Hope and Urgency', preacher: 'Guest Minister', date: '2023-10-15', series: 'Hope', type: 'YouTube' },
]

export default function AdminSermonsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Sermons</h1>
                    <p className="text-gray-500 mt-1">Manage your video library and messages.</p>
                </div>
                <Button asChild className="bg-[#f5bb00] text-[#140152] hover:bg-[#d9a600] font-bold">
                    <Link href="/admin/sermons/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Sermon
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg w-fit">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search sermons..."
                            className="bg-transparent border-none outline-none text-sm w-64"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3">Title</th>
                                <th className="px-6 py-3">Preacher</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sermons.map((sermon) => (
                                <tr key={sermon.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-[#140152] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#140152]/10 flex items-center justify-center text-[#140152]">
                                            <Video className="w-4 h-4" />
                                        </div>
                                        {sermon.title}
                                    </td>
                                    <td className="px-6 py-4">{sermon.preacher}</td>
                                    <td className="px-6 py-4 text-gray-500">{sermon.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${sermon.type === 'YouTube' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {sermon.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}

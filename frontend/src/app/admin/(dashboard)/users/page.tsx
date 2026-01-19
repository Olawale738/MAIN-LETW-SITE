'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Search, Loader2, Mail, Shield, CheckCircle, Clock, XCircle } from 'lucide-react'
import { dashboardApi, AdminUser } from '@/lib/api'

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        loadUsers()
    }, [statusFilter])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const data = await dashboardApi.getUsers(statusFilter || undefined, 100)
            setUsers(data.users)
            setTotal(data.total)
        } catch (err) {
            console.error('Failed to load users', err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
            case 'pending_verification':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
            case 'suspended':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Suspended</span>
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>
        }
    }

    const getRoleBadge = (role: string) => {
        if (role === 'admin') {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">User</span>
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#140152]">Users</h1>
                    <p className="text-gray-500 text-sm">Manage registered users ({total} total)</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-white border p-2 rounded-lg flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm flex-1"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={statusFilter === '' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('')}
                    >
                        All
                    </Button>
                    <Button
                        variant={statusFilter === 'active' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('active')}
                    >
                        Active
                    </Button>
                    <Button
                        variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            <Card className="border-none shadow-md">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchQuery ? 'No users match your search' : 'No users found'}
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Services</th>
                                    <th className="px-6 py-3">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#140152]/10 flex items-center justify-center text-[#140152] font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[#140152]">{user.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {user.services?.length > 0 ? (
                                                    user.services.slice(0, 3).map((s, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                                                            {s}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-xs">None</span>
                                                )}
                                                {user.services?.length > 3 && (
                                                    <span className="text-xs text-gray-500">+{user.services.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

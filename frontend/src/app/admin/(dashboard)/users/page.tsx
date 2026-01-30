'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Search, Loader2, Mail, Shield, CheckCircle, Clock, XCircle, MoreVertical, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { dashboardApi, AdminUser } from '@/lib/api'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return

        try {
            await dashboardApi.updateUser(editingUser.id, {
                name: editingUser.name,
                role: editingUser.role,
                status: editingUser.status
            })
            toast.success('User updated successfully')
            setIsEditDialogOpen(false)
            loadUsers()
        } catch (err) {
            toast.error('Failed to update user')
            console.error(err)
        }
    }

    const handleDeleteUser = async () => {
        if (!deletingUser) return

        try {
            await dashboardApi.deleteUser(deletingUser.id)
            toast.success('User deleted successfully')
            setIsDeleteDialogOpen(false)
            loadUsers()
        } catch (err) {
            toast.error('Failed to delete user')
            console.error(err)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
            case 'pending':
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
                                    <th className="px-6 py-3 text-right">Actions</th>
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
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingUser(user)
                                                        setIsEditDialogOpen(true)
                                                    }}
                                                    className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeletingUser(user)
                                                        setIsDeleteDialogOpen(true)
                                                    }}
                                                    className="w-8 h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={e => setEditingUser({ ...editingUser!, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-[#140152]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    disabled
                                    className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select
                                    value={editingUser.role}
                                    onValueChange={(val) => setEditingUser({ ...editingUser!, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                    value={editingUser.status}
                                    onValueChange={(val) => setEditingUser({ ...editingUser!, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="pending">Pending Verification</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-[#140152] hover:bg-[#140152]/90">
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Confirm Deletion
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete <strong>{deletingUser?.name}</strong>?</p>
                        <p className="text-sm text-gray-500 mt-2">This action cannot be undone. All user data, including prayer requests and progress, will be permanently removed.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 text-white border-none">
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

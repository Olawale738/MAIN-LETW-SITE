'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Users, MessageSquare, Shield, Trash2, Plus, Edit2, Check, X, ChevronDown, ChevronUp, AlertCircle, Lock, Unlock } from 'lucide-react'
import { bibleStudyApi } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

interface GroupMember {
    id: string
    name: string
    joined_at: string
}

interface Moderator {
    id: string
    user_id: string
    user_name: string
    permissions: {
        can_pin?: boolean
        can_delete_others?: boolean
        can_mute?: boolean
        can_edit_settings?: boolean
    }
    assigned_at: string
}

interface GroupData {
    id: string
    name: string
    member_count: number
    members: GroupMember[]
}

export default function BibleStudyGroupsAdminPage() {
    const { showToast, ToastComponent } = useToast()

    const [loading, setLoading] = useState(true)
    const [groups, setGroups] = useState<GroupData[]>([])
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
    const [groupModerators, setGroupModerators] = useState<Record<string, Moderator[]>>({})
    const [loadingModerators, setLoadingModerators] = useState<Set<string>>(new Set())

    // Moderator assignment state
    const [assigningGroupId, setAssigningGroupId] = useState<string | null>(null)
    const [selectedMemberId, setSelectedMemberId] = useState('')
    const [permissions, setPermissions] = useState({
        can_pin: false,
        can_delete_others: true,
        can_mute: false,
        can_edit_settings: false,
    })
    const [assigning, setAssigning] = useState(false)

    // Moderator edit state
    const [editingModId, setEditingModId] = useState<string | null>(null)
    const [editPermissions, setEditPermissions] = useState({
        can_pin: false,
        can_delete_others: true,
        can_mute: false,
        can_edit_settings: false,
    })
    const [saving, setSaving] = useState(false)

    // Fetch groups and info
    const loadGroupsAndMembers = useCallback(async () => {
        setLoading(true)
        try {
            const settings = await bibleStudyApi.getPublicSettings()
            const groups_list = (settings.study_groups || [])
                .filter(g => typeof g.id === 'string') // Ensure valid groups
                .map(g => ({
                    id: g.id,
                    name: g.name,
                    member_count: g.size || 0,
                    members: [] as GroupMember[]
                }))

            // Fetch actual members for each group
            const groupsWithMembers = await Promise.all(
                groups_list.map(async (group) => {
                    try {
                        const info = await bibleStudyApi.getGroupInfo(group.id)
                        return {
                            ...group,
                            member_count: info.members?.length || 0,
                            members: info.members || []
                        }
                    } catch (err) {
                        console.log(`Could not load members for group ${group.id}:`, err)
                        return group
                    }
                })
            )

            setGroups(groupsWithMembers)
        } catch (err) {
            console.error(err)
            showToast('Failed to load groups', 'error')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    // Load moderators for a specific group
    const loadModerators = useCallback(async (groupId: string) => {
        const newLoading = new Set(loadingModerators)
        newLoading.add(groupId)
        setLoadingModerators(newLoading)

        try {
            const mods = await bibleStudyApi.getGroupModerators(groupId)
            setGroupModerators(prev => ({ ...prev, [groupId]: mods }))
        } catch (err) {
            console.error(err)
            // Skip toast for moderator loading, it's optional
        } finally {
            const updated = new Set(loadingModerators)
            updated.delete(groupId)
            setLoadingModerators(updated)
        }
    }, [loadingModerators])

    useEffect(() => {
        loadGroupsAndMembers()
    }, [loadGroupsAndMembers])

    const toggleGroupExpanded = async (groupId: string) => {
        if (expandedGroupId === groupId) {
            setExpandedGroupId(null)
        } else {
            setExpandedGroupId(groupId)
            if (!groupModerators[groupId]) {
                await loadModerators(groupId)
            }
        }
    }

    // Assign moderator
    const assignModerator = async (groupId: string) => {
        if (!selectedMemberId) {
            showToast('Please select a member', 'error')
            return
        }

        setAssigning(true)
        try {
            await bibleStudyApi.assignGroupModerator(groupId, selectedMemberId, permissions)
            showToast('Moderator assigned successfully!', 'success')
            setSelectedMemberId('')
            setPermissions({
                can_pin: false,
                can_delete_others: true,
                can_mute: false,
                can_edit_settings: false,
            })
            setAssigningGroupId(null)
            await loadModerators(groupId)
        } catch (err: any) {
            showToast(err?.message || 'Failed to assign moderator', 'error')
        } finally {
            setAssigning(false)
        }
    }

    // Update moderator permissions
    const updateModeratorPerms = async (groupId: string, modId: string, userId: string) => {
        setSaving(true)
        try {
            await bibleStudyApi.updateModeratorPermissions(groupId, userId, editPermissions)
            showToast('Moderator permissions updated!', 'success')
            setEditingModId(null)
            await loadModerators(groupId)
        } catch (err: any) {
            showToast(err?.message || 'Failed to update permissions', 'error')
        } finally {
            setSaving(false)
        }
    }

    // Remove moderator
    const removeModerator = async (groupId: string, userId: string, modName: string) => {
        if (!confirm(`Remove ${modName} as moderator?`)) return

        try {
            await bibleStudyApi.removeGroupModerator(groupId, userId)
            showToast(`${modName} removed as moderator`, 'success')
            await loadModerators(groupId)
        } catch (err: any) {
            showToast(err?.message || 'Failed to remove moderator', 'error')
        }
    }

    const PermissionCheckbox = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                checked={value}
                onChange={e => onChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-xs text-gray-700 font-medium">{label}</span>
        </label>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#128c7e] mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading groups...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl space-y-6 pb-12">
            <ToastComponent />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-2">
                    <Users className="w-8 h-8 text-[#128c7e]" />
                    Bible Study Groups Management
                </h1>
                <p className="text-gray-600">Manage group members and assign moderators with granular permissions</p>
            </div>

            {/* Groups List */}
            <div className="space-y-3">
                {groups.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">No groups created yet</p>
                        <p className="text-xs text-gray-400 mt-1">Create groups in the Bible Study admin page first</p>
                    </div>
                ) : (
                    groups.map(group => (
                        <motion.div
                            key={group.id}
                            layout
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroupExpanded(group.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-lg bg-[#128c7e] text-white flex items-center justify-center flex-shrink-0">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h3 className="font-bold text-[#140152] text-base">{group.name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{group.member_count} members</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {loadingModerators.has(group.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    ) : (
                                        <>
                                            {groupModerators[group.id] && (
                                                <span className="text-xs font-bold text-[#128c7e] bg-blue-50 px-2.5 py-1 rounded-full">
                                                    {groupModerators[group.id].length} moderator{groupModerators[group.id].length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {expandedGroupId === group.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedGroupId === group.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-200 bg-gray-50 px-6 py-4"
                                    >
                                        <div className="space-y-6">
                                            {/* Current Moderators Section */}
                                            <div>
                                                <h4 className="font-bold text-[#140152] text-sm mb-3 flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-[#128c7e]" />
                                                    Current Moderators
                                                </h4>

                                                {loadingModerators.has(group.id) ? (
                                                    <div className="text-center py-4">
                                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                                                    </div>
                                                ) : groupModerators[group.id]?.length === 0 ? (
                                                    <div className="bg-white rounded-lg border border-dashed border-gray-200 p-4 text-center">
                                                        <p className="text-xs text-gray-500">No moderators assigned yet</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {groupModerators[group.id]?.map(mod => (
                                                            <div key={mod.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                                                {editingModId === mod.id ? (
                                                                    // Edit Mode
                                                                    <div className="space-y-3">
                                                                        <p className="font-semibold text-sm text-[#140152]">{mod.user_name}</p>
                                                                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                                                                            <PermissionCheckbox
                                                                                label="Can pin messages"
                                                                                value={editPermissions.can_pin}
                                                                                onChange={v => setEditPermissions(p => ({ ...p, can_pin: v }))}
                                                                            />
                                                                            <PermissionCheckbox
                                                                                label="Can delete other messages"
                                                                                value={editPermissions.can_delete_others}
                                                                                onChange={v => setEditPermissions(p => ({ ...p, can_delete_others: v }))}
                                                                            />
                                                                            <PermissionCheckbox
                                                                                label="Can mute members"
                                                                                value={editPermissions.can_mute}
                                                                                onChange={v => setEditPermissions(p => ({ ...p, can_mute: v }))}
                                                                            />
                                                                            <PermissionCheckbox
                                                                                label="Can edit group settings"
                                                                                value={editPermissions.can_edit_settings}
                                                                                onChange={v => setEditPermissions(p => ({ ...p, can_edit_settings: v }))}
                                                                            />
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                onClick={() => updateModeratorPerms(group.id, mod.id, mod.user_id)}
                                                                                disabled={saving}
                                                                                className="bg-green-600 text-white hover:bg-green-700 text-xs"
                                                                            >
                                                                                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                                                                                Save
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => setEditingModId(null)}
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                            >
                                                                                <X className="w-3 h-3 mr-1" /> Cancel
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // View Mode
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <p className="font-semibold text-sm text-[#140152]">{mod.user_name}</p>
                                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                                {mod.permissions.can_pin && (
                                                                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">📌 Can pin</span>
                                                                                )}
                                                                                {mod.permissions.can_delete_others && (
                                                                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">🗑️ Can delete</span>
                                                                                )}
                                                                                {mod.permissions.can_mute && (
                                                                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">🔇 Can mute</span>
                                                                                )}
                                                                                {mod.permissions.can_edit_settings && (
                                                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">⚙️ Can edit</span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[10px] text-gray-500 mt-1.5">Assigned: {new Date(mod.assigned_at).toLocaleDateString()}</p>
                                                                        </div>
                                                                        <div className="flex gap-1.5">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const perms: typeof editPermissions = {
                                                                                        can_pin: mod.permissions.can_pin ?? false,
                                                                                        can_delete_others: mod.permissions.can_delete_others ?? true,
                                                                                        can_mute: mod.permissions.can_mute ?? false,
                                                                                        can_edit_settings: mod.permissions.can_edit_settings ?? false,
                                                                                    }
                                                                                    setEditingModId(mod.id)
                                                                                    setEditPermissions(perms)
                                                                                }}
                                                                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                                                                title="Edit permissions"
                                                                            >
                                                                                <Edit2 className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => removeModerator(group.id, mod.user_id, mod.user_name)}
                                                                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                                                                title="Remove moderator"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Assign New Moderator */}
                                            <div className="border-t border-gray-200 pt-4">
                                                <h4 className="font-bold text-[#140152] text-sm mb-3 flex items-center gap-2">
                                                    <Plus className="w-4 h-4 text-[#128c7e]" />
                                                    Assign New Moderator
                                                </h4>

                                                {assigningGroupId === group.id ? (
                                                    <div className="bg-white rounded-lg border border-[#128c7e] p-4 space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-2">Select Member</label>
                                                            {(() => {
                                                                const members = group.members || []
                                                                const moderatorIds = new Set(groupModerators[group.id]?.map(m => m.user_id) || [])
                                                                const availableMembers = members.filter(m => !moderatorIds.has(m.id))

                                                                return (
                                                                    <>
                                                                        <select
                                                                            value={selectedMemberId}
                                                                            onChange={e => setSelectedMemberId(e.target.value)}
                                                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#128c7e] bg-white text-gray-900"
                                                                        >
                                                                            <option value="">Choose a member...</option>
                                                                            {availableMembers.length === 0 ? (
                                                                                <option disabled>No members available</option>
                                                                            ) : (
                                                                                availableMembers.map(m => (
                                                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                                                ))
                                                                            )}
                                                                        </select>
                                                                        {availableMembers.length === 0 && members.length > 0 && (
                                                                            <p className="text-[10px] text-amber-600 mt-1">✓ All members are already moderators</p>
                                                                        )}
                                                                        {members.length === 0 && (
                                                                            <p className="text-[10px] text-gray-500 mt-1">No members in this group yet</p>
                                                                        )}
                                                                    </>
                                                                )
                                                            })()}
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-2">Permissions</label>
                                                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                                                <PermissionCheckbox
                                                                    label="Can pin messages"
                                                                    value={permissions.can_pin}
                                                                    onChange={v => setPermissions(p => ({ ...p, can_pin: v }))}
                                                                />
                                                                <PermissionCheckbox
                                                                    label="Can delete other messages (default: enabled)"
                                                                    value={permissions.can_delete_others}
                                                                    onChange={v => setPermissions(p => ({ ...p, can_delete_others: v }))}
                                                                />
                                                                <PermissionCheckbox
                                                                    label="Can mute members"
                                                                    value={permissions.can_mute}
                                                                    onChange={v => setPermissions(p => ({ ...p, can_mute: v }))}
                                                                />
                                                                <PermissionCheckbox
                                                                    label="Can edit group settings"
                                                                    value={permissions.can_edit_settings}
                                                                    onChange={v => setPermissions(p => ({ ...p, can_edit_settings: v }))}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => assignModerator(group.id)}
                                                                disabled={!selectedMemberId || assigning}
                                                                className="bg-[#128c7e] text-white hover:bg-[#0f7a6e] text-sm flex-1"
                                                            >
                                                                {assigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                                                Assign Moderator
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setAssigningGroupId(null)
                                                                    setSelectedMemberId('')
                                                                }}
                                                                variant="outline"
                                                                className="text-sm"
                                                            >
                                                                <X className="w-4 h-4 mr-1" /> Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => setAssigningGroupId(group.id)}
                                                        variant="outline"
                                                        className="border-[#128c7e] text-[#128c7e] hover:bg-[#128c7e] hover:text-white text-sm w-full"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" /> Add Moderator
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Info Box */}
            {groups.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <p className="font-semibold">💡 How Moderators Work</p>
                        <ul className="mt-2 space-y-1 text-xs">
                            <li>• Moderators are group chat leaders with configurable permissions</li>
                            <li>• With <strong>"Can delete other messages"</strong> enabled, they can delete any message in the chat</li>
                            <li>• Other permissions (pin, mute, edit settings) are prepared for future features</li>
                            <li>• Members can only join groups if <strong>"Open for new members"</strong> is enabled in group settings</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

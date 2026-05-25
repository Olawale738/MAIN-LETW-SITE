'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, UserCheck, UserX, Crown, Shield, Users,
  CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle,
} from 'lucide-react'
import {
  adminListUsers, adminListLeaders, adminAssignRole, adminRevokeRole,
  type AdminUser,
} from '@/lib/dept-api'

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-medium ${ok ? 'bg-green-600' : 'bg-red-600'}`}>
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {msg}
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  choirmaster:          'Choirmaster',
  youth_leader:         'Youth Leader',
  children_coordinator: 'Children Coordinator',
  admin:                'Admin',
  user:                 'Member',
}

const ROLE_COLORS: Record<string, string> = {
  choirmaster:          'bg-indigo-100 text-indigo-700',
  youth_leader:         'bg-amber-100 text-amber-700',
  children_coordinator: 'bg-violet-100 text-violet-700',
  admin:                'bg-red-100 text-red-700',
  user:                 'bg-gray-100 text-gray-600',
}

const ASSIGNABLE_ROLES = [
  { value: 'choirmaster',          label: 'Choirmaster',          color: 'text-indigo-600' },
  { value: 'youth_leader',         label: 'Youth Leader',         color: 'text-amber-600' },
  { value: 'children_coordinator', label: 'Children Coordinator', color: 'text-violet-600' },
]

export default function NominationsPage() {
  const [users, setUsers]     = useState<AdminUser[]>([])
  const [leaders, setLeaders] = useState<AdminUser[]>([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  // Role assignment modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedRole, setSelectedRole] = useState('choirmaster')
  const [assigning, setAssigning]       = useState(false)
  const [revoking, setRevoking]         = useState<string | null>(null)

  const toast$ = (msg: string, ok = true) => setToast({ msg, ok })

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, l] = await Promise.all([adminListUsers(), adminListLeaders()])
      setUsers(u); setLeaders(l)
    } catch (e: unknown) {
      toast$((e as Error).message || 'Failed to load users', false)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Search with debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) { loadAll(); return }
      setLoading(true)
      try {
        const u = await adminListUsers(search)
        setUsers(u)
      } catch { /* silent */ } finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [search, loadAll])

  async function handleAssign() {
    if (!selectedUser) return
    setAssigning(true)
    try {
      await adminAssignRole(selectedUser.id, selectedRole)
      toast$(`${selectedUser.name} assigned as ${ROLE_LABELS[selectedRole]}`)
      setSelectedUser(null)
      await loadAll()
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to assign role', false)
    } finally { setAssigning(false) }
  }

  async function handleRevoke(leader: AdminUser) {
    if (!confirm(`Remove ${leader.name}'s leadership role? They will revert to regular member.`)) return
    setRevoking(leader.id)
    try {
      await adminRevokeRole(leader.id)
      toast$(`${leader.name}'s role revoked`)
      await loadAll()
    } catch (err: unknown) {
      toast$((err as Error).message || 'Failed to revoke role', false)
    } finally { setRevoking(null) }
  }

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Crown size={22} className="text-amber-500" />
          Leadership Nominations
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Assign or revoke Choirmaster, Youth Leader, and Children Coordinator roles.
          Only admins can perform these actions.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 w-fit">
          <AlertTriangle size={13} /> Role changes take effect immediately and are enforced at the API level.
        </div>
      </div>

      {/* ── Current Leaders ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Shield size={18} className="text-indigo-500" /> Current Leaders
          </h2>
          <button onClick={loadAll} disabled={loading} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {leaders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <Crown size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No leadership roles assigned yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.map(l => (
              <div key={l.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                      {l.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 leading-tight">{l.name}</div>
                      <div className="text-xs text-gray-400">{l.email}</div>
                    </div>
                  </div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${ROLE_COLORS[l.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[l.role] ?? l.role}
                  </span>
                </div>
                <button
                  onClick={() => handleRevoke(l)}
                  disabled={revoking === l.id}
                  className="p-2 rounded-xl hover:bg-red-50 text-red-400 flex-shrink-0 transition-colors disabled:opacity-50"
                  title="Revoke role"
                >
                  {revoking === l.id ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Assign Role ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <UserCheck size={18} className="text-green-500" /> Assign Leadership Role
        </h2>

        {/* Search users */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
        </div>

        {/* User table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={28} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">{search ? 'No users match your search' : 'No users found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Current Role</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${u.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role === 'admin' ? (
                          <span className="text-xs text-gray-300 italic">—</span>
                        ) : (
                          <button
                            onClick={() => { setSelectedUser(u); setSelectedRole('choirmaster') }}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Assign Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Role Assignment Modal ─────────────────────────────────────────── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Assign Leadership Role</h3>
            <p className="text-sm text-gray-500 mb-4">
              Assigning a role to <span className="font-semibold text-gray-700">{selectedUser.name}</span>.
              This will override their current role.
            </p>

            <div className="space-y-2 mb-5">
              {ASSIGNABLE_ROLES.map(r => (
                <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${selectedRole === r.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={selectedRole === r.value}
                    onChange={() => setSelectedRole(r.value)}
                    className="accent-indigo-600"
                  />
                  <Crown size={16} className={r.color} />
                  <span className={`font-medium text-sm ${r.color}`}>{r.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {assigning ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  )
}

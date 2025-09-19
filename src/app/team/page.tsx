'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { 
  UsersIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function TeamPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error deleting user:', error)
      } else {
        setUsers(users.filter(u => u.id !== userId))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user role:', error)
      } else {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      }
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-electric-purple text-soft-white'
      case 'member':
        return 'bg-neon-blue text-midnight-blue'
      default:
        return 'bg-light-gray text-midnight-blue'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-soft-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-soft-white">Please sign in to access team management.</div>
      </div>
    )
  }

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-soft-white">Team Management</h1>
            <p className="text-light-gray">Manage team members and their roles</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Member
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-dark-gray rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-gray" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  className="w-full pl-10 pr-4 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:ring-2 focus:ring-electric-purple focus:border-electric-purple"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:ring-2 focus:ring-electric-purple focus:border-electric-purple"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((member) => (
            <div key={member.id} className="bg-dark-gray rounded-lg p-6 hover:bg-midnight-blue transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-electric-purple flex items-center justify-center mr-4">
                    <span className="text-lg font-medium text-soft-white">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-soft-white">{member.name}</h3>
                    <p className="text-sm text-light-gray">{member.email}</p>
                  </div>
                </div>
                {isAdmin && member.id !== user.id && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingUser(member)}
                      className="p-1 text-light-gray hover:text-soft-white transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(member.id)}
                      className="p-1 text-light-gray hover:text-coral transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 text-light-gray mr-2" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
                <div className="text-xs text-light-gray">
                  Joined {new Date(member.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-light-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-white mb-2">No team members found</h3>
            <p className="text-light-gray mb-6">
              {searchTerm || roleFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No team members have been added yet.'
              }
            </p>
            {isAdmin && !searchTerm && roleFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Member
              </button>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-transparent-black flex items-center justify-center z-50">
            <div className="bg-dark-gray rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-soft-white mb-4">Edit User Role</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">
                    User
                  </label>
                  <p className="text-light-gray">{editingUser.name} ({editingUser.email})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'member'})}
                    className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:ring-2 focus:ring-electric-purple focus:border-electric-purple"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-light-gray hover:text-soft-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateRole(editingUser.id, editingUser.role)
                      setEditingUser(null)
                    }}
                    className="px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                  >
                    Update Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

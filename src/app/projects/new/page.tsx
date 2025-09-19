'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import MultiSelectMembers from '@/components/MultiSelectMembers'
import SecurityGuard from '@/components/SecurityGuard'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function NewProjectPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('planning')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [projectManager, setProjectManager] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('name')
      
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // Security check will be handled by SecurityGuard

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!user) {
      setError('You must be logged in to create a project')
      setLoading(false)
      return
    }

    if (!projectManager) {
      setError('Please select a project manager')
      setLoading(false)
      return
    }

    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          created_by: user.id
        })
        .select()
        .single()

      if (projectError) {
        throw projectError
      }

      // Add project manager
      await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: projectManager.id,
          role: 'project-manager'
        })

      // Add other members
      if (selectedMembers.length > 0) {
        const memberInserts = selectedMembers
          .filter(member => member.id !== projectManager.id)
          .map(member => ({
            project_id: project.id,
            user_id: member.id,
            role: 'member'
          }))

        if (memberInserts.length > 0) {
          await supabase
            .from('project_members')
            .insert(memberInserts)
        }
      }

      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-soft-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-soft-white mb-4">Please sign in</h1>
          <a 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <SecurityGuard requiredRole="team-lead">
        <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center text-electric-purple hover:text-neon-blue transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-soft-white">Create New Project</h1>
          <p className="text-light-gray mt-2">Set up a new project and assign team members</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-dark-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-soft-white mb-4">Project Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:border-electric-purple"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-light-gray mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:border-electric-purple"
                placeholder="Enter project description"
              />
            </div>
          </div>

          <div className="bg-dark-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold text-soft-white mb-4">Team Assignment</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Project Manager *
                </label>
                <select
                  value={projectManager?.id || ''}
                  onChange={(e) => {
                    const selectedUser = users.find(u => u.id === e.target.value)
                    setProjectManager(selectedUser || null)
                  }}
                  required
                  className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                >
                  <option value="">Select Project Manager</option>
                  {users
                    .filter(u => u.role === 'project-manager' || u.role === 'team-lead')
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Team Members
                </label>
                <MultiSelectMembers
                  members={users.filter(u => u.role === 'member')}
                  selectedMembers={selectedMembers}
                  onSelectionChange={setSelectedMembers}
                  placeholder="Select team members..."
                />
                <p className="text-xs text-light-gray mt-2">
                  Select team members to add to this project
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-coral bg-opacity-20 border border-coral rounded-lg p-4">
              <p className="text-coral">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Link
              href="/projects"
              className="px-6 py-2 border border-light-gray text-light-gray rounded-lg hover:bg-midnight-blue transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
        </div>
      </SecurityGuard>
    </DashboardLayout>
  )
}

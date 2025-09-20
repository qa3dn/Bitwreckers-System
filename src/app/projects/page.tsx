'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProjectColorCoding from '@/components/ProjectColorCoding'
import { createClient } from '@/lib/supabase/client'
import { Project } from '@/types/database'
import { 
  FolderIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UserMinusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ProjectsPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [projectMembers, setProjectMembers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: '',
    project_manager: ''
  })
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_manager:users!projects_project_manager_fkey(name, email),
          project_members:project_members(
            id,
            user_id,
            role,
            user:users(name, email, member_id)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
      } else {
        setProjects(data || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, member_id, role')
        .order('name')

      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setAllUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      project_manager: project.project_manager || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateProject = async () => {
    if (!editingProject) return

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editForm.name,
          description: editForm.description,
          status: editForm.status,
          project_manager: editForm.project_manager
        })
        .eq('id', editingProject.id)

      if (error) throw error

      setShowEditModal(false)
      setEditingProject(null)
      fetchProjects()
      alert('Project updated successfully!')
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Error updating project')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return

    try {
      // First delete project members
      const { error: membersError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)

      if (membersError) {
        console.error('Error deleting project members:', membersError)
      }

      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      fetchProjects()
      alert('Project deleted successfully!')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error deleting project')
    }
  }

  const handleManageMembers = async (project: Project) => {
    setEditingProject(project)
    setProjectMembers(project.project_members || [])
    setShowMembersModal(true)
    await fetchAllUsers()
  }

  const handleAddMember = async (userId: string) => {
    if (!editingProject) return

    try {
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: editingProject.id,
          user_id: userId,
          role: 'member'
        })

      if (error) throw error

      // Refresh project members
      const { data } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          user:users(name, email, member_id)
        `)
        .eq('project_id', editingProject.id)

      setProjectMembers(data || [])
      fetchProjects()
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Error adding member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      // Refresh project members
      const { data } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          user:users(name, email, member_id)
        `)
        .eq('project_id', editingProject?.id)

      setProjectMembers(data || [])
      fetchProjects()
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Error removing member')
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-aqua-green text-midnight-blue'
      case 'in_progress':
        return 'bg-neon-blue text-midnight-blue'
      case 'planning':
        return 'bg-light-gray text-midnight-blue'
      case 'on_hold':
        return 'bg-coral text-soft-white'
      default:
        return 'bg-light-gray text-midnight-blue'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress'
      case 'on_hold':
        return 'On Hold'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
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
        <div className="text-soft-white">Please sign in to access projects.</div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-soft-white">Projects</h1>
            <p className="text-light-gray">Manage and track your team's projects</p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-dark-gray rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-gray" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full pl-10 pr-4 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:ring-2 focus:ring-electric-purple focus:border-electric-purple"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:ring-2 focus:ring-electric-purple focus:border-electric-purple"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-dark-gray rounded-lg p-6 hover:bg-midnight-blue transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <ProjectColorCoding project={project} size="lg" showLabel={false} className="mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-soft-white">{project.name}</h3>
                    <p className="text-sm text-light-gray">
                      {project.start_date && new Date(project.start_date).toLocaleDateString()}
                      {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                  {userProfile?.role === 'team_leader' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditProject(project)}
                        className="p-1 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit Project"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleManageMembers(project)}
                        className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                        title="Manage Members"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete Project"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {project.description && (
                <p className="text-sm text-light-gray mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-light-gray">
                  <UserIcon className="h-4 w-4 mr-1" />
                  <span>Created by {project.created_by}</span>
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-electric-purple hover:text-neon-blue text-sm font-medium transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderIcon className="h-12 w-12 text-light-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-white mb-2">No projects found</h3>
            <p className="text-light-gray mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first project.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                href="/projects/new"
                className="inline-flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Project
              </Link>
            )}
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditModal && editingProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-gray p-6 rounded-lg w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-soft-white mb-4">Edit Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    Project Manager
                  </label>
                  <select
                    value={editForm.project_manager}
                    onChange={(e) => setEditForm({...editForm, project_manager: e.target.value})}
                    className="w-full px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                  >
                    <option value="">Select Project Manager</option>
                    {allUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.member_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateProject}
                  className="flex-1 bg-electric-purple text-soft-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Update Project
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingProject(null)
                  }}
                  className="flex-1 bg-gray-600 text-soft-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Members Modal */}
        {showMembersModal && editingProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-gray p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-soft-white mb-4">
                Manage Members - {editingProject.name}
              </h3>
              
              {/* Current Members */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-soft-white mb-3">Current Members</h4>
                <div className="space-y-2">
                  {projectMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-midnight-blue p-3 rounded-lg">
                      <div>
                        <div className="text-soft-white font-medium">{member.user.name}</div>
                        <div className="text-light-gray text-sm">{member.user.email} ({member.user.member_id})</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-electric-purple text-soft-white px-2 py-1 rounded">
                          {member.role}
                        </span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove Member"
                        >
                          <UserMinusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Member */}
              <div>
                <h4 className="text-lg font-semibold text-soft-white mb-3">Add New Member</h4>
                <div className="space-y-2">
                  {allUsers
                    .filter(user => !projectMembers.some(member => member.user_id === user.id))
                    .map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-midnight-blue p-3 rounded-lg">
                        <div>
                          <div className="text-soft-white font-medium">{user.name}</div>
                          <div className="text-light-gray text-sm">{user.email} ({user.member_id})</div>
                        </div>
                        <button
                          onClick={() => handleAddMember(user.id)}
                          className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                          title="Add Member"
                        >
                          <UserPlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowMembersModal(false)
                    setEditingProject(null)
                  }}
                  className="px-4 py-2 bg-gray-600 text-soft-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

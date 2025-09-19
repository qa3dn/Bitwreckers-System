'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { Project, User, Task } from '@/types/database'
import { 
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  FlagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

const priorities = [
  { value: 'low', label: 'Low', color: 'text-green-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' }
]

export default function NewTaskPage() {
  const { userProfile } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
    task_type: 'project'
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch projects based on user role
      let projectsQuery = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      // If user is project manager, only show their assigned projects
      if (userProfile?.role === 'project-manager') {
        const { data: projectMembers } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', userProfile.id)
          .eq('role', 'project-manager')

        if (projectMembers && projectMembers.length > 0) {
          const projectIds = projectMembers.map(pm => pm.project_id)
          projectsQuery = projectsQuery.in('id', projectIds)
        } else {
          // No projects assigned, set empty array
          setProjects([])
        }
      }

      const { data: projectsData, error: projectsError } = await projectsQuery

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
      }

      // Fetch users for assignment
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('id', userProfile?.id) // Exclude current user
        .order('name', { ascending: true })

      if (usersError) {
        console.error('Error fetching users:', usersError)
      }

      setProjects(projectsData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userProfile?.id) {
      alert('User not authenticated')
      return
    }

    // Check if user has permission
    if (!['team-lead', 'project-manager'].includes(userProfile.role)) {
      alert('You do not have permission to create tasks')
      return
    }

    // Validate required fields
    if (!formData.project_id || !formData.title || !formData.assigned_to) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: formData.project_id,
          title: formData.title,
          description: formData.description,
          assigned_to: formData.assigned_to,
          priority: formData.priority,
          due_date: formData.due_date,
          task_type: formData.task_type,
          created_by: userProfile.id,
          status: 'todo'
        })

      if (error) {
        console.error('Error creating task:', error)
        alert('Error creating task')
        return
      }

      alert('Task created successfully!')
      
      // Reset form
      setFormData({
        project_id: '',
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
        task_type: 'project'
      })

      // Redirect to tasks page
      window.location.href = '/tasks'
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Error creating task')
    } finally {
      setSaving(false)
    }
  }

  // Check if user has permission
  if (!userProfile) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="text-soft-white">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!['team-lead', 'project-manager'].includes(userProfile.role)) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="text-center">
            <XMarkIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-soft-white mb-2">Access Denied</h2>
            <p className="text-light-gray mb-4">You don't have permission to create tasks</p>
            <p className="text-light-gray mb-6">Only Team Leads and Project Managers can create tasks</p>
            <a 
              href="/tasks" 
              className="inline-flex items-center px-6 py-3 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
            >
              View Tasks
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="text-soft-white">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-midnight-blue p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-soft-white mb-2">New Task</h1>
                <p className="text-light-gray">Create a new task and assign it to team members</p>
              </div>
              <a
                href="/tasks"
                className="bg-gray-600 text-soft-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Cancel
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="bg-dark-gray rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  <DocumentTextIcon className="h-5 w-5 inline mr-2" />
                  Project *
                </label>
                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white focus:outline-none focus:border-electric-purple"
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && userProfile.role === 'project-manager' && (
                  <p className="text-yellow-500 text-sm mt-1">
                    No projects assigned to you. Contact a Team Lead to assign you to projects.
                  </p>
                )}
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter task title"
                  className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white focus:outline-none focus:border-electric-purple"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter task description"
                  className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white focus:outline-none focus:border-electric-purple resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assign To */}
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    <UserIcon className="h-5 w-5 inline mr-2" />
                    Assign To *
                  </label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    required
                    className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white focus:outline-none focus:border-electric-purple"
                  >
                    <option value="">Select Team Member</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({getDepartmentLabel(user.department || 'general')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-2">
                    <FlagIcon className="h-5 w-5 inline mr-2" />
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white focus:outline-none focus:border-electric-purple"
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">
                  <CalendarIcon className="h-5 w-5 inline mr-2" />
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full bg-midnight-blue border border-gray-600 rounded-lg px-3 py-2 text-soft-white focus:outline-none focus:border-electric-purple"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-700">
                <button
                  type="submit"
                  disabled={saving || projects.length === 0}
                  className="bg-electric-purple text-soft-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Helper function to get department label
function getDepartmentLabel(department: string): string {
  const departments = {
    'pr': 'PR',
    'media': 'Media',
    'dev': 'Development',
    'management': 'Management',
    'general': 'General'
  }
  return departments[department as keyof typeof departments] || 'General'
}

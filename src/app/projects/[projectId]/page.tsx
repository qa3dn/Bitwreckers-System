'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProgressOverview from '@/components/ProgressOverview'
import { createClient } from '@/lib/supabase/client'
import { Project, Task, User, ProjectMember } from '@/types/database'
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (user && projectId) {
      fetchProjectData()
    }
  }, [user, projectId])

  const fetchProjectData = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) {
        setError('Project not found')
        return
      }

      setProject(projectData)

      // Fetch tasks for this project
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setTasks(tasksData || [])

      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')

      // Fetch project members
      const { data: membersData } = await supabase
        .from('project_members')
        .select(`
          *,
          user:users(*)
        `)
        .eq('project_id', projectId)

      setUsers(usersData || [])
      setProjectMembers(membersData || [])
    } catch (error) {
      console.error('Error fetching project data:', error)
      setError('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        setError(error.message)
      } else {
        router.push('/projects')
      }
    } catch (err) {
      setError('Failed to delete project')
    }
  }

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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-aqua-green text-midnight-blue'
      case 'in_progress':
        return 'bg-neon-blue text-midnight-blue'
      case 'todo':
        return 'bg-light-gray text-midnight-blue'
      default:
        return 'bg-light-gray text-midnight-blue'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-coral'
      case 'high':
        return 'text-coral'
      case 'medium':
        return 'text-neon-blue'
      case 'low':
        return 'text-light-gray'
      default:
        return 'text-light-gray'
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
        <div className="text-soft-white">Please sign in to view this project.</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-soft-white mb-4">Project Not Found</h1>
          <p className="text-light-gray mb-6">{error || 'The project you are looking for does not exist.'}</p>
          <Link
            href="/projects"
            className="inline-flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Projects
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const completedTasks = tasks.filter(task => task.status === 'done').length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/projects"
              className="p-2 text-light-gray hover:text-soft-white transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-soft-white">{project.name}</h1>
              <p className="text-light-gray">Project Details</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/projects/${projectId}/edit`}
              className="p-2 text-light-gray hover:text-soft-white transition-colors"
            >
              <PencilIcon className="h-5 w-5" />
            </Link>
            <button
              onClick={handleDeleteProject}
              className="p-2 text-light-gray hover:text-coral transition-colors"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <div className="bg-dark-gray rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-soft-white mb-2">Project Information</h2>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    {project.start_date && (
                      <div className="flex items-center text-sm text-light-gray">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{new Date(project.start_date).toLocaleDateString()}</span>
                        {project.end_date && (
                          <span> - {new Date(project.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {project.description && (
                <p className="text-light-gray mb-4">{project.description}</p>
              )}

              <div className="flex items-center text-sm text-light-gray">
                <UserIcon className="h-4 w-4 mr-1" />
                <span>Created by {users.find(u => u.id === project.created_by)?.name || 'Unknown'}</span>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="mb-6">
              <ProgressOverview
                members={projectMembers.map(member => member.user).filter(Boolean)}
                tasks={tasks}
                projectId={projectId as string}
              />
            </div>

            {/* Tasks */}
            <div className="bg-dark-gray rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-soft-white">Tasks</h2>
                <Link
                  href={`/projects/${projectId}/tasks/new`}
                  className="flex items-center px-3 py-1 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Task
                </Link>
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-midnight-blue rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckIcon className="h-5 w-5 text-light-gray" />
                        <div>
                          <h3 className="text-sm font-medium text-soft-white">{task.title}</h3>
                          <div className="flex items-center space-x-2 text-xs text-light-gray">
                            <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                            {task.due_date && (
                              <span className="flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-electric-purple hover:text-neon-blue text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckIcon className="h-12 w-12 text-light-gray mx-auto mb-4" />
                  <p className="text-light-gray mb-4">No tasks yet</p>
                  <Link
                    href={`/projects/${projectId}/tasks/new`}
                    className="inline-flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add First Task
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-dark-gray rounded-lg p-6">
              <h3 className="text-lg font-semibold text-soft-white mb-4">Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-light-gray mb-2">
                    <span>Tasks Completed</span>
                    <span>{completedTasks}/{totalTasks}</span>
                  </div>
                  <div className="w-full bg-midnight-blue rounded-full h-2">
                    <div
                      className="bg-aqua-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-2xl font-bold text-soft-white">
                  {Math.round(progressPercentage)}%
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-dark-gray rounded-lg p-6">
              <h3 className="text-lg font-semibold text-soft-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-light-gray">Total Tasks</span>
                  <span className="text-soft-white font-medium">{totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-gray">Completed</span>
                  <span className="text-aqua-green font-medium">{completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-gray">In Progress</span>
                  <span className="text-neon-blue font-medium">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-gray">To Do</span>
                  <span className="text-light-gray font-medium">
                    {tasks.filter(t => t.status === 'todo').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

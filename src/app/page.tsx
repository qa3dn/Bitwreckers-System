'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ActivityFeed from '@/components/ActivityFeed'
import QuickActions from '@/components/QuickActions'
import PinnedProjects from '@/components/PinnedProjects'
import { createClient } from '@/lib/supabase/client'
import { Project, Task } from '@/types/database'
import { 
  FolderIcon, 
  CheckIcon,
  ClockIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { useAppKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Enable keyboard shortcuts
  useAppKeyboardShortcuts()

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    } else {
      // If no user, stop loading immediately
      setLoading(false)
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectsError) {
        console.error('Error fetching projects:', projectsError.message || projectsError)
        setProjects([])
      } else {
        setProjects(projectsData || [])
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError.message || tasksError)
        setTasks([])
      } else {
        setTasks(tasksData || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    console.log('Loading state:', { authLoading, loading, user })
  return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center" suppressHydrationWarning={true}>
        <div className="text-soft-white" suppressHydrationWarning={true}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center" suppressHydrationWarning={true}>
        <div className="text-center" suppressHydrationWarning={true}>
          <h1 className="text-2xl font-bold text-soft-white mb-4">Welcome to Bitwreckers System</h1>
          <p className="text-light-gray mb-6">Please sign in to access your dashboard</p>
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

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    overdueTasks: tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
    ).length,
  }

  const recentTasks = tasks.slice(0, 5)
  const recentProjects = projects.slice(0, 3)

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 px-2 md:px-0">
        {/* Welcome Section */}
        <div className="bg-dark-gray rounded-lg p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold text-soft-white mb-2">
            Welcome back, {user.user_metadata?.name || 'User'}!
          </h1>
          <p className="text-light-gray text-sm md:text-base">
            Here's what's happening with your projects today.
          </p>
          <p className="text-xs md:text-sm text-light-gray mt-2 hidden md:block">
            Press <kbd className="px-2 py-1 bg-midnight-blue rounded text-xs">Ctrl+K</kbd> to search, 
            <kbd className="px-2 py-1 bg-midnight-blue rounded text-xs ml-1">Ctrl+N</kbd> for new task
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Pinned Projects */}
        <PinnedProjects />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-dark-gray rounded-lg p-3 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-6 w-6 md:h-8 md:w-8 text-electric-purple" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-light-gray">Total Projects</p>
                <p className="text-lg md:text-2xl font-semibold text-soft-white">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-gray rounded-lg p-3 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckIcon className="h-6 w-6 md:h-8 md:w-8 text-aqua-green" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-light-gray">Completed Tasks</p>
                <p className="text-lg md:text-2xl font-semibold text-soft-white">
                  {stats.completedTasks}/{stats.totalTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-gray rounded-lg p-3 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 md:h-8 md:w-8 text-neon-blue" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-light-gray">Active Projects</p>
                <p className="text-lg md:text-2xl font-semibold text-soft-white">{stats.activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-gray rounded-lg p-3 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 md:h-8 md:w-8 text-coral" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-light-gray">Overdue Tasks</p>
                <p className="text-lg md:text-2xl font-semibold text-soft-white">{stats.overdueTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Projects */}
          <div className="bg-dark-gray rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-soft-white">Recent Projects</h2>
              <a href="/projects" className="text-electric-purple hover:text-purple-400 text-xs md:text-sm transition-colors">
                View all
              </a>
            </div>
            <div className="space-y-2 md:space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-2 md:p-3 bg-midnight-blue rounded-md">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-medium text-soft-white truncate">{project.name}</h3>
                    <p className="text-xs text-light-gray">{project.status}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ml-2 ${
                    project.status === 'completed' ? 'bg-aqua-green text-midnight-blue' :
                    project.status === 'in_progress' ? 'bg-neon-blue text-midnight-blue' :
                    'bg-light-gray text-midnight-blue'
                  }`}>
                    {project.status}
                  </div>
                </div>
              ))}
              {recentProjects.length === 0 && (
                <p className="text-light-gray text-xs md:text-sm">No projects yet</p>
              )}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-dark-gray rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-soft-white">Recent Tasks</h2>
              <a href="/tasks" className="text-electric-purple hover:text-purple-400 text-xs md:text-sm transition-colors">
                View all
              </a>
            </div>
            <div className="space-y-2 md:space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 md:p-3 bg-midnight-blue rounded-md">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-medium text-soft-white truncate">{task.title}</h3>
                    <p className="text-xs text-light-gray">{task.priority} priority</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ml-2 ${
                    task.status === 'done' ? 'bg-aqua-green text-midnight-blue' :
                    task.status === 'in_progress' ? 'bg-neon-blue text-midnight-blue' :
                    'bg-light-gray text-midnight-blue'
                  }`}>
                    {task.status}
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <p className="text-light-gray text-xs md:text-sm">No tasks yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-dark-gray rounded-lg p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-soft-white mb-3 md:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <a
              href="/projects/new"
              className="flex items-center p-3 md:p-4 bg-electric-purple hover:bg-neon-blue rounded-lg transition-colors"
            >
              <FolderIcon className="h-5 w-5 md:h-6 md:w-6 text-soft-white mr-2 md:mr-3" />
              <span className="text-soft-white font-medium text-sm md:text-base">New Project</span>
            </a>
            <a
              href="/tasks/new"
              className="flex items-center p-3 md:p-4 bg-electric-purple hover:bg-neon-blue rounded-lg transition-colors"
            >
              <CheckIcon className="h-5 w-5 md:h-6 md:w-6 text-soft-white mr-2 md:mr-3" />
              <span className="text-soft-white font-medium text-sm md:text-base">New Task</span>
            </a>
            <a
              href="/team"
              className="flex items-center p-3 md:p-4 bg-electric-purple hover:bg-neon-blue rounded-lg transition-colors sm:col-span-2 md:col-span-1"
            >
              <UsersIcon className="h-5 w-5 md:h-6 md:w-6 text-soft-white mr-2 md:mr-3" />
              <span className="text-soft-white font-medium text-sm md:text-base">Manage Team</span>
            </a>
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed />
    </div>
    </DashboardLayout>
  )
}
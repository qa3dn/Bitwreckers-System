'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DragDropContainer from '@/components/DragDropContainer'
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch'
import TaskDependencies from '@/components/TaskDependencies'
import TaskDependencyGraph from '@/components/TaskDependencyGraph'
import { createClient } from '@/lib/supabase/client'
import { Task, Project, User } from '@/types/database'
import { 
  CheckIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function TasksPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    status: '',
    priority: '',
    assignee: '',
    project: '',
    dateFrom: '',
    dateTo: '',
    type: 'project'
  })
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'dependencies'>('kanban')
  const [selectedProjectForDeps, setSelectedProjectForDeps] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      // Fetch only project tasks assigned to the current user (not personal todos)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*),
          assigned_user:users(*)
        `)
        .eq('assigned_to', user?.id)
        .eq('task_type', 'project') // Only project tasks
        .order('created_at', { ascending: false })

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')

      const { data: usersData } = await supabase
        .from('users')
        .select('*')

      setTasks(tasksData || [])
      setProjects(projectsData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
        .eq('assigned_to', user?.id) // Only allow updating own tasks

      if (error) {
        console.error('Error updating task:', error)
        return
      }

      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesQuery = !searchFilters.query || 
      task.title.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchFilters.query.toLowerCase())
    
    const matchesStatus = !searchFilters.status || task.status === searchFilters.status
    const matchesPriority = !searchFilters.priority || task.priority === searchFilters.priority
    const matchesProject = !searchFilters.project || task.project_id === searchFilters.project
    const matchesType = !searchFilters.type || task.task_type === searchFilters.type
    
    const matchesAssignee = !searchFilters.assignee || 
      users.find(u => u.id === task.assigned_to)?.name.toLowerCase().includes(searchFilters.assignee.toLowerCase())
    
    const matchesDateFrom = !searchFilters.dateFrom || 
      new Date(task.created_at) >= new Date(searchFilters.dateFrom)
    
    const matchesDateTo = !searchFilters.dateTo || 
      new Date(task.created_at) <= new Date(searchFilters.dateTo)
    
    return matchesQuery && matchesStatus && matchesPriority && matchesProject && 
           matchesType && matchesAssignee && matchesDateFrom && matchesDateTo
  })

  const getStatusColor = (status: string) => {
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

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unassigned'
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
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
        <div className="text-soft-white">Please sign in to access tasks.</div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-soft-white">Project Tasks</h1>
            <p className="text-light-gray">Manage and track your assigned project tasks</p>
            <p className="text-sm text-light-gray mt-2">
              For personal tasks, use <a href="/personal-todos" className="text-electric-purple hover:text-neon-blue">Personal Todos</a>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-midnight-blue rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-electric-purple text-soft-white' 
                    : 'text-light-gray hover:text-soft-white'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-electric-purple text-soft-white' 
                    : 'text-light-gray hover:text-soft-white'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('dependencies')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'dependencies' 
                    ? 'bg-electric-purple text-soft-white' 
                    : 'text-light-gray hover:text-soft-white'
                }`}
              >
                Dependencies
              </button>
            </div>
            {userProfile?.role === 'team-lead' || userProfile?.role === 'project-manager' ? (
              <Link
                href="/tasks/new"
                className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Task
              </Link>
            ) : (
              <div className="flex items-center px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed" title="Only Team Leads and Project Managers can create tasks">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Task
              </div>
            )}
          </div>
        </div>

        {/* Advanced Search */}
        <AdvancedSearch
          onSearch={setSearchFilters}
          placeholder="Search tasks..."
          showFilters={true}
        />

        {/* Tasks Display */}
        {viewMode === 'kanban' ? (
          <DragDropContainer
            tasks={filteredTasks}
            onUpdateTaskStatus={updateTaskStatus}
            onDeleteTask={(taskId) => {
              // TODO: Implement delete task
              console.log('Delete task:', taskId)
            }}
            onEditTask={(task) => {
              // TODO: Implement edit task
              console.log('Edit task:', task)
            }}
          />
        ) : viewMode === 'dependencies' ? (
          <div className="space-y-6">
            {/* Project Selection for Dependencies */}
            <div className="bg-dark-gray rounded-lg p-4">
              <h3 className="text-lg font-semibold text-soft-white mb-3">Select Project</h3>
              <select
                value={selectedProjectForDeps || ''}
                onChange={(e) => setSelectedProjectForDeps(e.target.value || null)}
                className="w-full px-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
              >
                <option value="">Choose a project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dependencies Graph */}
            {selectedProjectForDeps && (
              <TaskDependencyGraph
                projectId={selectedProjectForDeps}
                onTaskSelect={(taskId) => {
                  // TODO: Navigate to task details or highlight task
                  console.log('Selected task:', taskId)
                }}
              />
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="bg-dark-gray rounded-lg p-6 hover:bg-midnight-blue transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <CheckIcon className="h-6 w-6 text-light-gray mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-soft-white">{task.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {isOverdue(task.due_date) && task.status !== 'done' && (
                            <span className="px-2 py-1 bg-coral text-soft-white rounded-full text-xs font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                        
                        {/* Status Update Buttons */}
                        <div className="flex space-x-2 mb-3">
                          <button
                            onClick={() => updateTaskStatus(task.id, 'todo')}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              task.status === 'todo' 
                                ? 'bg-neon-blue text-midnight-blue' 
                                : 'bg-midnight-blue text-light-gray hover:bg-neon-blue hover:text-midnight-blue'
                            }`}
                          >
                            To Do
                          </button>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              task.status === 'in_progress' 
                                ? 'bg-neon-blue text-midnight-blue' 
                                : 'bg-midnight-blue text-light-gray hover:bg-neon-blue hover:text-midnight-blue'
                            }`}
                          >
                            In Progress
                          </button>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              task.status === 'done' 
                                ? 'bg-aqua-green text-midnight-blue' 
                                : 'bg-midnight-blue text-light-gray hover:bg-aqua-green hover:text-midnight-blue'
                            }`}
                          >
                            Done
                          </button>
                        </div>
                        
                        {task.description && (
                          <p className="text-light-gray mb-3 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center space-x-6 text-sm text-light-gray">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>{getUserName(task.assigned_to || '')}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">Project:</span>
                            <Link
                              href={`/projects/${task.project_id}`}
                              className="text-electric-purple hover:text-neon-blue transition-colors"
                            >
                              {getProjectName(task.project_id)}
                            </Link>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              <span className={isOverdue(task.due_date) && task.status !== 'done' ? 'text-coral' : ''}>
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-electric-purple hover:text-neon-blue text-sm font-medium transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                  
                  {/* Task Dependencies */}
                  <div className="mt-4">
                    <TaskDependencies
                      taskId={task.id}
                      projectId={task.project_id}
                      canEdit={user?.role === 'team-lead' || user?.role === 'project-manager'}
                      onDependencyChange={() => {
                        // Refresh tasks if needed
                        fetchTasks()
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <CheckIcon className="h-12 w-12 text-light-gray mx-auto mb-4" />
                <h3 className="text-lg font-medium text-soft-white mb-2">No tasks found</h3>
                <p className="text-light-gray mb-6">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first task.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && projectFilter === 'all' && (
                  <Link
                    href="/tasks/new"
                    className="inline-flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Task
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

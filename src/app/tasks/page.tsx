'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { Task, Project, User } from '@/types/database'
import { 
  CheckIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  FlagIcon,
  TagIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function TasksPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('kanban')
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      // Fetch only project tasks assigned to the current user
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*),
          assigned_user:users(*)
        `)
        .eq('assigned_to', user?.id)
        .eq('task_type', 'project')
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
        .eq('assigned_to', user?.id)

      if (error) {
        console.error('Error updating task:', error)
        return
      }

      // If task is marked as in_progress, add to personal todos
      if (status === 'in_progress') {
        const task = tasks.find(t => t.id === taskId)
        if (task) {
          const { error: todoError } = await supabase
            .from('personal_todos')
            .insert({
              title: `[Project] ${task.title}`,
              description: task.description || `Project: ${task.project?.name || 'Unknown'}`,
              category: 'project',
              priority: task.priority,
              due_date: task.due_date,
              user_id: user?.id
            })

          if (todoError) {
            console.error('Error adding to personal todos:', todoError)
          }
        }
      }

      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleBulkAction = async () => {
    if (selectedTasks.length === 0 || !bulkAction) return

    try {
      if (bulkAction === 'mark_done') {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'done' })
          .in('id', selectedTasks)
          .eq('assigned_to', user?.id)

        if (error) throw error
      } else if (bulkAction === 'mark_in_progress') {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'in_progress' })
          .in('id', selectedTasks)
          .eq('assigned_to', user?.id)

        if (error) throw error
      } else if (bulkAction === 'delete') {
        if (!confirm('Are you sure you want to delete selected tasks?')) return
        
        const { error } = await supabase
          .from('tasks')
          .delete()
          .in('id', selectedTasks)
          .eq('assigned_to', user?.id)

        if (error) throw error
      }

      setSelectedTasks([])
      setBulkAction('')
      fetchTasks()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Error performing bulk action')
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'in_progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      case 'todo': return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesQuery = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesProject = projectFilter === 'all' || task.project_id === projectFilter
    
    return matchesQuery && matchesStatus && matchesPriority && matchesProject
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'due_date':
        aValue = a.due_date || '9999-12-31'
        bValue = b.due_date || '9999-12-31'
        break
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
        break
      default:
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-soft-white">My Tasks</h1>
            <p className="text-light-gray">Manage and track your assigned project tasks</p>
            <p className="text-sm text-light-gray mt-2">
              For personal tasks, use <a href="/personal-todos" className="text-electric-purple hover:text-neon-blue">Personal Todos</a>
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
            {/* Bulk Actions */}
            {selectedTasks.length > 0 && (
              <div className="flex items-center space-x-2 bg-midnight-blue rounded-lg p-2">
                <span className="text-sm text-light-gray">{selectedTasks.length} selected</span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bg-dark-gray text-soft-white text-sm rounded px-2 py-1"
                >
                  <option value="">Bulk Actions</option>
                  <option value="mark_done">Mark as Done</option>
                  <option value="mark_in_progress">Mark as In Progress</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  className="px-3 py-1 bg-electric-purple text-soft-white text-sm rounded hover:bg-purple-600 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => setSelectedTasks([])}
                  className="px-3 py-1 bg-gray-600 text-soft-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

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
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-electric-purple text-soft-white' 
                    : 'text-light-gray hover:text-soft-white'
                }`}
              >
                Calendar
              </button>
            </div>

            {/* Sort and Filter */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-midnight-blue hover:bg-dark-gray text-soft-white rounded-lg transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-midnight-blue text-soft-white text-sm rounded px-3 py-2 border border-gray-600"
              >
                <option value="created_at">Created Date</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-midnight-blue hover:bg-dark-gray text-soft-white rounded-lg transition-colors"
              >
                {sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
              </button>
            </div>

            <Link
              href="/tasks/new"
              className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Task
            </Link>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-dark-gray rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-light-gray mb-2">Project</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-blue text-soft-white rounded-lg border border-gray-600 focus:border-electric-purple focus:outline-none"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Content */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* To Do Column */}
            <div className="bg-dark-gray rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-soft-white">To Do</h3>
                <span className="bg-gray-600 text-soft-white text-sm px-2 py-1 rounded-full">
                  {sortedTasks.filter(task => task.status === 'todo').length}
                </span>
              </div>
              <div className="space-y-3">
                {sortedTasks
                  .filter(task => task.status === 'todo')
                  .map(task => (
                    <TaskCard key={task.id} task={task} onUpdateStatus={updateTaskStatus} onToggleSelection={toggleTaskSelection} isSelected={selectedTasks.includes(task.id)} />
                  ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-dark-gray rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-soft-white">In Progress</h3>
                <span className="bg-blue-600 text-soft-white text-sm px-2 py-1 rounded-full">
                  {sortedTasks.filter(task => task.status === 'in_progress').length}
                </span>
              </div>
              <div className="space-y-3">
                {sortedTasks
                  .filter(task => task.status === 'in_progress')
                  .map(task => (
                    <TaskCard key={task.id} task={task} onUpdateStatus={updateTaskStatus} onToggleSelection={toggleTaskSelection} isSelected={selectedTasks.includes(task.id)} />
                  ))}
              </div>
            </div>

            {/* Done Column */}
            <div className="bg-dark-gray rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-soft-white">Done</h3>
                <span className="bg-green-600 text-soft-white text-sm px-2 py-1 rounded-full">
                  {sortedTasks.filter(task => task.status === 'done').length}
                </span>
              </div>
              <div className="space-y-3">
                {sortedTasks
                  .filter(task => task.status === 'done')
                  .map(task => (
                    <TaskCard key={task.id} task={task} onUpdateStatus={updateTaskStatus} onToggleSelection={toggleTaskSelection} isSelected={selectedTasks.includes(task.id)} />
                  ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-dark-gray rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-midnight-blue">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTasks.length === sortedTasks.length && sortedTasks.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(sortedTasks.map(task => task.id))
                          } else {
                            setSelectedTasks([])
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-light-gray">Task</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-light-gray">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-light-gray">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-light-gray">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-light-gray">Due Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-light-gray">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedTasks.map(task => (
                    <tr key={task.id} className="hover:bg-midnight-blue/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-soft-white font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-light-gray text-sm mt-1 line-clamp-2">{task.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-light-gray">{task.project?.name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-light-gray">
                        {task.due_date ? (
                          <span className={isOverdue(task.due_date) ? 'text-red-500' : ''}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        ) : (
                          'No due date'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="p-1 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                            title="Start Task"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                            title="Complete Task"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/tasks/${task.id}`}
                            className="p-1 text-gray-500 hover:bg-gray-500/10 rounded transition-colors"
                            title="View Task"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sortedTasks.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-light-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-white mb-2">No tasks found</h3>
            <p className="text-light-gray mb-6">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'You don\'t have any assigned tasks yet.'
              }
            </p>
            <Link
              href="/tasks/new"
              className="inline-flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Task
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// Task Card Component
function TaskCard({ task, onUpdateStatus, onToggleSelection, isSelected }: {
  task: Task
  onUpdateStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void
  onToggleSelection: (taskId: string) => void
  isSelected: boolean
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className={`bg-midnight-blue rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors ${isSelected ? 'ring-2 ring-electric-purple' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(task.id)}
            className="mt-1 rounded border-gray-600"
          />
          <div className="flex-1">
            <h4 className="text-soft-white font-medium mb-1">{task.title}</h4>
            {task.description && (
              <p className="text-light-gray text-sm line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-light-gray">
          <span>{task.project?.name || 'Unknown Project'}</span>
          {task.due_date && (
            <span className={isOverdue(task.due_date) ? 'text-red-500' : ''}>
              <ClockIcon className="h-4 w-4 inline mr-1" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {task.status === 'todo' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'in_progress')}
              className="p-1 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
              title="Start Task"
            >
              <PlayIcon className="h-4 w-4" />
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'done')}
              className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors"
              title="Complete Task"
            >
              <CheckCircleIcon className="h-4 w-4" />
            </button>
          )}
          <Link
            href={`/tasks/${task.id}`}
            className="p-1 text-gray-500 hover:bg-gray-500/10 rounded transition-colors"
            title="View Task"
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, TaskDependency, TaskDependencyWithDetails } from '@/types/database'
import { 
  LinkIcon, 
  XMarkIcon, 
  PlusIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface TaskDependenciesProps {
  taskId: string
  projectId: string
  canEdit?: boolean
  onDependencyChange?: () => void
}

export default function TaskDependencies({ 
  taskId, 
  projectId, 
  canEdit = false,
  onDependencyChange 
}: TaskDependenciesProps) {
  const [dependencies, setDependencies] = useState<TaskDependencyWithDetails[]>([])
  const [dependentTasks, setDependentTasks] = useState<TaskDependencyWithDetails[]>([])
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [showAddDependency, setShowAddDependency] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDependencies()
    fetchAvailableTasks()
  }, [taskId, projectId])

  const fetchDependencies = async () => {
    try {
      // Fetch dependencies (tasks this task depends on)
      const { data: depsData, error: depsError } = await supabase
        .from('task_dependencies')
        .select(`
          *,
          dependency_task:tasks!task_dependencies_depends_on_task_id_fkey(*)
        `)
        .eq('task_id', taskId)

      if (depsError) throw depsError

      // Fetch dependent tasks (tasks that depend on this task)
      const { data: dependentData, error: dependentError } = await supabase
        .from('task_dependencies')
        .select(`
          *,
          dependent_task:tasks!task_dependencies_task_id_fkey(*)
        `)
        .eq('depends_on_task_id', taskId)

      if (dependentError) throw dependentError

      setDependencies(depsData || [])
      setDependentTasks(dependentData || [])
    } catch (error) {
      console.error('Error fetching dependencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .neq('id', taskId) // Exclude current task
        .neq('status', 'done') // Exclude completed tasks

      if (error) throw error
      setAvailableTasks(data || [])
    } catch (error) {
      console.error('Error fetching available tasks:', error)
    }
  }

  const addDependency = async () => {
    if (!selectedTaskId) return

    try {
      const { error } = await supabase
        .from('task_dependencies')
        .insert({
          task_id: taskId,
          depends_on_task_id: selectedTaskId
        })

      if (error) throw error

      setSelectedTaskId('')
      setShowAddDependency(false)
      fetchDependencies()
      onDependencyChange?.()
    } catch (error) {
      console.error('Error adding dependency:', error)
    }
  }

  const removeDependency = async (dependencyId: string) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId)

      if (error) throw error

      fetchDependencies()
      onDependencyChange?.()
    } catch (error) {
      console.error('Error removing dependency:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-aqua-green'
      case 'in_progress':
        return 'text-neon-blue'
      case 'todo':
        return 'text-light-gray'
      default:
        return 'text-light-gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'in_progress':
        return <ClockIcon className="h-4 w-4" />
      case 'todo':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-coral'
      case 'medium':
        return 'text-neon-blue'
      case 'low':
        return 'text-aqua-green'
      default:
        return 'text-light-gray'
    }
  }

  if (loading) {
    return (
      <div className="bg-dark-gray rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-midnight-blue rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-midnight-blue rounded w-3/4"></div>
            <div className="h-3 bg-midnight-blue rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-gray rounded-lg p-4 space-y-4">
      {/* Dependencies Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-soft-white flex items-center">
            <LinkIcon className="h-5 w-5 mr-2 text-electric-purple" />
            Dependencies
          </h3>
          {canEdit && (
            <button
              onClick={() => setShowAddDependency(!showAddDependency)}
              className="flex items-center px-3 py-1 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </button>
          )}
        </div>

        {/* Add Dependency Form */}
        {showAddDependency && (
          <div className="mb-4 p-3 bg-midnight-blue rounded-lg">
            <div className="flex items-center space-x-2">
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-gray text-soft-white rounded border border-gray-600 focus:border-electric-purple focus:outline-none"
              >
                <option value="">Select a task...</option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.status})
                  </option>
                ))}
              </select>
              <button
                onClick={addDependency}
                disabled={!selectedTaskId}
                className="px-3 py-2 bg-aqua-green hover:bg-neon-blue text-soft-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddDependency(false)}
                className="px-3 py-2 bg-coral hover:bg-red-600 text-soft-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dependencies List */}
        {dependencies.length > 0 ? (
          <div className="space-y-2">
            {dependencies.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 bg-midnight-blue rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`${getStatusColor(dep.dependency_task.status)}`}>
                    {getStatusIcon(dep.dependency_task.status)}
                  </div>
                  <div className="flex-1">
                    <div className="text-soft-white font-medium">
                      {dep.dependency_task.title}
                    </div>
                    <div className="text-sm text-light-gray flex items-center space-x-2">
                      <span className={getPriorityColor(dep.dependency_task.priority)}>
                        {dep.dependency_task.priority}
                      </span>
                      <span>•</span>
                      <span className={getStatusColor(dep.dependency_task.status)}>
                        {dep.dependency_task.status}
                      </span>
                      {dep.dependency_task.due_date && (
                        <>
                          <span>•</span>
                          <span>{new Date(dep.dependency_task.due_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => removeDependency(dep.id)}
                    className="p-1 text-coral hover:text-red-400 transition-colors"
                    title="Remove dependency"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-light-gray">
            <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No dependencies</p>
            <p className="text-sm">This task can be started immediately</p>
          </div>
        )}
      </div>

      {/* Dependent Tasks Section */}
      {dependentTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-soft-white flex items-center mb-3">
            <ArrowRightIcon className="h-5 w-5 mr-2 text-neon-blue" />
            Dependent Tasks
          </h3>
          <div className="space-y-2">
            {dependentTasks.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center space-x-3 p-3 bg-midnight-blue rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className={`${getStatusColor(dep.dependent_task.status)}`}>
                  {getStatusIcon(dep.dependent_task.status)}
                </div>
                <div className="flex-1">
                  <div className="text-soft-white font-medium">
                    {dep.dependent_task.title}
                  </div>
                  <div className="text-sm text-light-gray flex items-center space-x-2">
                    <span className={getPriorityColor(dep.dependent_task.priority)}>
                      {dep.dependent_task.priority}
                    </span>
                    <span>•</span>
                    <span className={getStatusColor(dep.dependent_task.status)}>
                      {dep.dependent_task.status}
                    </span>
                    {dep.dependent_task.due_date && (
                      <>
                        <span>•</span>
                        <span>{new Date(dep.dependent_task.due_date).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

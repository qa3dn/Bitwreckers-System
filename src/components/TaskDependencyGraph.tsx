'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, TaskDependency } from '@/types/database'
import { 
  LinkIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface TaskDependencyGraphProps {
  projectId: string
  onTaskSelect?: (taskId: string) => void
}

interface GraphNode {
  id: string
  task: Task
  x: number
  y: number
  dependencies: string[]
  dependents: string[]
}

export default function TaskDependencyGraph({ 
  projectId, 
  onTaskSelect 
}: TaskDependencyGraphProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [dependencies, setDependencies] = useState<TaskDependency[]>([])
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [projectId, showCompleted])

  useEffect(() => {
    if (tasks.length > 0 && dependencies.length >= 0) {
      generateGraph()
    }
  }, [tasks, dependencies])

  const fetchData = async () => {
    try {
      // Fetch tasks
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (!showCompleted) {
        query = query.neq('status', 'done')
      }

      const { data: tasksData, error: tasksError } = await query
      if (tasksError) throw tasksError

      // Fetch dependencies
      const { data: depsData, error: depsError } = await supabase
        .from('task_dependencies')
        .select('*')
        .in('task_id', tasksData?.map(t => t.id) || [])
        .or(`depends_on_task_id.in.(${tasksData?.map(t => t.id).join(',') || ''})`)

      if (depsError) throw depsError

      setTasks(tasksData || [])
      setDependencies(depsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateGraph = () => {
    const graphNodes: GraphNode[] = []
    const nodeMap = new Map<string, GraphNode>()

    // Create nodes
    tasks.forEach((task, index) => {
      const node: GraphNode = {
        id: task.id,
        task,
        x: (index % 4) * 200 + 100, // 4 columns
        y: Math.floor(index / 4) * 150 + 100, // Rows
        dependencies: [],
        dependents: []
      }
      graphNodes.push(node)
      nodeMap.set(task.id, node)
    })

    // Add dependencies
    dependencies.forEach(dep => {
      const taskNode = nodeMap.get(dep.task_id)
      const depNode = nodeMap.get(dep.depends_on_task_id)
      
      if (taskNode && depNode) {
        taskNode.dependencies.push(dep.depends_on_task_id)
        depNode.dependents.push(dep.task_id)
      }
    })

    setNodes(graphNodes)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-aqua-green text-midnight-blue'
      case 'in_progress':
        return 'bg-neon-blue text-soft-white'
      case 'todo':
        return 'bg-midnight-blue text-light-gray'
      default:
        return 'bg-gray-600 text-light-gray'
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
        return 'border-coral'
      case 'medium':
        return 'border-neon-blue'
      case 'low':
        return 'border-aqua-green'
      default:
        return 'border-gray-600'
    }
  }

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(selectedTask === taskId ? null : taskId)
    onTaskSelect?.(taskId)
  }

  if (loading) {
    return (
      <div className="bg-dark-gray rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-midnight-blue rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-midnight-blue rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-gray rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-soft-white flex items-center">
          <LinkIcon className="h-5 w-5 mr-2 text-electric-purple" />
          Task Dependencies Graph
        </h3>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center px-3 py-1 bg-midnight-blue hover:bg-gray-700 text-soft-white rounded-lg transition-colors"
        >
          {showCompleted ? (
            <>
              <EyeSlashIcon className="h-4 w-4 mr-1" />
              Hide Completed
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4 mr-1" />
              Show Completed
            </>
          )}
        </button>
      </div>

      {nodes.length === 0 ? (
        <div className="text-center py-12 text-light-gray">
          <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tasks found</p>
          <p className="text-sm">Create some tasks to see the dependency graph</p>
        </div>
      ) : (
        <div className="relative overflow-auto" style={{ height: '500px' }}>
          <svg
            width="100%"
            height="100%"
            className="absolute inset-0"
            style={{ minWidth: '800px', minHeight: '500px' }}
          >
            {/* Draw connections */}
            {nodes.map(node => 
              node.dependencies.map(depId => {
                const depNode = nodes.find(n => n.id === depId)
                if (!depNode) return null

                return (
                  <line
                    key={`${node.id}-${depId}`}
                    x1={depNode.x + 100}
                    y1={depNode.y + 50}
                    x2={node.x + 100}
                    y2={node.y + 50}
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                )
              })
            )}

            {/* Arrow marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#8B5CF6"
                />
              </marker>
            </defs>
          </svg>

          {/* Render nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute cursor-pointer transition-all duration-200 ${
                selectedTask === node.id ? 'scale-110 z-10' : 'hover:scale-105'
              }`}
              style={{
                left: node.x,
                top: node.y,
                width: '200px'
              }}
              onClick={() => handleTaskClick(node.id)}
            >
              <div
                className={`p-3 rounded-lg border-2 ${getPriorityColor(node.task.priority)} ${
                  selectedTask === node.id
                    ? 'bg-electric-purple text-soft-white'
                    : 'bg-dark-gray text-soft-white hover:bg-midnight-blue'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded ${getStatusColor(node.task.status)}`}>
                      {getStatusIcon(node.task.status)}
                    </div>
                    <span className="text-xs font-medium">
                      {node.task.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-light-gray">
                    {node.dependencies.length} deps
                  </div>
                </div>
                
                <h4 className="font-medium text-sm mb-1 line-clamp-2">
                  {node.task.title}
                </h4>
                
                <div className="text-xs text-light-gray">
                  <div className="flex items-center justify-between">
                    <span>{node.task.status}</span>
                    {node.task.due_date && (
                      <span>{new Date(node.task.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-aqua-green rounded"></div>
          <span className="text-light-gray">Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-neon-blue rounded"></div>
          <span className="text-light-gray">In Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-midnight-blue rounded"></div>
          <span className="text-light-gray">To Do</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-coral rounded"></div>
          <span className="text-light-gray">High Priority</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-neon-blue rounded"></div>
          <span className="text-light-gray">Medium Priority</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-aqua-green rounded"></div>
          <span className="text-light-gray">Low Priority</span>
        </div>
      </div>
    </div>
  )
}

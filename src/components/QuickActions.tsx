'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types/database'
import { 
  CheckIcon, 
  PlusIcon, 
  ChatBubbleLeftRightIcon,
  FolderIcon,
  UserIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface QuickActionsProps {
  onTaskComplete?: (taskId: string) => void
  onTaskReassign?: (taskId: string) => void
  onOpenChat?: () => void
}

export default function QuickActions({ 
  onTaskComplete, 
  onTaskReassign, 
  onOpenChat 
}: QuickActionsProps) {
  const { user, userProfile } = useAuth()
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const quickActions = [
    {
      id: 'new-task',
      title: 'New Task',
      description: 'Create a new task',
      icon: PlusIcon,
      color: 'bg-electric-purple hover:bg-neon-blue',
      action: () => router.push('/tasks/new')
    },
    {
      id: 'new-project',
      title: 'New Project',
      description: 'Create a new project',
      icon: FolderIcon,
      color: 'bg-neon-blue hover:bg-aqua-green',
      action: () => router.push('/projects/new'),
      requiresRole: 'team-lead'
    },
    {
      id: 'open-chat',
      title: 'Open Chat',
      description: 'Start a conversation',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-aqua-green hover:bg-coral',
      action: () => {
        onOpenChat?.()
        router.push('/chat')
      }
    },
    {
      id: 'view-team',
      title: 'View Team',
      description: 'Manage team members',
      icon: UserIcon,
      color: 'bg-coral hover:bg-electric-purple',
      action: () => router.push('/team')
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-500'
      case 'in_progress': return 'text-neon-blue'
      case 'todo': return 'text-light-gray'
      default: return 'text-light-gray'
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const handleTaskAction = async (taskId: string, action: 'complete' | 'reassign') => {
    setLoading(true)
    try {
      if (action === 'complete') {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'done' })
          .eq('id', taskId)
        
        if (error) throw error
        onTaskComplete?.(taskId)
      } else if (action === 'reassign') {
        onTaskReassign?.(taskId)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActions = quickActions.filter(action => {
    if (action.requiresRole && userProfile?.role !== action.requiresRole) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`p-4 rounded-lg text-left transition-all duration-200 hover:scale-105 ${action.color} text-soft-white`}
          >
            <action.icon className="h-8 w-8 mb-2" />
            <h3 className="font-semibold text-sm">{action.title}</h3>
            <p className="text-xs opacity-90">{action.description}</p>
          </button>
        ))}
      </div>

      {/* Recent Tasks Quick Actions */}
      <div className="bg-midnight-blue rounded-lg p-4">
        <h3 className="text-lg font-semibold text-soft-white mb-4">Quick Task Actions</h3>
        <div className="space-y-2">
          {recentTasks.length === 0 ? (
            <div className="text-center py-4 text-light-gray">
              <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent tasks</p>
            </div>
          ) : (
            recentTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-dark-gray rounded-lg hover:bg-light-gray transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <CheckIcon className={`h-5 w-5 ${getStatusColor(task.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-soft-white truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-light-gray">
                      {task.due_date && new Date(task.due_date).toLocaleDateString()}
                      {isOverdue(task.due_date) && (
                        <span className="text-coral ml-2">Overdue</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {task.status !== 'done' && (
                    <button
                      onClick={() => handleTaskAction(task.id, 'complete')}
                      disabled={loading}
                      className="p-1 text-aqua-green hover:text-green-400 transition-colors"
                      title="Mark as complete"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleTaskAction(task.id, 'reassign')}
                    disabled={loading}
                    className="p-1 text-neon-blue hover:text-blue-400 transition-colors"
                    title="Reassign task"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

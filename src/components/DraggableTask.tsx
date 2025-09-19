'use client'

import { useState } from 'react'
import { Task } from '@/types/database'
import { CheckIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'

interface DraggableTaskProps {
  task: Task
  onUpdateStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void
  onDelete: (taskId: string) => void
  onEdit: (task: Task) => void
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, task: Task) => void
  onDragEnd?: (e: React.DragEvent) => void
}

export default function DraggableTask({
  task,
  onUpdateStatus,
  onDelete,
  onEdit,
  isDragging = false,
  onDragStart,
  onDragEnd
}: DraggableTaskProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-aqua-green text-midnight-blue'
      case 'in_progress': return 'bg-neon-blue text-midnight-blue'
      case 'todo': return 'bg-light-gray text-midnight-blue'
      default: return 'bg-light-gray text-midnight-blue'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-coral'
      case 'high': return 'text-coral'
      case 'medium': return 'text-neon-blue'
      case 'low': return 'text-light-gray'
      default: return 'text-light-gray'
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        bg-dark-gray rounded-lg p-4 cursor-move transition-all duration-200
        hover:bg-midnight-blue hover:shadow-lg hover:scale-105
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isHovered ? 'ring-2 ring-electric-purple' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            <div className="w-6 h-6 rounded-full bg-electric-purple flex items-center justify-center">
              <CheckIcon className="h-4 w-4 text-soft-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-soft-white truncate">
                {task.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
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
            
            {task.description && (
              <p className="text-light-gray text-sm mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center space-x-4 text-xs text-light-gray">
              {task.due_date && (
                <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
              )}
              <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`flex items-center space-x-2 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Status Update Buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => onUpdateStatus(task.id, 'todo')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                task.status === 'todo' 
                  ? 'bg-neon-blue text-midnight-blue' 
                  : 'bg-midnight-blue text-light-gray hover:bg-neon-blue hover:text-midnight-blue'
              }`}
              title="Mark as To Do"
            >
              To Do
            </button>
            <button
              onClick={() => onUpdateStatus(task.id, 'in_progress')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                task.status === 'in_progress' 
                  ? 'bg-neon-blue text-midnight-blue' 
                  : 'bg-midnight-blue text-light-gray hover:bg-neon-blue hover:text-midnight-blue'
              }`}
              title="Mark as In Progress"
            >
              In Progress
            </button>
            <button
              onClick={() => onUpdateStatus(task.id, 'done')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                task.status === 'done' 
                  ? 'bg-aqua-green text-midnight-blue' 
                  : 'bg-midnight-blue text-light-gray hover:bg-aqua-green hover:text-midnight-blue'
              }`}
              title="Mark as Done"
            >
              Done
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1 text-electric-purple hover:text-neon-blue transition-colors"
              title="Edit Task"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-coral hover:text-red-400 transition-colors"
              title="Delete Task"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

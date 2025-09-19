'use client'

import { useState } from 'react'
import { 
  CheckCircleIcon, 
  TrashIcon, 
  PencilIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  FolderIcon,
  FlagIcon
} from '@heroicons/react/24/outline'

interface DraggableTodoProps {
  todo: any
  onToggleComplete: (id: string, completed: boolean) => void
  onEdit: (todo: any) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, todo: any) => void
  onDragEnd: (e: React.DragEvent) => void
  isDragging?: boolean
}

export default function DraggableTodo({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging = false
}: DraggableTodoProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-200'
      case 'high': return 'bg-orange-100 border-orange-200'
      case 'medium': return 'bg-yellow-100 border-yellow-200'
      case 'low': return 'bg-green-100 border-green-200'
      default: return 'bg-gray-100 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔴'
      case 'high': return '🟠'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, todo)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        bg-white rounded-lg shadow-sm border border-slate-200 p-4 cursor-move
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${todo.completed ? 'opacity-60' : ''}
        ${isOverdue ? 'border-red-300 bg-red-50' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={() => onToggleComplete(todo.id, !todo.completed)}
          className="mt-1 flex-shrink-0"
        >
          {todo.completed ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-slate-400 hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  {todo.title}
                </h3>
                {isOverdue && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    Overdue
                  </span>
                )}
              </div>
              
              {todo.description && (
                <p className="text-sm text-slate-600 mb-2">{todo.description}</p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{getPriorityIcon(todo.priority)}</span>
                  <span className={`font-medium ${getPriorityColor(todo.priority)}`}>
                    {todo.priority}
                  </span>
                </div>
                
                {todo.due_date && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      {new Date(todo.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {todo.estimated_time && (
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{todo.estimated_time}m</span>
                  </div>
                )}
                
                {todo.category && (
                  <div className="flex items-center space-x-1">
                    <FolderIcon className="h-4 w-4" />
                    <span>{todo.category}</span>
                  </div>
                )}
              </div>
              
              {todo.tags && todo.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {todo.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className={`flex items-center space-x-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={() => onEdit(todo)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                title="Edit task"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Delete task"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

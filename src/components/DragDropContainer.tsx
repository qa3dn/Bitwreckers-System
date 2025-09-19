'use client'

import { useState, useRef } from 'react'
import { Task } from '@/types/database'
import DraggableTask from './DraggableTask'

interface DragDropContainerProps {
  tasks: Task[]
  onUpdateTaskStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: Task) => void
}

export default function DragDropContainer({
  tasks,
  onUpdateTaskStatus,
  onDeleteTask,
  onEditTask
}: DragDropContainerProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const todoRef = useRef<HTMLDivElement>(null)
  const inProgressRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)

  const columns = [
    { id: 'todo', title: 'To Do', ref: todoRef, color: 'bg-light-gray' },
    { id: 'in_progress', title: 'In Progress', ref: inProgressRef, color: 'bg-neon-blue' },
    { id: 'done', title: 'Done', ref: doneRef, color: 'bg-aqua-green' }
  ]

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    
    if (draggedTask && draggedTask.status !== columnId) {
      onUpdateTaskStatus(draggedTask.id, columnId as 'todo' | 'in_progress' | 'done')
    }
    
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const getTasksForColumn = (columnId: string) => {
    return tasks.filter(task => task.status === columnId)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {columns.map((column) => (
        <div
          key={column.id}
          ref={column.ref}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
          className={`
            bg-midnight-blue rounded-lg p-4 min-h-[500px] transition-all duration-200
            ${dragOverColumn === column.id ? 'ring-2 ring-electric-purple bg-opacity-80' : ''}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-soft-white">
              {column.title}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${column.color} text-midnight-blue`}>
              {getTasksForColumn(column.id).length}
            </span>
          </div>

          <div className="space-y-3">
            {getTasksForColumn(column.id).map((task) => (
              <DraggableTask
                key={task.id}
                task={task}
                onUpdateStatus={onUpdateTaskStatus}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggedTask?.id === task.id}
              />
            ))}

            {/* Drop Zone */}
            {dragOverColumn === column.id && (
              <div className="border-2 border-dashed border-electric-purple rounded-lg p-8 text-center">
                <div className="text-electric-purple text-sm font-medium">
                  Drop task here to move to {column.title}
                </div>
              </div>
            )}

            {/* Empty State */}
            {getTasksForColumn(column.id).length === 0 && !dragOverColumn && (
              <div className="text-center py-8 text-light-gray">
                <div className="text-sm">No tasks in {column.title.toLowerCase()}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

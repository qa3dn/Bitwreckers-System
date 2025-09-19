'use client'

import { Project } from '@/types/database'

interface ProjectColorCodingProps {
  project: Project
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function ProjectColorCoding({ 
  project, 
  size = 'md', 
  showLabel = true,
  className = ''
}: ProjectColorCodingProps) {
  const getProjectColor = (projectId: string) => {
    // Generate a consistent color based on project ID
    const colors = [
      'bg-electric-purple',
      'bg-neon-blue', 
      'bg-aqua-green',
      'bg-coral',
      'bg-yellow-400',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-red-500'
    ]
    
    // Simple hash function to get consistent color
    let hash = 0
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3'
      case 'md':
        return 'h-4 w-4'
      case 'lg':
        return 'h-6 w-6'
      default:
        return 'h-4 w-4'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'md':
        return 'text-sm'
      case 'lg':
        return 'text-base'
      default:
        return 'text-sm'
    }
  }

  const colorClass = getProjectColor(project.id)
  const sizeClass = getSizeClasses()
  const textSizeClass = getTextSize()

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClass} ${colorClass} rounded-full flex-shrink-0`} />
      {showLabel && (
        <span className={`${textSizeClass} text-soft-white font-medium`}>
          {project.name}
        </span>
      )}
    </div>
  )
}

// Utility function to get project color class
export const getProjectColorClass = (projectId: string) => {
  const colors = [
    'bg-electric-purple',
    'bg-neon-blue', 
    'bg-aqua-green',
    'bg-coral',
    'bg-yellow-400',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-red-500'
  ]
  
  let hash = 0
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

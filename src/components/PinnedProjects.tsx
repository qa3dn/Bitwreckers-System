'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Project } from '@/types/database'
import ProjectColorCoding from './ProjectColorCoding'
import { 
  FolderIcon, 
  MapPinIcon, 
  XMarkIcon,
  ClockIcon,
  UserIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function PinnedProjects() {
  const { user } = useAuth()
  const [pinnedProjects, setPinnedProjects] = useState<Project[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    try {
      // Fetch all projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      setAllProjects(projectsData || [])

      // Fetch pinned projects from localStorage
      const pinnedIds = JSON.parse(localStorage.getItem('pinnedProjects') || '[]')
      const pinned = (projectsData || []).filter(project => 
        pinnedIds.includes(project.id)
      )
      setPinnedProjects(pinned)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePin = (projectId: string) => {
    const isPinned = pinnedProjects.some(p => p.id === projectId)
    
    if (isPinned) {
      // Unpin
      const newPinned = pinnedProjects.filter(p => p.id !== projectId)
      setPinnedProjects(newPinned)
      localStorage.setItem('pinnedProjects', JSON.stringify(newPinned.map(p => p.id)))
    } else {
      // Pin
      const project = allProjects.find(p => p.id === projectId)
      if (project) {
        const newPinned = [...pinnedProjects, project]
        setPinnedProjects(newPinned)
        localStorage.setItem('pinnedProjects', JSON.stringify(newPinned.map(p => p.id)))
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-aqua-green text-midnight-blue'
      case 'planning': return 'bg-neon-blue text-midnight-blue'
      case 'completed': return 'bg-green-500 text-soft-white'
      case 'on_hold': return 'bg-coral text-soft-white'
      default: return 'bg-light-gray text-midnight-blue'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'planning': return 'Planning'
      case 'completed': return 'Completed'
      case 'on_hold': return 'On Hold'
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="bg-dark-gray rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="h-12 w-12 bg-midnight-blue rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-midnight-blue rounded w-3/4" />
                <div className="h-3 bg-midnight-blue rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pinned Projects */}
      {pinnedProjects.length > 0 && (
        <div className="bg-dark-gray rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soft-white flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-electric-purple" />
              Pinned Projects
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-midnight-blue rounded-lg p-4 hover:bg-light-gray transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <ProjectColorCoding project={project} size="md" showLabel={false} />
                    <div>
                      <h3 className="font-semibold text-soft-white group-hover:text-electric-purple transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-light-gray">
                        {project.start_date && new Date(project.start_date).toLocaleDateString()}
                        {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => togglePin(project.id)}
                    className="p-1 text-electric-purple hover:text-coral transition-colors"
                    title="Unpin project"
                  >
                    <MapPinIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {project.description && (
                  <p className="text-sm text-light-gray mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                  
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-xs text-electric-purple hover:text-neon-blue transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Projects with Pin Option */}
      <div className="bg-dark-gray rounded-lg p-6">
        <h2 className="text-lg font-semibold text-soft-white mb-4">All Projects</h2>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {allProjects.map((project) => {
            const isPinned = pinnedProjects.some(p => p.id === project.id)
            
            return (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 bg-midnight-blue rounded-lg hover:bg-light-gray transition-colors group"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <ProjectColorCoding project={project} size="sm" showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-soft-white truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-light-gray">
                      {project.start_date && new Date(project.start_date).toLocaleDateString()}
                      {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                  
                  <button
                    onClick={() => togglePin(project.id)}
                    className={`p-1 transition-colors ${
                      isPinned 
                        ? 'text-electric-purple hover:text-coral' 
                        : 'text-light-gray hover:text-electric-purple'
                    }`}
                    title={isPinned ? 'Unpin project' : 'Pin project'}
                  >
                    <MapPinIcon className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
                  </button>
                  
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-xs text-electric-purple hover:text-neon-blue transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProjectColorCoding from '@/components/ProjectColorCoding'
import { createClient } from '@/lib/supabase/client'
import { Project } from '@/types/database'
import { 
  FolderIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
      } else {
        setProjects(data || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-aqua-green text-midnight-blue'
      case 'in_progress':
        return 'bg-neon-blue text-midnight-blue'
      case 'planning':
        return 'bg-light-gray text-midnight-blue'
      case 'on_hold':
        return 'bg-coral text-soft-white'
      default:
        return 'bg-light-gray text-midnight-blue'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress'
      case 'on_hold':
        return 'On Hold'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
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
        <div className="text-soft-white">Please sign in to access projects.</div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-soft-white">Projects</h1>
            <p className="text-light-gray">Manage and track your team's projects</p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-dark-gray rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-gray" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full pl-10 pr-4 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:ring-2 focus:ring-electric-purple focus:border-electric-purple"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:ring-2 focus:ring-electric-purple focus:border-electric-purple"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-dark-gray rounded-lg p-6 hover:bg-midnight-blue transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <ProjectColorCoding project={project} size="lg" showLabel={false} className="mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-soft-white">{project.name}</h3>
                    <p className="text-sm text-light-gray">
                      {project.start_date && new Date(project.start_date).toLocaleDateString()}
                      {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              
              {project.description && (
                <p className="text-sm text-light-gray mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-light-gray">
                  <UserIcon className="h-4 w-4 mr-1" />
                  <span>Created by {project.created_by}</span>
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-electric-purple hover:text-neon-blue text-sm font-medium transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderIcon className="h-12 w-12 text-light-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-white mb-2">No projects found</h3>
            <p className="text-light-gray mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first project.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                href="/projects/new"
                className="inline-flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Project
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

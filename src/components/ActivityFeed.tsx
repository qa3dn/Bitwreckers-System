'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Project, Task, Message } from '@/types/database'
import { 
  CheckIcon, 
  FolderIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface ActivityItem {
  id: string
  type: 'task_created' | 'task_updated' | 'task_completed' | 'project_created' | 'message_sent' | 'user_joined'
  title: string
  description: string
  timestamp: string
  user: User
  project?: Project
  task?: Task
  message?: Message
  metadata?: any
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'tasks' | 'projects' | 'messages'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      // Fetch recent activities from different sources
      const [tasksResult, projectsResult, messagesResult] = await Promise.all([
        supabase
          .from('tasks')
          .select(`
            *,
            project:projects(*),
            assigned_user:users(*),
            created_user:users(*)
          `)
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('projects')
          .select(`
            *,
            created_user:users(*)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('messages')
          .select(`
            *,
            sender:users(*),
            project:projects(*)
          `)
          .order('created_at', { ascending: false })
          .limit(15)
      ])

      const activities: ActivityItem[] = []

      // Process tasks
      tasksResult.data?.forEach(task => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task_created',
          title: 'New Task Created',
          description: `"${task.title}" was created`,
          timestamp: task.created_at,
          user: task.created_user,
          project: task.project,
          task: task
        })

        if (task.status === 'done') {
          activities.push({
            id: `task-completed-${task.id}`,
            type: 'task_completed',
            title: 'Task Completed',
            description: `"${task.title}" was completed`,
            timestamp: task.updated_at || task.created_at,
            user: task.assigned_user,
            project: task.project,
            task: task
          })
        }
      })

      // Process projects
      projectsResult.data?.forEach(project => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project_created',
          title: 'New Project Created',
          description: `"${project.name}" was created`,
          timestamp: project.created_at,
          user: project.created_user,
          project: project
        })
      })

      // Process messages
      messagesResult.data?.forEach(message => {
        activities.push({
          id: `message-${message.id}`,
          type: 'message_sent',
          title: 'New Message',
          description: `"${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`,
          timestamp: message.created_at,
          user: message.sender,
          project: message.project,
          message: message
        })
      })

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(activities.slice(0, 50)) // Limit to 50 most recent
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
      case 'task_completed':
        return <CheckIcon className="h-5 w-5 text-aqua-green" />
      case 'project_created':
        return <FolderIcon className="h-5 w-5 text-electric-purple" />
      case 'message_sent':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-neon-blue" />
      case 'user_joined':
        return <UserIcon className="h-5 w-5 text-coral" />
      default:
        return <ClockIcon className="h-5 w-5 text-light-gray" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return 'bg-aqua-green bg-opacity-20 border-aqua-green'
      case 'task_completed':
        return 'bg-green-500 bg-opacity-20 border-green-500'
      case 'project_created':
        return 'bg-electric-purple bg-opacity-20 border-electric-purple'
      case 'message_sent':
        return 'bg-neon-blue bg-opacity-20 border-neon-blue'
      case 'user_joined':
        return 'bg-coral bg-opacity-20 border-coral'
      default:
        return 'bg-light-gray bg-opacity-20 border-light-gray'
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true
    if (filter === 'tasks') return activity.type.includes('task')
    if (filter === 'projects') return activity.type.includes('project')
    if (filter === 'messages') return activity.type.includes('message')
    return true
  })

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return time.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-dark-gray rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="h-10 w-10 bg-midnight-blue rounded-full" />
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
    <div className="bg-dark-gray rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-soft-white">Activity Feed</h2>
        <div className="flex space-x-2">
          {['all', 'tasks', 'projects', 'messages'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-electric-purple text-soft-white'
                  : 'bg-midnight-blue text-light-gray hover:bg-light-gray hover:text-soft-white'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-light-gray">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities found</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`flex space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
            >
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-electric-purple flex items-center justify-center">
                  <span className="text-sm font-medium text-soft-white">
                    {activity.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {getActivityIcon(activity.type)}
                  <span className="text-sm font-medium text-soft-white">
                    {activity.title}
                  </span>
                  <span className="text-xs text-light-gray">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-light-gray mb-1">
                  {activity.description}
                </p>
                
                <div className="flex items-center space-x-2 text-xs text-light-gray">
                  <span>by {activity.user?.name || 'Unknown'}</span>
                  {activity.project && (
                    <>
                      <span>•</span>
                      <span>in {activity.project.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

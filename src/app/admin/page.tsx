'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Protected from '@/components/Protected'
import { createClient } from '@/lib/supabase/client'
import { Project, User, ProjectMember, Task } from '@/types/database'
import { 
  PlusIcon,
  UserPlusIcon,
  CheckIcon,
  UsersIcon,
  FolderIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  TrophyIcon,
  FireIcon,
  LinkIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

export default function AdminPage() {
  const { user, userProfile } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showAssignMembers, setShowAssignMembers] = useState(false)
  const [showCreateMeeting, setShowCreateMeeting] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'meetings' | 'projects' | 'tasks' | 'members' | 'deadlines'>('overview')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_members(*),
          tasks(*)
        `)
        .order('created_at', { ascending: false })

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
      }

      // Fetch project members
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          *,
          user:users!project_members_user_id_fkey(*),
          project:projects!project_members_project_id_fkey(*)
        `)

      if (membersError) {
        console.error('Error fetching project members:', membersError)
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:users!tasks_assigned_to_fkey(*),
          project:projects!tasks_project_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
      }

      // Fetch meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_members(*)
        `)
        .order('meeting_date', { ascending: true })

      if (meetingsError) {
        console.error('Error fetching meetings:', meetingsError)
      }

      // Fetch suggestions
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('suggestions')
        .select(`
          *,
          user:users!suggestions_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (suggestionsError) {
        console.error('Error fetching suggestions:', suggestionsError)
      }

      setProjects(projectsData || [])
      setUsers(usersData || [])
      setProjectMembers(membersData || [])
      setTasks(tasksData || [])
      setMeetings(meetingsData || [])
      setSuggestions(suggestionsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (formData: FormData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          start_date: formData.get('start_date') as string,
          end_date: formData.get('end_date') as string,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        return
      }

      setShowCreateProject(false)
      fetchData()
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const assignMemberToProject = async (projectId: string, userId: string, role: 'project-manager' | 'member') => {
    try {
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role
        })

      if (error) {
        console.error('Error assigning member:', error)
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error assigning member:', error)
    }
  }

  const createTask = async (formData: FormData) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: formData.get('project_id') as string,
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          assigned_to: formData.get('assigned_to') as string,
          priority: formData.get('priority') as string,
          due_date: formData.get('due_date') as string,
          created_by: user?.id
        })

      if (error) {
        console.error('Error creating task:', error)
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateSuggestionStatus = async (suggestionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({ 
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', suggestionId)

      if (error) {
        console.error('Error updating suggestion status:', error)
        alert('Error updating suggestion status')
      } else {
        // Update local state
        setSuggestions(prev => prev.map(s => 
          s.id === suggestionId 
            ? { ...s, status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }
            : s
        ))
        alert(`Suggestion ${status} successfully!`)
      }
    } catch (error) {
      console.error('Error updating suggestion status:', error)
      alert('Error updating suggestion status')
    }
  }

  const sendMeetingNotifications = async (meeting: any, memberIds: string[]) => {
    try {
      // Get member details
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', memberIds)

      if (membersError) {
        console.error('Error fetching member details:', membersError)
        return
      }

      // Create notifications for each member
      const notifications = members.map(member => ({
        user_id: member.id,
        title: 'New Meeting Invitation',
        message: `You have been invited to a meeting: "${meeting.title}" on ${new Date(meeting.meeting_date).toLocaleDateString()} at ${new Date(meeting.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        type: 'meeting',
        data: {
          meeting_id: meeting.id,
          meeting_title: meeting.title,
          meeting_date: meeting.meeting_date,
          meeting_link: meeting.meeting_link
        },
        is_read: false,
        created_at: new Date().toISOString()
      }))

      // Insert notifications
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
      } else {
        console.log('Meeting notifications sent successfully')
      }

      // Send browser notifications if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        members.forEach(member => {
          new Notification('New Meeting Invitation', {
            body: `You have been invited to: "${meeting.title}"`,
            icon: '/favicon.ico',
            tag: `meeting-${meeting.id}`
          })
        })
      }
    } catch (error) {
      console.error('Error sending meeting notifications:', error)
    }
  }

  const createMeeting = async (formData: FormData) => {
    try {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const date = formData.get('date') as string
      const time = formData.get('time') as string
      const meetingLink = formData.get('meeting_link') as string
      const selectedMembers = formData.getAll('members') as string[]

      if (!title || !date || !time) {
        alert('Please fill in all required fields')
        return
      }

      // Combine date and time
      const meetingDateTime = new Date(`${date}T${time}`).toISOString()

      // Create meeting
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title,
          description: description || null,
          meeting_date: meetingDateTime,
          meeting_link: meetingLink || null,
          created_by: user?.id
        })
        .select()
        .single()

      if (meetingError) {
        console.error('Error creating meeting:', meetingError)
        alert('Error creating meeting')
        return
      }

      // Add members to meeting
      if (selectedMembers.length > 0) {
        const memberInserts = selectedMembers.map(memberId => ({
          meeting_id: meeting.id,
          user_id: memberId
        }))

        const { error: membersError } = await supabase
          .from('meeting_members')
          .insert(memberInserts)

        if (membersError) {
          console.error('Error adding members to meeting:', membersError)
          alert('Meeting created but failed to add members')
        }

        // Send notifications to invited members
        await sendMeetingNotifications(meeting, selectedMembers)
      }

      setShowCreateMeeting(false)
      alert('Meeting scheduled successfully!')
      fetchData()
    } catch (error) {
      console.error('Error creating meeting:', error)
      alert('Error creating meeting')
    }
  }

  // Calculate advanced statistics
  const calculateStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Project statistics
    const activeProjects = projects.filter(p => p.status === 'in_progress').length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const onHoldProjects = projects.filter(p => p.status === 'on_hold').length
    
    // Task statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const todoTasks = tasks.filter(t => t.status === 'todo').length
    
    // Priority statistics
    const urgentTasks = tasks.filter(t => t.priority === 'urgent').length
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium').length
    const lowPriorityTasks = tasks.filter(t => t.priority === 'low').length
    
    // Overdue tasks
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date) return false
      const dueDate = new Date(t.due_date)
      return dueDate < today && t.status !== 'done'
    }).length
    
    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = tasks.filter(t => {
      if (!t.due_date) return false
      const dueDate = new Date(t.due_date)
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      return dueDate >= today && dueDate <= sevenDaysFromNow && t.status !== 'done'
    }).length
    
    // Member performance
    const memberStats = users.map(user => {
      const userTasks = tasks.filter(t => t.assigned_to === user.id)
      const completedUserTasks = userTasks.filter(t => t.status === 'done').length
      const completionRate = userTasks.length > 0 ? (completedUserTasks / userTasks.length) * 100 : 0
      
      return {
        ...user,
        totalTasks: userTasks.length,
        completedTasks: completedUserTasks,
        completionRate: Math.round(completionRate),
        overdueTasks: userTasks.filter(t => {
          if (!t.due_date) return false
          const dueDate = new Date(t.due_date)
          return dueDate < today && t.status !== 'done'
        }).length
      }
    }).sort((a, b) => b.completionRate - a.completionRate)
    
    // Top performers
    const topPerformers = memberStats.slice(0, 5)
    
    // Project progress
    const projectProgress = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      const completedProjectTasks = projectTasks.filter(t => t.status === 'done').length
      const progress = projectTasks.length > 0 ? (completedProjectTasks / projectTasks.length) * 100 : 0
      
      return {
        ...project,
        totalTasks: projectTasks.length,
        completedTasks: completedProjectTasks,
        progress: Math.round(progress),
        overdueTasks: projectTasks.filter(t => {
          if (!t.due_date) return false
          const dueDate = new Date(t.due_date)
          return dueDate < today && t.status !== 'done'
        }).length
      }
    })
    
    return {
      projects: {
        total: projects.length,
        active: activeProjects,
        completed: completedProjects,
        onHold: onHoldProjects
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        overdue: overdueTasks,
        upcoming: upcomingDeadlines
      },
      priorities: {
        urgent: urgentTasks,
        high: highPriorityTasks,
        medium: mediumPriorityTasks,
        low: lowPriorityTasks
      },
      members: {
        total: users.length,
        topPerformers: topPerformers,
        memberStats: memberStats
      },
      projectProgress: projectProgress
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-soft-white">Loading...</div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <Protected allowedRoles={['team-lead']}>
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-soft-white mb-2">Admin Dashboard</h1>
              <p className="text-light-gray">Comprehensive overview of projects, tasks, and team performance</p>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                  { id: 'suggestions', name: 'Suggestions', icon: LightBulbIcon },
                  { id: 'meetings', name: 'Meetings', icon: CalendarIcon },
                  { id: 'projects', name: 'Projects', icon: FolderIcon },
                  { id: 'tasks', name: 'Tasks', icon: CheckIcon },
                  { id: 'members', name: 'Members', icon: UsersIcon },
                  { id: 'deadlines', name: 'Deadlines', icon: ClockIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-electric-purple text-soft-white'
                        : 'text-light-gray hover:text-soft-white hover:bg-dark-gray'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <>
                {/* Overview Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-dark-gray p-6 rounded-lg">
                    <div className="flex items-center">
                      <FolderIcon className="h-8 w-8 text-electric-purple" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-light-gray">Total Projects</p>
                        <p className="text-2xl font-bold text-soft-white">{stats.projects.total}</p>
                        <p className="text-xs text-light-gray">{stats.projects.active} active</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-gray p-6 rounded-lg">
                    <div className="flex items-center">
                      <UsersIcon className="h-8 w-8 text-neon-blue" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-light-gray">Total Members</p>
                        <p className="text-2xl font-bold text-soft-white">{stats.members.total}</p>
                        <p className="text-xs text-light-gray">Team members</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-gray p-6 rounded-lg">
                    <div className="flex items-center">
                      <CheckIcon className="h-8 w-8 text-aqua-green" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-light-gray">Total Tasks</p>
                        <p className="text-2xl font-bold text-soft-white">{stats.tasks.total}</p>
                        <p className="text-xs text-light-gray">{stats.tasks.completed} completed</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-gray p-6 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-coral" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-light-gray">Overdue Tasks</p>
                        <p className="text-2xl font-bold text-soft-white">{stats.tasks.overdue}</p>
                        <p className="text-xs text-light-gray">Need attention</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Status Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-dark-gray p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-soft-white mb-4">Task Status Distribution</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-aqua-green mr-2" />
                          <span className="text-light-gray">Completed</span>
                        </div>
                        <span className="text-soft-white font-semibold">{stats.tasks.completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-neon-blue mr-2" />
                          <span className="text-light-gray">In Progress</span>
                        </div>
                        <span className="text-soft-white font-semibold">{stats.tasks.inProgress}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <XCircleIcon className="h-5 w-5 text-light-gray mr-2" />
                          <span className="text-light-gray">To Do</span>
                        </div>
                        <span className="text-soft-white font-semibold">{stats.tasks.todo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-gray p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-soft-white mb-4">Priority Distribution</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FireIcon className="h-5 w-5 text-red-500 mr-2" />
                          <span className="text-light-gray">Urgent</span>
                        </div>
                        <span className="text-soft-white font-semibold">{stats.priorities.urgent}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                          <span className="text-light-gray">High</span>
                        </div>
                        <span className="text-soft-white font-semibold">{stats.priorities.high}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                          <span className="text-light-gray">Medium</span>
                        </div>
                        <span className="text-soft-white font-semibold">{stats.priorities.medium}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-light-gray">Low</span>
                        </div>
                        <span className="text-soft-white font-semibold">{stats.priorities.low}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Performers */}
                <div className="bg-dark-gray p-6 rounded-lg mb-8">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Top Performers</h3>
                  <div className="space-y-3">
                    {stats.members.topPerformers.map((member, index) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-midnight-blue rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-electric-purple rounded-full mr-3">
                            <span className="text-sm font-bold text-soft-white">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-soft-white font-medium">{member.name}</p>
                            <p className="text-sm text-light-gray">{(member as any).department || 'General'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-soft-white font-semibold">{member.completionRate}%</p>
                          <p className="text-sm text-light-gray">{member.completedTasks}/{member.totalTasks} tasks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'suggestions' && (
              <div className="space-y-6">
                {/* Suggestions Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <LightBulbIcon className="h-12 w-12 text-electric-purple mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{suggestions.length}</p>
                    <p className="text-light-gray">Total Suggestions</p>
                  </div>
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <ClockIcon className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{suggestions.filter(s => s.status === 'pending').length}</p>
                    <p className="text-light-gray">Pending Review</p>
                  </div>
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{suggestions.filter(s => s.status === 'approved').length}</p>
                    <p className="text-light-gray">Approved</p>
                  </div>
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{suggestions.filter(s => s.status === 'rejected').length}</p>
                    <p className="text-light-gray">Rejected</p>
                  </div>
                </div>

                {/* Suggestions List */}
                <div className="bg-dark-gray p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-soft-white">All Suggestions</h3>
                    <div className="flex gap-2">
                      <select
                        value={suggestionFilter}
                        onChange={(e) => setSuggestionFilter(e.target.value as any)}
                        className="px-3 py-2 bg-midnight-blue border border-slate-600 rounded-lg text-soft-white focus:border-electric-purple focus:outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <LightBulbIcon className="h-16 w-16 text-light-gray mx-auto mb-4" />
                      <p className="text-light-gray">No suggestions found</p>
                      <p className="text-sm text-light-gray mt-2">Team members can submit project suggestions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {suggestions
                        .filter(s => suggestionFilter === 'all' || s.status === suggestionFilter)
                        .map((suggestion) => (
                        <div key={suggestion.id} className="bg-midnight-blue p-6 rounded-lg border-l-4 border-electric-purple">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-soft-white">{suggestion.project_name}</h4>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  suggestion.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                                  suggestion.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {suggestion.status.replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  suggestion.priority === 'urgent' ? 'bg-red-500 text-white' :
                                  suggestion.priority === 'high' ? 'bg-orange-500 text-white' :
                                  suggestion.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                  'bg-green-500 text-white'
                                }`}>
                                  {suggestion.priority}
                                </span>
                              </div>
                              <p className="text-light-gray mb-3">{suggestion.description}</p>
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-light-gray mb-1">Why is it important?</h5>
                                <p className="text-soft-white">{suggestion.importance_reason}</p>
                              </div>
                              {(suggestion.estimated_budget || suggestion.estimated_duration) && (
                                <div className="flex gap-6 text-sm mb-3">
                                  {suggestion.estimated_budget && (
                                    <div>
                                      <span className="text-light-gray">Budget: </span>
                                      <span className="text-soft-white">${suggestion.estimated_budget.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {suggestion.estimated_duration && (
                                    <div>
                                      <span className="text-light-gray">Duration: </span>
                                      <span className="text-soft-white">{suggestion.estimated_duration} days</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {suggestion.review_notes && (
                                <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                                  <h5 className="text-sm font-medium text-light-gray mb-2">Review Notes</h5>
                                  <p className="text-soft-white">{suggestion.review_notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              {suggestion.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateSuggestionStatus(suggestion.id, 'under_review')}
                                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                                  >
                                    Start Review
                                  </button>
                                  <button
                                    onClick={() => updateSuggestionStatus(suggestion.id, 'approved')}
                                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => updateSuggestionStatus(suggestion.id, 'rejected')}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {suggestion.status === 'under_review' && (
                                <>
                                  <button
                                    onClick={() => updateSuggestionStatus(suggestion.id, 'approved')}
                                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => updateSuggestionStatus(suggestion.id, 'rejected')}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Submitted by: {suggestion.user?.name || 'Unknown'} • 
                            Department: {suggestion.department || 'General'} • 
                            {new Date(suggestion.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'meetings' && (
              <div className="space-y-6">
                {/* Meetings Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <CalendarIcon className="h-12 w-12 text-electric-purple mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{meetings.length}</p>
                    <p className="text-light-gray">Total Meetings</p>
                  </div>
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <ClockIcon className="h-12 w-12 text-neon-blue mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{meetings.filter(m => new Date(m.meeting_date) > new Date()).length}</p>
                    <p className="text-light-gray">Upcoming Meetings</p>
                  </div>
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <CheckCircleIcon className="h-12 w-12 text-aqua-green mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{meetings.filter(m => new Date(m.meeting_date) <= new Date()).length}</p>
                    <p className="text-light-gray">Completed Meetings</p>
                  </div>
                </div>

                {/* Upcoming Meetings */}
                <div className="bg-dark-gray p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Upcoming Meetings</h3>
                  {meetings.filter(m => new Date(m.meeting_date) > new Date()).length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-16 w-16 text-light-gray mx-auto mb-4" />
                      <p className="text-light-gray">No upcoming meetings</p>
                      <p className="text-sm text-light-gray mt-2">Schedule a meeting to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {meetings.filter(m => new Date(m.meeting_date) > new Date()).map((meeting) => (
                        <div key={meeting.id} className="bg-midnight-blue p-4 rounded-lg border-l-4 border-electric-purple">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-soft-white mb-2">{meeting.title}</h4>
                              {meeting.description && (
                                <p className="text-light-gray mb-2">{meeting.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-light-gray">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {new Date(meeting.meeting_date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {new Date(meeting.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {meeting.meeting_link && (
                                  <a
                                    href={meeting.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-electric-purple hover:text-neon-blue"
                                  >
                                    <LinkIcon className="h-4 w-4 mr-1" />
                                    Join Meeting
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-light-gray">
                                {meeting.meeting_members?.length || 0} members invited
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Meetings */}
                <div className="bg-dark-gray p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Recent Meetings</h3>
                  {meetings.filter(m => new Date(m.meeting_date) <= new Date()).length === 0 ? (
                    <div className="text-center py-8">
                      <ClockIcon className="h-16 w-16 text-light-gray mx-auto mb-4" />
                      <p className="text-light-gray">No recent meetings</p>
                      <p className="text-sm text-light-gray mt-2">Past meetings will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {meetings.filter(m => new Date(m.meeting_date) <= new Date()).map((meeting) => (
                        <div key={meeting.id} className="bg-midnight-blue p-4 rounded-lg opacity-75">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-soft-white mb-2">{meeting.title}</h4>
                              {meeting.description && (
                                <p className="text-light-gray mb-2">{meeting.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-light-gray">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {new Date(meeting.meeting_date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {new Date(meeting.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-light-gray">
                                {meeting.meeting_members?.length || 0} members invited
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                {/* Project Progress */}
                <div className="bg-dark-gray p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Project Progress</h3>
                  <div className="space-y-4">
                    {stats.projectProgress.map((project) => (
                      <div key={project.id} className="bg-midnight-blue p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-lg font-semibold text-soft-white">{project.name}</h4>
                            <p className="text-light-gray">{project.description}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs ${
                              project.status === 'in_progress' ? 'bg-neon-blue text-midnight-blue' :
                              project.status === 'completed' ? 'bg-aqua-green text-midnight-blue' :
                              project.status === 'on_hold' ? 'bg-coral text-soft-white' :
                              'bg-light-gray text-midnight-blue'
                            }`}>
                              {project.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-sm text-light-gray mb-1">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-light-gray rounded-full h-2">
                            <div 
                              className="bg-electric-purple h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-light-gray">
                          <span>{project.completedTasks}/{project.totalTasks} tasks completed</span>
                          {project.overdueTasks > 0 && (
                            <span className="text-coral">{project.overdueTasks} overdue</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                {/* Task Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <CheckCircleIcon className="h-12 w-12 text-aqua-green mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{stats.tasks.completed}</p>
                    <p className="text-light-gray">Completed Tasks</p>
                  </div>
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <ClockIcon className="h-12 w-12 text-neon-blue mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{stats.tasks.inProgress}</p>
                    <p className="text-light-gray">In Progress</p>
                  </div>
                  <div className="bg-dark-gray p-6 rounded-lg text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-coral mx-auto mb-2" />
                    <p className="text-2xl font-bold text-soft-white">{stats.tasks.overdue}</p>
                    <p className="text-light-gray">Overdue</p>
                  </div>
                </div>

                {/* Recent Tasks */}
                <div className="bg-dark-gray p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Recent Tasks</h3>
                  <div className="space-y-3">
                    {tasks.slice(0, 10).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-midnight-blue rounded-lg">
                        <div>
                          <p className="text-soft-white font-medium">{task.title}</p>
                          <p className="text-sm text-light-gray">
                            {(task as any).project?.name} • {(task as any).assigned_user?.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.priority === 'urgent' ? 'bg-red-500 text-white' :
                            task.priority === 'high' ? 'bg-orange-500 text-white' :
                            task.priority === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-green-500 text-white'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.status === 'done' ? 'bg-aqua-green text-midnight-blue' :
                            task.status === 'in_progress' ? 'bg-neon-blue text-midnight-blue' :
                            'bg-light-gray text-midnight-blue'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                {/* Member Performance */}
                <div className="bg-dark-gray p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Member Performance</h3>
                  <div className="space-y-4">
                    {stats.members.memberStats.map((member) => (
                      <div key={member.id} className="bg-midnight-blue p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-lg font-semibold text-soft-white">{member.name}</h4>
                            <p className="text-light-gray">{(member as any).department || 'General'} • {member.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-soft-white font-semibold">{member.completionRate}%</p>
                            <p className="text-sm text-light-gray">completion rate</p>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-sm text-light-gray mb-1">
                            <span>Task Completion</span>
                            <span>{member.completedTasks}/{member.totalTasks}</span>
                          </div>
                          <div className="w-full bg-light-gray rounded-full h-2">
                            <div 
                              className="bg-electric-purple h-2 rounded-full transition-all duration-300"
                              style={{ width: `${member.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-light-gray">
                          <span>Total Tasks: {member.totalTasks}</span>
                          {member.overdueTasks > 0 && (
                            <span className="text-coral">Overdue: {member.overdueTasks}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deadlines' && (
              <div className="space-y-6">
                {/* Upcoming Deadlines */}
                <div className="bg-dark-gray p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Upcoming Deadlines (Next 7 Days)</h3>
                  <div className="space-y-3">
                    {tasks.filter(t => {
                      if (!t.due_date) return false
                      const dueDate = new Date(t.due_date)
                      const today = new Date()
                      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                      return dueDate >= today && dueDate <= sevenDaysFromNow && t.status !== 'done'
                    }).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-midnight-blue rounded-lg">
                        <div>
                          <p className="text-soft-white font-medium">{task.title}</p>
                          <p className="text-sm text-light-gray">
                            {(task as any).project?.name} • {(task as any).assigned_user?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-soft-white font-semibold">
                            {new Date(task.due_date!).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-light-gray">
                            {Math.ceil((new Date(task.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overdue Tasks */}
                <div className="bg-dark-gray p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-soft-white mb-4">Overdue Tasks</h3>
                  <div className="space-y-3">
                    {tasks.filter(t => {
                      if (!t.due_date) return false
                      const dueDate = new Date(t.due_date)
                      const today = new Date()
                      return dueDate < today && t.status !== 'done'
                    }).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <div>
                          <p className="text-soft-white font-medium">{task.title}</p>
                          <p className="text-sm text-light-gray">
                            {(task as any).project?.name} • {(task as any).assigned_user?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 font-semibold">
                            {new Date(task.due_date!).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-red-300">
                            {Math.ceil((new Date().getTime() - new Date(task.due_date!).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Different for each tab */}
            <div className="flex flex-wrap gap-4 mb-8">
              {activeTab === 'overview' && (
                <>
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Project
                  </button>
                  <button
                    onClick={() => setShowAssignMembers(true)}
                    className="flex items-center px-4 py-2 bg-neon-blue hover:bg-aqua-green text-soft-white rounded-lg transition-colors"
                  >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Assign Members
                  </button>
                </>
              )}
              
              {activeTab === 'projects' && (
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Project
                </button>
              )}
              
              {activeTab === 'tasks' && (
                <a
                  href="/tasks/new"
                  className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Task
                </a>
              )}
              
              {activeTab === 'meetings' && (
                <button
                  onClick={() => setShowCreateMeeting(true)}
                  className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Schedule Meeting
                </button>
              )}
              
              {activeTab === 'members' && (
                <>
                  <button
                    onClick={() => setShowAssignMembers(true)}
                    className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                  >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Assign Members
                  </button>
                  <a
                    href="/member-management"
                    className="flex items-center px-4 py-2 bg-neon-blue hover:bg-aqua-green text-soft-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Generate Member IDs
                  </a>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-transparent-black flex items-center justify-center z-50">
            <div className="bg-dark-gray p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-bold text-soft-white mb-4">Create New Project</h3>
              <form action={createProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-1">Project Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-1">Start Date</label>
                    <input
                      name="start_date"
                      type="date"
                      className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-1">End Date</label>
                    <input
                      name="end_date"
                      type="date"
                      className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateProject(false)}
                    className="px-4 py-2 text-light-gray hover:text-soft-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Members Modal */}
        {showAssignMembers && (
          <div className="fixed inset-0 bg-transparent-black flex items-center justify-center z-50">
            <div className="bg-dark-gray p-6 rounded-lg w-full max-w-2xl">
              <h3 className="text-lg font-bold text-soft-white mb-4">Assign Members to Projects</h3>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-midnight-blue p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-soft-white mb-2">{project.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {users.map((user) => {
                        const isAssigned = projectMembers.some(
                          pm => pm.project_id === project.id && pm.user_id === user.id
                        )
                        return (
                          <div key={user.id} className="flex items-center justify-between p-2 bg-dark-gray rounded">
                            <span className="text-soft-white">{user.name}</span>
                            {isAssigned ? (
                              <span className="text-aqua-green text-sm">Assigned</span>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => assignMemberToProject(project.id, user.id, 'project-manager')}
                                  className="px-2 py-1 bg-electric-purple text-soft-white text-xs rounded hover:bg-neon-blue"
                                >
                                  Manager
                                </button>
                                <button
                                  onClick={() => assignMemberToProject(project.id, user.id, 'member')}
                                  className="px-2 py-1 bg-neon-blue text-soft-white text-xs rounded hover:bg-aqua-green"
                                >
                                  Member
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowAssignMembers(false)}
                  className="px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Meeting Modal */}
        {showCreateMeeting && (
          <div className="fixed inset-0 bg-transparent-black flex items-center justify-center z-50">
            <div className="bg-dark-gray p-6 rounded-lg w-full max-w-2xl">
              <h3 className="text-lg font-bold text-soft-white mb-4">Schedule New Meeting</h3>
              <form action={createMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-1">Meeting Title *</label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Enter meeting title"
                    className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Meeting description (optional)"
                    className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-1">Date *</label>
                    <input
                      name="date"
                      type="date"
                      required
                      className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-1">Time *</label>
                    <input
                      name="time"
                      type="time"
                      required
                      className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-1">Meeting Link</label>
                  <input
                    name="meeting_link"
                    type="url"
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-gray mb-1">Invite Members</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-midnight-blue rounded-lg p-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center p-2 hover:bg-dark-gray rounded cursor-pointer">
                        <input
                          name="members"
                          type="checkbox"
                          value={user.id}
                          className="mr-2 text-electric-purple"
                        />
                        <span className="text-soft-white text-sm">{user.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateMeeting(false)}
                    className="px-4 py-2 text-light-gray hover:text-soft-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </Protected>
  )
}

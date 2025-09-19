'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { Project, Task, User } from '@/types/database'
import { 
  ChartBarIcon,
  FolderIcon,
  CheckIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')

      const { data: usersData } = await supabase
        .from('users')
        .select('*')

      setProjects(projectsData || [])
      setTasks(tasksData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const projectStats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    planning: projects.filter(p => p.status === 'planning').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    overdue: tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
    ).length,
  }

  const priorityStats = {
    urgent: tasks.filter(t => t.priority === 'urgent').length,
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  }

  // Chart data
  const projectStatusData = [
    { name: 'Completed', value: projectStats.completed, color: '#2FFFC3' },
    { name: 'In Progress', value: projectStats.inProgress, color: '#00D4FF' },
    { name: 'Planning', value: projectStats.planning, color: '#E0E0E0' },
    { name: 'On Hold', value: projectStats.onHold, color: '#FF6B6B' },
  ]

  const taskStatusData = [
    { name: 'Done', value: taskStats.completed, color: '#2FFFC3' },
    { name: 'In Progress', value: taskStats.inProgress, color: '#00D4FF' },
    { name: 'To Do', value: taskStats.todo, color: '#E0E0E0' },
  ]

  const priorityData = [
    { name: 'Urgent', value: priorityStats.urgent, color: '#FF6B6B' },
    { name: 'High', value: priorityStats.high, color: '#FF6B6B' },
    { name: 'Medium', value: priorityStats.medium, color: '#00D4FF' },
    { name: 'Low', value: priorityStats.low, color: '#E0E0E0' },
  ]

  // Monthly completion data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    
    const monthTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at)
      return taskDate.getMonth() === date.getMonth() && 
             taskDate.getFullYear() === date.getFullYear()
    })
    
    return {
      month,
      completed: monthTasks.filter(t => t.status === 'done').length,
      total: monthTasks.length,
    }
  })

  // User activity data
  const userActivityData = users.map(user => {
    const userTasks = tasks.filter(t => t.assigned_to === user.id)
    return {
      name: user.name,
      completed: userTasks.filter(t => t.status === 'done').length,
      inProgress: userTasks.filter(t => t.status === 'in_progress').length,
      total: userTasks.length,
    }
  }).sort((a, b) => b.total - a.total).slice(0, 5)

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
        <div className="text-soft-white">Please sign in to access reports.</div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-soft-white">Reports & Analytics</h1>
          <p className="text-light-gray">Insights into your team's productivity and project progress</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-dark-gray rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-8 w-8 text-electric-purple" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-light-gray">Total Projects</p>
                <p className="text-2xl font-semibold text-soft-white">{projectStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-gray rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckIcon className="h-8 w-8 text-aqua-green" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-light-gray">Completed Tasks</p>
                <p className="text-2xl font-semibold text-soft-white">{taskStats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-gray rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-neon-blue" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-light-gray">Team Members</p>
                <p className="text-2xl font-semibold text-soft-white">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-gray rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-coral" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-light-gray">Overdue Tasks</p>
                <p className="text-2xl font-semibold text-soft-white">{taskStats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Distribution */}
          <div className="bg-dark-gray rounded-lg p-6">
            <h3 className="text-lg font-semibold text-soft-white mb-4">Project Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2C2C3A', 
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      color: '#F5F5F5'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {projectStatusData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-light-gray">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Status Distribution */}
          <div className="bg-dark-gray rounded-lg p-6">
            <h3 className="text-lg font-semibold text-soft-white mb-4">Task Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="name" stroke="#F5F5F5" />
                  <YAxis stroke="#F5F5F5" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2C2C3A', 
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      color: '#F5F5F5'
                    }}
                  />
                  <Bar dataKey="value" fill="#8C4DFF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Completion Trend */}
          <div className="bg-dark-gray rounded-lg p-6">
            <h3 className="text-lg font-semibold text-soft-white mb-4">Monthly Completion Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="month" stroke="#F5F5F5" />
                  <YAxis stroke="#F5F5F5" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2C2C3A', 
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      color: '#F5F5F5'
                    }}
                  />
                  <Line type="monotone" dataKey="completed" stroke="#2FFFC3" strokeWidth={2} />
                  <Line type="monotone" dataKey="total" stroke="#00D4FF" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Priority Distribution */}
          <div className="bg-dark-gray rounded-lg p-6">
            <h3 className="text-lg font-semibold text-soft-white mb-4">Task Priority Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="name" stroke="#F5F5F5" />
                  <YAxis stroke="#F5F5F5" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2C2C3A', 
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      color: '#F5F5F5'
                    }}
                  />
                  <Bar dataKey="value" fill="#8C4DFF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Team Activity */}
        <div className="bg-dark-gray rounded-lg p-6">
          <h3 className="text-lg font-semibold text-soft-white mb-4">Top Active Team Members</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivityData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis type="number" stroke="#F5F5F5" />
                <YAxis dataKey="name" type="category" stroke="#F5F5F5" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2C2C3A', 
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    color: '#F5F5F5'
                  }}
                />
                <Bar dataKey="completed" stackId="a" fill="#2FFFC3" />
                <Bar dataKey="inProgress" stackId="a" fill="#00D4FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

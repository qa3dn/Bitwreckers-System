'use client'

import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline'

interface TodoStatsProps {
  todos: any[]
  completedTodos: any[]
  pendingTodos: any[]
}

export default function TodoStats({ todos, completedTodos, pendingTodos }: TodoStatsProps) {
  const totalTodos = todos.length
  const completedCount = completedTodos.length
  const pendingCount = pendingTodos.length
  const completionRate = totalTodos > 0 ? Math.round((completedCount / totalTodos) * 100) : 0

  // Calculate priority distribution
  const priorityStats = todos.reduce((acc, todo) => {
    acc[todo.priority] = (acc[todo.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate category distribution
  const categoryStats = todos.reduce((acc, todo) => {
    const category = todo.category || 'uncategorized'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate overdue tasks
  const today = new Date()
  const overdueCount = pendingTodos.filter(todo => 
    todo.due_date && new Date(todo.due_date) < today
  ).length

  // Calculate today's tasks
  const todayCount = todos.filter(todo => {
    if (!todo.due_date) return false
    const dueDate = new Date(todo.due_date)
    return dueDate.toDateString() === today.toDateString()
  }).length

  // Calculate this week's tasks
  const weekFromNow = new Date()
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  const thisWeekCount = todos.filter(todo => 
    todo.due_date && new Date(todo.due_date) <= weekFromNow
  ).length

  // Calculate average completion time
  const completedWithTime = completedTodos.filter(todo => todo.actual_time)
  const avgCompletionTime = completedWithTime.length > 0 
    ? Math.round(completedWithTime.reduce((sum, todo) => sum + (todo.actual_time || 0), 0) / completedWithTime.length)
    : 0

  const stats = [
    {
      name: 'Total Tasks',
      value: totalTodos,
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Completed',
      value: completedCount,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Pending',
      value: pendingCount,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Overdue',
      value: overdueCount,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Today',
      value: todayCount,
      icon: CalendarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'This Week',
      value: thisWeekCount,
      icon: CalendarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Productivity Overview</h3>
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600">{completionRate}%</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.name} className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} mb-2`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-600">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Priority Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Priority Distribution</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(priorityStats).map(([priority, count]) => {
            const percentage = totalTodos > 0 ? Math.round((count / totalTodos) * 100) : 0
            const priorityColors = {
              urgent: 'bg-red-500',
              high: 'bg-orange-500',
              medium: 'bg-yellow-500',
              low: 'bg-green-500'
            }
            return (
              <div key={priority} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-500'}`} />
                  <span className="text-sm font-medium text-slate-700 capitalize">{priority}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{count}</div>
                  <div className="text-xs text-slate-500">{percentage}%</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category Distribution */}
      {Object.keys(categoryStats).length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Category Distribution</h4>
          <div className="space-y-2">
            {Object.entries(categoryStats).map(([category, count]) => {
              const percentage = totalTodos > 0 ? Math.round((count / totalTodos) * 100) : 0
              return (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">{category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ClockIcon className="h-5 w-5 text-slate-600" />
            <h4 className="text-sm font-medium text-slate-700">Average Completion Time</h4>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {avgCompletionTime > 0 ? `${avgCompletionTime}m` : 'N/A'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Based on {completedWithTime.length} completed tasks
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TagIcon className="h-5 w-5 text-slate-600" />
            <h4 className="text-sm font-medium text-slate-700">Most Active Category</h4>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Object.keys(categoryStats).length > 0 
              ? Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0][0]
              : 'N/A'
            }
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {Object.keys(categoryStats).length > 0 
              ? `${Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0][1]} tasks`
              : 'No categories yet'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

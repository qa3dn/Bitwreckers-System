'use client'

import { User, Task } from '@/types/database'
import { ChartBarIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline'

interface ProgressOverviewProps {
  members: User[]
  tasks: Task[]
  projectId?: string
}

export default function ProgressOverview({ members, tasks, projectId }: ProgressOverviewProps) {
  const getMemberProgress = (member: User) => {
    const memberTasks = projectId 
      ? tasks.filter(task => task.assigned_to === member.id && task.project_id === projectId)
      : tasks.filter(task => task.assigned_to === member.id)
    
    const totalTasks = memberTasks.length
    const completedTasks = memberTasks.filter(task => task.status === 'done').length
    const inProgressTasks = memberTasks.filter(task => task.status === 'in_progress').length
    const todoTasks = memberTasks.filter(task => task.status === 'todo').length
    
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionPercentage
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-aqua-green'
    if (percentage >= 60) return 'text-neon-blue'
    if (percentage >= 40) return 'text-electric-purple'
    return 'text-coral'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-aqua-green'
    if (percentage >= 60) return 'bg-neon-blue'
    if (percentage >= 40) return 'bg-electric-purple'
    return 'bg-coral'
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'team-lead': return 'bg-electric-purple text-soft-white'
      case 'project-manager': return 'bg-neon-blue text-midnight-blue'
      case 'member': return 'bg-aqua-green text-midnight-blue'
      default: return 'bg-light-gray text-midnight-blue'
    }
  }

  return (
    <div className="bg-dark-gray rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-soft-white">Team Progress Overview</h3>
        <ChartBarIcon className="h-6 w-6 text-electric-purple" />
      </div>

      <div className="space-y-4">
        {members.map((member) => {
          const progress = getMemberProgress(member)
          
          return (
            <div key={member.id} className="bg-midnight-blue rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-electric-purple flex items-center justify-center">
                    <span className="text-sm font-medium text-soft-white">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-soft-white">{member.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role.replace('-', ' ')}
                      </span>
                      <span className="text-xs text-light-gray">{member.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getProgressColor(progress.completionPercentage)}`}>
                    {progress.completionPercentage}%
                  </div>
                  <div className="text-xs text-light-gray">Complete</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-light-gray rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(progress.completionPercentage)}`}
                    style={{ width: `${progress.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Task Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <CheckIcon className="h-4 w-4 text-aqua-green" />
                  <div>
                    <div className="text-sm font-semibold text-soft-white">{progress.completedTasks}</div>
                    <div className="text-xs text-light-gray">Done</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-1">
                  <ClockIcon className="h-4 w-4 text-neon-blue" />
                  <div>
                    <div className="text-sm font-semibold text-soft-white">{progress.inProgressTasks}</div>
                    <div className="text-xs text-light-gray">In Progress</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-1">
                  <div className="h-4 w-4 rounded-full bg-light-gray flex items-center justify-center">
                    <span className="text-xs text-midnight-blue">T</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-soft-white">{progress.todoTasks}</div>
                    <div className="text-xs text-light-gray">To Do</div>
                  </div>
                </div>
              </div>

              {/* Total Tasks */}
              <div className="mt-3 pt-3 border-t border-light-gray text-center">
                <div className="text-sm text-light-gray">
                  Total Tasks: <span className="font-semibold text-soft-white">{progress.totalTasks}</span>
                </div>
              </div>
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="text-center py-8 text-light-gray">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team members found</p>
          </div>
        )}
      </div>
    </div>
  )
}

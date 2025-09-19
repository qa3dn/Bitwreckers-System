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
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function ProjectManagerPage() {
  const { user } = useAuth()
  const [managedProjects, setManagedProjects] = useState<Project[]>([])
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch projects where user is project manager
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          *,
          project:projects(*),
          user:users(*)
        `)
        .eq('user_id', user?.id)
        .eq('role', 'project-manager')

      if (membersError) {
        console.error('Error fetching managed projects:', membersError)
      }

      const projects = membersData?.map(member => member.project).filter(Boolean) || []
      setManagedProjects(projects)

      // Fetch all project members for managed projects
      if (projects.length > 0) {
        const projectIds = projects.map(p => p.id)
        const { data: allMembersData, error: allMembersError } = await supabase
          .from('project_members')
          .select(`
            *,
            user:users(*),
            project:projects(*)
          `)
          .in('project_id', projectIds)

        if (allMembersError) {
          console.error('Error fetching project members:', allMembersError)
        }

        setProjectMembers(allMembersData || [])
      }

      // Fetch tasks for managed projects
      if (projects.length > 0) {
        const projectIds = projects.map(p => p.id)
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            assigned_user:users(*),
            project:projects(*)
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError)
        }

        setTasks(tasksData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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

      setShowCreateTask(false)
      fetchData()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)

      if (error) {
        console.error('Error updating task:', error)
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-soft-white">Loading...</div>
      </div>
    )
  }

  const stats = {
    totalProjects: managedProjects.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length
  }

  return (
    <Protected allowedRoles={['project-manager']}>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-soft-white mb-2">Project Manager Dashboard</h1>
            <p className="text-light-gray">Manage your assigned projects and team members</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <FolderIcon className="h-8 w-8 text-electric-purple" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-light-gray">Managed Projects</p>
                  <p className="text-2xl font-bold text-soft-white">{stats.totalProjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <CheckIcon className="h-8 w-8 text-neon-blue" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-light-gray">Total Tasks</p>
                  <p className="text-2xl font-bold text-soft-white">{stats.totalTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-aqua-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-light-gray">In Progress</p>
                  <p className="text-2xl font-bold text-soft-white">{stats.inProgressTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-coral" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-light-gray">Completed</p>
                  <p className="text-2xl font-bold text-soft-white">{stats.completedTasks}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Task
            </button>
          </div>

          {/* Managed Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {managedProjects.map((project) => {
              const projectTasks = tasks.filter(t => t.project_id === project.id)
              const projectMembersList = projectMembers.filter(pm => pm.project_id === project.id)
              
              return (
                <div key={project.id} className="bg-dark-gray rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-soft-white">{project.name}</h3>
                      <p className="text-light-gray">{project.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      project.status === 'in_progress' ? 'bg-neon-blue text-midnight-blue' :
                      project.status === 'completed' ? 'bg-aqua-green text-midnight-blue' :
                      project.status === 'on_hold' ? 'bg-coral text-soft-white' :
                      'bg-light-gray text-midnight-blue'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Project Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-soft-white">{projectTasks.length}</p>
                      <p className="text-sm text-light-gray">Total Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-soft-white">{projectMembersList.length}</p>
                      <p className="text-sm text-light-gray">Team Members</p>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-light-gray mb-2">Team Members</h4>
                    <div className="flex flex-wrap gap-2">
                      {projectMembersList.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2 bg-midnight-blue px-3 py-1 rounded-full">
                          <div className="h-6 w-6 rounded-full bg-electric-purple flex items-center justify-center">
                            <span className="text-xs font-medium text-soft-white">
                              {member.user?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <span className="text-sm text-soft-white">{member.user?.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            member.role === 'project-manager' 
                              ? 'bg-electric-purple text-soft-white' 
                              : 'bg-neon-blue text-midnight-blue'
                          }`}>
                            {member.role.replace('-', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div>
                    <h4 className="text-sm font-medium text-light-gray mb-2">Recent Tasks</h4>
                    <div className="space-y-2">
                      {projectTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between bg-midnight-blue p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <CheckIcon className="h-4 w-4 text-light-gray" />
                            <span className="text-sm text-soft-white">{task.title}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              task.status === 'done' ? 'bg-aqua-green text-midnight-blue' :
                              task.status === 'in_progress' ? 'bg-neon-blue text-midnight-blue' :
                              'bg-light-gray text-midnight-blue'
                            }`}>
                              {task.status}
                            </span>
                            <button
                              onClick={() => updateTaskStatus(task.id, 'done')}
                              className="text-aqua-green hover:text-neon-blue text-xs"
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* All Tasks */}
          <div className="bg-dark-gray rounded-lg p-6">
            <h2 className="text-xl font-bold text-soft-white mb-4">All Tasks</h2>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-midnight-blue p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-soft-white">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.status === 'done' ? 'bg-aqua-green text-midnight-blue' :
                          task.status === 'in_progress' ? 'bg-neon-blue text-midnight-blue' :
                          'bg-light-gray text-midnight-blue'
                        }`}>
                          {task.status}
                        </span>
                        <span className={`text-sm ${
                          task.priority === 'urgent' ? 'text-coral' :
                          task.priority === 'high' ? 'text-coral' :
                          task.priority === 'medium' ? 'text-neon-blue' :
                          'text-light-gray'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-light-gray mb-2">{task.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-light-gray">
                        <span>Project: {task.project?.name}</span>
                        <span>Assigned to: {task.assigned_user?.name}</span>
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateTaskStatus(task.id, 'todo')}
                        className={`px-3 py-1 rounded text-xs ${
                          task.status === 'todo' 
                            ? 'bg-neon-blue text-midnight-blue' 
                            : 'bg-midnight-blue text-light-gray hover:bg-neon-blue hover:text-midnight-blue'
                        }`}
                      >
                        To Do
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        className={`px-3 py-1 rounded text-xs ${
                          task.status === 'in_progress' 
                            ? 'bg-neon-blue text-midnight-blue' 
                            : 'bg-midnight-blue text-light-gray hover:bg-neon-blue hover:text-midnight-blue'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.id, 'done')}
                        className={`px-3 py-1 rounded text-xs ${
                          task.status === 'done' 
                            ? 'bg-aqua-green text-midnight-blue' 
                            : 'bg-midnight-blue text-light-gray hover:bg-aqua-green hover:text-midnight-blue'
                        }`}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Task Modal */}
          {showCreateTask && (
            <div className="fixed inset-0 bg-transparent-black flex items-center justify-center z-50">
              <div className="bg-dark-gray p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-bold text-soft-white mb-4">Create New Task</h3>
                <form action={createTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-1">Project</label>
                    <select
                      name="project_id"
                      required
                      className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                    >
                      <option value="">Select Project</option>
                      {managedProjects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-1">Task Title</label>
                    <input
                      name="title"
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
                  <div>
                    <label className="block text-sm font-medium text-light-gray mb-1">Assign To</label>
                    <select
                      name="assigned_to"
                      required
                      className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                    >
                      <option value="">Select Member</option>
                      {projectMembers.map(member => (
                        <option key={member.id} value={member.user_id}>{member.user?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-light-gray mb-1">Priority</label>
                      <select
                        name="priority"
                        className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-light-gray mb-1">Due Date</label>
                      <input
                        name="due_date"
                        type="date"
                        className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateTask(false)}
                      className="px-4 py-2 text-light-gray hover:text-soft-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </Protected>
  )
}

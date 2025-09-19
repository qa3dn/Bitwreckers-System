'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import PomodoroTimer from '@/components/PomodoroTimer'
import TodoStats from '@/components/TodoStats'
import useTodoKeyboardShortcuts from '@/hooks/useTodoKeyboardShortcuts'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'
import DraggableTodo from '@/components/DraggableTodo'

interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  tags: string[]
  created_at: string
  updated_at: string
  estimated_time?: number // in minutes
  actual_time?: number // in minutes
  category?: string
  subtasks?: Subtask[]
}

interface Subtask {
  id: string
  title: string
  completed: boolean
  todo_id: string
}

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export default function PersonalTodosPage() {
  const { user, loading: authLoading } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar' | 'stats'>('list')
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'completed' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddTodo, setShowAddTodo] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const supabase = createClient()

  const categories: Category[] = [
    { id: 'programming', name: 'Programming', color: 'bg-blue-500', icon: '💻' },
    { id: 'frontend', name: 'Frontend', color: 'bg-green-500', icon: '🎨' },
    { id: 'backend', name: 'Backend', color: 'bg-red-500', icon: '⚙️' },
    { id: 'database', name: 'Database', color: 'bg-purple-500', icon: '🗄️' },
    { id: 'study', name: 'Study', color: 'bg-yellow-500', icon: '📚' },
    { id: 'project', name: 'Project', color: 'bg-indigo-500', icon: '🚀' },
    { id: 'debugging', name: 'Debugging', color: 'bg-orange-500', icon: '🐛' },
    { id: 'testing', name: 'Testing', color: 'bg-pink-500', icon: '🧪' }
  ]

  useEffect(() => {
    if (!authLoading && user) {
      fetchTodos()
    }
  }, [authLoading, user])


  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_todos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching todos:', error)
      } else {
        // Ensure all todos have the required fields with defaults
        const todosWithDefaults = (data || []).map(todo => ({
          ...todo,
          completed: todo.completed || false,
          priority: todo.priority || 'medium',
          tags: todo.tags || [],
          category: todo.category || null,
          estimated_time: todo.estimated_time || null,
          actual_time: todo.actual_time || null,
          due_date: todo.due_date || null
        }))
        setTodos(todosWithDefaults)
      }
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (todoData: Partial<Todo>) => {
    try {
      // Only include fields that exist in the current database schema
      const insertData = {
        title: todoData.title,
        description: todoData.description,
        user_id: user?.id,
        // Add new fields only if they exist
        ...(todoData.priority && { priority: todoData.priority }),
        ...(todoData.due_date && { due_date: todoData.due_date }),
        ...(todoData.tags && { tags: todoData.tags }),
        ...(todoData.category && { category: todoData.category }),
        ...(todoData.estimated_time && { estimated_time: todoData.estimated_time }),
        ...(todoData.actual_time && { actual_time: todoData.actual_time })
      }

      const { data, error } = await supabase
        .from('personal_todos')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error adding todo:', error)
        console.error('Insert data:', insertData)
      } else {
        setTodos(prev => [data, ...prev])
        setShowAddTodo(false)
      }
    } catch (error) {
      console.error('Error adding todo:', error)
    }
  }

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      // Filter out fields that might not exist in the database yet
      const allowedUpdates = {
        title: updates.title,
        description: updates.description,
        completed: updates.completed,
        priority: updates.priority,
        due_date: updates.due_date,
        tags: updates.tags,
        estimated_time: updates.estimated_time,
        actual_time: updates.actual_time,
        category: updates.category
      }

      // Remove undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(allowedUpdates).filter(([, value]) => value !== undefined)
      )

      const { error } = await supabase
        .from('personal_todos')
        .update(cleanUpdates)
        .eq('id', id)

      if (error) {
        console.error('Error updating todo:', error)
        console.error('Updates attempted:', cleanUpdates)
      } else {
        setTodos(prev => prev.map(todo => 
          todo.id === id ? { ...todo, ...updates } : todo
        ))
        setEditingTodo(null)
      }
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_todos')
      .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting todo:', error)
      } else {
        setTodos(prev => prev.filter(todo => todo.id !== id))
      }
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('personal_todos')
        .update({ completed })
        .eq('id', id)

      if (error) {
        console.error('Error toggling todo completion:', error)
      } else {
        setTodos(prev => prev.map(todo => 
          todo.id === id ? { ...todo, completed } : todo
        ))
      }
    } catch (error) {
      console.error('Error toggling todo completion:', error)
    }
  }

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = (() => {
      switch (filter) {
        case 'today':
          const today = new Date().toDateString()
          return todo.due_date && new Date(todo.due_date).toDateString() === today
        case 'week':
          const weekFromNow = new Date()
          weekFromNow.setDate(weekFromNow.getDate() + 7)
          return todo.due_date && new Date(todo.due_date) <= weekFromNow
        case 'completed':
          return todo.completed
        case 'pending':
          return !todo.completed
        default:
          return true
      }
    })()

    const matchesCategory = selectedCategory === 'all' || todo.category === selectedCategory

    return matchesSearch && matchesFilter && matchesCategory
  })

  const completedCount = todos.filter(todo => todo.completed).length
  const totalCount = todos.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Drag & Drop functions
  const handleDragStart = (e: React.DragEvent, todo: Todo) => {
    setDraggedTodo(todo)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTodo(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = async (_e: React.DragEvent, targetIndex: number) => {
    if (!draggedTodo) return

    const draggedIndex = todos.findIndex(todo => todo.id === draggedTodo.id)
    if (draggedIndex === -1 || draggedIndex === targetIndex) return

    // Create new array with reordered todos
    const newTodos = [...todos]
    const [removed] = newTodos.splice(draggedIndex, 1)
    newTodos.splice(targetIndex, 0, removed)
    
    setTodos(newTodos)
    setDragOverIndex(null)

    // Update priority based on new position (optional)
    const newPriority = targetIndex < 2 ? 'urgent' : 
                       targetIndex < 5 ? 'high' : 
                       targetIndex < 10 ? 'medium' : 'low'
    
    if (newPriority !== draggedTodo.priority) {
      await updateTodo(draggedTodo.id, { priority: newPriority })
    }
  }

  // Keyboard shortcuts
  useTodoKeyboardShortcuts({
    onAddTodo: () => setShowAddTodo(true),
    onToggleFilters: () => setShowFilters(!showFilters),
    onSearch: (query) => setSearchQuery(query),
    onViewModeChange: (mode) => setViewMode(mode),
    onTogglePomodoro: () => setShowPomodoro(!showPomodoro),
    searchQuery,
    setSearchQuery
  })


  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center" suppressHydrationWarning={true}>
          <div className="text-soft-white">Loading your tasks...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-midnight-blue" suppressHydrationWarning={true}>
        {/* Header */}
        <div className="bg-dark-gray shadow-sm border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-soft-white">To Do</h1>
                <div className="flex items-center space-x-2 text-sm text-light-gray">
                  <span>{completedCount} of {totalCount} completed</span>
                  <div className="w-16 bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-electric-purple h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span>{completionRate}%</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Pomodoro Toggle */}
                <button
                  onClick={() => setShowPomodoro(!showPomodoro)}
                  className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-soft-white px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="text-lg">🍅</span>
                  <span className="text-sm font-medium">Focus Timer</span>
                </button>

                {/* Help Button */}
                <button
                  onClick={() => setShowHelp(true)}
                  className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-soft-white px-3 py-2 rounded-lg transition-colors"
                  title="Keyboard Shortcuts"
                >
                  <span className="text-lg">❓</span>
                  <span className="text-sm font-medium">Help</span>
                </button>

                {/* Add Todo Button */}
                <button
                  onClick={() => setShowAddTodo(true)}
                  className="flex items-center space-x-2 bg-electric-purple hover:bg-purple-600 text-soft-white px-4 py-2 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Task</span>
                  <span className="text-xs text-purple-200">⌘N</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-dark-gray border border-slate-600 text-soft-white placeholder-light-gray rounded-lg focus:ring-2 focus:ring-electric-purple focus:border-transparent w-full sm:w-64"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-dark-gray border border-slate-600 text-soft-white rounded-lg hover:bg-slate-700"
              >
                <FunnelIcon className="h-5 w-5" />
                <span>Filters</span>
                <span className="text-xs text-light-gray">⌘F</span>
              </button>
            </div>

            {/* View Modes */}
            <div className="flex items-center space-x-2">
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-electric-purple shadow-sm' : 'text-light-gray hover:text-soft-white'}`}
                  title="List View (⌘1)"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-electric-purple shadow-sm' : 'text-light-gray hover:text-soft-white'}`}
                  title="Kanban View (⌘2)"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-electric-purple shadow-sm' : 'text-light-gray hover:text-soft-white'}`}
                  title="Calendar View (⌘3)"
                >
                  <CalendarIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('stats')}
                  className={`p-2 rounded ${viewMode === 'stats' ? 'bg-electric-purple shadow-sm' : 'text-light-gray hover:text-soft-white'}`}
                  title="Statistics (⌘4)"
                >
                  <ChartBarIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 bg-dark-gray rounded-lg shadow-sm border border-slate-700 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Time Filters */}
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">Time</label>
                  <div className="space-y-1">
                    {['all', 'today', 'week', 'completed', 'pending'].map((filterOption) => (
                      <button
                        key={filterOption}
                        onClick={() => setFilter(filterOption as any)}
                        className={`w-full text-left px-3 py-2 rounded text-sm capitalize ${
                          filter === filterOption 
                            ? 'bg-electric-purple text-soft-white' 
                            : 'hover:bg-slate-700 text-light-gray'
                        }`}
                      >
                        {filterOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-soft-white mb-2">Category</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        selectedCategory === 'all' 
                          ? 'bg-electric-purple text-soft-white' 
                          : 'hover:bg-slate-700 text-light-gray'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm flex items-center space-x-2 ${
                          selectedCategory === category.id 
                            ? 'bg-electric-purple text-soft-white' 
                            : 'hover:bg-slate-700 text-light-gray'
                        }`}
                      >
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pomodoro Timer */}
        {showPomodoro && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <PomodoroTimer onComplete={() => {
              // Optional: Add completion logic here
              console.log('Pomodoro session completed!')
            }} />
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredTodos.map((todo, index) => (
                <div
                  key={todo.id}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`transition-all duration-200 ${
                    dragOverIndex === index ? 'transform scale-105' : ''
                  }`}
                >
                  <DraggableTodo
                    todo={todo}
                    onToggleComplete={toggleComplete}
                    onEdit={setEditingTodo}
                    onDelete={deleteTodo}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTodo?.id === todo.id}
                  />
                </div>
              ))}
              
              {filteredTodos.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
                  <p className="text-slate-500 mb-4">
                    {searchQuery ? 'Try adjusting your search or filters' : 'Get started by adding your first task'}
                  </p>
                  <button
                    onClick={() => setShowAddTodo(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Task
                  </button>
                </div>
              )}
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {['pending', 'in_progress', 'review', 'completed'].map((status) => (
                <div key={status} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                  <h3 className="font-medium text-slate-900 mb-4 capitalize">
                    {status.replace('_', ' ')} ({filteredTodos.filter(t => {
                      switch (status) {
                        case 'pending': return !t.completed
                        case 'in_progress': return !t.completed && t.priority === 'high'
                        case 'review': return !t.completed && t.priority === 'medium'
                        case 'completed': return t.completed
                        default: return false
                      }
                    }).length})
                  </h3>
                  <div className="space-y-3">
                    {filteredTodos.filter(t => {
                      switch (status) {
                        case 'pending': return !t.completed
                        case 'in_progress': return !t.completed && t.priority === 'high'
                        case 'review': return !t.completed && t.priority === 'medium'
                        case 'completed': return t.completed
                        default: return false
                      }
                    }).map((todo) => (
                      <div
                        key={todo.id}
                        className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                      >
                        <h4 className="font-medium text-slate-900 text-sm">{todo.title}</h4>
                        {todo.due_date && (
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(todo.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'stats' && (
            <div className="space-y-6">
              <TodoStats 
                todos={todos}
                completedTodos={todos.filter(t => t.completed)}
                pendingTodos={todos.filter(t => !t.completed)}
              />
              
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {todos.slice(0, 5).map((todo) => (
                    <div key={todo.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${todo.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{todo.title}</p>
                        <p className="text-xs text-slate-500">
                          {todo.completed ? 'Completed' : 'Pending'} • {new Date(todo.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400">
                        {todo.priority}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Todo Modal */}
        {showAddTodo && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-dark-gray rounded-lg shadow-xl w-full max-w-md mx-4 border border-slate-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-soft-white">Add New Task</h3>
                  <button
                    onClick={() => setShowAddTodo(false)}
                    className="text-light-gray hover:text-soft-white transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  addTodo({
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent',
                    due_date: formData.get('due_date') as string,
                    category: formData.get('category') as string,
                    estimated_time: parseInt(formData.get('estimated_time') as string) || undefined,
                    tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || []
                  })
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-soft-white mb-2">Title</label>
                      <input
                        name="title"
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-soft-white placeholder-light-gray rounded-lg focus:ring-2 focus:ring-electric-purple focus:border-transparent transition-colors"
                        placeholder="What needs to be done?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-soft-white mb-2">Description</label>
                      <textarea
                        name="description"
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-soft-white placeholder-light-gray rounded-lg focus:ring-2 focus:ring-electric-purple focus:border-transparent transition-colors resize-none"
                        placeholder="Add details..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-soft-white mb-2">Priority</label>
                        <select
                          name="priority"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-soft-white rounded-lg focus:ring-2 focus:ring-electric-purple focus:border-transparent transition-colors"
                        >
                          <option value="low">🟢 Low</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="high">🟠 High</option>
                          <option value="urgent">🔴 Urgent</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-soft-white mb-2">Category</label>
                        <select
                          name="category"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-soft-white rounded-lg focus:ring-2 focus:ring-electric-purple focus:border-transparent transition-colors"
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.icon} {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-soft-white mb-2">Due Date</label>
                        <input
                          name="due_date"
                          type="date"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-soft-white rounded-lg focus:ring-2 focus:ring-electric-purple focus:border-transparent transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-soft-white mb-2">Est. Time (min)</label>
                        <input
                          name="estimated_time"
                          type="number"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-soft-white placeholder-light-gray rounded-lg focus:ring-2 focus:ring-electric-purple focus:border-transparent transition-colors"
                          placeholder="30"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-soft-white mb-2">Tags</label>
                      <input
                        name="tags"
                        type="text"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-soft-white placeholder-light-gray rounded-lg focus:ring-2 focus:ring-electric-purple focus:border-transparent transition-colors"
                        placeholder="react, bug, feature (comma separated)"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setShowAddTodo(false)}
                      className="px-6 py-3 text-light-gray hover:text-soft-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-electric-purple hover:bg-purple-600 text-soft-white rounded-lg transition-colors font-medium"
                    >
                      ✨ Add Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        <KeyboardShortcutsHelp 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
        />
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Suggestion {
  id: string
  project_name: string
  description: string
  importance_reason: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department?: string
  estimated_budget?: number
  estimated_duration?: number
  created_at: string
  updated_at: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
}

export default function SuggestionsPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all')
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchSuggestions()
    }
  }, [user])

  const fetchSuggestions = async () => {
    try {
      let query = supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false })

      // If user is not team-lead, only show their own suggestions
      if (userProfile?.role !== 'team-lead') {
        query = query.eq('user_id', user?.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching suggestions:', error)
      } else {
        setSuggestions(data || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSuggestion = async (suggestionData: Partial<Suggestion>) => {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user?.id,
          project_name: suggestionData.project_name,
          description: suggestionData.description,
          importance_reason: suggestionData.importance_reason,
          priority: suggestionData.priority || 'medium',
          department: userProfile?.department,
          estimated_budget: suggestionData.estimated_budget,
          estimated_duration: suggestionData.estimated_duration
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding suggestion:', error)
      } else {
        setSuggestions(prev => [data, ...prev])
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Error adding suggestion:', error)
    }
  }

  const updateSuggestion = async (id: string, updates: Partial<Suggestion>) => {
    try {
      const { error } = await supabase
        .from('suggestions')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating suggestion:', error)
      } else {
        setSuggestions(prev => prev.map(suggestion => 
          suggestion.id === id ? { ...suggestion, ...updates } : suggestion
        ))
        setEditingSuggestion(null)
      }
    } catch (error) {
      console.error('Error updating suggestion:', error)
    }
  }

  const deleteSuggestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting suggestion:', error)
      } else {
        setSuggestions(prev => prev.filter(suggestion => suggestion.id !== id))
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'under_review':
        return <EyeIcon className="h-5 w-5 text-blue-500" />
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter === 'all') return true
    return suggestion.status === filter
  })

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="text-soft-white">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-midnight-blue p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-soft-white mb-2">Project Suggestions</h1>
                <p className="text-light-gray">
                  {userProfile?.role === 'team-lead' 
                    ? 'View and manage all project suggestions from team members'
                    : 'Share your innovative project ideas with the team'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-electric-purple hover:bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                New Suggestion
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex gap-2">
              {['all', 'pending', 'under_review', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-electric-purple text-white'
                      : 'bg-slate-700 text-light-gray hover:bg-slate-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-light-gray text-lg">No suggestions found</div>
                <p className="text-gray-500 mt-2">
                  {filter === 'all' 
                    ? 'Start by creating your first project suggestion'
                    : `No suggestions with status: ${filter}`
                  }
                </p>
              </div>
            ) : (
              filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-dark-gray border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(suggestion.priority)}`} />
                      <h3 className="text-xl font-semibold text-soft-white">
                        {suggestion.project_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(suggestion.status)}`}>
                        {suggestion.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(suggestion.status)}
                      {suggestion.status === 'pending' && userProfile?.role !== 'team-lead' && (
                        <>
                          <button
                            onClick={() => setEditingSuggestion(suggestion)}
                            className="p-2 text-light-gray hover:text-electric-purple transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSuggestion(suggestion.id)}
                            className="p-2 text-light-gray hover:text-red-500 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-light-gray mb-1">Description</h4>
                      <p className="text-soft-white">{suggestion.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-light-gray mb-1">Why is it important?</h4>
                      <p className="text-soft-white">{suggestion.importance_reason}</p>
                    </div>

                    {(suggestion.estimated_budget || suggestion.estimated_duration) && (
                      <div className="flex gap-6 text-sm">
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
                        <h4 className="text-sm font-medium text-light-gray mb-2">Review Notes</h4>
                        <p className="text-soft-white">{suggestion.review_notes}</p>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Created: {new Date(suggestion.created_at).toLocaleDateString()}
                      {suggestion.reviewed_at && (
                        <span> • Reviewed: {new Date(suggestion.reviewed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || editingSuggestion) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-dark-gray border border-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-soft-white">
                  {editingSuggestion ? 'Edit Suggestion' : 'New Project Suggestion'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingSuggestion(null)
                  }}
                  className="text-light-gray hover:text-soft-white"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const data = {
                  project_name: formData.get('project_name') as string,
                  description: formData.get('description') as string,
                  importance_reason: formData.get('importance_reason') as string,
                  priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent',
                  estimated_budget: formData.get('estimated_budget') ? parseFloat(formData.get('estimated_budget') as string) : undefined,
                  estimated_duration: formData.get('estimated_duration') ? parseInt(formData.get('estimated_duration') as string) : undefined
                }

                if (editingSuggestion) {
                  updateSuggestion(editingSuggestion.id, data)
                } else {
                  addSuggestion(data)
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">Project Name</label>
                    <input
                      name="project_name"
                      type="text"
                      required
                      defaultValue={editingSuggestion?.project_name || ''}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-soft-white focus:border-electric-purple focus:outline-none"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">Description</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      defaultValue={editingSuggestion?.description || ''}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-soft-white focus:border-electric-purple focus:outline-none"
                      placeholder="Describe your project idea"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">Why is it important?</label>
                    <textarea
                      name="importance_reason"
                      required
                      rows={3}
                      defaultValue={editingSuggestion?.importance_reason || ''}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-soft-white focus:border-electric-purple focus:outline-none"
                      placeholder="Explain why this project is important for the team/company"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-soft-white mb-2">Priority</label>
                      <select
                        name="priority"
                        defaultValue={editingSuggestion?.priority || 'medium'}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-soft-white focus:border-electric-purple focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-soft-white mb-2">Estimated Budget ($)</label>
                      <input
                        name="estimated_budget"
                        type="number"
                        step="0.01"
                        defaultValue={editingSuggestion?.estimated_budget || ''}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-soft-white focus:border-electric-purple focus:outline-none"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-soft-white mb-2">Duration (days)</label>
                      <input
                        name="estimated_duration"
                        type="number"
                        defaultValue={editingSuggestion?.estimated_duration || ''}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-soft-white focus:border-electric-purple focus:outline-none"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingSuggestion(null)
                    }}
                    className="px-4 py-2 text-light-gray hover:text-soft-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-electric-purple hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    {editingSuggestion ? 'Update Suggestion' : 'Submit Suggestion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

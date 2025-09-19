'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  placeholder?: string
  showFilters?: boolean
}

export interface SearchFilters {
  query: string
  status?: string
  priority?: string
  assignee?: string
  project?: string
  dateFrom?: string
  dateTo?: string
  type?: string
}

export default function AdvancedSearch({ 
  onSearch, 
  placeholder = "Search...",
  showFilters = true 
}: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: '',
    priority: '',
    assignee: '',
    project: '',
    dateFrom: '',
    dateTo: '',
    type: ''
  })

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onSearch(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      status: '',
      priority: '',
      assignee: '',
      project: '',
      dateFrom: '',
      dateTo: '',
      type: ''
    }
    setFilters(clearedFilters)
    onSearch(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="bg-dark-gray rounded-lg p-4 mb-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-gray" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleInputChange('query', e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:border-electric-purple"
          />
        </div>
        
        {showFilters && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isExpanded || hasActiveFilters
                ? 'bg-electric-purple text-soft-white'
                : 'bg-midnight-blue text-light-gray hover:bg-light-gray hover:text-soft-white'
            }`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-1 bg-coral text-soft-white rounded-full text-xs">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center px-3 py-2 bg-coral text-soft-white rounded-lg hover:bg-red-500 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 mr-2" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && showFilters && (
        <div className="mt-4 pt-4 border-t border-light-gray">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-light-gray mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
              >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-light-gray mb-1">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
              >
                <option value="">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-light-gray mb-1">Type</label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
              >
                <option value="">All Types</option>
                <option value="project">Project Tasks</option>
                <option value="personal">Personal Todos</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-light-gray mb-1">Assignee</label>
              <input
                type="text"
                value={filters.assignee || ''}
                onChange={(e) => handleInputChange('assignee', e.target.value)}
                placeholder="Search by assignee..."
                className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:border-electric-purple"
              />
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-light-gray mb-1">Project</label>
              <input
                type="text"
                value={filters.project || ''}
                onChange={(e) => handleInputChange('project', e.target.value)}
                placeholder="Search by project..."
                className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:border-electric-purple"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-light-gray mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-light-gray mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white focus:outline-none focus:border-electric-purple"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

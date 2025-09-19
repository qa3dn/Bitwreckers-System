'use client'

import { useState, useEffect } from 'react'
import { Message, User } from '@/types/database'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface MessageSearchProps {
  messages: Message[]
  users: User[]
  onSearch: (results: SearchResult[]) => void
  onClear: () => void
}

interface SearchResult {
  message: Message
  sender: User
  context: string
  matchIndex: number
}

export default function MessageSearch({ 
  messages, 
  users, 
  onSearch, 
  onClear 
}: MessageSearchProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  const searchMessages = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      onClear()
      return
    }

    setIsSearching(true)
    const searchTerm = searchQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    messages.forEach(message => {
      const sender = users.find(u => u.id === message.sender_id)
      if (!sender) return

      const content = message.content.toLowerCase()
      const matchIndex = content.indexOf(searchTerm)
      
      if (matchIndex !== -1) {
        // Get context around the match
        const start = Math.max(0, matchIndex - 50)
        const end = Math.min(content.length, matchIndex + searchTerm.length + 50)
        const context = message.content.substring(start, end)
        
        searchResults.push({
          message,
          sender,
          context,
          matchIndex: matchIndex - start
        })
      }
    })

    // Sort by most recent
    searchResults.sort((a, b) => 
      new Date(b.message.created_at).getTime() - new Date(a.message.created_at).getTime()
    )

    setResults(searchResults)
    onSearch(searchResults)
    setIsSearching(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchMessages(query)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    onClear()
  }

  const highlightMatch = (text: string, matchIndex: number, searchTerm: string) => {
    const before = text.substring(0, matchIndex)
    const match = text.substring(matchIndex, matchIndex + searchTerm.length)
    const after = text.substring(matchIndex + searchTerm.length)
    
    return (
      <span>
        {before}
        <mark className="bg-electric-purple text-soft-white px-1 rounded">
          {match}
        </mark>
        {after}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-gray" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-10 pr-10 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:border-electric-purple"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-gray hover:text-soft-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="bg-dark-gray rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-soft-white">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </h3>
            <button
              onClick={handleClear}
              className="text-xs text-light-gray hover:text-soft-white"
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div key={`${result.message.id}-${index}`} className="p-3 bg-midnight-blue rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-electric-purple flex items-center justify-center">
                    <span className="text-xs font-medium text-soft-white">
                      {result.sender.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-soft-white">
                    {result.sender.name}
                  </span>
                  <span className="text-xs text-light-gray">
                    {new Date(result.message.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-light-gray">
                  {highlightMatch(result.context, result.matchIndex, query.toLowerCase())}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {query && results.length === 0 && !isSearching && (
        <div className="text-center py-8 text-light-gray">
          <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No messages found for "{query}"</p>
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="text-center py-8 text-light-gray">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-purple mx-auto mb-4" />
          <p>Searching...</p>
        </div>
      )}
    </div>
  )
}

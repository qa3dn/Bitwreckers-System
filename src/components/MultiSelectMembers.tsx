'use client'

import { useState, useRef, useEffect } from 'react'
import { User } from '@/types/database'
import { CheckIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline'

interface MultiSelectMembersProps {
  members: User[]
  selectedMembers: User[]
  onSelectionChange: (members: User[]) => void
  placeholder?: string
  maxSelections?: number
}

export default function MultiSelectMembers({
  members,
  selectedMembers,
  onSelectionChange,
  placeholder = "Select members...",
  maxSelections
}: MultiSelectMembersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMemberToggle = (member: User) => {
    const isSelected = selectedMembers.some(selected => selected.id === member.id)
    
    if (isSelected) {
      onSelectionChange(selectedMembers.filter(selected => selected.id !== member.id))
    } else {
      if (maxSelections && selectedMembers.length >= maxSelections) {
        return // Don't add if max selections reached
      }
      onSelectionChange([...selectedMembers, member])
    }
  }

  const removeMember = (memberId: string) => {
    onSelectionChange(selectedMembers.filter(member => member.id !== memberId))
  }

  const isMemberSelected = (memberId: string) => {
    return selectedMembers.some(selected => selected.id === memberId)
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
    <div className="relative" ref={dropdownRef}>
      {/* Selected Members Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[40px] p-2 bg-midnight-blue border border-light-gray rounded-lg cursor-pointer hover:border-electric-purple transition-colors"
      >
        {selectedMembers.length === 0 ? (
          <div className="text-light-gray text-sm">{placeholder}</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center space-x-2 bg-electric-purple text-soft-white px-3 py-1 rounded-full text-sm"
              >
                <div className="h-6 w-6 rounded-full bg-soft-white flex items-center justify-center">
                  <span className="text-xs font-medium text-electric-purple">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <span>{member.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMember(member.id)
                  }}
                  className="hover:text-coral transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {maxSelections && selectedMembers.length >= maxSelections && (
              <div className="text-xs text-coral">
                Max {maxSelections} selections
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-dark-gray border border-light-gray rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-light-gray">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full px-3 py-2 bg-midnight-blue border border-light-gray rounded-lg text-soft-white placeholder-light-gray focus:outline-none focus:border-electric-purple"
              autoFocus
            />
          </div>

          {/* Members List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-3 text-center text-light-gray text-sm">
                {searchQuery ? 'No members found' : 'No members available'}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = isMemberSelected(member.id)
                const isDisabled = !isSelected && maxSelections && selectedMembers.length >= maxSelections
                
                return (
                  <div
                    key={member.id}
                    onClick={() => !isDisabled && handleMemberToggle(member)}
                    className={`flex items-center space-x-3 p-3 hover:bg-midnight-blue cursor-pointer transition-colors ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-electric-purple flex items-center justify-center">
                        <span className="text-sm font-medium text-soft-white">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-soft-white truncate">
                          {member.name}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(member.role)}`}>
                          {member.role.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-light-gray truncate">
                        {member.email}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-5 w-5 text-aqua-green" />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-light-gray bg-midnight-blue">
            <div className="flex items-center justify-between text-xs text-light-gray">
              <span>
                {selectedMembers.length} selected
                {maxSelections && ` / ${maxSelections} max`}
              </span>
              <button
                onClick={() => onSelectionChange([])}
                className="text-coral hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

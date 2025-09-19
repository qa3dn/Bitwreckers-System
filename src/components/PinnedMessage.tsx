'use client'

import { useState } from 'react'
import { Message } from '@/types/database'
import { User } from '@/types/database'
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PinnedMessageProps {
  message: Message
  sender: User
  onUnpin: (messageId: string) => void
  canUnpin: boolean
}

export default function PinnedMessage({ 
  message, 
  sender, 
  onUnpin, 
  canUnpin 
}: PinnedMessageProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className="bg-electric-purple bg-opacity-20 border border-electric-purple rounded-lg p-3 mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          <MapPinIcon className="h-4 w-4 text-electric-purple mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-electric-purple">
                Pinned Message
              </span>
              <span className="text-xs text-light-gray">
                by {sender.name}
              </span>
            </div>
            <p className="text-sm text-soft-white line-clamp-2">
              {message.content}
            </p>
            <div className="text-xs text-light-gray mt-1">
              {new Date(message.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        
        {canUnpin && (
          <button
            onClick={() => onUnpin(message.id)}
            className={`p-1 text-light-gray hover:text-coral transition-colors ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            title="Unpin message"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

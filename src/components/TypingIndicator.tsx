'use client'

import { useEffect, useState } from 'react'
import { User } from '@/types/database'

interface TypingIndicatorProps {
  typingUsers: User[]
  currentUserId: string
}

export default function TypingIndicator({ typingUsers, currentUserId }: TypingIndicatorProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (typingUsers.length === 0) return null

  const otherUsers = typingUsers.filter(user => user.id !== currentUserId)

  if (otherUsers.length === 0) return null

  const getTypingText = () => {
    if (otherUsers.length === 1) {
      return `${otherUsers[0].name} is typing`
    } else if (otherUsers.length === 2) {
      return `${otherUsers[0].name} and ${otherUsers[1].name} are typing`
    } else {
      return `${otherUsers[0].name} and ${otherUsers.length - 1} others are typing`
    }
  }

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-sm text-light-gray">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-electric-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-electric-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-electric-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getTypingText()}{dots}</span>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { UserIcon } from '@heroicons/react/24/outline'

interface UserLinkProps {
  userId: string
  userName: string
  userEmail?: string
  className?: string
  showEmail?: boolean
}

export default function UserLink({ 
  userId, 
  userName, 
  userEmail, 
  className = '', 
  showEmail = false 
}: UserLinkProps) {
  return (
    <Link
      href={`/profile/${userId}`}
      className={`text-electric-purple hover:text-purple-400 transition-colors ${className}`}
    >
      <div className="flex items-center">
        <UserIcon className="h-4 w-4 mr-2" />
        <span className="font-medium">{userName}</span>
        {showEmail && userEmail && (
          <span className="text-sm text-light-gray mr-2">({userEmail})</span>
        )}
      </div>
    </Link>
  )
}

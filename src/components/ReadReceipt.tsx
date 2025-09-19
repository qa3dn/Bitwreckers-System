'use client'

import { CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ReadReceiptProps {
  isRead: boolean
  isDelivered: boolean
  readAt?: string
  className?: string
}

export default function ReadReceipt({ 
  isRead, 
  isDelivered, 
  readAt, 
  className = '' 
}: ReadReceiptProps) {
  if (!isDelivered) {
    return (
      <div className={`flex items-center space-x-1 text-light-gray ${className}`}>
        <div className="w-3 h-3 rounded-full bg-light-gray" />
      </div>
    )
  }

  if (isRead) {
    return (
      <div className={`flex items-center space-x-1 text-aqua-green ${className}`} title={`Read at ${readAt}`}>
        <CheckCircleIcon className="w-4 h-4" />
        <span className="text-xs">Read</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-1 text-neon-blue ${className}`} title="Delivered">
      <CheckIcon className="w-4 h-4" />
      <span className="text-xs">Delivered</span>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MemberIdStatusProps {
  memberId: string
}

export default function MemberIdStatus({ memberId }: MemberIdStatusProps) {
  const [status, setStatus] = useState<'checking' | 'assigned' | 'available' | 'invalid'>('checking')
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!memberId) {
      setStatus('invalid')
      return
    }

    const checkStatus = async () => {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, member_id')
          .eq('member_id', memberId)
          .single()

        if (error && error.code === 'PGRST116') {
          // Not found - available
          setStatus('available')
          setAssignedTo(null)
        } else if (error) {
          // Other error
          setStatus('invalid')
          setAssignedTo(null)
        } else if (user) {
          // Found - assigned
          setStatus('assigned')
          setAssignedTo(user.email)
        }
      } catch (error) {
        setStatus('invalid')
        setAssignedTo(null)
      }
    }

    checkStatus()
  }, [memberId])

  if (status === 'checking') {
    return (
      <div className="flex items-center space-x-2 text-yellow-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
        <span className="text-sm">Checking...</span>
      </div>
    )
  }

  if (status === 'assigned') {
    return (
      <div className="flex items-center space-x-2 text-red-400">
        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        <span className="text-sm">Assigned to {assignedTo}</span>
      </div>
    )
  }

  if (status === 'available') {
    return (
      <div className="flex items-center space-x-2 text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-sm">Available</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span className="text-sm">Invalid</span>
    </div>
  )
}

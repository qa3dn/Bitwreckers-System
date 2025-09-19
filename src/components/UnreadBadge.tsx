'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UnreadBadgeProps {
  userId: string | undefined
  children: React.ReactNode
}

export default function UnreadBadge({ userId, children }: UnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastReadTime, setLastReadTime] = useState<Date | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  // Check if user is currently viewing notifications
  const isViewingNotifications = pathname === '/notifications'

  useEffect(() => {
    if (!userId) return

    // Get last read time from localStorage
    const savedLastReadTime = localStorage.getItem(`lastReadTime_${userId}`)
    if (savedLastReadTime) {
      setLastReadTime(new Date(savedLastReadTime))
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const fetchUnreadCount = async () => {
      try {
        // Get unread notifications
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id, created_at')
          .eq('user_id', userId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })

        if (notifications) {
          setUnreadCount(notifications.length)
        }
      } catch (error) {
        console.error('Error fetching unread notifications:', error)
      }
    }

    fetchUnreadCount()

    // Subscribe to new notifications
    const channel = supabase
      .channel('unread-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as any
          if (newNotification.user_id === userId) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Mark as read when user is viewing notifications
  useEffect(() => {
    if (isViewingNotifications && userId) {
      const now = new Date()
      setLastReadTime(now)
      setUnreadCount(0)
      localStorage.setItem(`lastReadTime_${userId}`, now.toISOString())
    }
  }, [isViewingNotifications, userId])

  return (
    <div className="relative">
      {children}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  )
}

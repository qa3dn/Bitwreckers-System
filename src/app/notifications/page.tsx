'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types/database'
import { 
  BellIcon,
  CheckIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchNotifications()
      setupRealtimeSubscription()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
      } else {
        setNotifications(data || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
      } else {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
      } else {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
      } else {
        setNotifications(notifications.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleMeetingResponse = async (notificationId: string, meetingId: string, response: 'accepted' | 'declined') => {
    try {
      // Update meeting member status
      const { error: meetingError } = await supabase
        .from('meeting_members')
        .update({ status: response })
        .eq('meeting_id', meetingId)
        .eq('user_id', user?.id)

      if (meetingError) {
        console.error('Error updating meeting response:', meetingError)
        return
      }

      // Mark notification as read
      await markAsRead(notificationId)

      // Show success message
      alert(`Meeting ${response} successfully!`)
    } catch (error) {
      console.error('Error handling meeting response:', error)
      alert('Error updating meeting response')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <CalendarIcon className="h-5 w-5 text-electric-purple" />
      case 'task':
        return <CheckIcon className="h-5 w-5 text-aqua-green" />
      case 'project':
        return <UserIcon className="h-5 w-5 text-neon-blue" />
      case 'message':
        return <BellIcon className="h-5 w-5 text-coral" />
      default:
        return <BellIcon className="h-5 w-5 text-light-gray" />
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.is_read
    }
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-soft-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-soft-white">Please sign in to access notifications.</div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-soft-white">Notifications</h1>
            <p className="text-light-gray">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors text-sm"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-dark-gray rounded-lg p-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-electric-purple text-soft-white'
                  : 'text-light-gray hover:text-soft-white hover:bg-midnight-blue'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-electric-purple text-soft-white'
                  : 'text-light-gray hover:text-soft-white hover:bg-midnight-blue'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-dark-gray rounded-lg p-6 hover:bg-midnight-blue transition-colors ${
                !notification.is_read ? 'border-l-4 border-electric-purple' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-2 rounded-full ${
                    !notification.is_read ? 'bg-electric-purple' : 'bg-light-gray'
                  }`}>
                    {getNotificationIcon(notification.type || 'general')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-soft-white font-semibold">{notification.title}</h3>
                      {notification.type === 'meeting' && !notification.is_read && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleMeetingResponse(notification.id, notification.data?.meeting_id, 'accepted')}
                            className="flex items-center px-2 py-1 bg-aqua-green text-midnight-blue text-xs rounded hover:bg-green-400 transition-colors"
                          >
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleMeetingResponse(notification.id, notification.data?.meeting_id, 'declined')}
                            className="flex items-center px-2 py-1 bg-coral text-soft-white text-xs rounded hover:bg-red-400 transition-colors"
                          >
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-light-gray mb-2">{notification.message}</p>
                    {notification.type === 'meeting' && notification.data?.meeting_link && (
                      <a
                        href={notification.data.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-electric-purple hover:text-neon-blue text-sm"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Join Meeting
                      </a>
                    )}
                    <div className="flex items-center text-sm text-light-gray mt-2">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!notification.is_read && notification.type !== 'meeting' && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 text-light-gray hover:text-aqua-green transition-colors"
                      title="Mark as read"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 text-light-gray hover:text-coral transition-colors"
                    title="Delete notification"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <BellIcon className="h-12 w-12 text-light-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-white mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-light-gray">
              {filter === 'unread' 
                ? 'You\'re all caught up! Check back later for new updates.'
                : 'You\'ll receive notifications about project updates, task assignments, and more.'
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

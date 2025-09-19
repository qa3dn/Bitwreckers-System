'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { 
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Meeting {
  id: string
  title: string
  description: string | null
  meeting_date: string
  meeting_link: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface MeetingMember {
  id: string
  meeting_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export default function MeetingsPage() {
  const { userProfile } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [meetingMembers, setMeetingMembers] = useState<MeetingMember[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (userProfile) {
      fetchMeetings()
    }
  }, [userProfile])

  const fetchMeetings = async () => {
    try {
      // Fetch meetings the user is invited to
      const { data: meetingsData, error } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_members!inner(
            id,
            user_id,
            status
          )
        `)
        .eq('meeting_members.user_id', userProfile?.id)
        .order('meeting_date', { ascending: true })

      if (error) {
        console.error('Error fetching meetings:', error)
      } else {
        setMeetings(meetingsData || [])
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMeetingStatus = async (meetingId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('meeting_members')
        .update({ status })
        .eq('meeting_id', meetingId)
        .eq('user_id', userProfile?.id)

      if (error) {
        console.error('Error updating meeting status:', error)
        return
      }

      // Refresh meetings
      fetchMeetings()
    } catch (error) {
      console.error('Error updating meeting status:', error)
    }
  }

  const getUpcomingMeetings = () => {
    const now = new Date()
    return meetings.filter(meeting => new Date(meeting.meeting_date) > now)
  }

  const getPastMeetings = () => {
    const now = new Date()
    return meetings.filter(meeting => new Date(meeting.meeting_date) <= now)
  }

  const getMeetingStatus = (meeting: Meeting) => {
    const memberStatus = (meeting as any).meeting_members?.[0]?.status
    return memberStatus || 'pending'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
          <div className="text-soft-white">Loading meetings...</div>
        </div>
      </DashboardLayout>
    )
  }

  const upcomingMeetings = getUpcomingMeetings()
  const pastMeetings = getPastMeetings()

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-midnight-blue p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-soft-white mb-2">Meetings</h1>
            <p className="text-light-gray">View and manage your meeting invitations</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-electric-purple" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-light-gray">Total Meetings</p>
                  <p className="text-2xl font-bold text-soft-white">{meetings.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-neon-blue" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-light-gray">Upcoming</p>
                  <p className="text-2xl font-bold text-soft-white">{upcomingMeetings.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-aqua-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-light-gray">Past Meetings</p>
                  <p className="text-2xl font-bold text-soft-white">{pastMeetings.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-dark-gray rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-soft-white mb-4">Upcoming Meetings</h2>
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-16 w-16 text-light-gray mx-auto mb-4" />
                <p className="text-light-gray">No upcoming meetings</p>
                <p className="text-sm text-light-gray mt-2">You'll see your meeting invitations here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => {
                  const status = getMeetingStatus(meeting)
                  const meetingDate = new Date(meeting.meeting_date)
                  
                  return (
                    <div key={meeting.id} className="bg-midnight-blue p-4 rounded-lg border-l-4 border-electric-purple">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-soft-white mb-2">{meeting.title}</h3>
                          {meeting.description && (
                            <p className="text-light-gray mb-2">{meeting.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-light-gray">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {meetingDate.toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {meeting.meeting_link && (
                              <a
                                href={meeting.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-electric-purple hover:text-neon-blue"
                              >
                                <LinkIcon className="h-4 w-4 mr-1" />
                                Join Meeting
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            status === 'accepted' ? 'bg-aqua-green text-midnight-blue' :
                            status === 'declined' ? 'bg-coral text-soft-white' :
                            'bg-yellow-500 text-midnight-blue'
                          }`}>
                            {status === 'accepted' ? 'Accepted' :
                             status === 'declined' ? 'Declined' :
                             'Pending'}
                          </span>
                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateMeetingStatus(meeting.id, 'accepted')}
                                className="flex items-center px-3 py-1 bg-aqua-green text-midnight-blue text-xs rounded hover:bg-green-400 transition-colors"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Accept
                              </button>
                              <button
                                onClick={() => updateMeetingStatus(meeting.id, 'declined')}
                                className="flex items-center px-3 py-1 bg-coral text-soft-white text-xs rounded hover:bg-red-400 transition-colors"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Past Meetings */}
          <div className="bg-dark-gray rounded-lg p-6">
            <h2 className="text-xl font-bold text-soft-white mb-4">Past Meetings</h2>
            {pastMeetings.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-16 w-16 text-light-gray mx-auto mb-4" />
                <p className="text-light-gray">No past meetings</p>
                <p className="text-sm text-light-gray mt-2">Completed meetings will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastMeetings.map((meeting) => {
                  const status = getMeetingStatus(meeting)
                  const meetingDate = new Date(meeting.meeting_date)
                  
                  return (
                    <div key={meeting.id} className="bg-midnight-blue p-4 rounded-lg opacity-75">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-soft-white mb-2">{meeting.title}</h3>
                          {meeting.description && (
                            <p className="text-light-gray mb-2">{meeting.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-light-gray">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {meetingDate.toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            status === 'accepted' ? 'bg-aqua-green text-midnight-blue' :
                            status === 'declined' ? 'bg-coral text-soft-white' :
                            'bg-light-gray text-midnight-blue'
                          }`}>
                            {status === 'accepted' ? 'Attended' :
                             status === 'declined' ? 'Declined' :
                             'No Response'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

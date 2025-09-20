'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function SessionDebug() {
  const { user, userProfile, loading } = useAuth()
  const [showDebug, setShowDebug] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get session info from localStorage
      const authToken = localStorage.getItem('supabase.auth.token')
      const sessionData = authToken ? JSON.parse(authToken) : null
      setSessionInfo(sessionData)
    }
  }, [])

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white p-2 rounded-full text-xs z-50"
        title="Show Debug Info"
      >
        🐛
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Info</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-red-400 hover:text-red-300"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>User:</strong> {user ? user.email : 'None'}
        </div>
        
        <div>
          <strong>User ID:</strong> {user?.id || 'None'}
        </div>
        
        <div>
          <strong>Profile:</strong> {userProfile ? userProfile.name : 'None'}
        </div>
        
        <div>
          <strong>Role:</strong> {userProfile?.role || 'None'}
        </div>
        
        <div>
          <strong>Member ID:</strong> {userProfile?.member_id || 'None'}
        </div>
        
        <div>
          <strong>Session Token:</strong> {sessionInfo ? 'Present' : 'None'}
        </div>
        
        <div>
          <strong>Timestamp:</strong> {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

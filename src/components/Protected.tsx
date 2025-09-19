'use client'

import { useAuth } from '@/contexts/AuthContext'

interface ProtectedProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function Protected({ allowedRoles, children, fallback }: ProtectedProps) {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-soft-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-soft-white mb-4">Access Denied</h1>
          <p className="text-light-gray mb-6">Please sign in to access this page</p>
          <a 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-soft-white mb-4">Loading Profile...</h1>
          <p className="text-light-gray mb-6">Please wait while we load your profile</p>
        </div>
      </div>
    )
  }

  if (!allowedRoles.includes(userProfile.role)) {
    return fallback || (
      <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-coral mb-4">Access Denied</h1>
          <p className="text-light-gray mb-6">You don't have permission to access this page</p>
          <p className="text-light-gray mb-6">Required role: {allowedRoles.join(' or ')}</p>
          <p className="text-light-gray mb-6">Your role: {userProfile.role}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-electric-purple hover:bg-neon-blue text-soft-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
